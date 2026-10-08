// La sesión firmada que identifica al usuario de AirNation dentro de una llamada.
const crypto = require("crypto");
const { DEFAULTS, strEnv } = require("./config");

function sessionSecret() {
  return strEnv("JOULIE_ELEVEN_LLM_SECRET", "");
}

function signSession(userId, secret, now, ttlMs) {
  const body = Buffer.from(
    JSON.stringify({ u: String(userId || ""), e: (now || Date.now()) + (ttlMs || DEFAULTS.sessionTtlMs) })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", String(secret)).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifySession(token, secret, now) {
  if (!secret || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac("sha256", String(secret)).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.u !== "string" || !parsed.u) return null;
    if (typeof parsed.e !== "number" || parsed.e <= (now || Date.now())) return null;
    return { userId: parsed.u, exp: parsed.e };
  } catch {
    return null;
  }
}

function secretsMatch(headerValue, secret) {
  if (!secret || !headerValue) return false;
  const left = Buffer.from(String(headerValue));
  const right = Buffer.from(String(secret));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

module.exports = {
  secretsMatch,
  sessionSecret,
  signSession,
  verifySession,
};
