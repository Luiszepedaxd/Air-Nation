/**
 * Client-side clip export for the feed trimmer.
 *
 * Do not load ffmpeg.wasm here. `ffmpeg.load()` (module Worker + ~25MB core)
 * hangs indefinitely on Chrome/Firefox/Edge/Safari — desktop and mobile —
 * which is the "CARGANDO PROCESADOR…" overlay that never finishes. Even if
 * load returned, writing an 8+ min camera file into MEMFS often OOMs.
 *
 * Playback + MediaRecorder only decodes the selected ≤60s window.
 */

type CaptureVideo = HTMLVideoElement & {
  captureStream?: (frameRate?: number) => MediaStream
  mozCaptureStream?: (frameRate?: number) => MediaStream
  requestVideoFrameCallback?: (cb: (now: number, meta: unknown) => void) => number
  cancelVideoFrameCallback?: (id: number) => void
}

type AudioContextCtor = typeof AudioContext

export type TrimProgress = (percent: number) => void

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

export function createGestureAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AC: AudioContextCtor | undefined =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext
    if (!AC) return null
    const ctx = new AC()
    void ctx.resume()
    return ctx
  } catch {
    return null
  }
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
  if (/timeout|timed out|hang|deadlock/i.test(raw)) {
    return 'El recorte tardó demasiado. Inténtalo de nuevo y no salgas de esta pantalla.'
  }
  if (/memory|out of memory|oom|array buffer|allocation/i.test(raw)) {
    return 'El video es demasiado pesado para recortarlo en este dispositivo. Prueba un archivo más corto.'
  }
  if (/fetch|network|failed to load|load/i.test(raw)) {
    return 'No se pudo cargar el procesador de video. Revisa tu conexión e inténtalo de nuevo.'
  }
  return 'No se pudo recortar el video. Prueba con otro archivo o un tramo distinto.'
}

function pickRecorderMime(): { mime: string; ext: string } {
  const candidates: { mime: string; ext: string }[] = [
    { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mime: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' },
  ]
  if (typeof MediaRecorder === 'undefined') {
    return { mime: '', ext: 'mp4' }
  }
  for (const c of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(c.mime)) return c
    } catch {
      /* ignore */
    }
  }
  return { mime: '', ext: 'mp4' }
}

function createRecorder(stream: MediaStream, mime: string): MediaRecorder {
  const attempts: MediaRecorderOptions[] = []
  if (mime) {
    attempts.push({
      mimeType: mime,
      videoBitsPerSecond: 4_000_000,
      audioBitsPerSecond: 128_000,
    })
    attempts.push({ mimeType: mime })
  }
  attempts.push({ videoBitsPerSecond: 4_000_000 })
  attempts.push({})
  for (const opts of attempts) {
    try {
      return new MediaRecorder(stream, opts)
    } catch {
      /* try next */
    }
  }
  throw new Error(
    'Este navegador no puede recortar video. Actualízalo e inténtalo de nuevo.'
  )
}

function waitEvent(
  target: EventTarget,
  event: string,
  timeoutMs: number,
  timeoutMessage: string
): Promise<void> {
  return withTimeout(
    new Promise<void>((resolve, reject) => {
      const onOk = () => resolve()
      const onErr = () => reject(new Error(timeoutMessage))
      target.addEventListener(event, onOk, { once: true })
      target.addEventListener('error', onErr, { once: true })
    }),
    timeoutMs,
    timeoutMessage
  )
}

function outputSize(video: HTMLVideoElement): { w: number; h: number } {
  const vw = video.videoWidth || 1280
  const vh = video.videoHeight || 720
  const maxEdge = 1280
  const scale = Math.min(1, maxEdge / Math.max(vw, vh))
  const w = Math.max(2, Math.round((vw * scale) / 2) * 2)
  const h = Math.max(2, Math.round((vh * scale) / 2) * 2)
  return { w, h }
}

/**
 * Record the selected window by playing it. Only the clip is decoded, so
 * 8+ minute sources stay safe as long as the selection is ≤ 60s.
 */
