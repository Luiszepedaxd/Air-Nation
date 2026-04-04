const supabase = require("../lib/supabase");

/**
 * Requiere header Authorization: Bearer <JWT de Supabase>
 * y que el usuario tenga app_role = 'admin' en la tabla users.
 */
async function requireAdmin(req, res, next) {
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
