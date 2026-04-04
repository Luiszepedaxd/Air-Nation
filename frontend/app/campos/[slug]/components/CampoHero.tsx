import type { CampoDetailRow } from '../../types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

function PinIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-[#666666]"
      aria-hidden
    >
      <path
        d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CampoHero({ field }: { field: CampoDetailRow }) {
  const tipo = normalizeTipo(field.tipo)

  return (
    <div className="relative w-full">
      <div
        className="relative w-full overflow-hidden bg-[#111111] h-[240px] md:h-[360px]"
      >
        {field.foto_portada_url ? (
          <img
            src={field.foto_portada_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <span
          className={`absolute left-3 top-3 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] md:left-4 md:top-4 ${
            tipo === 'privado'
              ? 'bg-[#111111] text-white ring-1 ring-white/20'
              : 'bg-[#F4F4F4] text-[#666666]'
          }`}
          style={{ ...jost, borderRadius: 0 }}
        >
          {tipo === 'privado' ? 'PRIVADO' : 'PÚBLICO'}
        </span>
        {field.destacado ? (
          <span
            className="absolute right-3 top-3 bg-[#CC4B37] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white md:right-4 md:top-4"
            style={{ ...jost, borderRadius: 0 }}
          >
            DESTACADO
          </span>
        ) : null}
      </div>
      <div className="border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-5 md:px-6">
        <h1
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
          style={jost}
        >
          {field.nombre}
        </h1>
        {field.ciudad ? (
          <p
            className="mt-2 flex items-center gap-2 text-sm text-[#666666]"
            style={lato}
          >
            <PinIcon />
            {field.ciudad}
          </p>
        ) : null}
      </div>
    </div>
  )
}
