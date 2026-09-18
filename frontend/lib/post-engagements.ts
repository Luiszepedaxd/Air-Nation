import { supabase } from '@/lib/supabase'

export type PostEngagementType =
  | 'player'
  | 'team'
  | 'field'
  | 'blog'
  | 'new_team'
  | 'noticia'
  | 'event'
  | 'video'
  | 'replica'
  | 'listing'

export type PostEngagementKey = {
  postType: PostEngagementType
  postId: string
}

export type PostEngagement = {
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

export type FeedEngagementFields = {
  likeCount?: number
  commentCount?: number
  likedByMe?: boolean
}

const IN_CHUNK = 80
const ROW_PAGE = 1000

export function engagementKey(postType: string, postId: string): string {
  return `${postType}:${postId}`
}

export function feedKindToPostType(kind: string): PostEngagementType | null {
  switch (kind) {
    case 'team_post':
      return 'team'
    case 'player_post':
    case 'pinned_post':
      return 'player'
    case 'field_post':
      return 'field'
    case 'event':
    case 'tournament_result':
      return 'event'
    case 'new_team':
      return 'new_team'
    case 'video':
      return 'video'
    case 'noticia':
      return 'noticia'
    default:
      return null
  }
}

export function feedEngagementProps(item: FeedEngagementFields): {
  initialLikeCount?: number
  initialCommentCount?: number
  initialLiked?: boolean
} {
  return {
    initialLikeCount: item.likeCount,
    initialCommentCount: item.commentCount,
    initialLiked: item.likedByMe,
  }
}

export function attachEngagements<T extends { id: string; kind: string }>(
  items: T[],
  map: Map<string, PostEngagement> | null
): T[] {
  if (!map) return items
  return items.map((item) => {
    const postType = feedKindToPostType(item.kind)
    if (!postType) return item
    const eng =
      map.get(engagementKey(postType, item.id)) ?? {
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
      }
    return { ...item, ...eng }
  })
}

export function attachEngagementsByType<T extends { id: string }>(
  items: T[],
  postType: PostEngagementType,
  map: Map<string, PostEngagement> | null
): T[] {
  if (!map) return items
  return items.map((item) => {
    const eng =
      map.get(engagementKey(postType, item.id)) ?? {
        likeCount: 0,
        commentCount: 0,
        likedByMe: false,
      }
    return { ...item, ...eng }
  })
}

export function engagementKeysFromItems(
  items: { id: string; kind: string }[]
): PostEngagementKey[] {
  const keys: PostEngagementKey[] = []
  for (const item of items) {
    const postType = feedKindToPostType(item.kind)
    if (postType) keys.push({ postType, postId: item.id })
  }
  return keys
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return []
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

type EngagementRow = { post_id: unknown; post_type: unknown }

async function fetchEngagementPages(
  table: 'post_reactions' | 'post_comments',
  ids: string[],
  types: string[]
): Promise<EngagementRow[]> {
  const chunks = chunk(ids, IN_CHUNK)
  const pages = await Promise.all(
    chunks.map(async (idChunk) => {
      const rows: EngagementRow[] = []
      let from = 0
      for (;;) {
        const { data, error } = await supabase
          .from(table)
          .select('post_id, post_type')
          .in('post_id', idChunk)
          .in('post_type', types)
          .range(from, from + ROW_PAGE - 1)
        if (error) throw error
        const batch = (data ?? []) as EngagementRow[]
        rows.push(...batch)
        if (batch.length < ROW_PAGE) break
        from += ROW_PAGE
      }
      return rows
    })
  )
  return pages.flat()
}

async function fetchLikedRows(
  ids: string[],
  types: string[],
  currentUserId: string
): Promise<EngagementRow[]> {
  const chunks = chunk(ids, IN_CHUNK)
  const pages = await Promise.all(
    chunks.map(async (idChunk) => {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('post_id, post_type')
        .eq('user_id', currentUserId)
        .in('post_id', idChunk)
        .in('post_type', types)
      if (error) throw error
      return (data ?? []) as EngagementRow[]
    })
  )
  return pages.flat()
}

function aggregateEngagements(
  keys: PostEngagementKey[],
  likeRows: EngagementRow[],
  commentRows: EngagementRow[],
  likedRows: EngagementRow[]
): Map<string, PostEngagement> {
  const wanted = new Set(keys.map((k) => engagementKey(k.postType, k.postId)))
  const map = new Map<string, PostEngagement>()
  for (const key of wanted) {
    map.set(key, { likeCount: 0, commentCount: 0, likedByMe: false })
  }

  for (const row of likeRows) {
    const key = engagementKey(String(row.post_type), String(row.post_id))
    const eng = map.get(key)
    if (eng) eng.likeCount += 1
  }
  for (const row of commentRows) {
    const key = engagementKey(String(row.post_type), String(row.post_id))
    const eng = map.get(key)
    if (eng) eng.commentCount += 1
  }
  for (const row of likedRows) {
    const key = engagementKey(String(row.post_type), String(row.post_id))
    const eng = map.get(key)
    if (eng) eng.likedByMe = true
  }
  return map
}

async function fetchPostEngagementsNow(
  keys: PostEngagementKey[],
  currentUserId: string | null
): Promise<Map<string, PostEngagement> | null> {
  const unique: PostEngagementKey[] = []
  const seen = new Set<string>()
  for (const k of keys) {
    if (!k.postId) continue
    const id = engagementKey(k.postType, k.postId)
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(k)
  }
  if (unique.length === 0) return new Map()

  const ids = [...new Set(unique.map((k) => k.postId))]
  const types = [...new Set(unique.map((k) => k.postType))]

  try {
    const [likeRows, commentRows, likedRows] = await Promise.all([
      fetchEngagementPages('post_reactions', ids, types),
      fetchEngagementPages('post_comments', ids, types),
      currentUserId ? fetchLikedRows(ids, types, currentUserId) : Promise.resolve([]),
    ])
    return aggregateEngagements(unique, likeRows, commentRows, likedRows)
  } catch (e) {
    console.error('[post-engagements] batch fetch failed', e)
    return null
  }
}

type Waiter = {
  keys: PostEngagementKey[]
  currentUserId: string | null
  resolve: (map: Map<string, PostEngagement> | null) => void
}

let pending: Waiter[] = []
let scheduled = false

async function flushPending() {
  const batch = pending
  pending = []
  const groups = new Map<string, Waiter[]>()
  for (const waiter of batch) {
    const uid = waiter.currentUserId ?? ''
    const list = groups.get(uid)
    if (list) list.push(waiter)
    else groups.set(uid, [waiter])
  }
  for (const [uid, waiters] of groups) {
    const keys: PostEngagementKey[] = []
    for (const waiter of waiters) keys.push(...waiter.keys)
    const map = await fetchPostEngagementsNow(keys, uid || null)
    for (const waiter of waiters) waiter.resolve(map)
  }
}

/**
 * Loads like/comment counts (+ liked-by-me) for many posts in a few queries.
 * Concurrent calls in the same tick are coalesced to avoid N+1 COUNT requests.
 */
export function fetchPostEngagements(
  keys: PostEngagementKey[],
  currentUserId: string | null
): Promise<Map<string, PostEngagement> | null> {
  return new Promise((resolve) => {
    pending.push({ keys, currentUserId, resolve })
    if (scheduled) return
    scheduled = true
    queueMicrotask(() => {
      scheduled = false
      void flushPending()
    })
  })
}
