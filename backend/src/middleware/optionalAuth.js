const supabase = require("../lib/supabase");

/**
 * Si llega un Bearer válido deja `req.userId`; si no, sigue como invitado.
 * Un token inválido no corta la petición: ARENA acepta reservas sin cuenta.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (token) {
    try {
      const { data } = await supabase.auth.getUser(token);
      if (data?.user?.id) req.userId = data.user.id;
    } catch {
      /* invitado */
    }
  }
  next();
}

module.exports = { optionalAuth };
