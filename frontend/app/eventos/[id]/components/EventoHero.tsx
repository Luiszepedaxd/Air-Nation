import { formatEventoFechaCorta, disciplinaLabel } from '../../lib/format-evento-fecha'
import { CalendarioPlaceholderIcon } from '../../lib/calendar-placeholder'

const jost = { fontFamily: "'Jost', sans-serif" } as const

function tipoBadge(tipo: string | null) {
  const t = (tipo ?? '').toLowerCase()
  const pub = t !== 'privado'
  return pub ? 'PÚBLICO' : 'PRIVADO'
}

export function EventoHero({
  title,
  fecha,
  imagen_url,
  tipo,
  disciplina,
}: {
  title: string
  fecha: string
  imagen_url: string | null
  tipo: string | null
  disciplina: string | null
}) {
  const fechaTxt = formatEventoFechaCorta(fecha)
  const disc = disciplinaLabel(disciplina)

  return (
    <div className="w-full">
      <div className="relative h-[240px] w-full overflow-hidden bg-[#111111] md:h-[360px]">
        {imagen_url?.trim() ? (
          <img
            src={imagen_url.trim()}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#AAAAAA]">
            <CalendarioPlaceholderIcon size={56} />
          </div>
        )}
        <span
          style={jost}
          className="absolute left-3 top-3 bg-[#111111]/85 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF] md:left-4 md:top-4"
        >
          {tipoBadge(tipo)}
        </span>
        <span
          style={jost}
          className="absolute right-3 top-3 bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF] md:right-4 md:top-4"
        >
          {disc}
        </span>
      </div>
      <div className="border-b border-solid border-[#EEEEEE] px-4 py-5 md:px-6">
        <h1
          style={jost}
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
        >
          {title}
        </h1>
        {fechaTxt ? (
          <p
            className="mt-2 text-sm text-[#666666]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {fechaTxt}
          </p>
        ) : null}
      </div>
    </div>
  )
}