export async function trimWithPlaybackRecorder(opts: {
  srcUrl: string
  startSec: number
  durationSec: number
  onProgress: TrimProgress
  audioCtx?: AudioContext | null
  /** Prefer the on-screen preview so the decoder keeps emitting frames. */
  sourceVideo?: HTMLVideoElement | null
}): Promise<File> {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Este navegador no puede recortar video. Actualízalo e inténtalo de nuevo.'
    )
  }

  const { srcUrl, startSec, durationSec, onProgress, audioCtx, sourceVideo } =
    opts
  const { mime, ext } = pickRecorderMime()
  const ownVideo = !sourceVideo
  const video = (sourceVideo ?? document.createElement('video')) as CaptureVideo
  const restoreMuted = video.muted
  const restoreTime = video.currentTime
  if (ownVideo) {
    video.playsInline = true
    video.setAttribute('playsinline', 'true')
    video.setAttribute('webkit-playsinline', 'true')
    video.preload = 'auto'
    video.muted = true
    video.volume = 1
    video.crossOrigin = 'anonymous'
    video.src = srcUrl
    // Non-zero size + tiny opacity: some browsers skip display:none / 0×0 videos.
    video.style.cssText =
      'position:fixed;right:0;bottom:0;width:320px;height:180px;opacity:0.02;pointer-events:none;z-index:1;'
    document.body.appendChild(video)
  } else {
    video.playsInline = true
    video.setAttribute('playsinline', 'true')
  }

  const tracksToStop: MediaStreamTrack[] = []
  let drawId: number | null = null
  let usingRvfc = false

  const cancelDraw = () => {
    if (drawId == null) return
    if (usingRvfc && video.cancelVideoFrameCallback) {
      try {
        video.cancelVideoFrameCallback(drawId)
      } catch {
        /* noop */
      }
    } else {
      cancelAnimationFrame(drawId)
    }
    drawId = null
  }

  try {
    if (video.readyState < 1) {
      await waitEvent(
        video,
        'loadedmetadata',
        15_000,
        'Tardó demasiado en preparar el video. Inténtalo de nuevo.'
      )
    }

    const { w, h } = outputSize(video)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      throw new Error('No se pudo iniciar el recorte de video.')
    }

    const targetStart = Math.max(0, startSec)
    if (Math.abs(video.currentTime - targetStart) > 0.04) {
      video.currentTime = targetStart
      await waitEvent(
        video,
        'seeked',
        12_000,
        'No se pudo ubicar el inicio del clip. Inténtalo de nuevo.'
      )
    }
    ctx.drawImage(video, 0, 0, w, h)

    try {
      video.muted = false
      await video.play()
    } catch {
      video.muted = true
      await video.play()
    }

    const fps = 30
    const nativeCapture =
      typeof video.captureStream === 'function'
        ? video.captureStream.bind(video)
        : typeof video.mozCaptureStream === 'function'
          ? video.mozCaptureStream.bind(video)
          : null

    let useCanvas = !nativeCapture
    let videoStream: MediaStream
    if (nativeCapture) {
      try {
        videoStream = nativeCapture(fps)
        if (videoStream.getVideoTracks().length === 0) {
          throw new Error('no-video-track')
        }
      } catch {
        useCanvas = true
        if (typeof canvas.captureStream !== 'function') {
          throw new Error(
            'Este navegador no puede recortar video. Actualízalo e inténtalo de nuevo.'
          )
        }
        videoStream = canvas.captureStream(fps)
      }
    } else if (typeof canvas.captureStream === 'function') {
      videoStream = canvas.captureStream(fps)
    } else {
      throw new Error(
        'Este navegador no puede recortar video. Actualízalo e inténtalo de nuevo.'
      )
    }
    tracksToStop.push(...videoStream.getTracks())

    const audioTracks: MediaStreamTrack[] = [...videoStream.getAudioTracks()]
    const ctxToUse = audioCtx && audioCtx.state !== 'closed' ? audioCtx : null
    if (audioTracks.length === 0 && ctxToUse) {
      try {
        if (ctxToUse.state === 'suspended') await ctxToUse.resume()
        const srcNode = ctxToUse.createMediaElementSource(video)
        const dest = ctxToUse.createMediaStreamDestination()
        const gain = ctxToUse.createGain()
        gain.gain.value = 0
        srcNode.connect(dest)
        srcNode.connect(gain)
        gain.connect(ctxToUse.destination)
        const at = dest.stream.getAudioTracks()[0]
        if (at) audioTracks.push(at)
      } catch {
        /* silent clip is better than failing the whole export */
      }
    }

    const combined = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioTracks,
    ])
    tracksToStop.push(...audioTracks)

    let recorder: MediaRecorder
    try {
      recorder = createRecorder(combined, mime)
    } catch {
      recorder = createRecorder(
        new MediaStream(videoStream.getVideoTracks()),
        mime
      )
    }

    const chunks: Blob[] = []
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data)
    }
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve()
      recorder.onerror = () =>
        reject(new Error('Falló la grabación del clip. Inténtalo de nuevo.'))
    })

    const endAt = startSec + durationSec
    const recordTimeoutMs = Math.max(45_000, durationSec * 2500 + 20_000)

    try {
      recorder.start(250)
    } catch {
      recorder.start()
    }

    const draw = () => {
      if (useCanvas) {
        try {
          ctx.drawImage(video, 0, 0, w, h)
        } catch {
          /* frame skip */
        }
      }
      const elapsed = video.currentTime - startSec
      onProgress(
        Math.max(
          1,
          Math.min(99, Math.round((elapsed / Math.max(0.001, durationSec)) * 100))
        )
      )
      if (video.paused || video.ended || video.currentTime >= endAt - 0.03) {
        return
      }
      if (video.requestVideoFrameCallback) {
        usingRvfc = true
        drawId = video.requestVideoFrameCallback(() => draw())
      } else {
        usingRvfc = false
        drawId = requestAnimationFrame(draw)
      }
    }
    draw()

    await withTimeout(
      new Promise<void>((resolve) => {
        let done = false
        const finish = () => {
          if (done) return
          done = true
          video.removeEventListener('timeupdate', onTime)
          video.removeEventListener('ended', finish)
          window.clearInterval(poll)
          resolve()
        }
        const onTime = () => {
          if (video.currentTime >= endAt - 0.03 || video.ended) {
            video.pause()
            finish()
          }
        }
        const poll = window.setInterval(onTime, 80)
        video.addEventListener('timeupdate', onTime)
        video.addEventListener('ended', finish)
        onTime()
      }),
      recordTimeoutMs,
      'El recorte tardó demasiado. Inténtalo de nuevo y no salgas de esta pantalla.'
    )

    cancelDraw()
    if (useCanvas) {
      try {
        ctx.drawImage(video, 0, 0, w, h)
      } catch {
        /* noop */
      }
    }
    video.pause()
    if (recorder.state !== 'inactive') recorder.stop()
    await withTimeout(
      stopped,
      10_000,
      'No se pudo finalizar el recorte. Inténtalo de nuevo.'
    )

    const outType = recorder.mimeType || mime || 'video/mp4'
    const blob = new Blob(chunks, { type: outType })
    if (blob.size < 512) {
      throw new Error('El clip quedó vacío. Prueba con otro tramo o archivo.')
    }
    const outExt = outType.includes('mp4') ? 'mp4' : ext
    onProgress(100)
    return new File([blob], `clip.${outExt}`, { type: outType })
  } finally {
    cancelDraw()
    video.pause()
    if (ownVideo) {
      tracksToStop.forEach((t) => {
        try {
          t.stop()
        } catch {
          /* noop */
        }
      })
      video.removeAttribute('src')
      try {
        video.load()
      } catch {
        /* noop */
      }
      video.remove()
    } else {
      video.muted = restoreMuted
      try {
        video.currentTime = restoreTime
      } catch {
        /* noop */
      }
    }
  }
}

