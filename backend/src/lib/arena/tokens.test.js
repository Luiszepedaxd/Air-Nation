const test = require("node:test");
const assert = require("node:assert/strict");
const { comparaToken, tokenAbrePago } = require("./tokens");

test("comparaToken: solo pasa el token exacto y nunca el vacío", () => {
  assert.equal(comparaToken("abc", "abc"), true);
  assert.equal(comparaToken("abc", "abd"), false);
  assert.equal(comparaToken("abc", "abcd"), false);
  assert.equal(comparaToken("", ""), false);
  assert.equal(comparaToken(null, undefined), false);
});

test("tokenAbrePago: el token del pago (carrito) o el de una de sus reservas", () => {
  const pago = { access_token: "tokpago" };
  const reservas = [{ access_token: "tokA" }, { access_token: "tokB" }];
  assert.equal(tokenAbrePago("tokpago", { pago, reservas }), true);
  assert.equal(tokenAbrePago("tokB", { pago, reservas }), true);
  assert.equal(tokenAbrePago("otro", { pago, reservas }), false);
  assert.equal(tokenAbrePago("", { pago, reservas }), false);
});

test("tokenAbrePago: el pago de una reserva suelta no lleva token propio", () => {
  const pago = { access_token: null };
  assert.equal(tokenAbrePago("tokreserva", { pago, reservas: [{ access_token: "tokreserva" }] }), true);
  // Sin token en el pago ni en las reservas no hay forma de aprobarlo.
  assert.equal(tokenAbrePago("", { pago, reservas: [{ access_token: null }] }), false);
  assert.equal(tokenAbrePago("x", { pago }), false);
});
