import Link from 'next/link'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/**
 * Detecta si una URL apunta a un dominio AirNation (landing dedicada interna).
 * Acepta: airnation.online, www.airnation.online, http/https.
 */
function esLandingAirNation(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return /(^|\.)airnation\.online$/i.test(u.hostname)
  } catch {
    return false
  }
}

/**
 * Extrae el pathname de una URL AN para usar con <Link> (navegación interna SPA).
 * Si falla el parseo, devuelve la URL tal cual (fallback seguro).
 */
function pathnameDe(url: string): string {
  try {
    const u = new URL(url.trim())
    return u.pathname + u.search + u.hash
  } catch {
    return url.trim()
  }
}

export function EventoCtaPrincipal({ urlExterna }: { urlExterna: string | null }) {
  const url = urlExterna?.trim()
  if (!url) return null

  const esAN = esLandingAirNation(url)

  if (esAN) {
    const href = pathnameDe(url)
    return (
      <div className="border-b border-solid border-[#EEEEEE] px-4 py-5 md:px-6">
        <Link
          href={href}
          className="group flex w-full items-center justify-between gap-3 bg-[#CC4B37] px-4 py-4 text-[#FFFFFF] transition-opacity hover:opacity-90 md:px-6 md:py-5"
        >
          <div className="min-w-0 flex-1">
            <p
              style={jost}
              className="text-[10px] tracking-[0.16em] text-[#FFFFFF]/80 md:text-[11px]"
            >
              SPONSOR OFICIAL · COBERTURA EN CAMPO
            </p>
            <p
              style={jost}
              className="mt-1 text-[15px] leading-tight text-[#FFFFFF] md:text-[17px]"
            >
              VER COBERTURA COMPLETA EN AIRNATION →
            </p>
            <p
              style={lato}
              className="mt-1 text-[12px] leading-snug text-[#FFFFFF]/85 md:text-[13px]"
            >
              Galería, facciones, logística y todos los detalles que armamos para este evento.
            </p>
          </div>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="shrink-0 transition-transform group-hover:translate-x-0.5"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="border-b border-solid border-[#EEEEEE] px-4 py-5 md:px-6">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex w-full items-center justify-between gap-3 border-2 border-solid border-[#111111] bg-[#FFFFFF] px-4 py-4 text-[#111111] transition-colors hover:bg-[#111111] hover:text-[#FFFFFF] md:px-6 md:py-5"
      >
        <div className="min-w-0 flex-1">
          <p
            style={jost}
            className="text-[10px] tracking-[0.16em] text-[#999999] md:text-[11px]"
          >
            SITIO OFICIAL DEL EVENTO
          </p>
          <p style={jost} className="mt-1 text-[15px] leading-tight md:text-[17px]">
            VER MÁS INFO, INSCRIPCIONES Y REGLAMENTO →
          </p>
          <p
            style={lato}
            className="mt-1 text-[12px] leading-snug text-[#666666] group-hover:text-[#FFFFFF]/85 md:text-[13px]"
          >
            Página oficial del productor con boletos y detalle completo.
          </p>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="shrink-0"
        >
          <path
            d="M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  )
}
