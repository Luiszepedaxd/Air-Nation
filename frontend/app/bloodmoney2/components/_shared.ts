export const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export const lato = { fontFamily: "'Lato', sans-serif" }

export function getStr(config: Record<string, unknown>, key: string, fallback = ''): string {
  const v = config[key]
  return typeof v === 'string' && v.trim().length > 0 ? v : fallback
}

export function getList(config: Record<string, unknown>, key: string): string[] {
  const v = config[key]
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  }
  if (typeof v === 'string') {
    return v
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }
  return []
}
