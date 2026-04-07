'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800,
  textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Tab = 'feed' | 'eventos' | 'equipos' | 'noticias' | 'videos'

// Tipos de items del feed
type FeedItem =
  | { kind: 'team_post'; id: string; content: string | null; fotos_urls: string[] | null; created_at: string; team: { nombre: string; slug: string; logo_url: string | null } }
  | { kind: 'player_post'; id: string; content: string | null; fotos_urls: string[] | null; created_at: string; user: { alias: string | null; nombre: string | null; avatar_url: string | null } }
  | { kind: 'event'; id: string; title: string; fecha: string; imagen_url: string | null; field_nombre: string | null; field_ciudad: string | null; created_at: string }
  | { kind: 'new_team'; id: string; nombre: string; slug: string; ciudad: string | null; logo_url: string | null; foto_portada_url: string | null; created_at: string }
  | { kind: 'video'; id: string; title: string; youtube_url: string; thumbnail_url: string | null; created_at: string }
  | { kind: 'noticia'; id: string; title: string; slug: string; excerpt: string | null; cover_url: string | null; category: string | null; created_at: string }

type EventItem = { id: string; title: string; fecha: string; imagen_url: string | null; field_nombre: string | null; field_ciudad: string | null }
type TeamPostItem = { id: string; content: string | null; fotos_urls: string[] | null; created_at: string; team: { nombre: string; slug: string; logo_url: string | null } }
type NoticiaItem = { id: string; title: string; slug: string; excerpt: string | null; cover_url: string | null; category: string | null; created_at: string }
type VideoItem = { id: string; title: string; youtube_url: string; thumbnail_url: string | null; created_at: string }

function formatRelativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch { return '' }
}

function formatEventDate(iso: string) {
  try {
    const d = new Date(iso)
    const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']
    return `${dias[d.getDay()]} ${d.getDate()} ${meses[d.getMonth()]}`
  } catch { return '' }
}

// ─── CARD COMPONENTS ───

