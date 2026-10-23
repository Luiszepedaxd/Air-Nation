const supabase = require("../lib/supabase");
const { verifySupabaseUser } = require("./verifySupabaseUser");

/**
 * Requiere JWT válido y app_role = 'admin' en users.
 */
async function requireAdmin(req, res, next) {
  const user = req.authUser || (await verifySupabaseUser(req));
  if (!user) {
    return res.status(401).json({ error: "No autorizado" });
  }
  req.authUser = user;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("app_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  if (!profile || profile.app_role !== "admin") {
    return res.status(403).json({ error: "Se requiere rol de administrador" });
  }

  req.adminUser = user;
  next();
}

module.exports = { requireAdmin };
