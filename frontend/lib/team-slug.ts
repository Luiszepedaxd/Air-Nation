/**
 * Misma lógica que `backend/src/lib/teamSlug.js` — slug para enviar al API.
 */
export function generateTeamSlug(
  rawSlug: string | null | undefined,
  nombre: string
): string {
  const trimmedNombre = nombre.trim()
  const source =
    rawSlug != null && String(rawSlug).trim() !== ""
      ? String(rawSlug).trim()
      : trimmedNombre
  let s = source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  if (!s) s = "equipo"
  return s
}
