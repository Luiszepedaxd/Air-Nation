const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { decodeJwtRole, resolveServiceKey } = require("./supabase-key");

describe("supabase service key", () => {
  it("detecta role anon en un JWT de Supabase", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url"
    );
    const payload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url");
    const key = `${header}.${payload}.sig`;
    assert.equal(decodeJwtRole(key), "anon");
    assert.equal(decodeJwtRole("not-a-jwt"), null);
  });

  it("rechaza anon key como SUPABASE_SERVICE_KEY", () => {
    const header = Buffer.from("{}").toString("base64url");
    const payload = Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url");
    const anonJwt = `${header}.${payload}.sig`;
    const prev = process.env.SUPABASE_SERVICE_KEY;
    process.env.SUPABASE_SERVICE_KEY = anonJwt;
    assert.throws(() => resolveServiceKey(), /service_role/);
    process.env.SUPABASE_SERVICE_KEY = prev;
  });
});
