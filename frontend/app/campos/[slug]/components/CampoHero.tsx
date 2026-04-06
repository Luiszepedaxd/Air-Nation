import type { CampoDetailRow } from '../../types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

function initialNombre(nombre: string): string {
  const t = nombre.trim()
  if (!t) return '?'
  return t.charAt(0).toUpperCase()
}

export function CampoHero({ field }: { field: CampoDetailRow }) {
  const tipo = normalizeTipo(field.tipo)

  return (
    <div className="relative w-full">
      <div className="relative w-full overflow-hidden bg-[#111111] h-[240px] md:h-[360px]">
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

        <div className="absolute bottom-0 left-4 z-10 translate-y-1/2 md:left-6">
          {field.logo_url?.trim() ? (
            <div className="h-20 w-20 overflow-hidden rounded-full border-[3px] border-white bg-[#F4F4F4] md:h-24 md:w-24">
              <img
                src={field.logo_url.trim()}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center border-[3px] border-white bg-[#EEEEEE] text-2xl font-extrabold text-[#666666] md:h-24 md:w-24 md:text-3xl"
              style={jost}
              aria-hidden
            >
              {initialNombre(field.nombre)}
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 pb-6 pt-12 md:px-6 md:pb-8 md:pt-14">
        <h1
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
          style={jost}
        >
          {field.nombre}
        </h1>
        {field.ciudad ? (
          <p
            className="mt-2 text-sm text-[#666666]"
            style={lato}
          >
            {field.ciudad}
          </p>
        ) : null}
      </div>
    </div>
  )
}
