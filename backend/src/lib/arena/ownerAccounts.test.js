const test = require("node:test");
const assert = require("node:assert/strict");
const { generarPasswordTemporal } = require("./ownerAccounts");

test("el password temporal es largo, url-safe y distinto cada vez", () => {
  const a = generarPasswordTemporal();
  assert.ok(a.length >= 10, `demasiado corto: ${a.length}`);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
  assert.notEqual(a, generarPasswordTemporal());
});
