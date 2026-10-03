export type CapsulasProgress = {
  v: 1
  c: string[]
  p: Record<string, number>
}

const COOKIE = 'an_v3_capsulas'
const MAX_JSON = 3500
const MAX_AGE = 31536000

function vacio(): CapsulasProgress {
  return { v: 1, c: [], p: {} }
}

function leerCruda(): string | null {
  if (typeof document === 'undefined') return null
  const partes = document.cookie.split(';')
  for (const parte of partes) {
    const texto = parte.trim()
    const i = texto.indexOf('=')
    if (i === -1) continue
    if (texto.slice(0, i) === COOKIE) return texto.slice(i + 1)
  }
  return null
}

export function parseProgressValue(raw: string | null | undefined): CapsulasProgress {
  if (!raw) return vacio()
  let texto = raw
  try {
    texto = decodeURIComponent(raw)
  } catch {
    texto = raw
  }
  try {
    const data = JSON.parse(texto) as unknown
    if (!data || typeof data !== 'object' || Array.isArray(data)) return vacio()
    const o = data as { v?: unknown; c?: unknown; p?: unknown }
    if (o.v !== 1) return vacio()
    const c = Array.isArray(o.c)
      ? o.c.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : []
    const hechas = new Set(c)
    const p: Record<string, number> = {}
    if (o.p && typeof o.p === 'object' && !Array.isArray(o.p)) {
      for (const [id, seg] of Object.entries(o.p as Record<string, unknown>)) {
        if (hechas.has(id)) continue
        if (typeof seg === 'number' && Number.isFinite(seg) && seg > 0) p[id] = seg
      }
    }
    return { v: 1, c, p }
  } catch {
    return vacio()
  }
}

export function serializeProgress(progress: CapsulasProgress): string {
  const c = progress.c.filter((id) => typeof id === 'string' && id.length > 0)
  const hechas = new Set(c)
  const p: Record<string, number> = {}
  for (const [id, seg] of Object.entries(progress.p)) {
    if (hechas.has(id)) continue
    if (typeof seg === 'number' && Number.isFinite(seg) && seg > 0) p[id] = seg
  }
  let json = JSON.stringify({ v: 1, c, p })
  if (json.length > MAX_JSON) {
    for (const id of Object.keys(p)) {
      delete p[id]
      json = JSON.stringify({ v: 1, c, p })
      if (json.length <= MAX_JSON) break
    }
  }
  return encodeURIComponent(json)
}

function esHttps(): boolean {
  return globalThis.location?.protocol === 'https:'
}

function escribir(progress: CapsulasProgress): void {
  if (typeof document === 'undefined') return
  const valor = serializeProgress(progress)
  const secure = esHttps() ? '; Secure' : ''
  document.cookie = `${COOKIE}=${valor}; path=/; max-age=${MAX_AGE}; SameSite=Lax${secure}`
}

export function readProgress(): CapsulasProgress {
  return parseProgressValue(leerCruda())
}

export function isCompleted(progress: CapsulasProgress, id: string): boolean {
  return progress.c.includes(id)
}

export function markCompleted(id: string): CapsulasProgress {
  const actual = readProgress()
  if (!id) return actual
  const c = actual.c.includes(id) ? actual.c : [...actual.c, id]
  const p = { ...actual.p }
  delete p[id]
  const siguiente: CapsulasProgress = { v: 1, c, p }
  escribir(siguiente)
  return siguiente
}

export function savePosition(id: string, seconds: number): CapsulasProgress {
  const actual = readProgress()
  if (!id || isCompleted(actual, id)) return actual
  const p = { ...actual.p }
  const seg = Math.round(seconds)
  if (!Number.isFinite(seg) || seg <= 0) delete p[id]
  else p[id] = seg
  const siguiente: CapsulasProgress = { v: 1, c: actual.c, p }
  escribir(siguiente)
  return siguiente
}

export function resetProgress(): CapsulasProgress {
  const limpio = vacio()
  escribir(limpio)
  return limpio
}
