'use client'

import { useEffect, useRef } from 'react'
import type { HTMLAttributes } from 'react'
import { CampoCard } from '@/app/campos/components/CampoCard'
import type { CampoListRow } from '@/app/campos/types'

/** Velocidad del autoplay. Lento y constante, tipo marquee. */
const PX_PER_SECOND = 55
/** Mínimo de tarjetas por vuelta para que la cinta llene el ancho en desktop. */
const MIN_CARDS = 6
/** Tiempo sin interacción antes de reanudar el autoplay (cubre el inercial de iOS). */
const RESUME_DELAY_MS = 1200

/** Saca los clones del tab order y del árbol de accesibilidad (React 18 no tipa `inert`). */
const inertProps = { inert: '' } as unknown as HTMLAttributes<HTMLDivElement>

const SLIDE_CLASS = 'w-[260px] shrink-0 pr-4 sm:w-[288px] sm:pr-5 lg:w-[308px]'

function buildLoop(fields: CampoListRow[]): CampoListRow[] {
  if (fields.length === 0) return []
  const repeats = Math.ceil(MIN_CARDS / fields.length)
  return Array.from({ length: repeats }, () => fields).flat()
}

export function CamposHomeCarouselTrack({ fields }: { fields: CampoListRow[] }) {
  const loop = buildLoop(fields)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Hover/foco pausan mientras duren; scroll y touch pausan por unos segundos.
    let holding = false
    let idleUntil = 0
    let lastFrame = 0
    let selfScrollLeft = -1
    let raf = 0

    const hold = () => {
      holding = true
    }
    const release = () => {
      holding = false
      idleUntil = performance.now() + RESUME_DELAY_MS
    }
    const nudgeIdle = () => {
      idleUntil = performance.now() + RESUME_DELAY_MS
    }
    const onScroll = () => {
      // Ignora el scroll que escribe el propio autoplay; sólo pausa el del usuario.
      if (selfScrollLeft >= 0 && Math.abs(el.scrollLeft - selfScrollLeft) < 2) return
      nudgeIdle()
    }

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick)
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0
      lastFrame = now
      if (holding || now < idleUntil || dt === 0) return

      // La pista lleva dos vueltas idénticas: al pasar la mitad, volvemos atrás sin que se note.
      const half = el.scrollWidth / 2
      if (half <= 0) return
      let next = el.scrollLeft + PX_PER_SECOND * dt
      if (next >= half) next -= half
      el.scrollLeft = next
      selfScrollLeft = el.scrollLeft
    }

    el.addEventListener('mouseenter', hold)
    el.addEventListener('mouseleave', release)
    el.addEventListener('focusin', hold)
    el.addEventListener('focusout', release)
    el.addEventListener('touchstart', hold, { passive: true })
    el.addEventListener('touchend', release, { passive: true })
    el.addEventListener('touchcancel', release, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    raf = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(raf)
      el.removeEventListener('mouseenter', hold)
      el.removeEventListener('mouseleave', release)
      el.removeEventListener('focusin', hold)
      el.removeEventListener('focusout', release)
      el.removeEventListener('touchstart', hold)
      el.removeEventListener('touchend', release)
      el.removeEventListener('touchcancel', release)
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  if (loop.length === 0) return null

  return (
    <div
      ref={scrollerRef}
      className="campos-marquee scrollbar-hide overflow-x-auto"
      style={{ WebkitOverflowScrolling: 'touch' }}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Campos aprobados"
    >
      <div className="flex w-max">
        {loop.map((field, i) => (
          <div key={`campo-${i}`} className={SLIDE_CLASS}>
            <CampoCard field={field} />
          </div>
        ))}
        {/* Segunda vuelta idéntica: es lo que permite reiniciar el scroll sin salto visible. */}
        <div className="flex" aria-hidden {...inertProps}>
          {loop.map((field, i) => (
            <div key={`campo-clon-${i}`} className={SLIDE_CLASS}>
              <CampoCard field={field} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .campos-marquee {
            -webkit-mask-image: linear-gradient(
              to right,
              transparent,
              #000 3%,
              #000 97%,
              transparent
            );
            mask-image: linear-gradient(
              to right,
              transparent,
              #000 3%,
              #000 97%,
              transparent
            );
          }
        }
      `}</style>
    </div>
  )
}
