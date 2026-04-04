import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'

export const revalidate = 0

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type TeamListRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  logo_url: string | null
  foto_portada_url: string | null
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

function initialNombre(nombre: string): string {
  const t = nombre.trim()
  if (!t) return '?'
  return t.charAt(0).toUpperCase()
}

async function fetchEquiposActivos(): Promise<TeamListRow[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('teams')
    .select('id, nombre, slug, ciudad, logo_url, foto_portada_url')
    .eq('status', 'activo')
    .order('nombre', { ascending: true })

  if (error) {
    console.error('[equipos] list:', error.message)
    return []
  }
  return (data ?? []) as TeamListRow[]
}

function EquipoCard({ team }: { team: TeamListRow }) {
  const slugEnc = encodeURIComponent(team.slug)

  return (
    <Link
      href={`/equipos/${slugEnc}`}
      className="group block border border-[#EEEEEE] bg-[#FFFFFF] text-left transition-colors hover:border-[#CCCCCC]"
    >
      <article>
        <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
          {team.foto_portada_url ? (
            <img
              src={team.foto_portada_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span
                className="text-4xl font-extrabold text-white/90"
                style={jost}
              >
                {initialNombre(team.nombre)}
              </span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 h-12 w-12 shrink-0 overflow-hidden border-2 border-solid border-white bg-[#111111]">
            {team.logo_url ? (
              <img
                src={team.logo_url}
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
                {initialNombre(team.nombre)}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2 p-3">
          <h2
            className="line-clamp-2 text-base font-extrabold uppercase leading-snug text-[#111111]"
            style={jost}
          >
            {team.nombre}
          </h2>
          {team.ciudad?.trim() ? (
            <p
              className="flex items-center gap-1.5 text-[12px] text-[#666666]"
              style={lato}
            >
              <PinIcon />
              {team.ciudad.trim()}
            </p>
          ) : null}
        </div>
      </article>
    </Link>
  )
}

export default async function EquiposPublicPage() {
  const teams = await fetchEquiposActivos()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <h1
            className="text-[24px] font-extrabold uppercase leading-tight text-white"
            style={{ ...jost, fontWeight: 800 }}
          >
            Equipos
          </h1>
          <p
            className="mt-2 text-[14px] text-[#999999]"
            style={lato}
          >
            Comunidad de airsoft en México
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {teams.length === 0 ? (
          <p
            className="py-12 text-center text-sm text-[#666666]"
            style={lato}
          >
            Aún no hay equipos registrados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <EquipoCard key={t.id} team={t} />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/equipos/nuevo"
            style={jost}
            className="inline-flex min-h-[44px] min-w-[200px] items-center justify-center bg-[#CC4B37] px-6 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
          >
            Crear equipo
          </Link>
        </div>
      </div>
    </div>
  )
}
