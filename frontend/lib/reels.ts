/**
 * Modo Reels: estado de apertura (en memoria) + carga de la lista de videos.
 * Abrir: `openReels(videoUrl)` desde cualquier card del feed.
 * El orden vive en `reels-order.ts` (puro, con test).
 */

import { supabase } from '@/lib/supabase'
import {
  engagementKey,
  fetchPostEngagements,
  type PostEngagementType,
} from '@/lib/post-engagements'
import { getBlockedUserIds } from '@/lib/user-blocks'
import { orderReels, type ReelRankInput } from '@/lib/reels-order'

export type Reel = ReelRankInput & {
  postType: Extract<PostEngagementType, 'player' | 'team'>
  postId: string
  postOwnerId: string | null
  authorName: string
  authorAvatar: string | null
  authorHref: string
  content: string | null
  src: string
  videoMp4Url: string | null
  poster: string | null
  shareUrl: string
  postHref: string
  likedByMe: boolean
}

/** Videos por página. */
const PAGE = 24
/** Ventana de "recientes"; si hay menos de MIN_RECENT se cae a los más viejos. */
const RECENT_DAYS = 30
const MIN_RECENT = 8

const PLAYER_COLS =
  'id, user_id, content, video_url, video_mp4_url, thumbnail_url, created_at, users(alias, nombre, avatar_url)'
// team_posts no tiene thumbnail_url: el poster sale del thumbnail de Stream.
const TEAM_COLS =
  'id, team_id, created_by, content, video_url, video_mp4_url, created_at, teams(nombre, slug, logo_url)'

// ---------------------------------------------------------------- estado

type ReelsOpen = { src: string } | null

let openState: ReelsOpen = null
const listeners = new Set<() => void>()
/** Keys ya vistas en esta sesión (se reinicia al recargar). */
const seenKeys = new Set<string>()

function emit() {
  for (const listener of listeners) listener()
}

export function openReels(src: string) {
  if (!src) return
  openState = { src }
  emit()
}

export function closeReels() {
  if (!openState) return
  openState = null
  emit()
}

export function getReelsOpen(): ReelsOpen {
  return openState
}

