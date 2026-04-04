import type { PublicTeam } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
        fill="#666666"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M13.5 10.5h-2v-1c0-.5.3-.6.8-.6h1.2V6.2h-2.1c-2 0-2.9 1-2.9 2.6V10.5H7v2.8h1.5V22h3.2v-8.7h2.2l.3-2.8z"
        fill="currentColor"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M20.5 3.5A9.9 9.9 0 0012.1 0 9.9 9.9 0 002.2 9.9c0 1.7.4 3.4 1.2 4.9L1 24l9.4-2.5a9.8 9.8 0 004.7 1.2h.1c5.5 0 9.9-4.4 9.9-9.9a9.8 9.8 0 00-2.9-7.1l-.3-.2zM12 18.4h-.1a8.2 8.2 0 01-4.2-1.1l-.3-.2-4.9 1.3 1.3-4.8-.3-.5a8.2 8.2 0 1113.5 5.3zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.2-.2 0-.4.1-.5.1-.1.2-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.5h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.2.9 2.4 1 2.6.1.2 1.7 2.6 4.1 3.7.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3z"
      />
    </svg>
  )
}

function socialHref(
  kind: 'instagram' | 'facebook' | 'whatsapp',
  value: string
): string {
  const v = value.trim()
  if (!v) return '#'
  if (kind === 'whatsapp') {
    if (v.startsWith('http')) return v
    const digits = v.replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}` : v
  }
  if (v.startsWith('http')) return v
  if (kind === 'instagram') return `https://instagram.com/${v.replace(/^@/, '')}`
  return `https://facebook.com/${v.replace(/^@/, '')}`
}

export function TeamHero({ team }: { team: PublicTeam }) {
  const initial = (team.nombre?.trim()?.[0] || '?').toUpperCase()

  return (
    <header className="w-full">
      <div className="relative w-full">
        <div
          className="relative h-[240px] w-full overflow-hidden bg-[#111111] md:h-[360px]"
        >
          {team.foto_portada_url ? (
            <img
              src={team.foto_portada_url}
              alt=""
              width={1920}
              height={720}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] flex w-full -translate-x-1/2 translate-y-1/2 justify-center">
          <div
            className="pointer-events-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#F4F4F4] [border:3px_solid_#FFFFFF]"
          >
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="text-[28px] text-[#CC4B37]"
                style={jost}
              >
                {initial}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 pb-6 pt-14 text-center">
        <h1
          style={jost}
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
        >
          {team.nombre}
        </h1>

        {team.ciudad ? (
          <p
            className="mt-2 flex items-center justify-center gap-1.5 text-[14px] text-[#666666]"
            style={lato}
          >
            <PinIcon />
            <span>{team.ciudad}</span>
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
          {team.instagram ? (
            <a
              href={socialHref('instagram', team.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111111] transition-colors hover:text-[#CC4B37]"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>
          ) : null}
          {team.facebook ? (
            <a
              href={socialHref('facebook', team.facebook)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111111] transition-colors hover:text-[#CC4B37]"
              aria-label="Facebook"
            >
              <FacebookIcon />
            </a>
          ) : null}
          {team.whatsapp_url ? (
            <a
              href={socialHref('whatsapp', team.whatsapp_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#111111] transition-colors hover:text-[#CC4B37]"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon />
            </a>
          ) : null}
        </div>
      </div>
    </header>
  )
}
