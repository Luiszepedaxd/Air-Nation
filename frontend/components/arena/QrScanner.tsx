'use client'

import { useEffect, useRef, useState } from 'react'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}

function barcodeDetector(): BarcodeDetectorCtor | null {
  const w = window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
  return typeof w.BarcodeDetector === 'function' ? w.BarcodeDetector : null
}

/**
 * Lee un QR con la cámara. Usa `BarcodeDetector` donde existe (Chrome y la
 * WebView de Android) y cae a `html5-qrcode` en Safari e iOS.
 */
export function QrScanner({ onLeido }: { onLeido: (texto: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const yaLeido = useRef(false)
  const [error, setError] = useState('')
  const [motor, setMotor] = useState<'nativo' | 'respaldo' | ''>('')

  useEffect(() => {
    let cancelado = false
    let stream: MediaStream | null = null
    let raf = 0
    let html5: { stop: () => Promise<void>; clear: () => void } | null = null

    const entregar = (texto: string) => {
      if (yaLeido.current || !texto) return
      yaLeido.current = true
      onLeido(texto)
    }

    const conRespaldo = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelado || !fallbackRef.current) return
        setMotor('respaldo')
        const instancia = new Html5Qrcode(fallbackRef.current.id)
        html5 = instancia as unknown as { stop: () => Promise<void>; clear: () => void }
        await instancia.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (texto) => entregar(texto),
          () => {
            /* cada frame sin QR entra aquí: no es un error */
          }
        )
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error && /permission|denied|notallowed/i.test(err.message)
              ? 'No nos diste permiso de usar la cámara. Puedes teclear el código.'
              : 'No pudimos abrir la cámara. Puedes teclear el código.'
          )
        }
      }
    }

    const arrancar = async () => {
      const Detector = barcodeDetector()
      if (!Detector) return conRespaldo()
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        })
        if (cancelado || !videoRef.current) return
        setMotor('nativo')
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        const detector = new Detector({ formats: ['qr_code'] })
        const mirar = async () => {
          if (cancelado || yaLeido.current || !videoRef.current) return
          try {
            const codigos = await detector.detect(videoRef.current)
            if (codigos[0]?.rawValue) return entregar(codigos[0].rawValue)
          } catch {
            /* un frame malo no detiene el escáner */
          }
          raf = requestAnimationFrame(() => void mirar())
        }
        raf = requestAnimationFrame(() => void mirar())
      } catch {
        if (!cancelado) await conRespaldo()
      }
    }

    void arrancar()

    return () => {
      cancelado = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((t) => t.stop())
      if (html5) {
        html5
          .stop()
          .then(() => html5?.clear())
          .catch(() => {})
      }
    }
  }, [onLeido])

  return (
    <div className="flex flex-col gap-2" style={lato}>
      <div className="relative w-full overflow-hidden bg-[#111111]" style={{ aspectRatio: '1 / 1' }}>
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${motor === 'nativo' ? '' : 'hidden'}`}
          playsInline
          muted
        />
        <div
          id="arena-qr-fallback"
          ref={fallbackRef}
          className={`h-full w-full ${motor === 'respaldo' ? '' : 'hidden'}`}
        />
        {!motor && !error ? (
          <p
            style={jost}
            className="absolute inset-0 flex items-center justify-center text-[11px] text-[#FFFFFF]"
          >
            ABRIENDO LA CÁMARA…
          </p>
        ) : null}
      </div>
      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
    </div>
  )
}
