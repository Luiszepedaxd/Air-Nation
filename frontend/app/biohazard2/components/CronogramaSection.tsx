'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { CronogramaConfig, CronogramaHito } from '../lib/types'
import { BH2_HEADER_STYLE } from '../lib/theme'
import { BH2_TIMEZONE } from '../lib/fechas'
import './operativo-crt.css'

const reloj = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: BH2_TIMEZONE,
})

function agrupar(hitos: CronogramaHito[]) {
  const grupos: { dia: string; hitos: { hito: CronogramaHito; index: number }[] }[] = []
  hitos.forEach((hito, index) => {
    const dia = hito.dia?.trim() || 'JORNADA'
    const last = grupos.find((g) => g.dia === dia)
    if (last) last.hitos.push({ hito, index })
    else grupos.push({ dia, hitos: [{ hito, index }] })
  })
  return grupos
}

export function CronogramaSection({ config }: { config: CronogramaConfig }) {
  const hitos = (config.hitos ?? []).filter(
    (h) => h && (h.dia?.trim() || h.hora?.trim() || h.titulo?.trim() || h.descripcion?.trim())
  )
  const grupos = agrupar(hitos)
  const [bootDone, setBootDone] = useState(false)
  const [timestamp, setTimestamp] = useState('')
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setInView(true) }),
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
    if (!inView) return
    const update = () => setTimestamp(reloj.format(new Date()))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [inView])

  if (hitos.length === 0) return null

  const eyebrow = config.eyebrow?.trim() || 'CRONOGRAMA'
  const titulo = config.titulo?.trim() || 'LÍNEA DE TIEMPO'

  return (
    <section ref={sectionRef} id="cronograma" data-section="cronograma" className="relative w-full overflow-hidden bg-[#141A10] py-8 md:py-16">
      <div className="mx-auto mb-6 max-w-5xl px-4 md:mb-12 md:px-8">
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-[0.65rem] tracking-[0.5em] text-[#F2B705] md:text-xs" style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}>
          {eyebrow}
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-2 text-2xl leading-none text-white sm:text-3xl md:text-6xl" style={BH2_HEADER_STYLE}>
          {titulo}
        </motion.h2>
      </div>

      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="tablet-frame">
          <div className="tablet-camera" />
          <div className="tablet-screen crt-screen p-3 text-[10px] leading-[1.6] md:p-8 md:text-[14px]">
            <div className="crt-scanlines" />
            <div className="crt-vignette" />
            <div className="relative z-10">
              {inView ? (
                <>
                  <BootLine delay={0} text="> BOOTING OPS TERMINAL v2.0..." />
                  <BootLine delay={200} text="> LOAD MISSION: BIOHAZARD-II" />
                  <BootLine delay={400} text="> AUTH: SPEAR [VERIFIED]" />
                  <BootLine delay={600} text="> SECTOR: SELVA_OJO_DE_HALCON" />
                  <BootLine delay={800} text="> WINDOW: 14-15 NOV 2026" />
                  <BootLine delay={1000} text={`> OBJECTIVES: ${String(hitos.length).padStart(2, '0')}`} />
                  <BootLine delay={1200} text="> STATUS: PENDING_DEPLOYMENT" className="crt-amber" />
                  <BootLine delay={1500} text="> READY_" className="crt-cyan" />
                  {bootDone ? (
                    <>
                      <div className="crt-line-enter my-5 border-t border-[#7dd3a8]/20 md:my-7" />
                      <div className="crt-line-enter mb-5 flex flex-col gap-1 md:mb-7 md:flex-row md:items-center md:justify-between">
                        <span className="crt-dim text-[10px] md:text-[12px]">[ T+ {timestamp} CUN ]</span>
                        <span className="crt-dim text-[10px] md:text-[12px]">[ NODE: SPEAR-MAIN ]</span>
                      </div>
                      {grupos.map((g) => (
                        <div key={g.dia} className="mb-4">
                          <div className="crt-line-enter mb-2">
                            <span className="crt-amber text-[11px] font-bold tracking-[0.18em] md:text-[14px]">[ {g.dia} ]</span>
                          </div>
                          <div className="space-y-2 md:space-y-4">
                            {g.hitos.map(({ hito, index }) => (
                              <HitoLine key={`${g.dia}-${hito.hora}-${hito.titulo}-${index}`} hito={hito} index={index} />
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="crt-line-enter mt-7 border-t border-[#7dd3a8]/20 pt-3 md:mt-10">
                        <p className="crt-dim text-[10px] md:text-[12px]">&gt; END_OF_TRANSMISSION</p>
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

function BootLine({ delay, text, className = 'crt-prompt' }: { delay: number; text: string; className?: string }) {
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

function HitoLine({ hito, index }: { hito: CronogramaHito; index: number }) {
  const [typed, setTyped] = useState('')
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAppeared(true), 150 + index * 200)
    return () => clearTimeout(t)
  }, [index])

  useEffect(() => {
    if (!appeared) return
    let i = 0
    const titulo = hito.titulo || ''
    const interval = setInterval(() => {
      i += 1
      setTyped(titulo.slice(0, i))
      if (i >= titulo.length) clearInterval(interval)
    }, 25)
    return () => clearInterval(interval)
  }, [appeared, hito.titulo])

  if (!appeared) return null
  const accent = hito.nocturno ? 'crt-cyan' : 'crt-white'

  return (
    <div className="crt-line-enter">
      <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
        <span className={`${accent} font-bold`}>&gt;</span>
        <span className={`${accent} text-[11px] font-bold md:text-[16px]`}>{hito.hora}</span>
        <span className="crt-dim">::</span>
        <span className={`${accent} text-[11px] font-bold uppercase md:text-[16px]`}>
          {typed}
          {typed.length < (hito.titulo || '').length ? <span className="crt-cursor" /> : null}
        </span>
      </div>
      {hito.descripcion ? (
        <div className="ml-4 mt-1 md:ml-6">
          <span className="crt-dim text-[11px] md:text-[13px]">└ {hito.descripcion}</span>
        </div>
      ) : null}
      {hito.nocturno ? (
        <div className="ml-4 mt-1 md:ml-6">
          <span className="crt-cyan text-[9px] tracking-[0.2em] md:text-[10px]">◆ NIGHT_OPS</span>
        </div>
      ) : null}
    </div>
  )
}
