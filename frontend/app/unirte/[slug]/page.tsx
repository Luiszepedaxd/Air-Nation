import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { ClickableImage } from '@/components/ui/ClickableImage'

type TeamInviteData = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  descripcion: string | null
  foto_portada_url: string | null
  logo_url: string | null
  memberCount: number
  invitadoPor: string | null
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const getTeamForInvite = cache(
  async (slug: string): Promise<TeamInviteData | null> => {
    const supabase = createPublicSupabaseClient()

    const { data: team } = await supabase
      .from('teams')
      .select('id, nombre, slug, ciudad, descripcion, foto_portada_url, logo_url')
      .eq('slug', slug)
      .eq('status', 'activo')
      .maybeSingle()

    if (!team) return null

    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .eq('status', 'activo')

    return {
      id: team.id as string,
      nombre: team.nombre as string,
      slug: team.slug as string,
      ciudad: (team.ciudad as string | null) ?? null,
      descripcion: (team.descripcion as string | null) ?? null,
      foto_portada_url: (team.foto_portada_url as string | null) ?? null,
      logo_url: (team.logo_url as string | null) ?? null,
      memberCount: count ?? 0,
      invitadoPor: null,
    }
  }
)

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const team = await getTeamForInvite(params.slug)
  if (!team) return { title: 'AirNation' }

  const title = `Únete a ${team.nombre} en AirNation`
  const description = `Te invitan a unirte al equipo ${team.nombre}${team.ciudad ? ` de ${team.ciudad}` : ''} en AirNation — la plataforma del airsoft en México.`

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.airnation.online/unirte/${team.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.airnation.online/unirte/${team.slug}`,
      type: 'website',
      images: team.foto_portada_url
        ? [{ url: team.foto_portada_url, width: 1200, height: 630 }]
        : [{ url: 'https://www.airnation.online/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function UnirteEquipoPage({
  params,
}: {
  params: { slug: string }
}) {
  const team = await getTeamForInvite(params.slug)
  if (!team) notFound()

  const supabaseAuth = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  const hasSession = Boolean(user?.id)

  const redirectBack = `/unirte/${team.slug}`
  const registerHref = `/register?redirect=${encodeURIComponent(redirectBack)}`
  const loginHref = `/login?redirect=${encodeURIComponent(redirectBack)}`
  const equipoHref = `/equipos/${team.slug}`

  const initial = (team.nombre?.trim()?.[0] || '?').toUpperCase()

  return (
    <div
      className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]"
      style={lato}
    >
      <header className="flex justify-center px-4 py-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          <span
            style={{ fontFamily: "'Jost', sans-serif" }}
            className="text-[1.1rem] font-black uppercase tracking-[0.18em] text-[#111111]"
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </Link>
      </header>

      <div className="relative w-full">
        <div className="relative h-[200px] w-full overflow-hidden bg-[#111111] sm:h-[240px]">
          <ClickableImage
            src={team.foto_portada_url}
            alt=""
            width={1920}
            height={720}
            className="h-full w-full object-cover"
          >
            <div className="h-full w-full bg-[#111111]" />
          </ClickableImage>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] flex w-full -translate-x-1/2 translate-y-1/2 justify-center">
          <div className="pointer-events-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#F4F4F4] [border:3px_solid_#FFFFFF]">
            {team.logo_url ? (
              <ClickableImage
                src={team.logo_url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span style={jost} className="text-[28px] text-[#CC4B37]">
                {initial}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="px-4 pb-12 pt-14">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <span
            className="mb-4 inline-block rounded-[2px] bg-[#CC4B37] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white"
            style={jost}
          >
            INVITACIÓN
          </span>

          <h1
            className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] sm:text-[26px]"
            style={jost}
          >
            ÚNETE A {team.nombre}
          </h1>

          <div className="mt-6 w-full space-y-2 text-sm leading-relaxed text-[#444444]">
            {team.ciudad?.trim() ? (
              <p>
                <span className="text-[#666666]">Ciudad: </span>
                {team.ciudad.trim()}
              </p>
            ) : null}
            <p>{team.memberCount} integrantes</p>
            {team.descripcion?.trim() ? (
              <p className="line-clamp-2 text-pretty">{team.descripcion.trim()}</p>
            ) : null}
          </div>

          <div className="mt-8 w-full space-y-4">
            <Link
              href={hasSession ? equipoHref : registerHref}
              className="flex w-full items-center justify-center rounded-[2px] bg-[#CC4B37] px-4 py-3.5 text-center text-xs font-extrabold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-95"
              style={jost}
            >
              {hasSession
                ? 'SOLICITAR UNIRME AL EQUIPO'
                : 'CREAR CUENTA Y UNIRME'}
            </Link>

            <Link
              href={hasSession ? equipoHref : loginHref}
              className="block text-center text-xs text-[#888888] underline-offset-2 transition-colors hover:text-[#666666]"
            >
              {hasSession
                ? 'Ver perfil del equipo →'
                : '¿Ya tienes cuenta? Inicia sesión →'}
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 pb-10 text-center text-[11px] text-[#AAAAAA]">
        AirNation — La plataforma del airsoft en México
      </footer>
    </div>
  )
}
