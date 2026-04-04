/**
 * Slug de campo: mismo criterio que equipos (`generateTeamSlug`).
 */
export function generateFieldSlug(rawSlug: string | null | undefined, nombre: string): string {
  const trimmedNombre = nombre.trim()
  const source =
    rawSlug != null && String(rawSlug).trim() !== ''
      ? String(rawSlug).trim()
      : trimmedNombre
  let s = source
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (!s) s = 'campo'
  return s
}
