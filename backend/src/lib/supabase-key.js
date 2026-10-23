function decodeJwtRole(key) {
  if (!key || typeof key !== "string") return null;
  const parts = key.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function resolveServiceKey() {
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_KEY is required for the API server");
  }
  const anon =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon && key === anon) {
    throw new Error("SUPABASE_SERVICE_KEY must not be the anon key");
  }
  const role = decodeJwtRole(key);
  if (role === "anon") {
    throw new Error("SUPABASE_SERVICE_KEY must be the service_role key, not anon");
  }
  return key;
}

module.exports = { decodeJwtRole, resolveServiceKey };
