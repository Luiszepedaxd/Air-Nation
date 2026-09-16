/**
 * Helpers for the feed video trimmer.
 *
 * Primary path: send the original File + trim window to the backend
 * (fluent-ffmpeg stream-copy / re-encode). Client-side MediaRecorder was
 * real-time (~1 min for a 60s clip) and often produced mime types with
 * ";codecs=…" that multer rejected on upload.
 */

export type TrimProgress = (percent: number) => void

export type TrimWindow = {
  startSec: number
  durationSec: number
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(id)
        resolve(value)
      },
      (err) => {
        window.clearTimeout(id)
        reject(err)
      }
    )
  })
}

export function clipNeedsTrim(
  startSec: number,
  endSec: number,
  totalSec: number,
  maxSec: number
): boolean {
  if (totalSec > maxSec + 0.05) return true
  if (startSec > 0.08) return true
  if (endSec < totalSec - 0.2) return true
  return false
}

export function trimErrorMessage(e: unknown): string {
  const raw =
    e instanceof Error && e.message.trim()
      ? e.message.trim()
      : typeof e === 'string' && e.trim()
        ? e.trim()
        : ''
  if (
    raw &&
    (/[áéíóúñÁÉÍÓÚÑ¿¡]/.test(raw) ||
      /^(No se|El |Este |Tardó|Revisa)/.test(raw))
  ) {
    return raw
  }
  if (/timeout|timed out|hang|deadlock|abort/i.test(raw)) {
    return 'La operación tardó demasiado. Revisa tu conexión e inténtalo de nuevo.'
  }
  if (/memory|out of memory|oom|array buffer|allocation/i.test(raw)) {
    return 'El video es demasiado pesado. Prueba un archivo más corto o con menor resolución.'
  }
  if (/network|failed to fetch|load failed|fetch/i.test(raw)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
  }
  return 'No se pudo preparar el video. Prueba con otro archivo o un tramo distinto.'
}
