const test = require("node:test");
const assert = require("node:assert/strict");

const { revisarCampoDemo, pagosBorrables } = require("./demo");

const PAGO_A = "aaaaaaaa-1111-4111-8111-111111111111";
const PAGO_B = "bbbbbbbb-2222-4222-8222-222222222222";

test("el portero demo: 404 sin campo, 409 si el campo es real, null si es de prueba", () => {
  assert.equal(revisarCampoDemo(null).status, 404);
  assert.equal(revisarCampoDemo(undefined).status, 404);
  assert.equal(revisarCampoDemo({ id: "x", es_prueba: false }).status, 409);
  // Sin la columna (o con cualquier cosa que no sea true) tampoco pasa.
  assert.equal(revisarCampoDemo({ id: "x" }).status, 409);
  assert.equal(revisarCampoDemo({ id: "x", es_prueba: "true" }).status, 409);
  assert.equal(revisarCampoDemo({ id: "x", es_prueba: 1 }).status, 409);
  assert.equal(revisarCampoDemo({ id: "x", es_prueba: true }), null);
});

test("un pago de carrito que mezcla un campo demo con uno real nunca se borra", () => {
  const borrables = pagosBorrables([
    { payment_id: PAGO_A, es_prueba: true },
    { payment_id: PAGO_A, es_prueba: true },
    { payment_id: PAGO_B, es_prueba: true },
    { payment_id: PAGO_B, es_prueba: false }, // ← reserva de un campo real
  ]);
  assert.deepEqual(borrables, [PAGO_A]);
});

test("reservas sin pago no inventan pagos borrables", () => {
  assert.deepEqual(pagosBorrables([{ payment_id: null, es_prueba: true }]), []);
  assert.deepEqual(pagosBorrables([]), []);
  assert.deepEqual(pagosBorrables(null), []);
});
