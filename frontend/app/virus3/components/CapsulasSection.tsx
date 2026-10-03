'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import type { CapsulaItem, CapsulasConfig } from '../lib/types'
import {
  isCompleted,
  readProgress,
  resetProgress,
  type CapsulasProgress,
} from '../lib/progreso-capsulas'
import { GridCapsulas } from './capsulas/GridCapsulas'
import { ProgresoSegmentado } from './capsulas/ProgresoSegmentado'
import { ReproductorInmersivo } from './capsulas/ReproductorInmersivo'
import { RielCapsulas } from './capsulas/RielCapsulas'
import { TarjetaSiguiente } from './capsulas/TarjetaSiguiente'
import {
  PROGRESO_VACIO,
  FOCUS,
  capsulasVisibles,
  decodificar,
  enlaceSeguro,
  prefiereQuieto,
  scrollA,
  sincronizarUrl,
} from './capsulas/helpers'
const LAYOUT_PREFIX = 'capsula-reel'

export function CapsulasSection({ config }: { config: CapsulasConfig }) {
  const lista = useMemo(() => capsulasVisibles(config), [config])

  const [progreso, setProgreso] = useState<CapsulasProgress>(PROGRESO_VACIO)
  const [destacadaId, setDestacadaId] = useState<string>(lista[0]?.id ?? '')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [playerMontado, setPlayerMontado] = useState(false)
  const [reproductorId, setReproductorId] = useState<string>(lista[0]?.id ?? '')
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const [listo, setListo] = useState(false)
  const [pulsarTarjeta, setPulsarTarjeta] = useState(false)
  const [avisoCopia, setAvisoCopia] = useState<string | null>(null)
  const [esDesktop, setEsDesktop] = useState(false)

  const quierePlay = useRef(false)
  const copiaTimer = useRef<number | null>(null)
  const progresoRef = useRef(progreso)
  progresoRef.current = progreso

  const hechas = lista.filter((c) => isCompleted(progreso, c.id)).length
  const porcentaje = lista.length ? Math.round((hechas / lista.length) * 100) : 0
  const primeraAbierta = lista.find((c) => !isCompleted(progreso, c.id)) ?? null
  const todasHechas = lista.length > 0 && primeraAbierta === null

  const destacada =
    lista.find((c) => c.id === destacadaId) ??
    primeraAbierta ??
    lista[0] ??
    null

  const ctaTexto = config.cta_final_texto?.trim() || ''
  const ctaLink = config.cta_final_link?.trim() || ''
  const hayCta = Boolean(ctaTexto && ctaLink && enlaceSeguro(ctaLink))
  const eyebrow = config.eyebrow?.trim() || 'MANUAL DEL OPERADOR'
  const titulo = config.titulo?.trim() || 'CÁPSULAS'
  const notaProgreso = config.nota_progreso?.trim() || ''
  const [quieto, setQuieto] = useState(true)

  useEffect(() => {
    setQuieto(prefiereQuieto())
  }, [])

  useEffect(() => {
    return () => {
      if (copiaTimer.current != null) window.clearTimeout(copiaTimer.current)
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => setEsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
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
      setDestacadaId(pedido)
      setReproductorId(pedido)
      scrollA('capsulas')
      if (hashId === pedido) sincronizarUrl(pedido)
      setPulsarTarjeta(true)
      window.setTimeout(() => setPulsarTarjeta(false), 1400)
    } else {
      const pendiente = lista.find((c) => !isCompleted(actual, c.id)) ?? lista[0]
      if (pendiente) {
        setDestacadaId(pendiente.id)
        setReproductorId(pendiente.id)
      }
    }
    setListo(true)
  }, [lista])

  const abrirReproductor = useCallback((id: string, rect: DOMRect) => {
    quierePlay.current = true
    setReproductorId(id)
    setDestacadaId(id)
    setOriginRect(rect)
    setPlayerMontado(true)
    setModalAbierto(true)
    sincronizarUrl(id)
  }, [])

  const cerrarReproductor = useCallback(() => {
    setModalAbierto(false)
    quierePlay.current = false
  }, [])

  const alSalirReproductor = useCallback(() => {
    setPlayerMontado(false)
    setOriginRect(null)
  }, [])

  function reiniciar() {
    if (!window.confirm('¿Reiniciar el progreso de las cápsulas?')) return
    const limpio = resetProgress()
    progresoRef.current = limpio
    setProgreso(limpio)
    const primera = lista[0]
    if (primera) {
      setDestacadaId(primera.id)
      setReproductorId(primera.id)
    }
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

  const EASE_ENTRADA = [0.2, 0.8, 0.2, 1] as const

  const entrada = (delay: number) =>
    quieto
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { duration: 0.45, ease: EASE_ENTRADA, delay },
        }

  if (!listo) {
    return (
      <section id="capsulas" className="relative w-full scroll-mt-[var(--nav-h)] bg-[#0a0a0a] py-10 text-white [--nav-h:56px] md:[--nav-h:64px]" aria-hidden />
    )
  }

  return (
    <LayoutGroup id="virus3-capsulas">
      <section
        id="capsulas"
        className="relative w-full scroll-mt-[var(--nav-h)] bg-[#0a0a0a] py-8 text-white [--nav-h:56px] md:py-10 md:[--nav-h:64px] lg:py-12"
        aria-labelledby="capsulas-titulo"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <motion.div className="text-center" {...entrada(0)}>
            <p
              className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              {eyebrow}
            </p>
            <h2
              id="capsulas-titulo"
              className="mt-2 text-2xl leading-none sm:text-3xl md:text-4xl"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}
            >
              {titulo}
            </h2>
            {config.descripcion?.trim() ? (
              <p
                className="mx-auto mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base lg:line-clamp-none"
                style={{ fontFamily: 'Lato, sans-serif' }}
              >
                {config.descripcion}
              </p>
            ) : null}
          </motion.div>

          {lista.length === 0 ? (
            <p className="mt-8 text-center text-sm text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
              Cápsulas próximamente
            </p>
          ) : (
            <>
              <motion.div className="mt-4" {...entrada(0.06)}>
                <ProgresoSegmentado
                  lista={lista}
                  progreso={progreso}
                  nota={notaProgreso}
                  todasHechas={todasHechas}
                  porcentaje={porcentaje}
                />
              </motion.div>

              <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-8">
                {destacada ? (
                  <motion.div className="flex justify-center lg:justify-start" {...entrada(0.12)}>
                    <TarjetaSiguiente
                      capsula={destacada}
                      progreso={progreso}
                      todasHechas={todasHechas}
                      pulsar={pulsarTarjeta}
                      layoutId={`${LAYOUT_PREFIX}-${destacada.id}`}
                      onAbrir={(rect) => abrirReproductor(destacada.id, rect)}
                    />
                  </motion.div>
                ) : null}

                <motion.div {...entrada(0.18)}>
                  <RielCapsulas
                    lista={lista}
                    progreso={progreso}
                    destacadaId={destacada?.id ?? destacadaId}
                    layoutIdPrefix={LAYOUT_PREFIX}
                    onElegir={abrirReproductor}
                  />
                  <GridCapsulas
                    lista={lista}
                    progreso={progreso}
                    destacadaId={destacada?.id ?? destacadaId}
                    layoutIdPrefix={LAYOUT_PREFIX}
                    onElegir={abrirReproductor}
                  />
                </motion.div>
              </div>

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
            </>
          )}
        </div>
      </section>

      {playerMontado && reproductorId ? (
        <ReproductorInmersivo
          abierto={modalAbierto}
          onSalirAnimacion={alSalirReproductor}
          capsulaId={reproductorId}
          lista={lista}
          progreso={progreso}
          onProgreso={setProgreso}
          onCerrar={cerrarReproductor}
          onCambiarCapsula={(id) => {
            setReproductorId(id)
            setDestacadaId(id)
          }}
          originRect={originRect}
          esDesktop={esDesktop}
          compartir={compartir}
          avisoCopia={avisoCopia}
          hayCta={hayCta}
          ctaTexto={ctaTexto}
          ctaLink={ctaLink}
          layoutIdPrefix={LAYOUT_PREFIX}
          quierePlayRef={quierePlay}
        />
      ) : null}
    </LayoutGroup>
  )
}
