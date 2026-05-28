'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ManualConfig, ManualTab, ManualRegla } from '../lib/types'

export function ManualSection({ config }: { config: ManualConfig }) {
  const tabs: ManualTab[] = (() => {
    if (config.tabs && config.tabs.length > 0) return config.tabs
    if (config.reglas && config.reglas.length > 0) {
      return [
        {
          nombre: 'GENERAL',
          reglas: config.reglas.map((r) => ({ tipo: 'texto' as const, contenido: r })),
        },
      ]
    }
    return []
  })()

  const [activeIndex, setActiveIndex] = useState(0)
  const [typedTabs, setTypedTabs] = useState<Set<number>>(new Set())

  const handleTabClick = (index: number) => {
    setTypedTabs((prev) => new Set(prev).add(activeIndex))
    setActiveIndex(index)
  }

  return (
    <section
      data-section="manual"
      className="relative w-full overflow-x-hidden bg-[#EFE9D9] py-16 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.65\' numOctaves=\'3\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-8 md:mb-10"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.eyebrow || 'MANUAL DE CAMPO'}
          </p>
          <h2
            className="mt-3 text-3xl leading-none text-[#1a1a1a] sm:text-4xl md:text-5xl lg:text-6xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {config.titulo || 'REGLAS BÁSICAS'}
          </h2>
        </motion.div>

        {tabs.length === 0 ? (
          <div className="border border-[#D4C9A8] bg-[#FAF5E8] py-16 text-center">
            <p
              className="text-sm uppercase tracking-[0.2em] text-[#8b7e57]"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            >
              Reglas pendientes de publicar
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative z-10 flex flex-wrap gap-1 px-2 md:gap-1.5 md:px-4">
              {tabs.map((tab, i) => {
                const isActive = i === activeIndex
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleTabClick(i)}
                    className={`relative -mb-px flex max-w-full flex-col items-start gap-0.5 border border-b-0 px-2 py-1.5 text-left transition-all md:gap-1 md:px-5 md:py-2.5 ${
                      isActive
                        ? 'z-20 border-[#D4C9A8] bg-[#FAF5E8]'
                        : 'border-[#D4C9A8]/50 bg-[#E5DCC4] hover:bg-[#EAE2CC]'
                    }`}
                    style={{
                      borderTopLeftRadius: '4px',
                      borderTopRightRadius: '4px',
                    }}
                  >
                    <span
                      className={`text-[7px] tracking-[0.18em] md:text-[9px] ${
                        isActive ? 'text-[#CC4B37]' : 'text-[#8b7e57]'
                      }`}
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontWeight: 700,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`break-words text-[9px] uppercase tracking-[0.08em] md:text-[12px] md:tracking-[0.12em] ${
                        isActive ? 'text-[#1a1a1a]' : 'text-[#8b7e57]'
                      }`}
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontWeight: 700,
                      }}
                    >
                      {tab.nombre}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="relative bg-[#FAF5E8] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, rgba(212,201,168,0.5) 39px, rgba(212,201,168,0.5) 40px)',
                  backgroundPosition: '0 24px',
                }}
              />

              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-[38px] top-0 w-px bg-[#CC4B37] md:left-[52px]"
              />

              <div className="pointer-events-none absolute left-[10px] top-0 flex h-full flex-col justify-around md:left-[14px]">
                <span className="block h-3 w-3 rounded-full border border-[#D4C9A8] bg-[#EFE9D9] md:h-4 md:w-4" />
                <span className="block h-3 w-3 rounded-full border border-[#D4C9A8] bg-[#EFE9D9] md:h-4 md:w-4" />
                <span className="block h-3 w-3 rounded-full border border-[#D4C9A8] bg-[#EFE9D9] md:h-4 md:w-4" />
              </div>

              <div className="relative flex items-start justify-between border-b border-[#D4C9A8]/50 px-5 py-4 pl-[52px] md:px-8 md:pl-[72px]">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.15em] text-[#8b7e57] md:text-[12px]"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                  >
                    SECCIÓN {String(activeIndex + 1).padStart(2, '0')} /{' '}
                    {String(tabs.length).padStart(2, '0')}
                  </p>
                  {tabs[activeIndex]?.descripcion ? (
                    <p
                      className="mt-1 text-[11px] text-[#8b7e57] md:text-[13px]"
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                    >
                      {tabs[activeIndex].descripcion}
                    </p>
                  ) : null}
                </div>
                <p
                  className="text-right text-[9px] uppercase tracking-[0.15em] text-[#8b7e57] md:text-[10px]"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                >
                  DOC. KURSK-II
                  <br />
                  CLASIF. CONFIDENCIAL
                  <br />
                  ED. 2026
                </p>
              </div>

              <div className="relative min-h-[300px] px-5 py-8 pl-[52px] md:px-8 md:py-10 md:pl-[72px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <h3
                      className="mb-6 text-2xl uppercase text-[#1a1a1a] md:text-3xl"
                      style={{
                        fontFamily: 'Jost, sans-serif',
                        fontWeight: 900,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {tabs[activeIndex]?.nombre}
                    </h3>
                    <div className="space-y-3 md:space-y-4">
                      {(tabs[activeIndex]?.reglas ?? []).map((regla, i) => (
                        <ReglaRender
                          key={`${activeIndex}-${i}`}
                          regla={regla}
                          numero={String(i + 1).padStart(2, '0')}
                          shouldType={!typedTabs.has(activeIndex)}
                        />
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative border-t border-[#D4C9A8]/50 px-5 py-3 pl-[52px] md:px-8 md:pl-[72px]">
                <p
                  className="text-[9px] uppercase tracking-[0.2em] text-[#8b7e57] md:text-[10px]"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                >
                  Toloks Club Airsoft · XIII Aniversario · pág{' '}
                  {String(activeIndex + 1).padStart(2, '0')} /{' '}
                  {String(tabs.length).padStart(2, '0')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function ReglaRender({
  regla,
  numero,
  shouldType,
}: {
  regla: ManualRegla
  numero: string
  shouldType: boolean
}) {
  if (regla.tipo === 'tabla') {
    return <TablaRender contenido={regla.contenido} />
  }
  return <ReglaTexto numero={numero} texto={regla.contenido} shouldType={shouldType} />
}

function ReglaTexto({
  numero,
  texto,
  shouldType,
}: {
  numero: string
  texto: string
  shouldType: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState(shouldType ? '' : texto)
  const [started, setStarted] = useState(!shouldType)

  useEffect(() => {
    if (!shouldType) {
      setTyped(texto)
      setStarted(true)
      return
    }
    setTyped('')
    setStarted(false)
  }, [texto, shouldType])

  useEffect(() => {
    if (!shouldType || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true)
          }
        })
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started, shouldType])

  useEffect(() => {
    if (!shouldType || !started || !texto.length) return
    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setTyped(texto.slice(0, i))
      if (i >= texto.length) clearInterval(interval)
    }, 12)
    return () => clearInterval(interval)
  }, [started, texto, shouldType])

  return (
    <div
      ref={ref}
      className="flex items-baseline gap-3 md:gap-4"
      style={{ minHeight: '28px' }}
    >
      <span
        className="shrink-0 text-base text-[#CC4B37] md:text-lg"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontWeight: 700,
        }}
      >
        {numero}
      </span>
      <span
        className="shrink-0 select-none text-[#D4C9A8]"
        style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      >
        ····
      </span>
      <p
        className="text-sm leading-relaxed text-[#1a1a1a] md:text-base"
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}
      >
        {typed}
        {shouldType && started && typed.length < texto.length ? (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-[#CC4B37] align-middle" />
        ) : null}
      </p>
    </div>
  )
}

function TablaRender({ contenido }: { contenido: string }) {
  const filas = contenido
    .trim()
    .split('\n')
    .map((linea) => linea.split('|').map((c) => c.trim()))
    .filter((f) => f.length > 0 && f.some((c) => c.length > 0))

  if (filas.length === 0) return null

  const header = filas[0]
  const body = filas.slice(1)

  return (
    <div className="my-2 overflow-x-auto border border-[#D4C9A8] bg-[#FAF5E8]">
      <table className="w-full text-[11px] md:text-[13px]">
        <thead>
          <tr className="border-b border-[#D4C9A8] bg-[#EFE9D9]">
            {header.map((celda, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left uppercase tracking-[0.08em] text-[#CC4B37] md:px-4"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontWeight: 700,
                }}
              >
                {celda}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((fila, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-[#F4EDD8]/40'}>
              {fila.map((celda, j) => (
                <td
                  key={j}
                  className="border-t border-[#D4C9A8]/40 px-3 py-2 text-[#1a1a1a] md:px-4"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontWeight: 500,
                  }}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
