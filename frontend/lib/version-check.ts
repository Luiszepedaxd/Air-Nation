/**
 * Compara dos versiones semánticas tipo "1.0.8".
 * Retorna: -1 si a < b, 0 si iguales, 1 si a > b
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const na = pa[i] ?? 0
    const nb = pb[i] ?? 0
    if (na < nb) return -1
    if (na > nb) return 1
  }
  return 0
}

export const APP_STORE_URL = 'https://apps.apple.com/mx/app/airnation/id6790069177'
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.atomikapps.airnation'
