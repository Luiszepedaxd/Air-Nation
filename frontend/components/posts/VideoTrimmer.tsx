'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  clipNeedsTrim,
  trimErrorMessage,
  type TrimWindow,
} from '@/lib/trim-clip'

const BG = '#FFFFFF'
const BORDER = '#EEEEEE'
const ACCENT = '#CC4B37'
const TEXT = '#333333'
const MUTED = '#6B6B6B'
const TRACK_BG = '#E5E5E5'

const jostTitle = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ACCEPT = 'video/mp4,video/quicktime,video/webm'
const MAX_SEL_SEC = 60
const MIN_GAP_SEC = 0.1

type Props = {
  onVideoReady: (
    file: File,
    durationSeconds: number,
    trim?: TrimWindow | null
  ) => void
  onCancel: () => void
  /** Avisa al padre mientras se prepara el clip, para no cerrar el modal. */
  onEncodingChange?: (encoding: boolean) => void
}

type EncodePhase = 'idle' | 'preparing'

function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const s = Math.floor(sec % 60)
  const m = Math.floor((sec / 60) % 60)
  const h = Math.floor(sec / 3600)
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}

function clampRange(
  start: number,
  end: number,
  total: number
): { start: number; end: number } {
  if (!Number.isFinite(total) || total <= 0) return { start: 0, end: 0 }
  let s = Math.max(0, start)
  let e = Math.min(total, end)
  if (e - s < MIN_GAP_SEC) {
    e = Math.min(total, s + MIN_GAP_SEC)
  }
  if (e - s > MAX_SEL_SEC) {
    e = s + MAX_SEL_SEC
  }
  if (e > total) {
    e = total
    s = Math.max(0, e - Math.min(MAX_SEL_SEC, total - MIN_GAP_SEC))
  }
  return { start: s, end: e }
}

