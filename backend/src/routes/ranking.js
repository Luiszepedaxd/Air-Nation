const express = require("express");
const supabase = require("../lib/supabase");

const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TIPOS_EVENTO = new Set([
  "Dominguera",
  "Milsim / Opsim",
  "Torneo",
  "Final nacional",
  "Speedsoft",
  "Otro",
  // Alias de la escalera vieja (formulario cacheado / solicitudes en vuelo).
  "Milsim o evento grande",
  "Circuito",
]);

const JUGADORES_OPCIONES = new Set([
  "Menos de 15",
  "15 a 40",
  "40 a 100",
  "Más de 100",
]);

const ORIGENES = new Set(["home", "ranking", "feed"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function strField(body, key) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

/**
 * POST /api/v1/ranking/solicitudes
 */
router.post("/solicitudes", async (req, res) => {
  try {
    const body = req.body || {};

    const honeypot = strField(body, "sitio_web");
    if (honeypot.length > 0) {
      return res.json({ success: true });
    }

    const nombre = strField(body, "nombre");
    if (nombre.length < 2 || nombre.length > 120) {
      return res.status(400).json({
        success: false,
        error: "El nombre debe tener entre 2 y 120 caracteres",
      });
    }

    let whatsapp = String(body.whatsapp ?? "").replace(/\D/g, "");
    if (whatsapp.length < 10 || whatsapp.length > 13) {
      return res.status(400).json({
        success: false,
        error: "Ingresa un WhatsApp válido (10 dígitos en México)",
      });
    }
    if (whatsapp.length === 10) {
      whatsapp = `52${whatsapp}`;
    }

    const emailRaw = strField(body, "email");
    let email = null;
    if (emailRaw.length > 0) {
      if (!EMAIL_RE.test(emailRaw) || emailRaw.length > 200) {
        return res.status(400).json({
          success: false,
          error: "El correo no es válido",
        });
      }
      email = emailRaw;
    }

    const organizacion = strField(body, "organizacion");
    if (organizacion.length < 2 || organizacion.length > 150) {
      return res.status(400).json({
        success: false,
        error: "El nombre del evento u organización debe tener entre 2 y 150 caracteres",
      });
    }

    const tipo_evento = strField(body, "tipo_evento");
    if (!TIPOS_EVENTO.has(tipo_evento)) {
      return res.status(400).json({
        success: false,
        error: "Selecciona un tipo de evento válido",
      });
    }

    const ciudad = strField(body, "ciudad");
    if (ciudad.length < 2 || ciudad.length > 100) {
      return res.status(400).json({
        success: false,
        error: "La ciudad debe tener entre 2 y 100 caracteres",
      });
    }

    const jugadoresRaw = strField(body, "jugadores_esperados");
    let jugadores_esperados = null;
    if (jugadoresRaw.length > 0) {
      if (!JUGADORES_OPCIONES.has(jugadoresRaw)) {
        return res.status(400).json({
          success: false,
          error: "Selecciona una opción válida de jugadores esperados",
        });
      }
      jugadores_esperados = jugadoresRaw;
    }

    const fechaRaw = strField(body, "fecha_aproximada");
    let fecha_aproximada = null;
    if (fechaRaw.length > 0) {
      if (fechaRaw.length > 60) {
        return res.status(400).json({
          success: false,
          error: "La fecha aproximada no puede superar 60 caracteres",
        });
      }
      fecha_aproximada = fechaRaw;
    }

    const mensajeRaw = strField(body, "mensaje");
    let mensaje = null;
    if (mensajeRaw.length > 0) {
      if (mensajeRaw.length > 1000) {
        return res.status(400).json({
          success: false,
          error: "El mensaje no puede superar 1000 caracteres",
        });
      }
      mensaje = mensajeRaw;
    }

    const userIdRaw = strField(body, "user_id");
    let user_id = null;
    if (userIdRaw.length > 0) {
      if (UUID_RE.test(userIdRaw)) {
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("id", userIdRaw)
          .maybeSingle();
        if (userRow) user_id = userIdRaw;
      }
    }

    const origenRaw = strField(body, "origen");
    let origen = null;
    if (origenRaw.length > 0 && ORIGENES.has(origenRaw)) {
      origen = origenRaw;
    }

    const row = {
      nombre,
      whatsapp,
      email,
      organizacion,
      tipo_evento,
      ciudad,
      jugadores_esperados,
      fecha_aproximada,
      mensaje,
      user_id,
      origen,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("ranking_solicitudes")
      .insert(row)
      .select("id, created_at")
      .single();

    if (insertErr || !inserted) {
      console.error("[ranking] insert error:", insertErr);
      return res.status(500).json({
        success: false,
        error: "No se pudo enviar tu solicitud. Intenta de nuevo.",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const { Resend } = require("resend");
        const resend = new Resend(apiKey);
        const fromAddr =
          process.env.RESEND_FROM_EMAIL || "AirNation <info@airnation.online>";
        const waLink = `https://wa.me/${whatsapp}`;
        const html = `
<h2>Nueva solicitud — Ranking Nacional</h2>
<p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
<p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>
<p><strong>Correo:</strong> ${escapeHtml(email || "—")}</p>
<p><strong>Organización / evento:</strong> ${escapeHtml(organizacion)}</p>
<p><strong>Tipo de evento:</strong> ${escapeHtml(tipo_evento)}</p>
<p><strong>Ciudad:</strong> ${escapeHtml(ciudad)}</p>
<p><strong>Jugadores esperados:</strong> ${escapeHtml(jugadores_esperados || "—")}</p>
<p><strong>Fecha aproximada:</strong> ${escapeHtml(fecha_aproximada || "—")}</p>
<p><strong>Mensaje:</strong></p>
<p>${mensaje ? escapeHtml(mensaje).replace(/\n/g, "<br/>") : "—"}</p>
<p><strong>Origen:</strong> ${escapeHtml(origen || "—")}</p>
<p><strong>User ID:</strong> ${escapeHtml(user_id || "—")}</p>
<p><strong>Fecha:</strong> ${escapeHtml(inserted.created_at)}</p>
<p><a href="${escapeHtml(waLink)}" style="display:inline-block;padding:10px 16px;background:#25D366;color:#fff;text-decoration:none;font-weight:bold;">Escribir por WhatsApp</a></p>
`.trim();

        const { error: mailErr } = await resend.emails.send({
          from: fromAddr,
          to: "info@airnation.online",
          subject: `[Ranking] Nuevo organizador: ${organizacion}`,
          html,
        });

        if (mailErr) {
          console.warn("[ranking] Resend error:", mailErr);
        }
      } catch (mailEx) {
        console.warn("[ranking] email failed:", mailEx);
      }
    } else {
      console.warn("[ranking] RESEND_API_KEY no configurada");
    }

    res.json({ success: true, id: inserted.id });
  } catch (err) {
    console.error("[ranking]", err);
    res.status(500).json({
      success: false,
      error: "No se pudo enviar tu solicitud. Intenta de nuevo.",
    });
  }
});

module.exports = router;
