'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { Check, Pause, Play, Share2, Volume2, VolumeX, X } from 'lucide-react'
import type { CapsulaItem } from '../../lib/types'
import {
  isCompleted,
  markCompleted,
  savePosition,
  type CapsulasProgress,
} from '../../lib/progreso-capsulas'
import { useCapsulaVideoEngine } from './CapsulaVideoEngine'
import { FOCUS, acento, emitir, prefiereQuieto, sincronizarUrl } from './helpers'
import { posterDe } from './poster'
import { PosterVisual } from './PosterVisual'
import { ReproductorDebugPanel } from './ReproductorDebugPanel'

type Overlay =
  | { tipo: 'siguiente'; siguienteId: string; segundos: number }
  | { tipo: 'fin' }

function AnilloCuenta({ segundos, total = 5 }: { segundos: number; total?: number }) {
  const r = 18
  const c = 2 * Math.PI * r
  const pct = (total - segundos) / total
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="#CC4B37"
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 22 22)"
      />
    </svg>
  )
}

export function ReproductorInmersivo({
  abierto,
  capsulaId,
  lista,
  progreso,
  onProgreso,
  onCerrar,
  onCambiarCapsula,
  originRect,
  esDesktop,
  compartir,
  avisoCopia,
  hayCta,
  ctaTexto,
  ctaLink,
  layoutIdPrefix,
  onSalirAnimacion,
}: {
  abierto: boolean
  capsulaId: string
  lista: CapsulaItem[]
  progreso: CapsulasProgress
  onProgreso: (p: CapsulasProgress) => void
  onCerrar: () => void
  onCambiarCapsula: (id: string) => void
  originRect: DOMRect | null
  esDesktop: boolean
  compartir: (c: CapsulaItem) => void
  avisoCopia: string | null
  hayCta: boolean
  ctaTexto: string
  ctaLink: string
  layoutIdPrefix: string
  onSalirAnimacion: () => void
}) {
  const EASE_REELS = [0.2, 0.8, 0.2, 1] as const
  const engine = useCapsulaVideoEngine()
  const [debugCapsulas, setDebugCapsulas] = useState(false)
  useEffect(() => {
    setDebugCapsulas(new URLSearchParams(window.location.search).get('debug') === 'capsulas')
  }, [])

  const progresoRef = useRef(progreso)
  progresoRef.current = progreso
  engine.progresoRef.current = progreso

  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrubRef = useRef<HTMLDivElement>(null)
  const videoSlotRef = useRef<HTMLDivElement>(null)
  const ultimoGuardado = useRef(0)
  const rafRef = useRef(0)
  const pushedRef = useRef(false)
  const pointerStart = useRef<{ y: number; t: number } | null>(null)
  const irARef = useRef<(id: string, reproducir?: boolean) => void>(() => {})
  const prepararSalidaRef = useRef(() => {})
  const videoAreaRef = useRef<HTMLDivElement>(null)
  const [videoAreaH, setVideoAreaH] = useState(0)

  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [iconoPlay, setIconoPlay] = useState<'play' | 'pause' | null>(null)
  const [montado, setMontado] = useState(false)
  const [checkAnim, setCheckAnim] = useState(false)
  const [salidaRect, setSalidaRect] = useState<DOMRect | null>(null)

  const dragY = useMotionValue(0)
  const nextY = useTransform(dragY, (v) => {
    const h = videoAreaH || 1
    return v > 0 ? h : h + v
  })
  const prevY = useTransform(dragY, (v) => {
    const h = videoAreaH || 1
    return v < 0 ? -h : -h + v
  })

  const capsula = lista.find((c) => c.id === capsulaId) ?? lista[0]
  const indice = capsula ? lista.findIndex((c) => c.id === capsula.id) : -1
  const anterior = indice > 0 ? lista[indice - 1] : null
  const proxima = indice >= 0 && indice < lista.length - 1 ? lista[indice + 1] : null
  const quieto = prefiereQuieto()

  useEffect(() => setMontado(true), [])

  useEffect(() => {
    if (!abierto) {
      engine.attachToSlot(null)
      return
    }
    const t = window.requestAnimationFrame(() => {
      engine.attachToSlot(videoSlotRef.current)
    })
    return () => {
      window.cancelAnimationFrame(t)
      if (!abierto) engine.attachToSlot(null)
    }
  }, [abierto, engine, capsulaId])

  useEffect(() => {
    if (!abierto || !videoAreaRef.current) return
    const medir = () => setVideoAreaH(videoAreaRef.current?.clientHeight ?? 0)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(videoAreaRef.current)
    return () => ro.disconnect()
  }, [abierto])

  useEffect(() => {
    if (abierto) {
      setSalidaRect(null)
      dragY.set(0)
      return
    }
    const el = document.querySelector(`[data-capsula-thumb="${capsulaId}"]`)
    setSalidaRect(el?.getBoundingClientRect() ?? null)
  }, [abierto, capsulaId, dragY])

  const actualizarBarras = useCallback(() => {
    const video = engine.videoRef.current
    if (!video || !capsula) return
    const dur = video.duration
    const t = video.currentTime
    lista.forEach((_, i) => {
      const el = barRefs.current[i]
      if (!el) return
      if (i < indice) el.style.transform = 'scaleX(1)'
      else if (i > indice) el.style.transform = 'scaleX(0)'
      else if (Number.isFinite(dur) && dur > 0) el.style.transform = `scaleX(${Math.min(1, t / dur)})`
    })
    const scrub = scrubRef.current
    if (scrub && Number.isFinite(dur) && dur > 0) {
      scrub.style.transform = `scaleX(${Math.min(1, t / dur)})`
    }
  }, [capsula, engine.videoRef, indice, lista])

  const irA = useCallback(
    (id: string, reproducir = false) => {
      const c = lista.find((x) => x.id === id)
      if (!c) return
      setOverlay(null)
      onCambiarCapsula(id)
      sincronizarUrl(id)
      engine.switchCapsula(c, progresoRef.current, reproducir)
    },
    [engine, lista, onCambiarCapsula],
  )

  irARef.current = irA

  useEffect(() => {
    if (!abierto) return
    const prev = document.body.style.overflow
    const pad = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (pad > 0) document.body.style.paddingRight = `${pad}px`
    return () => {
      document.body.style.overflow = prev
      document.body.style.paddingRight = ''
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) {
      pushedRef.current = false
      return
    }
    pushedRef.current = true
    window.history.pushState({ capsulasModal: true }, '')
    const onPop = () => {
      pushedRef.current = false
      prepararSalidaRef.current()
      onCerrar()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [abierto, onCerrar])

  useEffect(() => {
    if (!abierto || !capsula) return
    return engine.bindVideoEvents({
      onPlay: () => emitir('capsula_play', capsula),
      onPause: onPausePersist,
      onTimeUpdate: onTimePersist,
      onEnded: alTerminar,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, capsula?.id])

  useEffect(() => {
    if (!abierto || !proxima) return
    const url = posterDe(proxima)
    if (!url) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [abierto, proxima?.id, proxima])

  useEffect(() => {
    if (!abierto) return
    const loop = () => {
      actualizarBarras()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [abierto, actualizarBarras])

  useEffect(() => {
    if (!overlay || overlay.tipo !== 'siguiente') return
    if (overlay.segundos <= 0) {
      const id = overlay.siguienteId
      setOverlay(null)
      irARef.current(id, true)
      return
    }
    const t = window.setTimeout(() => {
      setOverlay((cur) => (cur && cur.tipo === 'siguiente' ? { ...cur, segundos: cur.segundos - 1 } : cur))
    }, 1000)
    return () => window.clearTimeout(t)
  }, [overlay])

  function cerrar() {
    prepararSalida()
    engine.onClose()
    if (pushedRef.current) {
      pushedRef.current = false
      window.history.back()
    } else onCerrar()
  }

  function alTerminar() {
    if (!capsula) return
    const antes = lista.every((c) => isCompleted(progresoRef.current, c.id))
    const siguiente = markCompleted(capsula.id)
    progresoRef.current = siguiente
    onProgreso(siguiente)
    emitir('capsula_completa', capsula)
    const ahora = lista.every((c) => isCompleted(siguiente, c.id))
    if (ahora && !antes) emitir('capsulas_manual_completo', capsula)
    setCheckAnim(true)
    window.setTimeout(() => setCheckAnim(false), 600)
    try {
      navigator.vibrate?.(15)
    } catch {
      /* noop */
    }
    if (proxima) setOverlay({ tipo: 'siguiente', siguienteId: proxima.id, segundos: 5 })
    else setOverlay({ tipo: 'fin' })
  }

  function togglePlay() {
    const video = engine.videoRef.current
    if (!video) return
    if (video.paused) {
      engine.tapToPlay()
      setIconoPlay('play')
    } else {
      video.pause()
      setIconoPlay('pause')
    }
    window.setTimeout(() => setIconoPlay(null), 500)
  }

  function onTimePersist() {
    const video = engine.videoRef.current
    if (!video || !capsula || video.ended) return
    if (isCompleted(progresoRef.current, capsula.id)) return
    const t = video.currentTime
    if (t < 1 || Math.abs(t - ultimoGuardado.current) < 3) return
    ultimoGuardado.current = t
    progresoRef.current = savePosition(capsula.id, t)
  }

  function onPausePersist() {
    const video = engine.videoRef.current
    if (!video || !capsula || video.ended) return
    if (video.currentTime < 1 || isCompleted(progresoRef.current, capsula.id)) return
    const siguiente = savePosition(capsula.id, video.currentTime)
    progresoRef.current = siguiente
    onProgreso(siguiente)
  }

  function onSwipeEnd(_: unknown, info: PanInfo) {
    const y = info.offset.y
    const vy = info.velocity.y
    const h = videoAreaH || 1
    if (y < -80 || vy < -500) {
      if (proxima) {
        animate(dragY, -h, {
          duration: 0.28,
          ease: EASE_REELS,
          onComplete: () => {
            irA(proxima.id, true)
            dragY.set(0)
          },
        })
      } else if (overlay?.tipo !== 'fin') setOverlay({ tipo: 'fin' })
      else animate(dragY, 0, { duration: 0.2 })
      return
    }
    if (y > 80 || vy > 500) {
      if (anterior) {
        animate(dragY, h, {
          duration: 0.28,
          ease: EASE_REELS,
          onComplete: () => {
            irA(anterior.id, true)
            dragY.set(0)
          },
        })
      } else cerrar()
      return
    }
    animate(dragY, 0, { duration: 0.2 })
  }

  function prepararSalida() {
    const el = document.querySelector(`[data-capsula-thumb="${capsulaId}"]`)
    setSalidaRect(el?.getBoundingClientRect() ?? null)
  }

  prepararSalidaRef.current = prepararSalida

  function onScrub(e: React.PointerEvent<HTMLDivElement>) {
    const video = engine.videoRef.current
    const track = e.currentTarget
    if (!video || !Number.isFinite(video.duration)) return
    const rect = track.getBoundingClientRect()
    const move = (ev: PointerEvent) => {
      const x = Math.min(rect.width, Math.max(0, ev.clientX - rect.left))
      video.currentTime = (x / rect.width) * video.duration
      actualizarBarras()
    }
    move(e.nativeEvent)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      onPausePersist()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  function verAhoraDesdeGesto(siguienteId: string) {
    const c = lista.find((x) => x.id === siguienteId)
    if (!c) return
    setOverlay(null)
    onCambiarCapsula(siguienteId)
    sincronizarUrl(siguienteId)
    engine.playFromGesture(c, progresoRef.current)
  }

  if (!montado || !capsula) return null

  const siguienteOverlay = overlay?.tipo === 'siguiente' ? lista.find((c) => c.id === overlay.siguienteId) : null

  const from = originRect
  const cerrando = !abierto && salidaRect != null
  const shellFull = esDesktop
    ? { top: '5vh', left: '50%', x: '-50%', width: 'min(420px, 90vw)', height: '90vh', opacity: 1 }
    : { top: 0, left: 0, x: 0, width: '100%', height: '100dvh', opacity: 1 }

  const shellCerrar = salidaRect
    ? { top: salidaRect.top, left: salidaRect.left, x: 0, width: salidaRect.width, height: salidaRect.height, opacity: 1 }
    : { opacity: 0 }

  const shellAbrir =
    quieto || !from
      ? { opacity: 0 }
      : { top: from.top, left: from.left, x: 0, width: from.width, height: from.height, opacity: 1 }

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
      style={{ height: '100dvh', overscrollBehavior: 'contain' }}
    >
      <motion.div
        layoutId={quieto ? undefined : `${layoutIdPrefix}-${capsula.id}`}
        className="fixed flex flex-col overflow-hidden bg-black"
        initial={abierto ? (quieto ? { opacity: 0 } : esDesktop ? { opacity: 0 } : shellAbrir) : false}
        animate={cerrando ? shellCerrar : shellFull}
        transition={{ duration: quieto ? 0.2 : 0.3, ease: EASE_REELS }}
        onAnimationComplete={() => {
          if (!abierto && salidaRect) {
            setSalidaRect(null)
            onSalirAnimacion()
          }
        }}
      >
        <header
          className="shrink-0 bg-black px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]"
          style={{ minHeight: 'calc(48px + env(safe-area-inset-top, 0px))' }}
        >
          <div className="mb-2 flex gap-0.5">
            {lista.map((c, i) => (
              <div key={c.id} className="h-0.5 flex-1 overflow-hidden bg-white/25">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el
                  }}
                  className="h-full origin-left bg-white"
                  style={{ transform: i < indice ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p
              className="truncate text-[11px] tracking-[0.16em]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
            >
              CÁPSULA <span style={{ color: acento(capsula.color) }}>{capsula.numero}</span>
              <span className="text-white/50">
                {' '}
                · {String(indice + 1).padStart(2, '0')}/{lista.length}
              </span>
            </p>
            <button
              type="button"
              aria-label="Cerrar reproductor"
              className={`flex h-10 w-10 items-center justify-center text-white ${FOCUS}`}
              onClick={cerrar}
            >
              <X className="h-6 w-6" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </header>

        <motion.div
          ref={videoAreaRef}
          className="relative min-h-0 flex-1 bg-black"
          style={{ y: dragY, touchAction: 'none' }}
          drag={quieto || overlay ? false : 'y'}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragEnd={onSwipeEnd}
          onPointerDown={(e) => {
            pointerStart.current = { y: e.clientY, t: Date.now() }
          }}
          onPointerUp={(e) => {
            const start = pointerStart.current
            pointerStart.current = null
            if (!start) return
            const dy = Math.abs(e.clientY - start.y)
            const dt = Date.now() - start.t
            if (dy < 12 && dt < 300) togglePlay()
          }}
        >
          {anterior && !overlay ? (
            <motion.div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black" style={{ y: prevY }}>
              <PosterVisual capsula={anterior} width={390} height={693} imgClassName="max-h-full max-w-full object-contain opacity-40" />
            </motion.div>
          ) : null}
          {proxima && !overlay ? (
            <motion.div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black" style={{ y: nextY }}>
              <PosterVisual capsula={proxima} width={390} height={693} imgClassName="max-h-full max-w-full object-contain opacity-40" />
            </motion.div>
          ) : null}

          <div className="relative z-[1] flex h-full w-full items-center justify-center">
            <div
              ref={videoSlotRef}
              className="aspect-[9/16] h-full w-auto max-h-full max-w-full"
              data-capsula-video-slot
            />
          </div>

          {debugCapsulas ? <ReproductorDebugPanel snap={engine.debugSnapshot} /> : null}

          {checkAnim ? (
            <div className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center">
              <Check className="h-16 w-16 text-[#CC4B37]" strokeWidth={2.5} aria-hidden />
            </div>
          ) : null}

          {iconoPlay ? (
            <div className="pointer-events-none absolute inset-0 z-[7] flex items-center justify-center">
              {iconoPlay === 'pause' ? (
                <Pause className="h-14 w-14 text-white/90" fill="currentColor" aria-hidden />
              ) : (
                <Play className="h-14 w-14 text-white/90" fill="currentColor" aria-hidden />
              )}
            </div>
          ) : null}

          {engine.needsTapToPlay ? (
            <div className="absolute inset-0 z-[9] flex items-center justify-center bg-black/40 px-6">
              <button
                type="button"
                className={`flex flex-col items-center gap-2 rounded border border-white/30 bg-black/80 px-6 py-5 text-white ${FOCUS}`}
                onClick={() => engine.tapToPlay()}
              >
                <Play className="h-12 w-12" fill="currentColor" aria-hidden />
                <span className="text-[11px] tracking-[0.2em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}>
                  TOCA PARA REPRODUCIR
                </span>
              </button>
            </div>
          ) : null}

          {engine.loadError ? (
            <div className="absolute inset-0 z-[9] flex flex-col items-center justify-center gap-3 bg-black/75 px-6 text-center">
              <p className="text-sm text-white" style={{ fontFamily: 'Lato, sans-serif' }}>
                No se pudo cargar la cápsula
              </p>
              <button
                type="button"
                className={`border border-white/40 px-4 py-2 text-[10px] tracking-[0.14em] text-white ${FOCUS}`}
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                onClick={() => engine.retryLoad()}
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {overlay ? (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-black/55 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
              role="status"
            >
              {overlay.tipo === 'siguiente' && siguienteOverlay ? (
                <motion.div
                  initial={{ y: 120 }}
                  animate={{ y: 0 }}
                  transition={{ duration: quieto ? 0.15 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  className="w-full max-w-md border border-white/20 bg-[#111] p-4"
                >
                  <p
                    className="text-[10px] tracking-[0.2em] text-[#CC4B37]"
                    style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                  >
                    SIGUIENTE TRANSMISIÓN
                  </p>
                  <div className="mt-3 flex gap-3">
                    <div className="h-16 w-12 shrink-0 overflow-hidden">
                      <PosterVisual capsula={siguienteOverlay} width={48} height={64} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold uppercase" style={{ fontFamily: 'Jost, sans-serif' }}>
                        {siguienteOverlay.numero} · {siguienteOverlay.titulo}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <AnilloCuenta segundos={overlay.segundos} />
                      <span className="text-[10px] text-white/60">{overlay.segundos}s</span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 bg-[#CC4B37] py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                      onClick={() => verAhoraDesdeGesto(overlay.siguienteId)}
                    >
                      VER AHORA
                    </button>
                    <button
                      type="button"
                      className={`flex-1 border border-white/40 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                      onClick={() => setOverlay(null)}
                    >
                      CANCELAR
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="w-full max-w-md border border-white/20 bg-[#111] p-6 text-center">
                  <p className="text-lg tracking-[0.14em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}>
                    MANUAL COMPLETO
                  </p>
                  {hayCta ? (
                    <a
                      href={ctaLink}
                      className={`mt-4 inline-block bg-[#CC4B37] px-4 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                    >
                      {ctaTexto}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className={`mt-3 border border-white/40 px-4 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                    style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                    onClick={() => setOverlay(null)}
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>

        <footer
          className="shrink-0 bg-black px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
          style={{ minHeight: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div
            className="relative mb-2 h-1 w-full cursor-pointer bg-white/25"
            onPointerDown={onScrub}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso del video"
          >
            <div ref={scrubRef} className="h-full origin-left bg-[#CC4B37]" style={{ transform: 'scaleX(0)' }} />
          </div>
          <div className="flex items-center gap-2">
            <p
              className="min-w-0 flex-1 truncate text-xs uppercase text-white/90"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
            >
              {capsula.titulo}
            </p>
            <button
              type="button"
              aria-label={avisoCopia ?? 'Compartir cápsula'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center text-white ${FOCUS}`}
              onClick={() => compartir(capsula)}
            >
              <Share2 className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label={engine.muted ? 'Activar sonido' : 'Silenciar'}
              className={`flex h-10 w-10 shrink-0 items-center justify-center text-white ${FOCUS}`}
              onClick={() => engine.setMuted(!engine.muted)}
            >
              {engine.muted ? (
                <VolumeX className="h-5 w-5" aria-hidden />
              ) : (
                <Volume2 className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  )

  const mostrar = abierto || salidaRect != null
  return createPortal(<AnimatePresence mode="wait">{mostrar ? content : null}</AnimatePresence>, document.body)
}
