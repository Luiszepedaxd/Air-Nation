'use client'

import { useEffect, useRef, useState } from 'react'
import type { OperativoConfig, OperativoHito } from '../lib/types'
import './operativo-crt.css'

export function OperativoSection({ config }: { config: OperativoConfig }) {
  const hitos = config.hitos ?? []
  const [bootDone, setBootDone] = useState(false)
  const [timestamp, setTimestamp] = useState('')
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setInView(true)
        })
      },
      { threshold: 0.2 }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const t = setTimeout(() => setBootDone(true), 1800)
    return () => clearTimeout(t)
  }, [inView])

  useEffect(() => {
    const update = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      const ss = String(d.getUTCSeconds()).padStart(2, '0')
      setTimestamp(`${hh}:${mm}:${ss}Z`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      ref={sectionRef}
      id="operativo"
      data-section="operativo"
      className="relative w-full bg-[#0a0a0a] py-16 md:py-24"
    >
      {/* Header */}
      <div className="mx-auto mb-10 max-w-5xl px-4 md:mb-14 md:px-8">
        <p
          className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {config.eyebrow || 'OPERATIVO'}
        </p>
        <h2
          className="mt-3 text-4xl leading-none text-white sm:text-5xl md:text-7xl lg:text-8xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          {config.titulo || '12+ HORAS DE COMBATE'}
        </h2>
      </div>

      {/* Tablet frame */}
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="tablet-frame">
          <div className="tablet-camera" />

          <div className="tablet-screen crt-screen min-h-[520px] p-4 text-[12px] leading-[1.7] md:min-h-[640px] md:p-8 md:text-[14px]">
            <div className="crt-scanlines" />
            <div className="crt-vignette" />

            <div className="relative z-10">
              {inView ? (
                <>
                  <BootLine delay={0} text="> BOOTING OPS TERMINAL v2.6..." />
                  <BootLine delay={200} text="> LOAD MISSION: KURSK-II" />
                  <BootLine delay={400} text="> AUTH: TOLOKS_AIRSOFT [VERIFIED]" />
                  <BootLine delay={600} text="> SECTOR: MISNÉBALAM_07" />
                  <BootLine delay={800} text="> WINDOW: 04-05 JUL 2026" />
                  <BootLine
                    delay={1000}
                    text={`> OBJECTIVES: ${String(hitos.length).padStart(2, '0')}`}
                  />
                  <BootLine
                    delay={1200}
                    text="> STATUS: PENDING_DEPLOYMENT"
                    className="crt-amber"
                  />
                  <BootLine delay={1500} text="> READY_" className="crt-cyan" />

                  {bootDone ? (
                    <>
                      <div className="crt-line-enter my-5 border-t border-[#7dd3a8]/20 md:my-7" />

                      <div className="crt-line-enter mb-5 flex flex-col gap-1 md:mb-7 md:flex-row md:items-center md:justify-between">
                        <span className="crt-dim text-[10px] md:text-[12px]">
                          [ T+ {timestamp} ]
                        </span>
                        <span className="crt-dim text-[10px] md:text-[12px]">
                          [ NODE: OPS-MAIN ]
                        </span>
                      </div>

                      <div className="crt-line-enter mb-4 md:mb-5">
                        <span className="crt-prompt">&gt; LIST OBJECTIVES --all</span>
                      </div>

                      <div className="space-y-4 md:space-y-6">
                        {hitos.map((h, i) => (
                          <HitoLine key={`${h.hora}-${h.titulo}-${i}`} hito={h} index={i} />
                        ))}
                      </div>

                      <div className="crt-line-enter mt-7 border-t border-[#7dd3a8]/20 pt-3 md:mt-10 md:pt-4">
                        <p className="crt-dim text-[10px] md:text-[12px]">
                          &gt; END_OF_TRANSMISSION
                        </p>
                        <p className="crt-prompt mt-1 text-[10px] md:text-[12px]">
                          &gt; AWAITING_DEPLOYMENT
                          <span className="crt-cursor" />
                        </p>
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <div className="tablet-led" />
        </div>
      </div>
    </section>
  )
}

function BootLine({
  delay,
  text,
  className = 'crt-prompt',
}: {
  delay: number
  text: string
  className?: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return null
  return (
    <div className="crt-line-enter">
      <span className={`${className} text-[11px] md:text-[13px]`}>{text}</span>
    </div>
  )
}

function HitoLine({ hito, index }: { hito: OperativoHito; index: number }) {
  const [typed, setTyped] = useState('')
  const [started, setStarted] = useState(false)
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAppeared(true), 150 + index * 200)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    if (!appeared) return
    setStarted(true)
    let i = 0
    const interval = setInterval(() => {
      i++
      setTyped(hito.titulo.slice(0, i))
      if (i >= hito.titulo.length) clearInterval(interval)
    }, 25)
    return () => clearInterval(interval)
  }, [appeared, hito.titulo])

  if (!appeared) return null

  const accent = hito.nocturno ? 'crt-cyan' : 'crt-white'

  return (
    <div className="crt-line-enter">
      <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
        <span className={`${accent} font-bold`}>&gt;</span>
        <span className={`${accent} text-[13px] font-bold md:text-[16px]`}>
          {hito.hora}
        </span>
        <span className="crt-dim">::</span>
        <span
          className={`${accent} text-[13px] font-bold uppercase md:text-[16px]`}
        >
          {typed}
          {started && typed.length < hito.titulo.length ? (
            <span className="crt-cursor" />
          ) : null}
        </span>
        {hito.unidad?.trim() ? (
          <span className="crt-amber text-[10px] md:text-[12px]">
            [ {hito.unidad.trim()} ]
          </span>
        ) : null}
      </div>

      {hito.descripcion ? (
        <div className="ml-4 mt-1 md:ml-6">
          <span className="crt-dim text-[11px] md:text-[13px]">
            └ {hito.descripcion}
          </span>
        </div>
      ) : null}

      {hito.nocturno ? (
        <div className="ml-4 mt-1 md:ml-6">
          <span className="crt-cyan text-[9px] tracking-[0.2em] md:text-[10px]">
            ◆ NIGHT_OPS
          </span>
        </div>
      ) : null}
    </div>
  )
}
