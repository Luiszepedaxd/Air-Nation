const express = require("express");
const Stripe = require("stripe");
const supabase = require("../lib/supabase");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn("[stripe] STRIPE_SECRET_KEY no está definida. Los endpoints fallarán.");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: "2024-11-20.acacia" }) : null;

// ─────────────────────────────────────────────────────────────
// POST /api/v1/stripe/create-payment-intent
// Body: { order_id: string }
// El monto se calcula server-side desde Supabase, NUNCA se confía en el cliente.
// ─────────────────────────────────────────────────────────────
router.post("/create-payment-intent", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe no configurado en el servidor" });
  }

  const { order_id } = req.body;

  if (!order_id || typeof order_id !== "string") {
    return res.status(400).json({ error: "order_id es requerido" });
  }

  // 1. Buscar la orden en Supabase
  const { data: order, error: orderError } = await supabase
    .from("store_orders")
    .select("id, order_number, total, metodo_pago, status_interno, stripe_payment_intent_id, guest_email, user_id")
    .eq("id", order_id)
    .maybeSingle();

  if (orderError || !order) {
    console.error("[stripe] order not found:", order_id, orderError?.message);
    return res.status(404).json({ error: "Orden no encontrada" });
  }

  // 2. Validaciones de seguridad
  if (order.metodo_pago !== "tarjeta") {
    return res.status(400).json({ error: "Esta orden no es de pago con tarjeta" });
  }

  if (order.status_interno === "pago_confirmado") {
    return res.status(400).json({ error: "Esta orden ya fue pagada" });
  }

  if (order.status_interno === "cancelado") {
    return res.status(400).json({ error: "Esta orden está cancelada" });
  }

  const totalCentavos = Math.round(Number(order.total) * 100);

  if (totalCentavos < 50) {
    return res.status(400).json({ error: "Monto mínimo no alcanzado" });
  }

  // 3. Si ya hay un PaymentIntent y sigue válido, devolverlo (idempotencia)
  if (order.stripe_payment_intent_id) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
      if (
        existing &&
        ["requires_payment_method", "requires_confirmation", "requires_action", "processing"].includes(existing.status)
      ) {
        return res.json({
          client_secret: existing.client_secret,
          payment_intent_id: existing.id,
        });
      }
    } catch (err) {
      console.warn("[stripe] PaymentIntent previo inválido, creando nuevo:", err.message);
    }
  }

  // 4. Crear PaymentIntent nuevo
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: totalCentavos,
      currency: "mxn",
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
      },
      receipt_email: order.guest_email || undefined,
    });
  } catch (err) {
    console.error("[stripe] error creando PaymentIntent:", err.message);
    return res.status(500).json({ error: "No se pudo iniciar el pago" });
  }

  // 5. Guardar el ID en la orden
  const { error: updateError } = await supabase
    .from("store_orders")
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      stripe_status: paymentIntent.status,
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("[stripe] error guardando payment_intent_id:", updateError.message);
    // No fallar la respuesta — el PaymentIntent ya existe en Stripe
  }

  return res.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/v1/stripe/webhook
// Stripe firma el body crudo. NO usar express.json() en esta ruta.
// El raw body se inyecta en index.js antes de express.json() global.
// ─────────────────────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  if (!stripe || !webhookSecret) {
    console.error("[stripe webhook] Stripe o webhookSecret no configurados");
    return res.status(500).send("Webhook no configurado");
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Falta stripe-signature");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] firma inválida:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[stripe webhook] evento recibido: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        await handlePaymentSucceeded(pi);
        break;
      }
      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        await handlePaymentFailed(pi);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        await handleChargeRefunded(charge);
        break;
      }
      default:
        console.log(`[stripe webhook] evento ignorado: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe webhook] error procesando ${event.type}:`, err.message);
    // Devolver 200 igual para que Stripe no reintente indefinidamente eventos rotos
    return res.status(200).json({ received: true, error: err.message });
  }

  return res.status(200).json({ received: true });
});

// ─────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────

async function handlePaymentSucceeded(paymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    console.error("[stripe] payment_intent.succeeded sin order_id en metadata");
    return;
  }

  // Idempotencia: verificar si ya está pago_confirmado
  const { data: order } = await supabase
    .from("store_orders")
    .select("id, status_interno, order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) {
    console.error("[stripe] orden no encontrada:", orderId);
    return;
  }

  if (order.status_interno === "pago_confirmado") {
    console.log(`[stripe] orden ${order.order_number} ya estaba pago_confirmado, ignorando`);
    return;
  }

  const { error } = await supabase
    .from("store_orders")
    .update({
      status_interno: "pago_confirmado",
      stripe_status: paymentIntent.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("[stripe] error actualizando orden a pago_confirmado:", error.message);
    throw error;
  }

  console.log(`[stripe] orden ${order.order_number} marcada como pago_confirmado`);
}

async function handlePaymentFailed(paymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;

  if (!orderId) {
    console.error("[stripe] payment_intent.payment_failed sin order_id en metadata");
    return;
  }

  const { data: order } = await supabase
    .from("store_orders")
    .select("id, status_interno, order_number")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;

  // Si ya estaba cancelado o pago_confirmado, no tocar
  if (["cancelado", "pago_confirmado"].includes(order.status_interno)) {
    return;
  }

  // Devolver stock
  const { data: items } = await supabase
    .from("store_order_items")
    .select("product_id, cantidad")
    .eq("order_id", orderId);

  if (items && items.length > 0) {
    for (const item of items) {
      const { error: stockError } = await supabase.rpc("restore_product_stock", {
        p_product_id: item.product_id,
        p_cantidad: item.cantidad,
      });
      if (stockError) {
        console.error(`[stripe] error devolviendo stock de ${item.product_id}:`, stockError.message);
      }
    }
  }

  // Marcar orden como cancelada
  const { error } = await supabase
    .from("store_orders")
    .update({
      status_interno: "cancelado",
      stripe_status: paymentIntent.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) {
    console.error("[stripe] error marcando orden como cancelada:", error.message);
    throw error;
  }

  console.log(`[stripe] orden ${order.order_number} marcada como cancelada (pago fallido)`);
}

async function handleChargeRefunded(charge) {
  const paymentIntentId = charge.payment_intent;

  if (!paymentIntentId) return;

  const { data: order } = await supabase
    .from("store_orders")
    .select("id, status_interno, order_number")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!order) {
    console.error("[stripe] orden no encontrada para PI:", paymentIntentId);
    return;
  }

  if (order.status_interno === "reembolsado") {
    return;
  }

  const { error } = await supabase
    .from("store_orders")
    .update({
      status_interno: "reembolsado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (error) {
    console.error("[stripe] error marcando reembolso:", error.message);
    throw error;
  }

  console.log(`[stripe] orden ${order.order_number} marcada como reembolsado`);
}

module.exports = router;
