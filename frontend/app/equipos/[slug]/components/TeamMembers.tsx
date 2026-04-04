import Link from 'next/link'
import type { MemberDisplay } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.9L18.18 22 12 18.56 5.82 22 7 14.17l-5-4.9 7.1-1.01L12 2z"
        fill="#CC4B37"
      />
    </svg>
  )
}

function isFounderRole(rol: string | null) {
  if (!rol) return false
  const r = rol.toLowerCase()
  return r === 'founder' || r === 'fundador'
}

export function TeamMembers({ members }: { members: MemberDisplay[] }) {
  const n = members.length

  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-8">
      <h2
        style={jost}
        className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
      >
        Integrantes ({n})
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {members.map((m) => {
          const displayName = (m.alias || m.nombre || '—').trim()
          const initial = (displayName[0] || '?').toUpperCase()
          const founder = isFounderRole(m.rol_plataforma)

          return (
            <Link
              key={m.id}
              href={`/u/${m.user_id}`}
              className="border border-[#EEEEEE] bg-[#FFFFFF] p-3 transition-colors hover:bg-[#F4F4F4]"
            >
              <div className="mx-auto h-16 w-16 overflow-hidden bg-[#F4F4F4]">
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
              <div className="mt-3 flex items-start justify-center gap-1">
                <p
                  style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                  className="line-clamp-2 text-center text-[14px] text-[#111111]"
                >
                  {displayName}
                </p>
                {founder ? (
                  <span className="pt-0.5" title="Fundador">
                    <StarIcon />
                  </span>
                ) : null}
              </div>
              {m.rango_militar ? (
                <p
                  style={lato}
                  className="mt-1 line-clamp-2 text-center text-[12px] font-normal uppercase text-[#666666]"
                >
                  {m.rango_militar}
                </p>
              ) : null}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
