import Link from 'next/link'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const jost700 = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 700,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type MisEquipoItem = {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  ciudad: string | null
  rol_plataforma: string | null
  rango_militar: string | null
}

function badgeKind(rol: string | null): 'founder' | 'admin' | 'member' {
  const r = (rol || '').toLowerCase().trim()
  if (r === 'founder') return 'founder'
  if (r === 'admin') return 'admin'
  return 'member'
}

function RoleBadge({ rol }: { rol: string | null }) {
  const k = badgeKind(rol)
  const label =
    k === 'founder' ? 'FUNDADOR' : k === 'admin' ? 'ADMIN' : 'MIEMBRO'
  const cls =
    k === 'founder'
      ? 'bg-[#CC4B37] text-[#FFFFFF]'
      : k === 'admin'
        ? 'bg-[#111111] text-[#FFFFFF]'
        : 'bg-[#F4F4F4] text-[#666666]'
  return (
    <span
      style={jost}
      className={`inline-block rounded-[2px] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  )
}

function canEditTeam(rol: string | null) {
  const r = (rol || '').toLowerCase().trim()
  return r === 'founder' || r === 'admin'
}

export function MisEquiposSection({ teams }: { teams: MisEquipoItem[] }) {
  if (teams.length === 0) {
    return (
      <section className="mx-auto mt-8 max-w-[640px] border-t border-solid border-[#EEEEEE] pt-8">
        <h2
          style={jost}
          className="text-[14px] font-extrabold uppercase tracking-wide text-[#111111]"
        >
          Mis equipos
        </h2>
        <p className="mt-2 text-[13px] text-[#666666]" style={lato}>
          Registra tu equipo en AirNation
        </p>
        <Link
          href="/equipos/nuevo"
          style={jost}
          className="mt-6 inline-flex items-center justify-center rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
        >
          Crear equipo
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto mt-8 max-w-[640px] border-t border-solid border-[#EEEEEE] pt-8">
      <h2
        style={jost}
        className="text-[14px] font-extrabold uppercase tracking-wide text-[#111111]"
      >
        Mis equipos
      </h2>

      <ul className="mt-6 flex flex-col gap-4">
        {teams.map((t) => {
          const initial = (t.nombre?.trim()?.[0] || '?').toUpperCase()
          return (
            <li
              key={t.id}
              className="flex flex-wrap items-center gap-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt=""
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-[16px] text-[#CC4B37]"
                      style={jost}
                    >
                      {initial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[14px] text-[#111111]"
                    style={jost700}
                  >
                    {t.nombre}
                  </p>
                  <p
                    className="mt-0.5 text-[12px] text-[#666666]"
                    style={lato}
                  >
                    {t.ciudad || '—'}
                  </p>
                  <div className="mt-2">
                    <RoleBadge rol={t.rol_plataforma} />
                  </div>
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
                <Link
                  href={`/equipos/${encodeURIComponent(t.slug)}`}
                  style={jost}
                  className="inline-flex min-h-[36px] min-w-[72px] items-center justify-center rounded-[2px] bg-[#CC4B37] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
                >
                  Ver
                </Link>
                {canEditTeam(t.rol_plataforma) ? (
                  <Link
                    href={`/equipos/${encodeURIComponent(t.slug)}/editar`}
                    style={jost}
                    className="inline-flex min-h-[36px] items-center justify-center rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                  >
                    Editar
                  </Link>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
