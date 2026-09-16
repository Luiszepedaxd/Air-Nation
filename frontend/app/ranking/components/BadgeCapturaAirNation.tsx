import { ETIQUETAS } from '@/lib/ranking-contenido'

export function BadgeCapturaAirNation({ oscuro }: { oscuro?: boolean }) {
  const colorClass = oscuro
    ? 'border-[#4CAF50] text-[#4CAF50]'
    : 'border-[#2E7D32] text-[#2E7D32]'

  return (
    <span
      title={ETIQUETAS.resultadosEnVivoTooltip}
      className={`inline-flex shrink-0 items-center gap-1 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colorClass}`}
      style={{ fontFamily: "'Jost', sans-serif" }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {ETIQUETAS.resultadosEnVivo}
    </span>
  )
}
