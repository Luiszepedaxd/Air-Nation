import Link from 'next/link'
import type { CampoListRow } from '../types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

function ratingValue(raw: number | string | null | undefined): number {
  if (raw == null) return 0
  const n = typeof raw === 'string' ? Number.parseFloat(raw) : raw
  return Number.isFinite(n) ? n : 0
}

function PinIcon() {
  return (
    <svg
      width={12}
      height={12}
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

function StarsRow({ value }: { value: number }) {
  const full = Math.round(value)
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={14}
          height={14}
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
            fill={i <= full ? '#CC4B37' : 'none'}
            stroke={i <= full ? '#CC4B37' : '#CCCCCC'}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  )
}

function initialNombre(nombre: string): string {
  const t = nombre.trim()
  if (!t) return '?'
  return t.charAt(0).toUpperCase()
}

export function CampoCard({ field }: { field: CampoListRow }) {
  const tipo = normalizeTipo(field.tipo)
  const avg = ratingValue(field.promedio_rating)
  const hasReviews = avg > 0

  return (
    <Link
      href={`/campos/${field.slug}`}
      className="group block border border-[#EEEEEE] bg-[#FFFFFF] text-left transition-colors hover:border-[#CCCCCC]"
    >
      <article>
        <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
          {field.foto_portada_url ? (
            <img
              src={field.foto_portada_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="text-4xl font-extrabold text-white/90"
                style={jost}
              >
                {initialNombre(field.nombre)}
              </span>
            </div>
          )}
          <span
            className={`absolute left-2 top-2 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${
              tipo === 'privado'
                ? 'bg-[#111111] text-white'
                : 'bg-[#F4F4F4] text-[#666666]'
            }`}
            style={{ ...jost, borderRadius: 0 }}
          >
            {tipo === 'privado' ? 'PRIVADO' : 'PÚBLICO'}
          </span>
          {field.destacado ? (
            <span
              className="absolute right-2 top-2 bg-[#CC4B37] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white"
              style={{ ...jost, borderRadius: 0 }}
            >
              DESTACADO
            </span>
          ) : null}
        </div>
        <div className="space-y-2 p-3">
          <h2
            className="line-clamp-2 text-base font-extrabold uppercase leading-snug text-[#111111]"
            style={jost}
          >
            {field.nombre}
          </h2>
          {field.ciudad ? (
            <p
              className="flex items-center gap-1.5 text-sm text-[#666666]"
              style={lato}
            >
              <PinIcon />
              {field.ciudad}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {hasReviews ? (
              <>
                <StarsRow value={avg} />
                <span
                  className="text-sm font-medium text-[#111111]"
                  style={lato}
                >
                  {avg.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-sm text-[#999999]" style={lato}>
                Sin reseñas
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
