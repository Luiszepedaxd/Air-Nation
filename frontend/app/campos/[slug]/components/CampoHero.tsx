import Link from 'next/link'
import type { CampoDetailRow } from '../../types'
import { ClickableImage } from '@/components/ui/ClickableImage'
import { CampoShareButton } from './CampoShareButton'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const
const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

export function CampoHero({ field }: { field: CampoDetailRow }) {
  const tipo = normalizeTipo(field.tipo)
  const logo = field.logo_url?.trim()
  const crearEventoHref = `/eventos/nuevo?${new URLSearchParams({
    field_id: field.id,
    field_nombre: field.nombre,
  }).toString()}`

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
        <div className="mt-4 flex w-full max-w-full flex-row flex-nowrap items-stretch gap-2 sm:gap-3">
          <Link
            href={crearEventoHref}
            style={{ ...jostBtn, borderRadius: 0 }}
            className="inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 bg-[#CC4B37] px-3 py-2.5 text-[11px] tracking-[0.12em] text-white transition-colors hover:bg-[#D95540] sm:flex-none sm:px-5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="shrink-0"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span className="truncate">CREAR EVENTO</span>
          </Link>
          <CampoShareButton
            nombre={field.nombre}
            slug={field.slug}
            className="min-w-0 flex-1 sm:flex-none"
          />
        </div>
      </div>
    </div>
  )
}
