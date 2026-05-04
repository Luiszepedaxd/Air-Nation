'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EventoCard, type EventoCardRow } from './EventoCard'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

type MesOption = {
  key: string
  label: string
  year: number
  month: number
}

function getMesOptions(eventos: EventoCardRow[]): MesOption[] {
  const currentYear = new Date().getFullYear()
  const map = new Map<string, MesOption>()
  for (const e of eventos) {
    const d = new Date(e.fecha)
    if (Number.isNaN(d.getTime())) continue
    const y = d.getFullYear()
    const m = d.getMonth()
    const key = `${y}-${String(m + 1).padStart(2, '0')}`
    if (!map.has(key)) {
      const mesNombre = MESES_ES[m]
      const label = y === currentYear ? mesNombre : `${mesNombre} ${y}`
      map.set(key, { key, label, year: y, month: m })
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
}

function getCiudadesOptions(eventos: EventoCardRow[]): string[] {
  const set = new Set<string>()
  for (const e of eventos) {
    const c = e.ciudad?.trim() || e.sede_ciudad?.trim() || null
    if (c) set.add(c)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
}

function eventoMatchesMes(e: EventoCardRow, mesKey: string | null): boolean {
  if (!mesKey) return true
  const d = new Date(e.fecha)
  if (Number.isNaN(d.getTime())) return false
  const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return k === mesKey
}

function eventoMatchesCiudad(e: EventoCardRow, ciudad: string | null): boolean {
  if (!ciudad) return true
  const c = e.ciudad?.trim() || e.sede_ciudad?.trim() || null
  return c === ciudad
}

function ChevronDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseX() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function FilterDropdown({
  label,
  activeLabel,
  options,
  onSelect,
  onClear,
}: {
  label: string
  activeLabel: string | null
  options: { key: string; label: string }[]
  onSelect: (key: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const hasActive = activeLabel !== null

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 border border-solid px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.1em] transition-colors ${
          hasActive
            ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
            : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
        }`}
        style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
      >
        <span>
          {label}
          {hasActive ? `: ${activeLabel}` : ''}
        </span>
        {hasActive ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onClear()
              setOpen(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onClear()
                setOpen(false)
              }
            }}
            className="flex h-4 w-4 items-center justify-center hover:opacity-70"
            aria-label="Limpiar filtro"
          >
            <CloseX />
          </span>
        ) : (
          <ChevronDown />
        )}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute left-0 top-full z-[100] mt-1 min-w-[180px] border border-solid border-[#EEEEEE] bg-white shadow-lg"
            style={{ borderRadius: 2 }}
          >
            <button
              type="button"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className={`flex w-full items-center px-4 py-2.5 text-left text-[12px] uppercase tracking-[0.06em] transition-colors hover:bg-[#F4F4F4] ${
                !hasActive ? 'font-extrabold text-[#CC4B37]' : 'text-[#111111]'
              }`}
              style={{ ...jost, fontWeight: !hasActive ? 800 : 600 }}
            >
              Todos
            </button>
            <div className="border-t border-solid border-[#EEEEEE]" />
            {options.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  onSelect(opt.key)
                  setOpen(false)
                }}
                className={`flex w-full items-center px-4 py-2.5 text-left text-[12px] uppercase tracking-[0.06em] transition-colors hover:bg-[#F4F4F4] ${
                  activeLabel === opt.label
                    ? 'font-extrabold text-[#CC4B37]'
                    : 'text-[#111111]'
                }`}
                style={{
                  ...jost,
                  fontWeight: activeLabel === opt.label ? 800 : 600,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export function EventosFiltros({ eventos }: { eventos: EventoCardRow[] }) {
  const [mesActivo, setMesActivo] = useState<string | null>(null)
  const [ciudadActiva, setCiudadActiva] = useState<string | null>(null)

  const mesesOptions = useMemo(() => getMesOptions(eventos), [eventos])
  const ciudadesOptions = useMemo(() => getCiudadesOptions(eventos), [eventos])

  const showMes = mesesOptions.length >= 2
  const showCiudad = ciudadesOptions.length >= 2
  const showFiltrosBar = showMes || showCiudad

  const eventosFiltrados = useMemo(() => {
    return eventos.filter(
      (e) =>
        eventoMatchesMes(e, mesActivo) && eventoMatchesCiudad(e, ciudadActiva)
    )
  }, [eventos, mesActivo, ciudadActiva])

  const hayFiltrosActivos = mesActivo !== null || ciudadActiva !== null

  const limpiarFiltros = () => {
    setMesActivo(null)
    setCiudadActiva(null)
  }

  const mesActivoLabel = mesActivo
    ? mesesOptions.find((m) => m.key === mesActivo)?.label ?? null
    : null
  const ciudadActivaLabel = ciudadActiva ?? null

  return (
    <>
      {showFiltrosBar ? (
        <div
          className="sticky top-0 z-30 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF]/95 backdrop-blur-sm"
          style={{ borderRadius: 0 }}
        >
          <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={{ ...jost, fontWeight: 800 }}
              >
                FILTRAR:
              </span>

              {showMes ? (
                <FilterDropdown
                  label="Mes"
                  activeLabel={mesActivoLabel}
                  options={mesesOptions.map((m) => ({
                    key: m.key,
                    label: m.label,
                  }))}
                  onSelect={(k) => setMesActivo(k)}
                  onClear={() => setMesActivo(null)}
                />
              ) : null}

              {showCiudad ? (
                <FilterDropdown
                  label="Ciudad"
                  activeLabel={ciudadActivaLabel}
                  options={ciudadesOptions.map((c) => ({
                    key: c,
                    label: c,
                  }))}
                  onSelect={(k) => setCiudadActiva(k)}
                  onClear={() => setCiudadActiva(null)}
                />
              ) : null}

              {hayFiltrosActivos ? (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="ml-auto shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#CC4B37] hover:underline"
                  style={{ ...jost, fontWeight: 800 }}
                >
                  Limpiar todo
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {eventosFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-[#666666]" style={lato}>
              {hayFiltrosActivos
                ? 'No hay eventos con estos filtros.'
                : 'No hay eventos publicados por ahora.'}
            </p>
            {hayFiltrosActivos ? (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#CC4B37] hover:underline"
                style={{ ...jost, fontWeight: 800 }}
              >
                Ver todos los eventos →
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventosFiltrados.map((e, idx) => (
              <EventoCard key={e.id} evento={e} index={idx} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
