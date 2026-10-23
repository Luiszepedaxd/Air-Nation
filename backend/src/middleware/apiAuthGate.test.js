const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isPublicApiRoute } = require("./apiAuthAllowlist");

describe("isPublicApiRoute", () => {
  it("permite lecturas públicas de equipos y búsqueda", () => {
    assert.equal(isPublicApiRoute("GET", "/teams"), true);
    assert.equal(isPublicApiRoute("GET", "/teams/search"), true);
    assert.equal(isPublicApiRoute("GET", "/search"), true);
  });

  it("bloquea escrituras que no están en la allowlist", () => {
    assert.equal(isPublicApiRoute("POST", "/replicas"), false);
    assert.equal(isPublicApiRoute("PATCH", "/replicas/abc/transfer"), false);
    assert.equal(isPublicApiRoute("POST", "/teams/00000000-0000-4000-8000-000000000001/notify-join-request"), false);
    assert.equal(isPublicApiRoute("POST", "/search/log"), false);
  });

  it("mantiene webhooks y checkout públicos", () => {
    assert.equal(isPublicApiRoute("POST", "/stripe/webhook"), true);
    assert.equal(isPublicApiRoute("POST", "/arena/payments/webhook/stripe"), true);
    assert.equal(isPublicApiRoute("POST", "/arena/bookings"), true);
  });
});
