'use client'

import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import type { CapsulaItem, CapsulasConfig } from '../lib/types'
import {
  isCompleted,
  markCompleted,
  readProgress,
  resetProgress,
  savePosition,
  type CapsulasProgress,
} from '../lib/progreso-capsulas'

const PROGRESO_VACIO: CapsulasProgress = { v: 1, c: [], p: {} }
const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC4B37]'

function acento(color: string | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#CC4B37'
}

function enlaceSeguro(link: string): boolean {
  return /^https?:\/\//i.test(link) || (link.startsWith('/') && !link.startsWith('//'))
}

function formatearDuracion(segundos: number): string {
  const total = Math.max(0, Math.round(segundos))
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}

function capsulasVisibles(config: CapsulasConfig): CapsulaItem[] {
  return (config.capsulas ?? []).filter((c) => {
    if (!c || c.activo === false) return false
    const id = typeof c.id === 'string' ? c.id.trim() : ''
    const url = typeof c.video_url === 'string' ? c.video_url.trim() : ''
    return Boolean(id) && /^https?:\/\//i.test(url)
  })
}

function prefiereQuieto(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollA(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefiereQuieto() ? 'auto' : 'smooth', block: 'start' })
}

function sincronizarUrl(id: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('capsula', id)
  window.history.replaceState(null, '', `${url.pathname}${url.search}`)
}

function emitir(nombre: string, capsula: CapsulaItem) {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  gtag('event', nombre, { capsula_id: capsula.id, capsula_numero: capsula.numero })
}

function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}

type Overlay =
  | { tipo: 'siguiente'; siguienteId: string; segundos: number }
  | { tipo: 'fin' }

