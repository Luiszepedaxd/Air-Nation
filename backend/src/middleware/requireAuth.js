const supabase = require("../lib/supabase");

/**
 * Requiere header Authorization: Bearer <JWT de Supabase>
 * Verifica que el token sea válido y adjunta req.authUser.
 */
async function requireAuth(req, res, next) {
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
