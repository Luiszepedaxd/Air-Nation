export type CatalogSponsor = {
  id: string
  nombre: string
  logo_url: string
  link: string
}

export type SponsorLogoEntry = {
  id?: string
  nombre: string
  logo_url: string
  link: string
}

export function buildLogosFromCatalog(
  catalog: CatalogSponsor[],
  selectedIds: Set<string>
): SponsorLogoEntry[] {
  return catalog
    .filter((s) => selectedIds.has(s.id))
    .map((s) => ({ id: s.id, nombre: s.nombre, logo_url: s.logo_url, link: s.link }))
}

export function selectedIdsFromLogos(
  logos: SponsorLogoEntry[],
  catalog: CatalogSponsor[]
): Set<string> {
  const selected = new Set<string>()
  for (const logo of logos) {
    const id = logo.id?.trim()
    const byId = id ? catalog.find((c) => c.id === id) : undefined
    const match =
      byId ??
      catalog.find(
        (c) =>
          (logo.logo_url && c.logo_url && c.logo_url.trim() === logo.logo_url.trim()) ||
          (logo.nombre?.trim() &&
            c.nombre.trim().toLowerCase() === logo.nombre.trim().toLowerCase())
      )
    if (match) selected.add(match.id)
  }
  return selected
}

/**
 * Cruza la selección guardada con el catálogo activo.
 * Catálogo vacío o ilegible: se conservan los logos ya guardados (mismo fallback que un snapshot).
 * Con filas: solo los elegidos, en el orden del catálogo y con el logo vigente.
 */
export function logosParaLanding(
  stored: SponsorLogoEntry[] | undefined,
  catalog: CatalogSponsor[] | null
): SponsorLogoEntry[] {
  const logos = (stored ?? []).filter((l) => l && (l.logo_url?.trim() || l.nombre?.trim()))
  if (!catalog || catalog.length === 0) return logos
  return buildLogosFromCatalog(catalog, selectedIdsFromLogos(logos, catalog))
}
