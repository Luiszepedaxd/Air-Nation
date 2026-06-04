/** Identidad visual — dossier militar / manual de campo. */

export const TG_COLORS = {
  paper: '#F5F0E6',
  dark: '#1A1A1A',
  text: '#1A1A1A',
  red: '#CC4B37',
  olive: '#4A5328',
  brass: '#D4A017',
  border: '#C4B89C',
  terminalGreen: '#00FF41',
} as const

export const TG_FONTS = {
  header: "'Jost', sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  body: "'Lato', sans-serif",
} as const

/** Estilo estándar de títulos AirNation (Jost display). La identidad táctica
 *  viene de colores, texturas, stamps y layout — NO de la tipografía. */
export const TG_HEADER_STYLE = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '-0.01em',
}
