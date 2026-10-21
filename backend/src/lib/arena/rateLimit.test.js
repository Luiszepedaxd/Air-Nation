const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { createIpLimit, ipRateLimit } = require("./rateLimit");

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

describe("ipRateLimit", () => {
  // Pide con la IP que resolvió Express (trust proxy) y una x-forwarded-for
  // falsificada distinta: si el middleware hiciera caso a la cabecera, cada
  // petición tendría cupo nuevo y nunca saldría el 429.
  const pedir = (middleware, ip) => {
    let status = null;
    middleware(
      { ip, headers: { "x-forwarded-for": `9.9.9.${Math.random()}` } },
      { status: (c) => ((status = c), { json: () => {} }) },
      () => (status = 200)
    );
    return status;
  };

  it("cuenta por req.ip e ignora x-forwarded-for", () => {
    const middleware = ipRateLimit(2);
    assert.deepEqual(
      [pedir(middleware, "187.1.2.3"), pedir(middleware, "187.1.2.3"), pedir(middleware, "187.1.2.3")],
      [200, 200, 429]
    );
    // Otro cliente sigue pasando.
    assert.equal(pedir(middleware, "187.4.5.6"), 200);
  });
});
