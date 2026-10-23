const { verifySupabaseUser } = require("./verifySupabaseUser");

/**
 * Requiere sesión válida (apiAuthGate o este middleware).
 */
async function requireAuth(req, res, next) {
  if (req.authUser?.id) return next();

  const user = await verifySupabaseUser(req);
  if (!user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  req.authUser = user;
  next();
}

module.exports = { requireAuth };
