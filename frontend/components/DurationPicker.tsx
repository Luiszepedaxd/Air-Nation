'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ITEM_HEIGHT = 40

function WheelColumn({
  values,
  selected,
  onChange,
  label,
}: {
  values: number[]
  selected: number
  onChange: (v: number) => void
  label: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const releaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el || isScrollingRef.current) return
    const idx = values.indexOf(selected)
    if (idx < 0) return
    el.scrollTop = idx * ITEM_HEIGHT
  }, [selected, values])

  useEffect(
    () => () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
      if (releaseTimeoutRef.current) clearTimeout(releaseTimeoutRef.current)
    },
    []
  )

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    scrollTimeoutRef.current = setTimeout(() => {
      const el = containerRef.current
      if (!el) return
      const idx = Math.round(el.scrollTop / ITEM_HEIGHT)
      const clamped = Math.max(0, Math.min(idx, values.length - 1))
      el.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: 'smooth' })
      onChange(values[clamped])
      if (releaseTimeoutRef.current) clearTimeout(releaseTimeoutRef.current)
      releaseTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
      }, 150)
    }, 80)
  }, [values, onChange])

  return (
    <div className="flex flex-col items-center">
      <p style={jost} className="mb-1 text-[9px] tracking-[0.15em] text-[#999999]">
        {label}
      </p>
      <div className="relative h-[120px] w-[72px] overflow-hidden">
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-[40px]"
          style={{ background: 'linear-gradient(to bottom, #FFFFFF, transparent)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[40px]"
          style={{ background: 'linear-gradient(to top, #FFFFFF, transparent)' }}
        />
        <div className="pointer-events-none absolute left-0 right-0 top-[40px] z-10 h-[40px] border-y border-[#CC4B37]/30" />
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          <div style={{ height: ITEM_HEIGHT }} />
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                onChange(v)
                const el = containerRef.current
                const idx = values.indexOf(v)
                if (el && idx >= 0) {
                  el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' })
                }
              }}
              className={`flex w-full items-center justify-center transition-colors ${
                v === selected ? 'text-[#111111]' : 'text-[#CCCCCC]'
              }`}
              style={{
                height: ITEM_HEIGHT,
                // 'center' mantiene el snap nativo alineado con el indicador,
                // que ocupa la fila central de las tres visibles.
                scrollSnapAlign: 'center',
                fontFamily: "'Lato', sans-serif",
                fontSize: v === selected ? 24 : 18,
                fontWeight: v === selected ? 700 : 400,
              }}
            >
              {v.toString().padStart(2, '0')}
            </button>
          ))}
          <div style={{ height: ITEM_HEIGHT }} />
        </div>
      </div>
    </div>
  )
}

export function DurationPicker({
  value,
  onChange,
  showHours = false,
  maxMinutes = 59,
  label,
}: {
  value: number
  onChange: (seconds: number) => void
  showHours?: boolean
  maxMinutes?: number
  label?: string
}) {
  const hours = Math.floor(value / 3600)
  // Sin columna de horas la rueda de minutos es el total, así que 60 min debe
  // seguir mostrándose como 60 y no volver a 00.
  const minutes = showHours
    ? Math.floor((value % 3600) / 60)
    : Math.floor(value / 60)

  const hourValues = useMemo(() => Array.from({ length: 6 }, (_, i) => i), [])
  const minuteValues = useMemo(
    () => Array.from({ length: maxMinutes + 1 }, (_, i) => i),
    [maxMinutes]
  )

  const handleHours = useCallback(
    (h: number) => onChange(h * 3600 + minutes * 60),
    [onChange, minutes]
  )

  const handleMinutes = useCallback(
    (m: number) => onChange(showHours ? hours * 3600 + m * 60 : m * 60),
    [onChange, showHours, hours]
  )

  return (
    <div>
      {label && (
        <p style={jost} className="mb-2 text-[11px] tracking-[0.12em] text-[#999999]">
          {label}
        </p>
      )}
      <div className="flex items-center justify-center gap-2">
        {showHours && (
          <>
            <WheelColumn
              values={hourValues}
              selected={hours}
              onChange={handleHours}
              label="HORAS"
            />
            <span className="mt-4 text-[20px] font-bold text-[#CCCCCC]">:</span>
          </>
        )}
        <WheelColumn
          values={minuteValues}
          selected={minutes}
          onChange={handleMinutes}
          label="MINUTOS"
        />
      </div>
      <p className="mt-2 text-center text-[12px] text-[#666666]" style={lato}>
        {showHours && hours > 0 ? `${hours}h ` : ''}
        {minutes} min
        {value === 0 && ' — selecciona la duración'}
      </p>
    </div>
  )
}
