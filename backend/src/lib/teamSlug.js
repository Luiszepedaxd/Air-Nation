/**
 * Genera un slug URL-safe a partir de un slug opcional o del nombre.
 * @param {string|null|undefined} rawSlug
 * @param {string} nombre
 */
function generateTeamSlug(rawSlug, nombre) {
  const base = String(rawSlug != null && String(rawSlug).trim() !== "" ? rawSlug : nombre)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "equipo";
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} baseSlug
 * @returns {Promise<string>}
 */
async function resolveUniqueTeamSlug(supabase, baseSlug) {
  let candidate = baseSlug;
  for (let n = 2; n < 10000; n += 1) {
    const { data: existing, error } = await supabase
      .from("teams")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!existing) {
      return candidate;
    }
    candidate = `${baseSlug}-${n}`;
  }
  throw new Error("No se pudo generar un slug único");
}

module.exports = {
  generateTeamSlug,
  resolveUniqueTeamSlug,
};
