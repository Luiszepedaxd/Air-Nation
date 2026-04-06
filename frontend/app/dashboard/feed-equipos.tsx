import Link from 'next/link'
import { DestacadoBadge, isDestacadoTrue } from '@/app/campos/components/DestacadoBadge'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { Carrusel } from './components/Carrusel'
import { SectionHeader } from './components/SectionHeader'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
} as const

type TeamFeedRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  logo_url: string | null
  foto_portada_url: string | null
  destacado: boolean
}

export function EquiposSkeleton() {
  return (
    <section>
      <div className="w-full border-t border-[#EEEEEE]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:mx-auto md:max-w-[1200px] md:px-6">
          <div className="h-4 w-40 animate-pulse bg-[#F4F4F4]" />
          <div className="h-3 w-24 animate-pulse bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pt-1 md:px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[240px] w-[220px] shrink-0 animate-pulse bg-[#111111] md:w-[260px]"
          />
        ))}
      </div>
    </section>
  )
}

export async function EquiposSection() {
  const supabase = createDashboardSupabaseServerClient()
  const { data, error } = await supabase
    .from('teams')
    .select('id, nombre, slug, ciudad, logo_url, foto_portada_url, destacado')
    .eq('status', 'activo')
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !data?.length) return null

  const teams = (data as TeamFeedRow[]).map((row) => ({
    ...row,
    destacado: isDestacadoTrue(row.destacado),
  }))

  return (
    <section>
      <SectionHeader title="EQUIPOS" href="/equipos" linkLabel="Ver todos →" />
      <Carrusel>
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/equipos/${encodeURIComponent(team.slug)}`}
            className="relative h-[240px] w-[220px] shrink-0 snap-start overflow-hidden border border-[#EEEEEE] md:w-[260px]"
          >
            <div className="absolute inset-0 bg-[#111111]">
              {team.foto_portada_url ? (
                <img
                  src={team.foto_portada_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              {team.destacado ? <DestacadoBadge /> : null}
            </div>
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25"
              aria-hidden
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-3 pt-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border-2 border-white/30 bg-[#111111]">
                {team.logo_url ? (
                  <img
                    src={team.logo_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    style={jost}
                    className="text-[18px] font-extrabold uppercase text-white"
                  >
                    {(team.nombre?.trim()?.[0] || '?').toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8 text-center">
              <h3
                style={jost}
                className="line-clamp-2 text-[13px] font-extrabold uppercase leading-tight text-white"
              >
                {team.nombre}
              </h3>
              {team.ciudad?.trim() ? (
                <p
                  className="mt-1 text-[12px] text-white/75"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {team.ciudad.trim()}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </Carrusel>
    </section>
  )
}
