const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export function PatrocinadoBadge() {
  return (
    <span
      style={jost}
      className="inline-block bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white"
    >
      PATROCINADO AN
    </span>
  )
}
