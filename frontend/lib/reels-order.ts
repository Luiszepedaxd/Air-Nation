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

/** Pesos del puntaje (sin azar: el azar entra al muestrear). */
const RECENCY_W = 1
const ENGAGEMENT_W = 0.8
/** A los 7 días la recencia vale la mitad. */
const RECENCY_HALF_LIFE_DAYS = 7
/** Un comentario pesa como 2 likes; 50 interacciones ya es engagement pleno. */
const COMMENT_WEIGHT = 2
const ENGAGEMENT_FULL = 50
/**
 * Piso del peso. Sumar ruido chico al score no cambiaba el orden: la recencia
 * entre videos a días de distancia vale más que 0.5. El piso deja que uno viejo
 * salga primero de vez en cuando sin ganarle siempre a lo reciente.
 */
const WEIGHT_FLOOR = 0.2

const DAY_MS = 86_400_000

export function reelScore(item: ReelRankInput, now: number): number {
  const ageDays = (now - Date.parse(item.createdAt)) / DAY_MS
  const recency = Number.isFinite(ageDays)
    ? 2 ** (-Math.max(0, ageDays) / RECENCY_HALF_LIFE_DAYS)
    : 0
  const interactions =
    Math.max(0, item.likeCount) + COMMENT_WEIGHT * Math.max(0, item.commentCount)
  const engagement = Math.min(1, Math.log1p(interactions) / Math.log1p(ENGAGEMENT_FULL))
  return RECENCY_W * recency + ENGAGEMENT_W * engagement
}

/**
 * Puntúa, descarta lo ya visto, saca sin reemplazo con peso = puntaje + piso
 * y separa autores repetidos. `random() === 0` devuelve el orden por puntaje.
 * ponytail: ranking por página (O(n²), n ≈ 24). Un ranking global pediría
 * un endpoint/RPC con el corpus completo.
 */
export function orderReels<T extends ReelRankInput>(
  items: T[],
  opts: { now?: number; random?: () => number; seen?: Set<string> } = {}
): T[] {
  const now = opts.now ?? Date.now()
  const random = opts.random ?? Math.random
  const seen = opts.seen
  const rest = items
    .filter((item) => !seen?.has(item.key))
    .map((item) => ({ item, score: reelScore(item, now) }))
    .sort((a, b) => b.score - a.score)
  const picked: T[] = []
  while (rest.length > 0) {
    let total = 0
    const weights = rest.map((entry) => {
      const weight = entry.score + WEIGHT_FLOOR
      total += weight
      return weight
    })
    let ticket = random() * total
    let idx = rest.length - 1
    for (let i = 0; i < rest.length; i++) {
      ticket -= weights[i]
      if (ticket < 0) {
        idx = i
        break
      }
    }
    picked.push(rest.splice(idx, 1)[0].item)
  }
  return spreadAuthors(picked)
}

/**
 * Catálogo agotado: reordena lo ya mostrado, sin el video en pantalla, y si
 * puede no arranca con el mismo autor. La lista puede traer repetidos; se
 * queda la copia más reciente.
 */
export function recycleReels<T extends ReelRankInput>(
  items: T[],
  currentKey: string | null,
  opts: { now?: number; random?: () => number } = {}
): T[] {
  const current = currentKey ? items.find((item) => item.key === currentKey) : undefined
  const unique = new Map<string, T>()
  for (const item of items) {
    if (item.key !== currentKey) unique.set(item.key, item)
  }
  const ordered = orderReels([...unique.values()], opts)
  if (!current || ordered.length < 2 || ordered[0].authorId !== current.authorId) return ordered
  const other = ordered.findIndex((item) => item.authorId !== current.authorId)
  if (other <= 0) return ordered
  const [next] = ordered.splice(other, 1)
  ordered.unshift(next)
  return ordered
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
