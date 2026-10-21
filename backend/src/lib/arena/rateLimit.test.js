const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { createIpLimit, clientIp } = require("./rateLimit");

describe("createIpLimit", () => {
  it("deja pasar el cupo y corta el siguiente, por IP", () => {
    const allow = createIpLimit(3);
    assert.deepEqual(
      [allow("1.1.1.1"), allow("1.1.1.1"), allow("1.1.1.1"), allow("1.1.1.1")],
      [true, true, true, false]
    );
    // Otra IP tiene su propio cupo.
    assert.equal(allow("2.2.2.2"), true);
  });
});

describe("clientIp", () => {
  it("usa el primer x-forwarded-for porque la app no activa trust proxy", () => {
    assert.equal(
      clientIp({ headers: { "x-forwarded-for": "187.1.2.3, 10.0.0.1" }, ip: "10.0.0.1" }),
      "187.1.2.3"
    );
    assert.equal(clientIp({ headers: {}, ip: "187.9.9.9" }), "187.9.9.9");
    assert.equal(clientIp({ headers: {} }), "desconocida");
  });
});
