import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { streamThumbnail } from '@/lib/stream-thumbnail'
import { ReelOpener } from './ReelOpener'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const SITE = 'https://www.airnation.online'
const OG_DEFAULT = `${SITE}/og-default.jpg`
const OG_DESC = 'Airsoft en AirNation · toca para verlo'

type Reel = { author: string; authorHref: string; src: string; image: string }

/** Solo https absoluto: WhatsApp/Twitter ignoran relativos y http. */
function absoluteHttps(value: unknown): string | null {
  const url = typeof value === 'string' ? value.trim() : ''
  return url.startsWith('https://') ? url : null
}

/**
 * Datos públicos del post, con el anon key (sin sesión): igual que el perfil
 * `/u/[id]`. `cache()` lo comparte entre `generateMetadata` y la página.
 */
const fetchReel = cache(async (type: string, id: string): Promise<Reel | null> => {
  if (type !== 'player' && type !== 'team') return null
  const supabase = createPublicSupabaseClient()

  if (type === 'player') {
    const { data, error } = await supabase
      .from('player_posts')
      .select('user_id, video_url, video_mp4_url, thumbnail_url, users(alias, nombre)')
      .eq('id', id)
      .eq('published', true)
      .maybeSingle()
    if (error || !data) return null
    const row = data as {
      user_id: string | null
      video_url: string | null
      video_mp4_url: string | null
      thumbnail_url: string | null
      users: { alias: string | null; nombre: string | null } | { alias: string | null; nombre: string | null }[] | null
    }
    const src = row.video_url || row.video_mp4_url
    if (!src || !row.user_id) return null
    const u = Array.isArray(row.users) ? row.users[0] : row.users
    return {
      author: u?.alias?.trim() || u?.nombre?.trim() || 'Jugador',
      authorHref: `/u/${row.user_id}`,
      src,
      // R2 legacy no tiene thumbnail de Stream: usa el guardado.
      image: absoluteHttps(row.thumbnail_url) || streamThumbnail(src, 630, '1s') || OG_DEFAULT,
    }
  }

  // team_posts no tiene thumbnail_url: el poster sale de Stream.
  const { data, error } = await supabase
    .from('team_posts')
    .select('video_url, teams(nombre, slug)')
    .eq('id', id)
    .eq('published', true)
    .maybeSingle()
  if (error || !data) return null
  const row = data as {
    video_url: string | null
    teams: { nombre: string | null; slug: string | null } | { nombre: string | null; slug: string | null }[] | null
  }
  const t = Array.isArray(row.teams) ? row.teams[0] : row.teams
  if (!row.video_url || !t?.slug) return null
  return {
    author: t.nombre?.trim() || 'Equipo',
    authorHref: `/equipos/${t.slug}`,
    src: row.video_url,
    image: streamThumbnail(row.video_url, 630, '1s') || OG_DEFAULT,
  }
})

type Params = { params: { type: string; id: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const reel = await fetchReel(params.type, params.id)
  if (!reel) return { title: 'AirNation' }

  const title = `Mira este reel de ${reel.author} en AirNation`
  const url = `${SITE}/reel/${params.type}/${params.id}`
  return {
    title,
    description: OG_DESC,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: OG_DESC,
      url,
      siteName: 'AirNation',
      locale: 'es_MX',
      type: 'video.other',
      images: [{ url: reel.image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: OG_DESC,
      images: [reel.image],
    },
  }
}

export default async function ReelPage({ params }: Params) {
  const reel = await fetchReel(params.type, params.id)
  if (!reel) notFound()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black p-6 text-white">
      <img
        src={reel.image}
        alt={`Reel de ${reel.author} en AirNation`}
        className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain"
      />
      <h1 className="text-center text-lg font-extrabold uppercase" style={{ fontFamily: "'Jost', sans-serif" }}>
        Mira este reel de {reel.author} en AirNation
      </h1>
      <ReelOpener src={reel.src} />
      <a href={reel.authorHref} className="text-sm underline" style={{ fontFamily: "'Lato', sans-serif" }}>
        Ver perfil de {reel.author}
      </a>
    </main>
  )
}
