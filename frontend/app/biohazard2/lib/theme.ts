/** Identidad visual Biohazard 2 — selva táctica + biopeligro. */
export const BH2_COLORS = {
  paper: '#F5F3EF',
  jungle: '#141A10',
  jungleSoft: '#1F2A17',
  olive: '#4A5328',
  hazard: '#F2B705',
  red: '#CC4B37',
  khaki: '#C8B27A',
  border: '#2E3A24',
  text: '#111111',
} as const

export const BH2_HEADER_STYLE = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 900 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '-0.02em',
}

export const BH2_EYEBROW_STYLE = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 600 as const,
}

/** Cinta de peligro diagonal (amarillo/negro) para separadores y bordes. */
export const BH2_HAZARD_STRIPE =
  'repeating-linear-gradient(-45deg, #F2B705 0 14px, #111111 14px 28px)'
