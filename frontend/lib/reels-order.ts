/**
 * Orden del modo Reels: recencia + engagement + algo de azar.
 * Puro y sin imports para que `npm test` lo corra tal cual.
 */

export type ReelRankInput = {
  /** `${postType}:${postId}` */
  key: string
  /** user_id o team_id: evita dos seguidos del mismo autor. */
  authorId: string
  createdAt: string
  likeCount: number
  commentCount: number
}

/** Pesos del puntaje. Subir RANDOM_W = más sorpresa, menos recencia. */
const RECENCY_W = 1
const ENGAGEMENT_W = 0.8
const RANDOM_W = 0.5
/** A los 7 días la recencia vale la mitad. */
const RECENCY_HALF_LIFE_DAYS = 7
/** Un comentario pesa como 2 likes; 50 interacciones ya es engagement pleno. */
const COMMENT_WEIGHT = 2
const ENGAGEMENT_FULL = 50

const DAY_MS = 86_400_000

export function reelScore(item: ReelRankInput, now: number, random: number): number {
  const ageDays = (now - Date.parse(item.createdAt)) / DAY_MS
  const recency = Number.isFinite(ageDays)
    ? 2 ** (-Math.max(0, ageDays) / RECENCY_HALF_LIFE_DAYS)
    : 0
  const interactions =
    Math.max(0, item.likeCount) + COMMENT_WEIGHT * Math.max(0, item.commentCount)
  const engagement = Math.min(1, Math.log1p(interactions) / Math.log1p(ENGAGEMENT_FULL))
  return RECENCY_W * recency + ENGAGEMENT_W * engagement + RANDOM_W * random
}

/**
 * Puntúa, descarta lo ya visto y separa autores repetidos.
 * ponytail: ranking por página (O(n²) al separar autores, n ≈ 24). Un ranking
 * global pediría un endpoint/RPC con el corpus completo.
 */
export function orderReels<T extends ReelRankInput>(
  items: T[],
  opts: { now?: number; random?: () => number; seen?: Set<string> } = {}
): T[] {
  const now = opts.now ?? Date.now()
  const random = opts.random ?? Math.random
  const seen = opts.seen
  const scored = items
    .filter((item) => !seen?.has(item.key))
    .map((item) => ({ item, score: reelScore(item, now, random()) }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.item)
  return spreadAuthors(scored)
}

/** Adelanta al siguiente de otro autor cuando el mejor repite el anterior. */
function spreadAuthors<T extends ReelRankInput>(list: T[]): T[] {
  const out: T[] = []
  const rest = [...list]
  while (rest.length > 0) {
    const prev = out[out.length - 1]
    let idx = 0
    if (prev) {
      const other = rest.findIndex((i) => i.authorId !== prev.authorId)
      if (other > 0) idx = other
    }
    out.push(rest.splice(idx, 1)[0])
  }
  return out
}
