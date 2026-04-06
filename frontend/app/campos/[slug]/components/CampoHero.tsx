import type { CampoDetailRow } from '../../types'
import { ClickableImage } from '@/components/ui/ClickableImage'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

export function CampoHero({ field }: { field: CampoDetailRow }) {
  const tipo = normalizeTipo(field.tipo)
  const logo = field.logo_url?.trim()

  return (
    <div className="relative w-full">
      <div className="relative w-full overflow-hidden bg-[#111111] h-[240px] md:h-[360px]">
        <ClickableImage
          src={field.foto_portada_url}
          alt=""
          className="h-full w-full object-cover"
        >
          <div className="h-full w-full bg-[#111111]" />
        </ClickableImage>
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

        {logo ? (
          <div className="absolute bottom-2 left-2 z-10 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#F4F4F4] border-2 border-solid border-white md:h-24 md:w-24">
            <img
              src={logo}
              alt=""
              width={96}
              height={96}
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 pb-6 pt-6 md:px-6 md:pb-8">
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
