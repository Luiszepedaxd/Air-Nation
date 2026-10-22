const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { describe, it, before } = require("node:test");

process.env.ARENA_PUBLIC_URL = "https://www.airnation.online";
process.env.ARENA_MOCK_WEBHOOK_SECRET = "secreto-webhook-de-prueba";

const mock = require("./mock");

describe("proveedor mock", () => {
  it("createCheckout manda al pago simulado de la propia reserva", async () => {
    const r = await mock.createCheckout({
      booking: { codigo: "AR-7K2M9Q", access_token: "tok123" },
    });
    assert.match(r.provider_ref, /^mock_[0-9a-f]{32}$/);
    assert.equal(
      r.checkout_url,
      "https://www.airnation.online/reservas/AR-7K2M9Q/pago-simulado?t=tok123"
    );
  });

  it("createCheckout de un carrito manda al pago simulado del pago", async () => {
    const r = await mock.createCheckout({
      payment: { id: "11111111-2222-3333-4444-555555555555", access_token: "tokpago" },
    });
    assert.equal(
      r.checkout_url,
      "https://www.airnation.online/arena/pago-simulado?p=11111111-2222-3333-4444-555555555555&t=tokpago"
    );
  });

  it("dos checkouts nunca comparten provider_ref", async () => {
    const a = await mock.createCheckout({ booking: { codigo: "A", access_token: "t" } });
    const b = await mock.createCheckout({ booking: { codigo: "A", access_token: "t" } });
    assert.notEqual(a.provider_ref, b.provider_ref);
  });

  const firmar = (body) => ({
    body: Buffer.from(JSON.stringify(body)),
    headers: {
      "x-arena-mock-signature": crypto
        .createHmac("sha256", process.env.ARENA_MOCK_WEBHOOK_SECRET)
        .update(Buffer.from(JSON.stringify(body)))
        .digest("hex"),
    },
  });

  it("parseWebhook acepta un cuerpo firmado", () => {
    const r = mock.parseWebhook(firmar({ provider_ref: "mock_abc", status: "pagado" }));
    assert.deepEqual(
      { provider_ref: r.provider_ref, status: r.status },
      { provider_ref: "mock_abc", status: "pagado" }
    );
  });

  it("parseWebhook rechaza sin firma, con firma ajena o con status inventado", () => {
    assert.throws(
      () => mock.parseWebhook({ body: Buffer.from('{"provider_ref":"x","status":"pagado"}'), headers: {} }),
      /firma_invalida/
    );
    assert.throws(
      () =>
        mock.parseWebhook({
          body: Buffer.from('{"provider_ref":"x","status":"pagado"}'),
          headers: { "x-arena-mock-signature": "a".repeat(64) },
        }),
      /firma_invalida/
    );
    assert.throws(
      () => mock.parseWebhook(firmar({ provider_ref: "mock_abc", status: "confirmada" })),
      /firma_invalida/
    );
    assert.throws(() => mock.parseWebhook(firmar({ status: "pagado" })), /firma_invalida/);
  });

  it("un cuerpo alterado después de firmar no pasa", () => {
    const bueno = firmar({ provider_ref: "mock_abc", status: "fallido" });
    bueno.body = Buffer.from(JSON.stringify({ provider_ref: "mock_abc", status: "pagado" }));
    assert.throws(() => mock.parseWebhook(bueno), /firma_invalida/);
  });

  it("sin ARENA_MOCK_WEBHOOK_SECRET el webhook queda cerrado", () => {
    const firmado = firmar({ provider_ref: "mock_abc", status: "pagado" });
    const secreto = process.env.ARENA_MOCK_WEBHOOK_SECRET;
    delete process.env.ARENA_MOCK_WEBHOOK_SECRET;
    try {
      assert.throws(() => mock.parseWebhook(firmado), /secreto_faltante/);
    } finally {
      process.env.ARENA_MOCK_WEBHOOK_SECRET = secreto;
    }
  });

  it("refund devuelve reembolsado", async () => {
    assert.deepEqual(await mock.refund({ monto_centavos: 35000 }), {
      status: "reembolsado",
      monto_centavos: 35000,
    });
  });
});
