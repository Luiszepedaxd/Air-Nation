const supabase = require("../lib/supabase");

const STRESS_MODE = process.env.STRESS_TEST_MODE === "true";

function bearerToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
}

/**
 * @returns {Promise<{ id: string, email?: string } | null>}
 */
async function verifySupabaseUser(req) {
  if (STRESS_MODE) {
    const fakeId = req.headers["x-stress-user-id"];
    if (fakeId && /^[0-9a-f-]{36}$/.test(fakeId)) {
      return { id: fakeId, email: `stress-${fakeId.slice(0, 8)}@local.test` };
    }
  }

  const token = bearerToken(req);
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

module.exports = { verifySupabaseUser, bearerToken };