function TeamPostCard({ item }: { item: Extract<FeedItem, { kind: 'team_post' }> }) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="flex items-center gap-3 mb-3">
        <Link href={`/equipos/${item.team.slug}`}>
          <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0">
            {item.team.logo_url
              ? <img src={item.team.logo_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-sm font-bold" style={jost}>{item.team.nombre[0]}</div>
            }
          </div>
        </Link>
        <div>
          <Link href={`/equipos/${item.team.slug}`}>
            <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111] hover:text-[#CC4B37]">{item.team.nombre}</p>
          </Link>
          <p style={lato} className="text-[11px] text-[#999999]">{formatRelativeTime(item.created_at)}</p>
        </div>
      </div>
      {item.content?.trim() && (
        <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">{item.content}</p>
      )}
      {fotos.length > 0 && (
        <div className={`grid gap-1 ${fotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {fotos.map((url, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-[#F4F4F4]">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PlayerPostCard({ item }: { item: Extract<FeedItem, { kind: 'player_post' }> }) {
  const fotos = (item.fotos_urls ?? []).slice(0, 4)
  const name = item.user.alias?.trim() || item.user.nombre?.trim() || 'Jugador'
  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-[#F4F4F4] overflow-hidden shrink-0 rounded-full">
          {item.user.avatar_url
            ? <img src={item.user.avatar_url} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-sm font-bold" style={jost}>{name[0].toUpperCase()}</div>
          }
        </div>
        <div>
          <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">{name}</p>
          <p style={lato} className="text-[11px] text-[#999999]">{formatRelativeTime(item.created_at)}</p>
        </div>
      </div>
      {item.content?.trim() && (
        <p style={lato} className="text-[14px] text-[#111111] mb-3 leading-relaxed">{item.content}</p>
      )}
      {fotos.length > 0 && (
        <div className={`grid gap-1 ${fotos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {fotos.map((url, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-[#F4F4F4]">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ item }: { item: Extract<FeedItem, { kind: 'event' }> }) {
  const sub = [item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ')
  return (
    <Link href={`/eventos/${item.id}`} className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
      <div className="w-16 h-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
        {item.imagen_url
          ? <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="1.5" stroke="#AAAAAA" strokeWidth="1.4" /><path d="M3 9h18M8 5V3M16 5V3" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37]">{formatEventDate(item.fecha)}</p>
        <h3 style={jost} className="mt-0.5 line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
        {sub && <p style={lato} className="mt-1 text-[11px] text-[#666666] truncate">{sub}</p>}
      </div>
    </Link>
  )
}

function NewTeamCard({ item }: { item: Extract<FeedItem, { kind: 'new_team' }> }) {
  return (
    <Link href={`/equipos/${item.slug}`} className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3 items-center">
      <div className="w-12 h-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
        {item.logo_url
          ? <img src={item.logo_url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-[#CC4B37] text-lg font-bold" style={jost}>{item.nombre[0]}</div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <p style={lato} className="text-[11px] text-[#999999] mb-0.5">Nuevo equipo</p>
        <h3 style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">{item.nombre}</h3>
        {item.ciudad && <p style={lato} className="text-[11px] text-[#666666]">{item.ciudad}</p>}
      </div>
    </Link>
  )
}

function VideoCard({ item }: { item: Extract<FeedItem, { kind: 'video' }> }) {
  const videoId = item.youtube_url?.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )?.[1]
  const thumb = item.thumbnail_url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null)

  return (
    <a
      href={item.youtube_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden"
    >
      <div className="relative aspect-video w-full bg-[#111111] overflow-hidden">
        {thumb && (
          <img src={thumb} alt="" className="w-full h-full object-cover opacity-90"/>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-[#CC4B37] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
              <path d="M8 5.14v14l11-7-11-7z"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="p-3">
        <p style={lato} className="text-[11px] text-[#999999] mb-1">Video</p>
        <h3 style={jost} className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">
          {item.title}
        </h3>
      </div>
    </a>
  )
}

function NoticiaFeedCard({ item }: { item: Extract<FeedItem, { kind: 'noticia' }> }) {
  return (
    <Link href={`/blog/${item.slug}`}
      className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
      <div className="w-20 h-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
        {item.cover_url
          ? <img src={item.cover_url} alt="" className="w-full h-full object-cover"/>
          : <div className="w-full h-full flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1Z"
                  stroke="#AAAAAA" strokeWidth="1.4" strokeLinejoin="round"/>
                <path d="M15 3v4h4M9 11h6M9 15h4"
                  stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
        }
      </div>
      <div className="min-w-0 flex-1">
        {item.category && (
          <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37] mb-0.5">
            {item.category}
          </p>
        )}
        <h3 style={jost} className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">
          {item.title}
        </h3>
        {item.excerpt && (
          <p style={lato} className="mt-1 line-clamp-2 text-[11px] text-[#666666]">
            {item.excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}

// ─── FEED TAB ───
function FeedTab() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [teamPostsRes, playerPostsRes, eventsRes, teamsRes, videosRes, noticiasRes] = await Promise.all([
        supabase.from('team_posts')
          .select('id, content, fotos_urls, created_at, teams(nombre, slug, logo_url)')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('player_posts')
          .select('id, content, fotos_urls, created_at, users(alias, nombre, avatar_url)')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('events')
          .select('id, title, fecha, imagen_url, created_at, fields(nombre, ciudad)')
          .eq('published', true)
          .eq('status', 'publicado')
          .gte('fecha', new Date().toISOString())
          .order('fecha', { ascending: true })
          .limit(5),
        supabase.from('teams')
          .select('id, nombre, slug, ciudad, logo_url, foto_portada_url, created_at')
          .eq('status', 'activo')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('videos')
          .select('id, title, youtube_url, thumbnail_url, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('posts')
          .select('id, title, slug, excerpt, cover_url, category, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      const feedItems: FeedItem[] = []

      for (const row of teamPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
        if (!t) continue
        feedItems.push({
          kind: 'team_post',
          id: String(r.id),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          created_at: String(r.created_at),
          team: { nombre: String((t as Record<string, unknown>).nombre ?? ''), slug: String((t as Record<string, unknown>).slug ?? ''), logo_url: (t as Record<string, unknown>).logo_url as string | null },
        })
      }

      for (const row of playerPostsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        feedItems.push({
          kind: 'player_post',
          id: String(r.id),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          created_at: String(r.created_at),
          user: { alias: u ? String((u as Record<string, unknown>).alias ?? '') || null : null, nombre: u ? String((u as Record<string, unknown>).nombre ?? '') || null : null, avatar_url: u ? (u as Record<string, unknown>).avatar_url as string | null : null },
        })
      }

      for (const row of eventsRes.data ?? []) {
        const r = row as Record<string, unknown>
        const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
        feedItems.push({
          kind: 'event',
          id: String(r.id),
          title: String(r.title ?? ''),
          fecha: String(r.fecha ?? ''),
          imagen_url: (r.imagen_url as string | null) ?? null,
          field_nombre: f ? String((f as Record<string, unknown>).nombre ?? '') || null : null,
          field_ciudad: f ? String((f as Record<string, unknown>).ciudad ?? '') || null : null,
          created_at: String(r.created_at),
        })
      }

      for (const row of teamsRes.data ?? []) {
        const r = row as Record<string, unknown>
        feedItems.push({
          kind: 'new_team',
          id: String(r.id),
          nombre: String(r.nombre ?? ''),
          slug: String(r.slug ?? ''),
          ciudad: (r.ciudad as string | null) ?? null,
          logo_url: (r.logo_url as string | null) ?? null,
          foto_portada_url: (r.foto_portada_url as string | null) ?? null,
          created_at: String(r.created_at),
        })
      }

      for (const row of videosRes.data ?? []) {
        const r = row as Record<string, unknown>
        if (!r.youtube_url) continue
        feedItems.push({
          kind: 'video',
          id: String(r.id),
          title: String(r.title ?? ''),
          youtube_url: String(r.youtube_url),
          thumbnail_url: (r.thumbnail_url as string | null) ?? null,
          created_at: String(r.created_at),
        })
      }

      for (const row of noticiasRes.data ?? []) {
        const r = row as Record<string, unknown>
        feedItems.push({
          kind: 'noticia',
          id: String(r.id),
          title: String(r.title ?? ''),
          slug: String(r.slug ?? ''),
          excerpt: (r.excerpt as string | null) ?? null,
          cover_url: (r.cover_url as string | null) ?? null,
          category: (r.category as string | null) ?? null,
          created_at: String(r.created_at),
        })
      }

      // Mezclar por created_at DESC
      feedItems.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setItems(feedItems)
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map(i => (
        <div key={i} className="border border-[#EEEEEE] p-4">
          <div className="flex gap-3 mb-3">
            <div className="w-9 h-9 bg-[#F4F4F4] animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-[#F4F4F4] animate-pulse" />
              <div className="h-2 w-16 bg-[#F4F4F4] animate-pulse" />
            </div>
          </div>
          <div className="h-4 w-full bg-[#F4F4F4] animate-pulse mb-2" />
          <div className="h-4 w-3/4 bg-[#F4F4F4] animate-pulse" />
        </div>
      ))}
    </div>
  )

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p style={jost} className="text-[13px] font-extrabold uppercase text-[#666666]">La comunidad está arrancando</p>
      <p style={lato} className="mt-2 text-[13px] text-[#999999]">Pronto verás actividad de equipos y jugadores aquí</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => {
        if (item.kind === 'team_post') return <TeamPostCard key={`tp-${item.id}`} item={item} />
        if (item.kind === 'player_post') return <PlayerPostCard key={`pp-${item.id}`} item={item} />
        if (item.kind === 'event') return <EventCard key={`ev-${item.id}`} item={item} />
        if (item.kind === 'new_team') return <NewTeamCard key={`nt-${item.id}`} item={item} />
        if (item.kind === 'video') return <VideoCard key={`vid-${item.id}`} item={item}/>
        if (item.kind === 'noticia') return <NoticiaFeedCard key={`not-${item.id}`} item={item}/>
        return null
      })}
    </div>
  )
}

// ─── EVENTOS TAB ───
function EventosTab() {
  const [items, setItems] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('events')
        .select('id, title, fecha, imagen_url, fields(nombre, ciudad)')
        .eq('published', true)
        .eq('status', 'publicado')
        .gte('fecha', new Date().toISOString())
        .order('fecha', { ascending: true })
        .limit(20)

      setItems((data ?? []).map(row => {
        const r = row as Record<string, unknown>
        const f = Array.isArray(r.fields) ? r.fields[0] : r.fields
        return {
          id: String(r.id),
          title: String(r.title ?? ''),
          fecha: String(r.fecha ?? ''),
          imagen_url: (r.imagen_url as string | null) ?? null,
          field_nombre: f ? String((f as Record<string, unknown>).nombre ?? '') || null : null,
          field_ciudad: f ? String((f as Record<string, unknown>).ciudad ?? '') || null : null,
        }
      }))
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="h-20 border border-[#EEEEEE] animate-pulse" />)}</div>
  if (!items.length) return <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">No hay eventos próximos</p>

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <Link key={item.id} href={`/eventos/${item.id}`} className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
          <div className="w-16 h-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
            {item.imagen_url ? <img src={item.imagen_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="1.5" stroke="#AAAAAA" strokeWidth="1.4" /><path d="M3 9h18M8 5V3M16 5V3" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" /></svg></div>}
          </div>
          <div className="min-w-0 flex-1">
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37]">{formatEventDate(item.fecha)}</p>
            <h3 style={jost} className="mt-0.5 line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
            {[item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ') && <p style={lato} className="mt-1 text-[11px] text-[#666666] truncate">{[item.field_nombre, item.field_ciudad].filter(Boolean).join(' · ')}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

// ─── EQUIPOS TAB ───
function EquiposTab() {
  const [items, setItems] = useState<TeamPostItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('team_posts')
        .select('id, content, fotos_urls, created_at, teams(nombre, slug, logo_url)')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)

      setItems((data ?? []).map(row => {
        const r = row as Record<string, unknown>
        const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
        return {
          id: String(r.id),
          content: (r.content as string | null) ?? null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : null,
          created_at: String(r.created_at),
          team: { nombre: t ? String((t as Record<string, unknown>).nombre ?? '') : '', slug: t ? String((t as Record<string, unknown>).slug ?? '') : '', logo_url: t ? (t as Record<string, unknown>).logo_url as string | null : null },
        }
      }))
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="h-24 border border-[#EEEEEE] animate-pulse" />)}</div>
  if (!items.length) return <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">Los equipos aún no han publicado</p>

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <TeamPostCard key={item.id} item={{ kind: 'team_post', ...item }} />
      ))}
    </div>
  )
}

// ─── NOTICIAS TAB ───
function NoticiasTab() {
  const [items, setItems] = useState<NoticiaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('posts')
        .select('id, title, slug, excerpt, cover_url, category, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)
      setItems((data ?? []) as NoticiaItem[])
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <div key={i} className="h-24 border border-[#EEEEEE] animate-pulse" />)}</div>
  if (!items.length) return <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">No hay noticias aún</p>

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <Link key={item.id} href={`/blog/${item.slug}`} className="flex gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3">
          <div className="w-20 h-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
            {item.cover_url ? <img src={item.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1Z" stroke="#AAAAAA" strokeWidth="1.4" strokeLinejoin="round" /><path d="M15 3v4h4M9 11h6M9 15h4" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" /></svg></div>}
          </div>
          <div className="min-w-0 flex-1">
            {item.category && <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37] mb-0.5">{item.category}</p>}
            <h3 style={jost} className="line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]">{item.title}</h3>
            {item.excerpt && <p style={lato} className="mt-1 line-clamp-2 text-[11px] text-[#666666]">{item.excerpt}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}

function VideosTab() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('videos')
        .select('id, title, youtube_url, thumbnail_url, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)
      setItems((data ?? []) as VideoItem[])
      setLoading(false)
    }
    void load()
  }, [])

  if (loading) return (
    <div className="flex flex-col gap-3">
      {[0,1,2].map(i => (
        <div key={i} className="border border-[#EEEEEE] animate-pulse">
          <div className="aspect-video w-full bg-[#F4F4F4]"/>
          <div className="p-3 space-y-2">
            <div className="h-3 w-full bg-[#F4F4F4]"/>
            <div className="h-2 w-20 bg-[#F4F4F4]"/>
          </div>
        </div>
      ))}
    </div>
  )

  if (!items.length) return (
    <p style={lato} className="py-12 text-center text-[13px] text-[#999999]">
      No hay videos aún
    </p>
  )

  return (
    <div className="flex flex-col gap-3">
      {items.map(item => (
        <VideoCard
          key={item.id}
          item={{ kind: 'video', ...item }}
        />
      ))}
    </div>
  )
}

// ─── MAIN COMPONENT ───
const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'FEED' },
  { id: 'eventos', label: 'EVENTOS' },
  { id: 'equipos', label: 'EQUIPOS' },
  { id: 'noticias', label: 'NOTICIAS' },
  { id: 'videos', label: 'VIDEOS' },
]

export function FeedHome() {
  const [activeTab, setActiveTab] = useState<Tab>('feed')

  return (
    <div>
      {/* Tabs sticky */}
      <div className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#EEEEEE] -mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={jost}
              className={`shrink-0 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#CC4B37] text-[#111111]'
                  : 'border-transparent text-[#999999]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'eventos' && <EventosTab />}
        {activeTab === 'equipos' && <EquiposTab />}
        {activeTab === 'noticias' && <NoticiasTab />}
        {activeTab === 'videos' && <VideosTab />}
      </div>
    </div>
  )
}
