'use client'

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { CapsulaItem } from '../../lib/types'
import {
  isCompleted,
  markCompleted,
  savePosition,
  type CapsulasProgress,
} from '../../lib/progreso-capsulas'
import { FOCUS, acento, emitir, prefiereQuieto, sincronizarUrl } from './helpers'
import { posterDe } from './poster'
import { PosterVisual } from './PosterVisual'

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
  quierePlayRef,
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
  quierePlayRef: MutableRefObject<boolean>
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progresoRef = useRef(progreso)
  progresoRef.current = progreso
  const barRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrubRef = useRef<HTMLDivElement>(null)
  const ultimoGuardado = useRef(0)
  const rafRef = useRef(0)
  const pushedRef = useRef(false)
  const pointerStart = useRef<{ y: number; t: number } | null>(null)
  const irARef = useRef<(id: string, reproducir?: boolean) => void>(() => {})

  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [muted, setMuted] = useState(false)
  const [glitch, setGlitch] = useState(false)
  const [iconoPlay, setIconoPlay] = useState(false)
  const [montado, setMontado] = useState(false)
  const [checkAnim, setCheckAnim] = useState(false)

  const capsula = lista.find((c) => c.id === capsulaId) ?? lista[0]
  const indice = capsula ? lista.findIndex((c) => c.id === capsula.id) : -1
  const anterior = indice > 0 ? lista[indice - 1] : null
  const proxima = indice >= 0 && indice < lista.length - 1 ? lista[indice + 1] : null
  const quieto = prefiereQuieto()

  useEffect(() => setMontado(true), [])

  const actualizarBarras = useCallback(() => {
    const video = videoRef.current
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
  }, [capsula, indice, lista])

  const cargarYReproducir = useCallback(
    (c: CapsulaItem, reproducir: boolean) => {
      const video = videoRef.current
      if (!video) return
      const src = c.video_url.trim()
      if (!video.src.endsWith(src) && video.src !== src) {
        video.src = src
        video.load()
      }
      const poster = posterDe(c)
      if (poster) video.poster = poster
      const pos = progresoRef.current.p[c.id] ?? 0
      const onMeta = () => {
        if (
          pos > 0 &&
          !isCompleted(progresoRef.current, c.id) &&
          Number.isFinite(video.duration) &&
          pos < video.duration - 0.5
        ) {
          try {
            video.currentTime = pos
          } catch {
            /* seek */
          }
        }
        if (reproducir) video.play().catch(() => {})
      }
      if (video.readyState >= 1) onMeta()
      else video.addEventListener('loadedmetadata', onMeta, { once: true })
    },
    [],
  )

  const irA = useCallback(
    (id: string, reproducir = false) => {
      const c = lista.find((x) => x.id === id)
      if (!c) return
      setOverlay(null)
      if (!quieto) {
        setGlitch(true)
        window.setTimeout(() => setGlitch(false), 200)
      }
      onCambiarCapsula(id)
      sincronizarUrl(id)
      cargarYReproducir(c, reproducir)
    },
    [cargarYReproducir, lista, onCambiarCapsula, quieto],
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
      onCerrar()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [abierto, onCerrar])

  useEffect(() => {
    if (!abierto || !capsula) return
    const rep = quierePlayRef.current
    quierePlayRef.current = false
    cargarYReproducir(capsula, rep)
  }, [abierto, capsula?.id, capsula, cargarYReproducir, quierePlayRef])

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
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
    setIconoPlay(true)
    window.setTimeout(() => setIconoPlay(false), 500)
  }

  function onTimePersist() {
    const video = videoRef.current
    if (!video || !capsula || video.ended) return
    if (isCompleted(progresoRef.current, capsula.id)) return
    const t = video.currentTime
    if (t < 1 || Math.abs(t - ultimoGuardado.current) < 3) return
    ultimoGuardado.current = t
    progresoRef.current = savePosition(capsula.id, t)
  }

  function onPausePersist() {
    const video = videoRef.current
    if (!video || !capsula || video.ended) return
    if (video.currentTime < 1 || isCompleted(progresoRef.current, capsula.id)) return
    const siguiente = savePosition(capsula.id, video.currentTime)
    progresoRef.current = siguiente
    onProgreso(siguiente)
  }

  function onSwipeEnd(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
    const y = info.offset.y
    const vy = info.velocity.y
    if (y < -80 || vy < -500) {
      if (proxima) irA(proxima.id, true)
      else if (overlay?.tipo !== 'fin') setOverlay({ tipo: 'fin' })
      return
    }
    if (y > 80 || vy > 500) {
      if (anterior) irA(anterior.id, true)
      else cerrar()
    }
  }

  function onScrub(e: React.PointerEvent<HTMLDivElement>) {
    const video = videoRef.current
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

  if (!montado || !abierto || !capsula) return null

  const siguienteOverlay = overlay?.tipo === 'siguiente' ? lista.find((c) => c.id === overlay.siguienteId) : null

  const from = originRect
  const shellInitial =
    quieto || !from
      ? { opacity: 0 }
      : {
          top: from.top,
          left: from.left,
          width: from.width,
          height: from.height,
          borderRadius: 0,
        }

  const shellAnimate = quieto
    ? { opacity: 1 }
    : esDesktop
      ? { opacity: 1, scale: 1 }
      : from && !quieto
        ? { top: 0, left: 0, width: '100%', height: '100dvh', opacity: 1 }
        : { opacity: 1 }

  const content = (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
      style={{ height: '100dvh', overscrollBehavior: 'contain' }}
    >
    <motion.div
      className={`relative overflow-hidden bg-black ${esDesktop ? 'h-[90vh] w-[min(420px,90vw)]' : 'h-full w-full max-h-[100dvh]'}`}
      initial={esDesktop ? { opacity: 0 } : shellInitial}
      animate={shellAnimate}
      exit={{ opacity: 0 }}
      transition={{ duration: quieto ? 0.2 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.div
        layoutId={`${layoutIdPrefix}-${capsula.id}`}
        className="relative h-full w-full bg-black"
        drag={quieto || overlay ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
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
        style={{ touchAction: 'none' }}
      >
        <video
          ref={videoRef}
          playsInline
          preload="metadata"
          muted={muted}
          className={`h-full w-full bg-black ${esDesktop ? 'object-contain' : 'object-cover'}`}
          onPlay={() => emitir('capsula_play', capsula)}
          onPause={onPausePersist}
          onTimeUpdate={onTimePersist}
          onEnded={alTerminar}
        />

        {checkAnim ? (
          <div className="pointer-events-none absolute inset-0 z-[8] flex items-center justify-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl text-[#CC4B37]"
            >
              ✓
            </motion.span>
          </div>
        ) : null}

        {iconoPlay ? (
          <div className="pointer-events-none absolute inset-0 z-[7] flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-5xl text-white/90"
            >
              ▶
            </motion.span>
          </div>
        ) : null}

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/85 to-transparent px-3 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]"
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
          <div className="pointer-events-auto flex items-center justify-between gap-3">
            <p className="truncate text-[11px] tracking-[0.16em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}>
              CÁPSULA <span style={{ color: acento(capsula.color) }}>{capsula.numero}</span>
              <span className="text-white/50"> · {String(indice + 1).padStart(2, '0')}/{lista.length}</span>
            </p>
            <button
              type="button"
              aria-label="Cerrar reproductor"
              className={`flex h-11 w-11 items-center justify-center text-2xl text-white ${FOCUS}`}
              onClick={cerrar}
            >
              ×
            </button>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/75 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-20"
        >
          <p
            className={`text-xl uppercase ${glitch && !quieto ? 'reels-glitch' : ''}`}
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
            }}
          >
            {capsula.titulo}
          </p>
          {capsula.descripcion?.trim() ? (
            <p className="mt-1 line-clamp-2 text-sm text-white/70" style={{ fontFamily: 'Lato, sans-serif' }}>
              {capsula.descripcion}
            </p>
          ) : null}
          <div
            className="pointer-events-auto relative mt-3 h-1 w-full cursor-pointer bg-white/25"
            onPointerDown={onScrub}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso del video"
          >
            <div ref={scrubRef} className="h-full origin-left bg-[#CC4B37]" style={{ transform: 'scaleX(0)' }} />
          </div>
          <div className="pointer-events-auto mt-3 flex gap-2">
            <button
              type="button"
              className={`flex-1 border border-white/30 py-2.5 text-[10px] tracking-[0.14em] ${FOCUS}`}
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
              onClick={() => compartir(capsula)}
            >
              {avisoCopia ?? 'COMPARTIR'}
            </button>
            <button
              type="button"
              className={`flex-1 border border-white/30 py-2.5 text-[10px] tracking-[0.14em] ${FOCUS}`}
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
              onClick={() => {
                const v = videoRef.current
                if (!v) return
                v.muted = !v.muted
                setMuted(v.muted)
              }}
            >
              {muted ? 'ACTIVAR SONIDO' : 'SILENCIAR'}
            </button>
          </div>
        </div>

        {overlay ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-black/55 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]" role="status">
            {overlay.tipo === 'siguiente' && siguienteOverlay ? (
              <motion.div
                initial={{ y: 120 }}
                animate={{ y: 0 }}
                transition={{ duration: quieto ? 0.15 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                className="w-full max-w-md border border-white/20 bg-[#111] p-4"
              >
                <p className="text-[10px] tracking-[0.2em] text-[#CC4B37]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}>
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
                    onClick={() => irA(overlay.siguienteId, true)}
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
      <style jsx>{`
        @keyframes reels-glitch {
          0%,
          100% {
            transform: translateX(0);
            clip-path: inset(0 0 0 0);
          }
          33% {
            transform: translateX(-3px);
            clip-path: inset(0 0 45% 0);
          }
          66% {
            transform: translateX(3px);
            clip-path: inset(55% 0 0 0);
          }
        }
        .reels-glitch {
          animation: reels-glitch 0.2s ease-out;
        }
      `}</style>
    </motion.div>
    </div>
  )

  return createPortal(<AnimatePresence mode="wait">{abierto ? content : null}</AnimatePresence>, document.body)
}
