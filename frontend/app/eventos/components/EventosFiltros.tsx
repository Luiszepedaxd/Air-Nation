'use client'

import { useMemo, useState } from 'react'
import { EventoCard, type EventoCardRow } from './EventoCard'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const MESES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

type MesOption = {
  key: string // 'YYYY-MM'
  label: string // 'Mayo' o 'May 2027'
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

  return (
    <>
      {showFiltrosBar ? (
        <div
          className="sticky top-0 z-30 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF]/95 backdrop-blur-sm"
          style={{ borderRadius: 0 }}
        >
          <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-6">
            <div className="flex items-center gap-3 overflow-x-auto">
              {showMes ? (
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                    style={{ ...jost, fontWeight: 800 }}
                  >
                    MES
                  </span>
                  <button
                    type="button"
                    onClick={() => setMesActivo(null)}
                    className={`shrink-0 border border-solid px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] transition-colors ${
                      mesActivo === null
                        ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                        : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
                    }`}
                    style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                  >
                    Todos
                  </button>
                  {mesesOptions.map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMesActivo(m.key)}
                      className={`shrink-0 border border-solid px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] transition-colors ${
                        mesActivo === m.key
                          ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                          : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
                      }`}
                      style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {showMes && showCiudad ? (
                <div className="h-6 w-px shrink-0 bg-[#EEEEEE]" aria-hidden />
              ) : null}

              {showCiudad ? (
                <div className="flex items-center gap-2">
                  <span
                    className="shrink-0 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                    style={{ ...jost, fontWeight: 800 }}
                  >
                    CIUDAD
                  </span>
                  <button
                    type="button"
                    onClick={() => setCiudadActiva(null)}
                    className={`shrink-0 border border-solid px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] transition-colors ${
                      ciudadActiva === null
                        ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                        : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
                    }`}
                    style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                  >
                    Todas
                  </button>
                  {ciudadesOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCiudadActiva(c)}
                      className={`shrink-0 border border-solid px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] transition-colors ${
                        ciudadActiva === c
                          ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                          : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
                      }`}
                      style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : null}

              {hayFiltrosActivos ? (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="ml-auto shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#CC4B37] hover:underline"
                  style={{ ...jost, fontWeight: 800 }}
                >
                  Limpiar filtros ✕
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {eventosFiltrados.length === 0 ? (
          <div className="py-12 text-center">
            <p
              className="text-sm text-[#666666]"
              style={lato}
            >
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