export function CapsulasSection({ config }: { config: CapsulasConfig }) {
  const lista = useMemo(() => capsulasVisibles(config), [config])

  const [progreso, setProgreso] = useState<CapsulasProgress>(PROGRESO_VACIO)
  const [seleccionId, setSeleccionId] = useState<string | null>(lista[0]?.id ?? null)
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [listo, setListo] = useState(false)
  const [avisoCopia, setAvisoCopia] = useState<string | null>(null)

  const progresoRef = useRef(progreso)
  progresoRef.current = progreso
  const quiereReproducir = useRef(false)
  const ultimoGuardado = useRef(0)
  const copiaTimer = useRef<number | null>(null)
  const pendienteScroll = useRef(false)

  const seleccion = lista.find((c) => c.id === seleccionId) ?? lista[0] ?? null
  const indice = seleccion ? lista.findIndex((c) => c.id === seleccion.id) : -1
  const anterior = indice > 0 ? lista[indice - 1] : null
  const proxima = indice >= 0 && indice < lista.length - 1 ? lista[indice + 1] : null

  const hechas = lista.filter((c) => isCompleted(progreso, c.id)).length
  const porcentaje = lista.length ? Math.round((hechas / lista.length) * 100) : 0
  const primeraAbierta = lista.find((c) => !isCompleted(progreso, c.id)) ?? null
  const todasHechas = lista.length > 0 && primeraAbierta === null

  const ctaTexto = config.cta_final_texto?.trim() || ''
  const ctaLink = config.cta_final_link?.trim() || ''
  const hayCta = Boolean(ctaTexto && ctaLink && enlaceSeguro(ctaLink))
  const eyebrow = config.eyebrow?.trim() || 'MANUAL DEL OPERADOR'
  const titulo = config.titulo?.trim() || 'CÁPSULAS'
  const notaProgreso = config.nota_progreso?.trim() || ''

  useEffect(() => {
    return () => {
      if (copiaTimer.current != null) window.clearTimeout(copiaTimer.current)
    }
  }, [])

  useEffect(() => {
    const actual = readProgress()
    setProgreso(actual)
    const params = new URLSearchParams(window.location.search)
    const q = params.get('capsula')
    const hash = window.location.hash.match(/^#capsula-(.+)$/)
    const hashId = hash ? decodificar(hash[1]) : null
    const ids = new Set(lista.map((c) => c.id))
    const pedido = [q, hashId].find((id): id is string => id != null && ids.has(id))
    if (pedido) {
      setSeleccionId(pedido)
      scrollA('capsulas')
      if (hashId === pedido) sincronizarUrl(pedido)
    } else {
      const pendiente = lista.find((c) => !isCompleted(actual, c.id)) ?? lista[0]
      if (pendiente) setSeleccionId(pendiente.id)
    }
    setListo(true)
  }, [lista])

  useEffect(() => {
    ultimoGuardado.current = 0
  }, [seleccionId])

  useEffect(() => {
    if (!pendienteScroll.current) return
    pendienteScroll.current = false
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    scrollA('capsula-reproductor')
  }, [seleccionId])

  useEffect(() => {
    if (!overlay || overlay.tipo !== 'siguiente') return
    if (overlay.segundos <= 0) {
      const id = overlay.siguienteId
      quiereReproducir.current = true
      setOverlay(null)
      setSeleccionId(id)
      sincronizarUrl(id)
      return
    }
    const t = window.setTimeout(() => {
      setOverlay((cur) => {
        if (!cur || cur.tipo !== 'siguiente') return cur
        return { ...cur, segundos: cur.segundos - 1 }
      })
    }, 1000)
    return () => window.clearTimeout(t)
  }, [overlay])

  function elegir(id: string, opts?: { scrollJugador?: boolean; soloMovil?: boolean; reproducir?: boolean }) {
    setOverlay(null)
    quiereReproducir.current = Boolean(opts?.reproducir)
    setSeleccionId(id)
    sincronizarUrl(id)
    if (!opts?.scrollJugador) return
    const movil = window.matchMedia('(max-width: 1023px)').matches
    if (!opts.soloMovil || movil) pendienteScroll.current = true
  }

  function reiniciar() {
    if (!window.confirm('¿Reiniciar el progreso de las cápsulas?')) return
    const limpio = resetProgress()
    progresoRef.current = limpio
    setProgreso(limpio)
    setOverlay(null)
  }

  function alMetadata(e: SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget
    if (!seleccion) return
    const pos = progresoRef.current.p[seleccion.id] ?? 0
    const dur = video.duration
    if (
      pos > 0 &&
      !isCompleted(progresoRef.current, seleccion.id) &&
      Number.isFinite(dur) &&
      pos < dur - 0.5
    ) {
      try {
        video.currentTime = pos
      } catch {
        // El navegador aún no permite seek; se queda al inicio.
      }
    }
    if (quiereReproducir.current) {
      quiereReproducir.current = false
      video.play().catch(() => {})
    }
  }

  function alPausa(e: SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget
    if (!seleccion || video.ended) return
    const dur = video.duration
    if (Number.isFinite(dur) && video.currentTime >= dur - 0.4) return
    if (video.currentTime < 1) return
    if (isCompleted(progresoRef.current, seleccion.id)) return
    const siguiente = savePosition(seleccion.id, video.currentTime)
    progresoRef.current = siguiente
    setProgreso(siguiente)
  }

  function alTiempo(e: SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget
    if (!seleccion || video.ended) return
    if (isCompleted(progresoRef.current, seleccion.id)) return
    const t = video.currentTime
    if (t < 1 || Math.abs(t - ultimoGuardado.current) < 3) return
    ultimoGuardado.current = t
    const siguiente = savePosition(seleccion.id, t)
    progresoRef.current = siguiente
    setProgreso(siguiente)
  }

  function alTerminar() {
    if (!seleccion) return
    const antes = lista.every((c) => isCompleted(progresoRef.current, c.id))
    const siguiente = markCompleted(seleccion.id)
    progresoRef.current = siguiente
    setProgreso(siguiente)
    emitir('capsula_completa', seleccion)
    const ahora = lista.every((c) => isCompleted(siguiente, c.id))
    if (ahora && !antes) emitir('capsulas_manual_completo', seleccion)
    if (proxima) setOverlay({ tipo: 'siguiente', siguienteId: proxima.id, segundos: 5 })
    else setOverlay({ tipo: 'fin' })
  }

  async function compartir(capsula: CapsulaItem) {
    const url = `https://www.airnation.online/virus3?capsula=${encodeURIComponent(capsula.id)}`
    const title = `Cápsula ${capsula.numero} · ${capsula.titulo}`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
        return
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setAvisoCopia('Link copiado')
    } catch {
      setAvisoCopia('No se pudo copiar')
    }
    if (copiaTimer.current != null) window.clearTimeout(copiaTimer.current)
    copiaTimer.current = window.setTimeout(() => setAvisoCopia(null), 2000)
  }

  const siguienteOverlay = overlay?.tipo === 'siguiente'
    ? lista.find((c) => c.id === overlay.siguienteId)
    : null

  return (
    <section
      id="capsulas"
      className="relative w-full scroll-mt-20 bg-[#0a0a0a] py-16 text-white md:py-24"
      aria-labelledby="capsulas-titulo"
      style={{ ['--nav-h' as string]: '56px' }}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-6 text-center md:mb-14">
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
          <h2
            id="capsulas-titulo"
            className="mt-3 text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}
          >
            {titulo}
          </h2>
          {config.descripcion?.trim() ? (
            <p
              className="mx-auto mt-4 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/65 lg:line-clamp-none md:text-base"
              style={{ fontFamily: 'Lato, sans-serif' }}
            >
              {config.descripcion}
            </p>
          ) : null}

          {lista.length > 0 ? (
            <div className="mx-auto mt-6 max-w-md">
              <div
                className="mb-2 flex items-center justify-between gap-3 text-[0.65rem] tracking-[0.22em]"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
              >
                <span>PROGRESO {hechas}/{lista.length}</span>
                <span className="shrink-0" style={todasHechas ? { color: '#CC4B37' } : undefined}>
                  {todasHechas ? 'MANUAL COMPLETO ✓' : `${porcentaje}%`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/10" aria-hidden>
                <div className="h-full bg-[#CC4B37]" style={{ width: `${porcentaje}%` }} />
              </div>
              <p className="sr-only">{porcentaje}% del manual completado</p>
              {notaProgreso ? (
                <p className="mt-2 truncate text-[11px] text-white/45" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {notaProgreso}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {lista.length === 0 ? (
          <p className="text-center text-sm text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
            Cápsulas próximamente
          </p>
        ) : (
          <div className="lg:grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start lg:gap-10">
            <div
              id="capsula-reproductor"
              className="w-full min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:max-w-[380px] lg:self-start"
            >
              {seleccion ? (
                <>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <p
                      className="min-w-0 truncate text-sm tracking-[0.12em]"
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}
                    >
                      CÁPSULA <span style={{ color: acento(seleccion.color) }}>{seleccion.numero}</span>
                      {seleccion.titulo?.trim() ? ` · ${seleccion.titulo}` : ''}
                    </p>
                    <span
                      className="shrink-0 text-[11px] tracking-[0.16em] text-white/45"
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                    >
                      {String(indice + 1).padStart(2, '0')}/{lista.length}
                    </span>
                  </div>
                  <div className="relative mx-auto w-fit max-w-full bg-black">
                    {listo ? (
                      <video
                        key={seleccion.id}
                        src={seleccion.video_url.trim()}
                        poster={seleccion.poster_url?.trim() || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        className="mx-auto aspect-[9/16] h-[calc(100svh-var(--nav-h)-8rem)] min-h-[320px] w-auto max-w-full bg-black object-contain lg:h-auto lg:max-h-[calc(100vh-10rem)] lg:w-full"
                        onPlay={() => emitir('capsula_play', seleccion)}
                        onPause={alPausa}
                        onTimeUpdate={alTiempo}
                        onLoadedMetadata={alMetadata}
                        onEnded={alTerminar}
                      />
                    ) : (
                      <div className="mx-auto aspect-[9/16] h-[calc(100svh-var(--nav-h)-8rem)] min-h-[320px] w-auto max-w-full bg-black lg:h-auto lg:max-h-[calc(100vh-10rem)] lg:w-full" />
                    )}
                    {overlay ? (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center" role="status" aria-live="polite">
                        {overlay.tipo === 'siguiente' && siguienteOverlay ? (
                          <>
                            <p className="text-sm tracking-[0.18em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}>
                              CÁPSULA COMPLETA ✓
                            </p>
                            <p className="text-sm text-white/80" style={{ fontFamily: 'Lato, sans-serif' }}>
                              Siguiente: {siguienteOverlay.numero} · {siguienteOverlay.titulo}
                            </p>
                            <p className="text-3xl" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}>
                              {overlay.segundos}
                            </p>
                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                className={`bg-[#CC4B37] px-4 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                                onClick={() => elegir(overlay.siguienteId, { reproducir: true })}
                              >
                                Ver ahora
                              </button>
                              <button
                                type="button"
                                className={`border border-white/40 px-4 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                                onClick={() => setOverlay(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-lg tracking-[0.14em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900 }}>
                              ¡MANUAL COMPLETO!
                            </p>
                            {hayCta ? (
                              <a
                                href={ctaLink}
                                className={`bg-[#CC4B37] px-4 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                              >
                                {ctaTexto}
                              </a>
                            ) : null}
                            <button
                              type="button"
                              className={`border border-white/40 px-4 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                              onClick={() => setOverlay(null)}
                            >
                              Cerrar
                            </button>
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                  {seleccion.descripcion?.trim() ? (
                    <p
                      className="mt-3 hidden text-sm leading-relaxed text-white/70 lg:block"
                      style={{ fontFamily: 'Lato, sans-serif' }}
                    >
                      {seleccion.descripcion}
                    </p>
                  ) : null}
                  <div className="mt-3 grid h-11 grid-cols-3 border border-white/25">
                    <button
                      type="button"
                      disabled={!anterior}
                      className={`border-r border-white/25 text-[10px] tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`}
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                      onClick={() => anterior && elegir(anterior.id)}
                    >
                      {anterior ? `‹ ${anterior.numero}` : '‹'}
                    </button>
                    <button
                      type="button"
                      className={`border-r border-white/25 text-[10px] tracking-[0.14em] ${FOCUS}`}
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                      onClick={() => compartir(seleccion)}
                    >
                      {avisoCopia ?? 'COMPARTIR'}
                    </button>
                    <button
                      type="button"
                      disabled={!proxima}
                      className={`text-[10px] tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`}
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                      onClick={() => proxima && elegir(proxima.id)}
                    >
                      {proxima ? `${proxima.numero} ›` : '›'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-6 min-w-0 lg:mt-0 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1">
              <ol>
                {lista.map((c) => (
                  <CapsulaFila
                    key={c.id}
                    capsula={c}
                    progreso={progreso}
                    activa={seleccion?.id === c.id}
                    onElegir={() => {
                      const movil = window.matchMedia('(max-width: 1023px)').matches
                      if (movil) elegir(c.id, { scrollJugador: true, soloMovil: true, reproducir: true })
                      else elegir(c.id, { reproducir: true })
                    }}
                  />
                ))}
              </ol>
              <p className="mt-4 text-center">
                <button
                  type="button"
                  onClick={reiniciar}
                  className={`text-[11px] text-white/45 underline decoration-white/30 underline-offset-2 hover:text-white ${FOCUS}`}
                  style={{ fontFamily: 'Lato, sans-serif' }}
                >
                  Reiniciar progreso
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function CapsulaFila({
  capsula,
  progreso,
  activa,
  onElegir,
}: {
  capsula: CapsulaItem
  progreso: CapsulasProgress
  activa: boolean
  onElegir: () => void
}) {
  const color = acento(capsula.color)
  const completa = isCompleted(progreso, capsula.id)
  const pos = progreso.p[capsula.id] ?? 0
  const enProgreso = !completa && pos > 0
  const pct = capsula.duracion_seg > 0 ? Math.min(100, Math.round((pos / capsula.duracion_seg) * 100)) : null
  const estado = completa ? 'Completa' : enProgreso ? 'En progreso' : 'Nueva'
  const duracion = capsula.duracion_seg > 0 ? formatearDuracion(capsula.duracion_seg) : ''
  const poster = capsula.poster_url?.trim() || ''

  return (
    <li>
      <button
        type="button"
        aria-current={activa ? 'true' : undefined}
        aria-label={`Cápsula ${capsula.numero}: ${capsula.titulo}. ${estado}${activa ? '. Reproduciendo' : ''}`}
        onClick={onElegir}
        className={`relative flex min-h-[64px] w-full items-center gap-3 border-b border-l-2 border-white/10 px-3 py-3 text-left ${FOCUS} ${
          activa ? 'bg-white/[0.04]' : ''
        }`}
        style={{
          borderLeftColor: activa ? color : 'transparent',
          opacity: completa ? 0.7 : 1,
        }}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden bg-[#1a1a1a]">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          {poster ? <span className="absolute inset-0 bg-black/45" aria-hidden /> : null}
          <span
            className="relative text-base"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, color }}
          >
            {capsula.numero}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-[13px] uppercase"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            {capsula.titulo}
          </span>
          <span className="block text-[11px] text-white/45" style={{ fontFamily: 'Lato, sans-serif' }}>
            {duracion ? `${duracion} · ${estado}` : estado}
          </span>
          {activa && capsula.descripcion?.trim() ? (
            <span className="mt-1 line-clamp-2 block text-xs text-white/60" style={{ fontFamily: 'Lato, sans-serif' }}>
              {capsula.descripcion}
            </span>
          ) : null}
        </span>
        {activa ? (
          <span className="shrink-0 text-sm" style={{ color }} aria-hidden>
            ▶
          </span>
        ) : completa ? (
          <span className="shrink-0 text-sm text-white/50" aria-hidden>
            ✓
          </span>
        ) : null}
        {enProgreso && pct != null ? (
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10" aria-hidden>
            <span className="block h-full" style={{ width: `${pct}%`, background: color }} />
          </span>
        ) : null}
      </button>
    </li>
  )
}