export function subscribeReels(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function markReelSeen(key: string) {
  seenKeys.add(key)
}

export function getSeenReels(): Set<string> {
  return seenKeys
}

// ---------------------------------------------------------------- carga

function one(value: unknown): Record<string, unknown> | null {
  const v = Array.isArray(value) ? value[0] : value
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

function str(value: unknown): string | null {
  return value == null ? null : String(value)
}

/** Primer frame de Cloudflare Stream, mismo origen que el manifiesto. */
function streamPoster(src: string): string | null {
  try {
    const url = new URL(src)
    const host = url.hostname.toLowerCase()
    if (!host.includes('cloudflarestream.com') && !host.includes('videodelivery.net')) return null
    const uid = url.pathname.split('/').filter(Boolean)[0]
    if (!uid || uid === 'manifest') return null
    return `${url.origin}/${uid}/thumbnails/thumbnail.jpg?time=0s&height=640`
  } catch {
    return null
  }
}

function mapPlayerRow(row: Record<string, unknown>): Reel | null {
  const src = str(row.video_url)
  const id = str(row.id)
  const userId = str(row.user_id)
  if (!src || !id || !userId) return null
  const u = one(row.users)
  const name = str(u?.alias)?.trim() || str(u?.nombre)?.trim() || 'Jugador'
  return {
    key: engagementKey('player', id),
    postType: 'player',
    postId: id,
    postOwnerId: userId,
    authorId: userId,
    authorName: name,
    authorAvatar: str(u?.avatar_url),
    authorHref: `/u/${userId}`,
    content: str(row.content),
    src,
    videoMp4Url: str(row.video_mp4_url),
    poster: str(row.thumbnail_url) || streamPoster(src),
    shareUrl: `/u/${userId}#post-${id}`,
    postHref: `/dashboard?highlight_id=${id}&highlight_type=player`,
    createdAt: String(row.created_at ?? ''),
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  }
}

function mapTeamRow(row: Record<string, unknown>): Reel | null {
  const src = str(row.video_url)
  const id = str(row.id)
  const t = one(row.teams)
  const slug = str(t?.slug)
  if (!src || !id || !slug) return null
  return {
    key: engagementKey('team', id),
    postType: 'team',
    postId: id,
    postOwnerId: str(row.created_by),
    authorId: str(row.team_id) ?? slug,
    authorName: str(t?.nombre)?.trim() || 'Equipo',
    authorAvatar: str(t?.logo_url),
    authorHref: `/equipos/${slug}`,
    content: str(row.content),
    src,
    videoMp4Url: str(row.video_mp4_url),
    poster: streamPoster(src),
    shareUrl: `/equipos/${slug}`,
    postHref: `/dashboard?highlight_id=${id}&highlight_type=team`,
    createdAt: String(row.created_at ?? ''),
    likeCount: 0,
    commentCount: 0,
    likedByMe: false,
  }
}

type TablePage = { reels: Reel[]; next: string | null }

/**
 * Una página de una tabla. `next` = created_at más viejo traído, o null si la
 * tabla ya se agotó. Un cursor por tabla: con un cursor único, una tabla con
 * pocos videos viejos se saltaría todos los recientes de la otra.
 */
async function fetchTablePage(
  table: 'player_posts' | 'team_posts',
  before: string | null,
  since: string | null,
  exhausted: boolean
): Promise<TablePage> {
  if (exhausted) return { reels: [], next: null }
  const isPlayer = table === 'player_posts'
  let query = supabase
    .from(table)
    .select(isPlayer ? PLAYER_COLS : TEAM_COLS)
    .eq('published', true)
    .not('video_url', 'is', null)
  if (before) query = query.lt('created_at', before)
  if (since) query = query.gte('created_at', since)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(PAGE)
  if (error) {
    console.error(`[reels] ${table}`, error.message)
    return { reels: [], next: null }
  }

  const rows = (data ?? []) as Record<string, unknown>[]
  const reels: Reel[] = []
  for (const row of rows) {
    const reel = isPlayer ? mapPlayerRow(row) : mapTeamRow(row)
    if (reel) reels.push(reel)
  }
  const last = rows[rows.length - 1]
  return {
    reels,
    next: rows.length === PAGE && last ? String(last.created_at) : null,
  }
}

/** Likes/comentarios reales (batch compartido con el feed). */
async function withEngagements(
  reels: Reel[],
  currentUserId: string | null
): Promise<Reel[]> {
  if (reels.length === 0) return reels
  const map = await fetchPostEngagements(
    reels.map((r) => ({ postType: r.postType, postId: r.postId })),
    currentUserId
  )
  if (!map) return reels
  return reels.map((r) => ({ ...r, ...(map.get(r.key) ?? {}) }))
}

async function blockedIdsFor(currentUserId: string | null): Promise<Set<string>> {
  if (!currentUserId) return new Set()
  try {
    return await getBlockedUserIds(currentUserId)
  } catch {
    return new Set()
  }
}

/** El video que el usuario tocó: va primero, aunque sea viejo. */
export async function fetchReelBySrc(
  src: string,
  currentUserId: string | null
): Promise<Reel | null> {
  const [playerRes, teamRes] = await Promise.all([
    supabase.from('player_posts').select(PLAYER_COLS).eq('video_url', src).limit(1),
    supabase.from('team_posts').select(TEAM_COLS).eq('video_url', src).limit(1),
  ])
  const playerRow = (playerRes.data ?? [])[0] as Record<string, unknown> | undefined
  const teamRow = (teamRes.data ?? [])[0] as Record<string, unknown> | undefined
  const reel = playerRow
    ? mapPlayerRow(playerRow)
    : teamRow
      ? mapTeamRow(teamRow)
      : null
  if (!reel) return null
  const [withEng] = await withEngagements([reel], currentUserId)
  return withEng
}

/** Cursor de paginación: created_at por tabla (null = tabla agotada). */
export type ReelsCursor = { player: string | null; team: string | null }

/**
 * Siguiente página ya ordenada: recencia + engagement + azar, sin repetir
 * `seen` ni dos seguidos del mismo autor. `cursor` null = primera página.
 */
export async function loadReelsPage(
  cursor: ReelsCursor | null,
  currentUserId: string | null,
  seen: Set<string>
): Promise<{ reels: Reel[]; cursor: ReelsCursor; done: boolean }> {
  const first = cursor === null
  const prev: ReelsCursor = cursor ?? { player: null, team: null }
  const since = first
    ? new Date(Date.now() - RECENT_DAYS * 86_400_000).toISOString()
    : null

  let [player, team] = await Promise.all([
    fetchTablePage('player_posts', prev.player, since, !first && prev.player === null),
    fetchTablePage('team_posts', prev.team, since, !first && prev.team === null),
  ])
  // Pocos videos recientes → se abre la ventana a los más antiguos.
  if (first && player.reels.length + team.reels.length < MIN_RECENT) {
    ;[player, team] = await Promise.all([
      fetchTablePage('player_posts', null, null, false),
      fetchTablePage('team_posts', null, null, false),
    ])
  }

  const raw = [...player.reels, ...team.reels]
  const blocked = await blockedIdsFor(currentUserId)
  const usable = raw.filter(
    (r) => !blocked.has(r.authorId) && !(r.postOwnerId && blocked.has(r.postOwnerId))
  )
  const withEng = await withEngagements(usable, currentUserId)
  return {
    reels: orderReels(withEng, { seen }),
    cursor: { player: player.next, team: team.next },
    done: player.next === null && team.next === null,
  }
}