export function VideoTrimmer({ onVideoReady, onCancel, onEncodingChange }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const stateRef = useRef({ start: 0, end: 0, total: 0 })
  const [activeDrag, setActiveDrag] = useState<null | 'start' | 'end'>(null)

  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [totalSec, setTotalSec] = useState(0)
  const [startSec, setStartSec] = useState(0)
  const [endSec, setEndSec] = useState(0)
  const [processErr, setProcessErr] = useState<string | null>(null)
  const [encoding, setEncoding] = useState(false)
  const [encodePhase, setEncodePhase] = useState<EncodePhase>('idle')
  const encodingRef = useRef(false)

  const encodingChangeRef = useRef(onEncodingChange)
  encodingChangeRef.current = onEncodingChange
  encodingRef.current = encoding
  useEffect(() => {
    encodingChangeRef.current?.(encoding)
  }, [encoding])

  const selected = useMemo(
    () => Math.max(0, endSec - startSec),
    [endSec, startSec]
  )
  const overLimit = selected > MAX_SEL_SEC + 0.01

  useEffect(() => {
    stateRef.current = { start: startSec, end: endSec, total: totalSec }
  }, [endSec, startSec, totalSec])

  const clearAll = useCallback(() => {
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        /* noop */
      }
    }
    setFile(null)
    setUrl(null)
    setTotalSec(0)
    setStartSec(0)
    setEndSec(0)
    setProcessErr(null)
    setEncoding(false)
    setEncodePhase('idle')
  }, [url])

  const handleCancel = useCallback(() => {
    if (encoding) return
    clearAll()
    onCancel()
  }, [clearAll, encoding, onCancel])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProcessErr(null)
    const f = e.target.files?.[0]
    if (!f) return
    if (url) {
      try {
        URL.revokeObjectURL(url)
      } catch {
        /* noop */
      }
    }
    const u = URL.createObjectURL(f)
    setFile(f)
    setUrl(u)
    setStartSec(0)
    setEndSec(0)
    setTotalSec(0)
    e.target.value = ''
  }

  const onVideoMeta = () => {
    const v = videoRef.current
    if (!v) return
    const d = v.duration
    if (!Number.isFinite(d) || d <= 0) return
    setTotalSec(d)
    const end = Math.min(MAX_SEL_SEC, d)
    const c = clampRange(0, end, d)
    setStartSec(c.start)
    setEndSec(c.end)
  }

  useEffect(() => {
    const v = videoRef.current
    if (!v || !url) return
    v.muted = true
    v.playsInline = true
    v.play().catch(() => {
      /* autoplay: puede requerir gesto en algunos navegadores */
    })
  }, [url])

  useEffect(() => {
    return () => {
      if (url) {
        try {
          URL.revokeObjectURL(url)
        } catch {
          /* noop */
        }
      }
    }
  }, [url])

  const onTime = () => {
    if (encodingRef.current) return
    const v = videoRef.current
    if (!v || !Number.isFinite(v.duration)) return
    if (v.currentTime < startSec) v.currentTime = startSec
    if (v.currentTime >= endSec - 0.02) v.currentTime = startSec
  }

  const clientXToTime = useCallback((clientX: number) => {
    const el = trackRef.current
    const t = stateRef.current.total
    if (!el || !Number.isFinite(t) || t <= 0) return 0
    const rect = el.getBoundingClientRect()
    const r = (clientX - rect.left) / Math.max(1, rect.width)
    return r * t
  }, [])

  useEffect(() => {
    if (!activeDrag) return
    const onMove = (e: PointerEvent) => {
      e.preventDefault()
      const t = clientXToTime(e.clientX)
      const { start: s0, end: e0, total: D } = stateRef.current
      if (activeDrag === 'start') {
        const c = clampRange(t, e0, D)
        setStartSec(c.start)
        setEndSec(c.end)
      } else {
        const c = clampRange(s0, t, D)
        setStartSec(c.start)
        setEndSec(c.end)
      }
    }
    const onUp = () => setActiveDrag(null)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp, { capture: true })
    window.addEventListener('pointercancel', onUp, { capture: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp, { capture: true })
      window.removeEventListener('pointercancel', onUp, { capture: true })
    }
  }, [activeDrag, clientXToTime])

  useEffect(() => {
    if (encoding) return
    const v = videoRef.current
    if (!v) return
    if (v.currentTime < startSec) v.currentTime = startSec
    if (v.currentTime > endSec) v.currentTime = startSec
  }, [endSec, encoding, startSec])

  const handleUseClip = async () => {
    if (!file || !url || !totalSec) return
    if (overLimit) return
    setProcessErr(null)
    const clipLen = endSec - startSec
    if (clipLen < MIN_GAP_SEC) {
      setProcessErr('El clip es demasiado corto')
      return
    }
    // Keep export under the product max so keyframe/stream-copy drift
    // does not probe >60s and get rejected on upload.
    const exportLen = Math.min(clipLen, Math.max(MIN_GAP_SEC, MAX_SEL_SEC - 0.05))
    const clipDuration = Math.round(exportLen * 1000) / 1000

    videoRef.current?.pause()

    encodingRef.current = true
    setEncoding(true)
    setEncodePhase('preparing')

    try {
      const needsTrim = clipNeedsTrim(startSec, endSec, totalSec, MAX_SEL_SEC)
      const trim: TrimWindow | null = needsTrim
        ? { startSec, durationSec: exportLen }
        : null
      // Original file + trim window → backend ffmpeg (seconds). No real-time record.
      onVideoReady(file, clipDuration, trim)
    } catch (e) {
      setProcessErr(trimErrorMessage(e))
      encodingRef.current = false
      setEncoding(false)
      setEncodePhase('idle')
      const preview = videoRef.current
      if (preview && url) {
        preview.play().catch(() => {
          /* preview loop is optional */
        })
      }
    }
  }

  const hasVideo = Boolean(url && file)
  const encodeStatus = 'Preparando clip…'
  const startPct = totalSec > 0 ? (startSec / totalSec) * 100 : 0
  const endPct = totalSec > 0 ? (endSec / totalSec) * 100 : 0

  return (
    <div
      className="relative flex w-full max-w-md flex-col gap-4 rounded-xl border p-4 shadow-sm"
      style={{ background: BG, borderColor: BORDER, ...lato, color: TEXT }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          className="text-sm tracking-tight"
          style={{ color: TEXT, ...jostTitle }}
        >
          Recortar video
        </h2>
        <button
          type="button"
          onClick={handleCancel}
          disabled={encoding}
          className="rounded-md border px-3 py-1.5 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: BORDER, color: MUTED, ...jostTitle, fontSize: 11 }}
        >
          Cancelar
        </button>
      </div>

      <p className="text-sm" style={{ color: MUTED }}>
        Elige hasta 1 minuto. El recorte se aplica al publicar (segundos en el
        servidor), no hace falta esperar la duración del clip.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onFileChange}
      />
      {!hasVideo && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed py-10 text-sm font-bold"
          style={{ borderColor: ACCENT, color: ACCENT, ...jostTitle }}
        >
          Elegir de la galería
        </button>
      )}

      {hasVideo && url && (
        <>
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: BORDER, background: '#F9F9F9' }}
          >
            <video
              ref={videoRef}
              src={url}
              muted
              loop={false}
              playsInline
              onLoadedMetadata={onVideoMeta}
              onTimeUpdate={onTime}
              className="mx-auto max-h-64 w-full object-contain"
            />
          </div>
          <p className="text-center text-sm" style={{ color: MUTED }}>
            Duración total:{' '}
            <span className="font-bold" style={{ color: TEXT }}>
              {formatTime(totalSec)}
            </span>
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase" style={{ color: MUTED, ...jostTitle }}>
              Timeline
            </p>
            <div
              ref={trackRef}
              className="relative h-3 w-full select-none touch-none rounded-full"
              style={{ background: TRACK_BG, border: `1px solid ${BORDER}` }}
            >
              <div
                className="pointer-events-none absolute inset-y-0 rounded-full"
                style={{
                  left: `${startPct}%`,
                  width: `${endPct - startPct}%`,
                  background: `${ACCENT}4D`,
                }}
              />
              <button
                type="button"
                aria-label="Inicio del clip"
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveDrag('start')
                  ;(e.target as HTMLButtonElement).setPointerCapture(
                    e.pointerId
                  )
                }}
                className="absolute top-1/2 z-10 h-8 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded border-2 active:cursor-grabbing"
                style={{
                  left: `${startPct}%`,
                  borderColor: ACCENT,
                  background: BG,
                  touchAction: 'none',
                }}
              />
              <button
                type="button"
                aria-label="Fin del clip"
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setActiveDrag('end')
                  ;(e.target as HTMLButtonElement).setPointerCapture(
                    e.pointerId
                  )
                }}
                className="absolute top-1/2 z-10 h-8 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded border-2 active:cursor-grabbing"
                style={{
                  left: `${endPct}%`,
                  borderColor: ACCENT,
                  background: BG,
                  touchAction: 'none',
                }}
              />
            </div>
            <p
              className="text-center text-sm font-bold"
              style={{ color: overLimit ? ACCENT : TEXT, ...lato }}
            >
              {selected.toFixed(1)}s seleccionados
            </p>
            {overLimit && (
              <p
                className="text-center text-sm font-bold"
                style={{ color: ACCENT, ...lato }}
              >
                El clip no puede superar 1 minuto. Acorta el tramo
                moviendo inicio o fin.
              </p>
            )}
          </div>
        </>
      )}

      {processErr && (
        <p className="text-center text-sm" style={{ color: ACCENT, ...lato }}>
          {processErr}
        </p>
      )}

      {hasVideo && (
        <div className="mt-1 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void handleUseClip()}
            disabled={overLimit || encoding}
            className="w-full rounded-lg py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: ACCENT, ...jostTitle }}
          >
            {encoding ? 'Preparando…' : 'Usar este clip'}
          </button>
        </div>
      )}

      {encoding && encodePhase === 'preparing' && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl px-6 text-center"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(2px)' }}
          role="status"
          aria-live="polite"
        >
          <svg
            className="h-10 w-10 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: ACCENT }}
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-sm" style={{ color: TEXT, ...jostTitle, fontSize: 13 }}>
            {encodeStatus}
          </p>
          <p className="text-xs" style={{ color: MUTED, ...lato }}>
            Listo en un momento. El corte fino ocurre al publicar.
          </p>
        </div>
      )}
    </div>
  )
}
