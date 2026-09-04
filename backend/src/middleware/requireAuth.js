const supabase = require("../lib/supabase");

// ─── Modo stress test local ────────────────────────────────────────────────────
// Activo SOLO cuando STRESS_TEST_MODE=true en .env.
// Acepta el header X-Stress-User-Id: <uuid> en lugar de un JWT real.
// NUNCA habilitar en producción.
const STRESS_MODE = process.env.STRESS_TEST_MODE === "true";

/**
 * Requiere header Authorization: Bearer <JWT de Supabase>
 * Verifica que el token sea válido y adjunta req.authUser.
 *
 * En modo STRESS_TEST_MODE=true acepta el header X-Stress-User-Id
 * con cualquier UUID válido y omite la verificación JWT.
 */
async function requireAuth(req, res, next) {
  // ── Bypass local para stress tests ──────────────────────────────────────────
  if (STRESS_MODE) {
    const fakeId = req.headers["x-stress-user-id"];
    if (fakeId && /^[0-9a-f-]{36}$/.test(fakeId)) {
      req.authUser = { id: fakeId, email: `stress-${fakeId.slice(0, 8)}@local.test` };
      return next();
    }
  }

  // ── Flujo normal: JWT de Supabase ────────────────────────────────────────────
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  req.authUser = user;
  next();
}

module.exports = { requireAuth };
