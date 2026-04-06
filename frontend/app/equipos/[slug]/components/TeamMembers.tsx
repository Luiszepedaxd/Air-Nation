import Link from 'next/link'
import type { MemberDisplay } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function StarWhiteIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.9L18.18 22 12 18.56 5.82 22 7 14.17l-5-4.9 7.1-1.01L12 2z"
        fill="#FFFFFF"
      />
    </svg>
  )
}

function normalizeRol(rol: string | null): 'founder' | 'admin' | 'member' {
  const r = (rol ?? '').toLowerCase().trim()
  if (r === 'founder' || r === 'fundador') return 'founder'
  if (r === 'admin') return 'admin'
  return 'member'
}

function MemberRoleLine({ m }: { m: MemberDisplay }) {
  const kind = normalizeRol(m.rol_plataforma)

  if (kind === 'founder') {
    return (
      <span
        className="inline-flex items-center justify-center gap-1 bg-[#111111] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
        style={jost}
      >
        <StarWhiteIcon />
        FUNDADOR
      </span>
    )
  }

  if (kind === 'admin') {
    return (
      <span
        className="inline-flex items-center justify-center border border-[#111111] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#111111]"
        style={jost}
      >
        ADMIN
      </span>
    )
  }

  const rank = m.rango_militar?.trim() || 'MIEMBRO'
  return (
    <p
      style={lato}
      className="text-center text-[11px] font-normal uppercase text-dim"
    >
      {rank}
    </p>
  )
}

export function TeamMembers({
  members,
  variant = 'section',
}: {
  members: MemberDisplay[]
  variant?: 'section' | 'tab'
}) {
  const n = members.length

  if (!n) {
    return (
      <p className="text-sm text-dim" style={lato}>
        No hay integrantes públicos aún.
      </p>
    )
  }

  return (
    <section
      className={
        variant === 'section'
          ? 'mx-auto w-full max-w-[960px] px-4 py-8'
          : 'w-full'
      }
    >
      {variant === 'section' ? (
        <h2
          style={jost}
          className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
        >
          Integrantes ({n})
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {members.map((m) => {
          const displayName = (m.alias || m.nombre || '—').trim()
          const initial = (displayName[0] || '?').toUpperCase()

          return (
            <Link
              key={m.id}
              href={`/u/${m.user_id}`}
              className="border border-[#EEEEEE] bg-[#FFFFFF] p-3 transition-colors hover:bg-[#F4F4F4]"
            >
              <div className="mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[18px] text-[#CC4B37]"
                    style={jost}
                  >
                    {initial}
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p
                  style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                  className="line-clamp-2 text-center text-[14px] text-[#111111]"
                >
                  {displayName}
                </p>
                <div className="mt-2 flex justify-center">
                  <MemberRoleLine m={m} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
