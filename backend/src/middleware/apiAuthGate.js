const { verifySupabaseUser } = require("./verifySupabaseUser");
const { isPublicApiRoute } = require("./apiAuthAllowlist");

async function apiAuthGate(req, res, next) {
  const path = req.path || "/";
  const isPublic = isPublicApiRoute(req.method, path);

  const user = await verifySupabaseUser(req);
  if (user) req.authUser = user;

  if (isPublic) return next();

  if (!user) {
    return res.status(401).json({ error: "No autorizado" });
  }

  return next();
}

module.exports = { apiAuthGate, isPublicApiRoute };
