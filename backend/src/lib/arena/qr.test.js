const test = require("node:test");
const assert = require("node:assert/strict");

const { checkinUrl, qrAdjuntoInline } = require("./qr");

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

test("el QR codifica la pantalla de check-in", () => {
  assert.match(checkinUrl("tok-123"), /\/checkin\/tok-123$/);
});

test("el QR del correo va inline con las llaves que el SDK de Resend sí mapea", async () => {
  const { cid, adjunto } = await qrAdjuntoInline("ARN-ABC123", "tok-123", 200);

  assert.equal(cid, "qr-ARN-ABC123");
  assert.equal(adjunto.filename, "ARN-ABC123.png");
  // camelCase o nada: el SDK descarta `content_id`/`content_type` y el correo
  // llega con la imagen roto en Gmail.
  assert.equal(adjunto.contentId, cid);
  assert.equal(adjunto.contentType, "image/png");
  assert.deepEqual(Object.keys(adjunto).filter((k) => k.includes("_")), []);
  // El contenido es un PNG de verdad en base64.
  assert.ok(Buffer.from(adjunto.content, "base64").subarray(0, 8).equals(PNG_MAGIC));
});
