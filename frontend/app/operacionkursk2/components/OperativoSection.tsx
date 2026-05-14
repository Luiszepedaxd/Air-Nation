'use client'

import { useEffect, useRef, useState } from 'react'
import type { OperativoConfig, OperativoHito } from '../lib/types'
import './operativo-crt.css'

export function OperativoSection({ config }: { config: OperativoConfig }) {
  const hitos = config.hitos ?? []
  const [bootDone, setBootDone] = useState(false)
  const [timestamp, setTimestamp] = useState('')
  const [glitch, setGlitch] = useState(false)
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
    const t = setTimeout(() => setBootDone(true), 2200)
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

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.5) {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 280)
      }
    }, 5500)
    return () => clearInterval(id)
  }, [])

  const objectivesPadded = String(hitos.length).padStart(2, '0')

  return (
    <section
      ref={sectionRef}
      id="operativo"
      data-section="operativo"
      className="relative w-full bg-black py-16 md:py-24"
    >
      <div className="mx-auto mb-8 max-w-5xl px-4 md:mb-12 md:px-8">
        <p
          className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {config.eyebrow || 'OPERATIVO'}
        </p>
        <h2
          className="mt-3 text-4xl leading-none text-white sm:text-5xl md:text-7xl lg:text-8xl"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, letterSpacing: '-0.02em' }}
        >
          {config.titulo || '12+ HORAS DE COMBATE'}
        </h2>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="crt-screen crt-flicker relative min-h-[600px] p-5 text-[13px] leading-[1.7] md:min-h-[700px] md:p-10 md:text-[15px]">
          <div className="crt-scanlines" />
          <div className="crt-sweep" />
          <div className="crt-vignette" />

          <div className={`relative z-10 ${glitch ? 'crt-glitch' : ''}`}>
            {inView ? (
              <>
                <BootLine delay={0} text="> BOOTING TACTICAL OPS TERMINAL v2.6..." />
                <BootLine delay={250} text="> LOADING MISSION_PROFILE: KURSK-II" />
                <BootLine delay={500} text="> AUTH: TOLOKS_CLUB_AIRSOFT [VERIFIED]" />
                <BootLine delay={750} text="> SECTOR: MISNÉBALAM_07 [LOCKED]" />
                <BootLine delay={1000} text="> WINDOW: 04-05 JUL 2026" />
                <BootLine delay={1250} text={`> OBJECTIVES_LOADED: ${objectivesPadded}`} />
                <BootLine delay={1500} text="> STATUS: PENDING_DEPLOYMENT" className="crt-amber" />
                <BootLine delay={1900} text="> READY_" className="crt-cyan" />

                {bootDone ? (
                  <>
                    <div className="crt-line-enter my-5 w-full border-t border-[#4ade80]/30 md:my-7" />

                    <div className="crt-line-enter mb-5 flex flex-col gap-1 md:mb-7 md:flex-row md:items-center md:justify-between">
                      <span className="crt-dim text-[11px] md:text-[13px]">
                        [ TIMESTAMP ] T+ {timestamp}
                      </span>
                      <span className="crt-dim text-[11px] md:text-[13px]">
                        [ NODE ] OPS-MAIN
                      </span>
                    </div>

                    <div className="crt-line-enter mb-3 md:mb-5">
                      <span className="crt-prompt">&gt; LIST OBJECTIVES --all</span>
                    </div>

                    <div className="space-y-5 md:space-y-7">
                      {hitos.map((h, i) => (
                        <HitoLine key={`${h.hora}-${h.titulo}-${i}`} hito={h} index={i} />
                      ))}
                    </div>

                    <div className="crt-line-enter mt-7 border-t border-[#4ade80]/30 pt-4 md:mt-10 md:pt-5">
                      <p className="crt-dim text-[11px] md:text-[13px]">&gt; END_OF_TRANSMISSION</p>
                      <p className="crt-prompt mt-1 text-[11px] md:text-[13px]">
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

        <p
          className="mt-4 text-center text-[10px] tracking-[0.3em] text-white/40 md:text-[11px]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          TERMINAL TÁCTICA · TRANSMISIÓN DIRECTA DESDE OPS-MAIN
        </p>
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
      <span className={`${className} text-[12px] md:text-[14px]`}>{text}</span>
    </div>
  )
}

function HitoLine({ hito, index }: { hito: OperativoHito; index: number }) {
  const [typed, setTyped] = useState('')
  const [started, setStarted] = useState(false)
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAppeared(true), 200 + index * 250)
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
    }, 30)
    return () => clearInterval(interval)
  }, [appeared, hito.titulo])

  if (!appeared) return null

  const accentClass = hito.nocturno ? 'crt-cyan' : 'crt-white'
  const prefix = hito.nocturno ? '✦' : '●'
  const unidadLabel = hito.unidad?.trim()

  return (
    <div className="crt-line-enter">
      <div className="flex flex-wrap items-baseline gap-2 md:gap-4">
        <span className={`${accentClass} font-bold`}>&gt;</span>
        <span className={`${accentClass} text-[14px] font-bold md:text-[17px]`}>{hito.hora}</span>
        <span className="crt-dim">::</span>
        <span className={`${accentClass} text-[14px] font-bold uppercase md:text-[17px]`}>
          {typed}
          {started && typed.length < hito.titulo.length ? <span className="crt-cursor" /> : null}
        </span>
        {unidadLabel ? (
          <span className="crt-amber text-[11px] md:text-[13px]">[ {unidadLabel} ]</span>
        ) : null}
      </div>

      {hito.descripcion ? (
        <div className="ml-4 mt-1 md:ml-7">
          <span className="crt-dim text-[12px] md:text-[14px]">└ {hito.descripcion}</span>
        </div>
      ) : null}

      {hito.nocturno ? (
        <div className="ml-4 mt-1 md:ml-7">
          <span className="crt-cyan text-[10px] tracking-[0.2em] md:text-[11px]">
            {prefix} NIGHT_OPS_PROTOCOL
          </span>
        </div>
      ) : null}
    </div>
  )
}
