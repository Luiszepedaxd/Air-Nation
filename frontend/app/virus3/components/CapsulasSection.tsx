'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react'
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

function CarruselConFade({ firma, children }: { firma: string; children: ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const fadeIzq = useRef<HTMLDivElement>(null)
  const fadeDer = useRef<HTMLDivElement>(null)

  const actualizar = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const alInicio = el.scrollLeft <= 4
    const alFinal = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    if (fadeIzq.current) fadeIzq.current.style.opacity = alInicio ? '0' : '1'
    if (fadeDer.current) fadeDer.current.style.opacity = alFinal ? '0' : '1'
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    actualizar()
    el.addEventListener('scroll', actualizar, { passive: true })
    const ro = new ResizeObserver(actualizar)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', actualizar)
      ro.disconnect()
    }
  }, [actualizar, firma])

  return (
    <div className="relative">
      <div
        ref={fadeIzq}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10"
        style={{ background: 'linear-gradient(to left, transparent, #0a0a0a)', opacity: 0 }}
      />
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div
        ref={fadeDer}
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10"
        style={{ background: 'linear-gradient(to right, transparent, #0a0a0a)', opacity: 0 }}
      />
    </div>
  )
}

export function CapsulasSection({ config }: { config: CapsulasConfig }) {
  const lista = useMemo(() => capsulasVisibles(config), [config])
  const grupos = useMemo(() => {
    const vistos: string[] = []
    for (const c of lista) {
      const grupo = c.grupo?.trim()
      if (grupo && !vistos.includes(grupo)) vistos.push(grupo)
    }
    return vistos
  }, [lista])

  const [progreso, setProgreso] = useState<CapsulasProgress>(PROGRESO_VACIO)
  const [seleccionId, setSeleccionId] = useState<string | null>(lista[0]?.id ?? null)
  const [tab, setTab] = useState('TODAS')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [listo, setListo] = useState(false)
  const [avisoCopia, setAvisoCopia] = useState<string | null>(null)

  const progresoRef = useRef(progreso)
  progresoRef.current = progreso
  const quiereReproducir = useRef(false)
  const ultimoGuardado = useRef(0)
  const copiaTimer = useRef<number | null>(null)

  const tabActual = tab === 'TODAS' || grupos.includes(tab) ? tab : 'TODAS'
  const filtradas = tabActual === 'TODAS' ? lista : lista.filter((c) => c.grupo.trim() === tabActual)
  const seleccion = lista.find((c) => c.id === seleccionId) ?? lista[0] ?? null
  const indice = seleccion ? lista.findIndex((c) => c.id === seleccion.id) : -1
  const anterior = indice > 0 ? lista[indice - 1] : null
  const proxima = indice >= 0 && indice < lista.length - 1 ? lista[indice + 1] : null

  const hechas = lista.filter((c) => isCompleted(progreso, c.id)).length
  const porcentaje = lista.length ? Math.round((hechas / lista.length) * 100) : 0
  const primeraAbierta = lista.find((c) => !isCompleted(progreso, c.id)) ?? null
  const todasHechas = lista.length > 0 && primeraAbierta === null
  const hayProgreso = lista.some((c) => isCompleted(progreso, c.id) || (progreso.p[c.id] ?? 0) > 0)

  const ctaTexto = config.cta_final_texto?.trim() || ''
  const ctaLink = config.cta_final_link?.trim() || ''
  const hayCta = Boolean(ctaTexto && ctaLink && enlaceSeguro(ctaLink))
  const eyebrow = config.eyebrow?.trim() || 'MANUAL DEL OPERADOR'
  const titulo = config.titulo?.trim() || 'CÁPSULAS'

  useEffect(() => {
    return () => {
      if (copiaTimer.current != null) window.clearTimeout(copiaTimer.current)
    }
  }, [])

  useEffect(() => {
    setProgreso(readProgress())
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
    }
    setListo(true)
  }, [lista])

  useEffect(() => {
    ultimoGuardado.current = 0
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
    if (!opts.soloMovil || movil) scrollA('capsula-reproductor')
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

  function cuenta(grupo: string | null): string {
    const subset = grupo ? lista.filter((c) => c.grupo.trim() === grupo) : lista
    const n = subset.filter((c) => isCompleted(progreso, c.id)).length
    return `${n}/${subset.length}`
  }

  const pestanas = [{ id: 'TODAS', label: `TODAS ${cuenta(null)}` }].concat(
    grupos.map((grupo) => ({ id: grupo, label: `${grupo} ${cuenta(grupo)}` }))
  )

  function onTeclaTab(e: KeyboardEvent<HTMLButtonElement>, indiceTab: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const ultimo = pestanas.length - 1
    const siguiente =
      e.key === 'ArrowRight'
        ? (indiceTab + 1) % pestanas.length
        : e.key === 'ArrowLeft'
          ? (indiceTab - 1 + pestanas.length) % pestanas.length
          : e.key === 'Home'
            ? 0
            : ultimo
    setTab(pestanas[siguiente].id)
    document.getElementById(`capsula-tab-${siguiente}`)?.focus()
  }

  const siguienteOverlay = overlay?.tipo === 'siguiente'
    ? lista.find((c) => c.id === overlay.siguienteId)
    : null

  return (
    <section id="capsulas" className="relative w-full scroll-mt-20 bg-[#0a0a0a] py-16 text-white md:py-24" aria-labelledby="capsulas-titulo">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 text-center md:mb-14">
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
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base" style={{ fontFamily: 'Lato, sans-serif' }}>
              {config.descripcion}
            </p>
          ) : null}

          {lista.length > 0 ? (
            <div className="mx-auto mt-8 max-w-md text-left">
              <div className="mb-2 flex items-center justify-between text-[0.65rem] tracking-[0.22em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
                <span>PROGRESO {hechas}/{lista.length}</span>
                <span>{porcentaje}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10" aria-hidden>
                <div className="h-full bg-[#CC4B37]" style={{ width: `${porcentaje}%` }} />
              </div>
              <p className="sr-only">{porcentaje}% del manual completado</p>
            </div>
          ) : null}

          <p className="mx-auto mt-3 max-w-md text-xs text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
            {config.nota_progreso?.trim() ? <span>{config.nota_progreso.trim()} </span> : null}
            <button type="button" onClick={reiniciar} className={`underline decoration-white/30 underline-offset-2 hover:text-white ${FOCUS}`}>
              Reiniciar progreso
            </button>
          </p>

          {lista.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {todasHechas ? (
                <>
                  <span
                    className="border border-[#CC4B37] px-4 py-3 text-[11px] tracking-[0.16em] text-[#CC4B37]"
                    style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                  >
                    MANUAL COMPLETO ✓
                  </span>
                  <button
                    type="button"
                    className={`border border-white/40 px-5 py-3 text-[11px] tracking-[0.14em] hover:border-white ${FOCUS}`}
                    style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                    onClick={() => elegir(lista[0].id, { scrollJugador: true })}
                  >
                    VER DE NUEVO
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={`bg-[#CC4B37] px-5 py-3 text-[11px] tracking-[0.14em] text-white hover:opacity-90 ${FOCUS}`}
                  style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800 }}
                  onClick={() => {
                    const destino = hayProgreso && primeraAbierta ? primeraAbierta : lista[0]
                    elegir(destino.id, { scrollJugador: true })
                  }}
                >
                  {hayProgreso && primeraAbierta
                    ? `▶ CONTINUAR: ${primeraAbierta.numero} · ${primeraAbierta.titulo}`
                    : `▶ EMPEZAR POR LA ${lista[0].numero}`}
                </button>
              )}
            </div>
          ) : null}
        </div>

        {lista.length === 0 ? (
          <p className="text-center text-sm text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
            Cápsulas próximamente
          </p>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Grupos de cápsulas"
              className="mb-8 flex gap-1 overflow-x-auto border-b border-white/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {pestanas.map((pestana, i) => {
                const activa = pestana.id === tabActual
                return (
                  <button
                    key={pestana.id}
                    id={`capsula-tab-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={activa}
                    tabIndex={activa ? 0 : -1}
                    className={`shrink-0 border-b-2 px-3 py-2 text-[10px] tracking-[0.16em] ${FOCUS} ${
                      activa ? 'border-[#CC4B37] text-white' : 'border-transparent text-white/45 hover:text-white'
                    }`}
                    style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                    onClick={() => setTab(pestana.id)}
                    onKeyDown={(e) => onTeclaTab(e, i)}
                  >
                    {pestana.label}
                  </button>
                )
              })}
            </div>

            <div className="lg:grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start lg:gap-10">
              <div id="capsula-reproductor" className="mx-auto w-full max-w-[380px] scroll-mt-24 lg:sticky lg:top-24 lg:mx-0 lg:self-start">
                {seleccion ? (
                  <>
                    <p
                      className="mb-3 text-sm tracking-[0.12em] md:text-base"
                      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}
                    >
                      CÁPSULA <span style={{ color: acento(seleccion.color) }}>{seleccion.numero}</span>
                      {seleccion.titulo?.trim() ? ` · ${seleccion.titulo}` : ''}
                    </p>
                    <div className="relative bg-black">
                      {listo ? (
                        <video
                          key={seleccion.id}
                          src={seleccion.video_url.trim()}
                          poster={seleccion.poster_url?.trim() || undefined}
                          controls
                          playsInline
                          preload="metadata"
                          className="aspect-[9/16] max-h-[80vh] w-full bg-black object-contain"
                          onPlay={() => emitir('capsula_play', seleccion)}
                          onPause={alPausa}
                          onTimeUpdate={alTiempo}
                          onLoadedMetadata={alMetadata}
                          onEnded={alTerminar}
                        />
                      ) : (
                        <div className="aspect-[9/16] max-h-[80vh] w-full bg-black" />
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
                      <p className="mt-3 text-sm leading-relaxed text-white/70" style={{ fontFamily: 'Lato, sans-serif' }}>
                        {seleccion.descripcion}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!anterior}
                        className={`border border-white/25 px-3 py-2 text-[10px] tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`}
                        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                        onClick={() => anterior && elegir(anterior.id)}
                      >
                        ← Anterior
                      </button>
                      <button
                        type="button"
                        disabled={!proxima}
                        className={`border border-white/25 px-3 py-2 text-[10px] tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-30 ${FOCUS}`}
                        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                        onClick={() => proxima && elegir(proxima.id)}
                      >
                        Siguiente →
                      </button>
                      <button
                        type="button"
                        className={`border border-white/25 px-3 py-2 text-[10px] tracking-[0.14em] ${FOCUS}`}
                        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
                        onClick={() => compartir(seleccion)}
                      >
                        {avisoCopia ?? 'Compartir'}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="mt-8 lg:mt-0">
                <div className="lg:hidden">
                  <CarruselConFade firma={filtradas.map((c) => c.id).join('|')}>
                    {filtradas.map((c) => (
                      <CapsulaCard
                        key={c.id}
                        capsula={c}
                        progreso={progreso}
                        activa={seleccion?.id === c.id}
                        className="w-[78vw] max-w-[260px] shrink-0 snap-start"
                        onElegir={() => elegir(c.id, { scrollJugador: true, soloMovil: true })}
                      />
                    ))}
                  </CarruselConFade>
                </div>
                <div className="hidden max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-y-auto pr-1 lg:flex">
                  {filtradas.map((c) => (
                    <CapsulaCard
                      key={c.id}
                      capsula={c}
                      progreso={progreso}
                      activa={seleccion?.id === c.id}
                      className="w-full shrink-0"
                      onElegir={() => elegir(c.id)}
                    />
                  ))}
                </div>
                {filtradas.length === 0 ? (
                  <p className="text-sm text-white/45" style={{ fontFamily: 'Lato, sans-serif' }}>
                    No hay cápsulas en este grupo.
                  </p>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function CapsulaCard({
  capsula,
  progreso,
  activa,
  className,
  onElegir,
}: {
  capsula: CapsulaItem
  progreso: CapsulasProgress
  activa: boolean
  className?: string
  onElegir: () => void
}) {
  const color = acento(capsula.color)
  const completa = isCompleted(progreso, capsula.id)
  const pos = progreso.p[capsula.id] ?? 0
  const enProgreso = !completa && pos > 0
  const pct = capsula.duracion_seg > 0 ? Math.min(100, Math.round((pos / capsula.duracion_seg) * 100)) : null
  const estado = completa ? 'Completa' : enProgreso ? 'En progreso' : 'Nueva'
  const duracion = capsula.duracion_seg > 0 ? formatearDuracion(capsula.duracion_seg) : ''

  return (
    <button
      type="button"
      aria-pressed={activa}
      aria-label={`Cápsula ${capsula.numero}: ${capsula.titulo}. ${estado}${activa ? '. Reproduciendo' : ''}`}
      onClick={onElegir}
      className={`border-2 bg-[#1a1a1a] p-4 text-left ${FOCUS} ${className ?? ''}`}
      style={{ borderColor: activa ? color : '#2a2a2a', opacity: completa ? 0.75 : 1 }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-4xl leading-none" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, color }}>
          {capsula.numero}
        </span>
        {completa ? (
          <span className="px-2 py-1 text-[9px] tracking-[0.14em] text-white" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, background: color }}>
            COMPLETA ✓
          </span>
        ) : enProgreso ? (
          <span className="text-[9px] tracking-[0.14em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, color }}>
            EN PROGRESO{pct != null ? ` ${pct}%` : ''}
          </span>
        ) : (
          <span className="border border-white/15 px-2 py-1 text-[9px] tracking-[0.14em] text-white/45" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
            NUEVA
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-snug" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}>
        {capsula.titulo}
      </p>
      <p className="mt-2 text-[10px] tracking-[0.18em] text-white/45" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
        {capsula.grupo?.trim() ? capsula.grupo.trim() : 'SIN GRUPO'}
        {duracion ? ` · ${duracion}` : ''}
      </p>
      {activa ? (
        <p className="mt-3 text-[10px] tracking-[0.16em]" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, color }}>
          ▶ REPRODUCIENDO
        </p>
      ) : null}
      {enProgreso && pct != null ? (
        <div className="mt-3 h-1 w-full bg-white/10" aria-hidden>
          <div className="h-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      ) : null}
    </button>
  )
}
