'use client'

import { useMemo, useState } from 'react'

const jost = { fontFamily: "'Jost', sans-serif" } as const

export type TipoFiltro = 'todos' | 'publico' | 'privado'

type Props = {
  estados: string[]
  estado: string
  onEstado: (v: string) => void
  ciudades: string[]
  ciudad: string
  onCiudad: (v: string) => void
  tipo: TipoFiltro
  onTipo: (v: TipoFiltro) => void
  activeCount: number
}

const shell =
  'w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:outline-none focus:border-[#CC4B37] transition-colors'

export function FiltrosCampos({
  estados,
  estado,
  onEstado,
  ciudades,
  ciudad,
  onCiudad,
  tipo,
  onTipo,
  activeCount,
}: Props) {
  const [open, setOpen] = useState(false)
  const [localEstado, setLocalEstado] = useState(estado)
  const [localCiudad, setLocalCiudad] = useState(ciudad)
  const [localTipo, setLocalTipo] = useState<TipoFiltro>(tipo)

  const estadoOptions = useMemo(
    () => [...estados].sort((a, b) => a.localeCompare(b, 'es')),
    [estados]
  )
  const ciudadOptions = useMemo(
    () => [...ciudades].sort((a, b) => a.localeCompare(b, 'es')),
    [ciudades]
  )

  const handleOpen = () => {
    setLocalEstado(estado)
    setLocalCiudad(ciudad)
    setLocalTipo(tipo)
    setOpen(true)
  }

  const handleApply = () => {
    onEstado(localEstado)
    onCiudad(localCiudad)
    onTipo(localTipo)
    setOpen(false)
  }

  const handleClear = () => {
    setLocalEstado('')
    setLocalCiudad('')
    setLocalTipo('todos')
  }

  return (
    <>
      {/* Botón filtrar */}
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          style={jost}
          className="flex items-center gap-2 border border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:border-[#CCCCCC]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center bg-[#CC4B37] text-[9px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => { onEstado(''); onCiudad(''); onTipo('todos') }}
            style={jost}
            className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          borderRadius: '12px 12px 0 0',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle */}
        <div
          className="flex w-full cursor-pointer justify-center py-4"
          onClick={() => setOpen(false)}
          style={{ minHeight: 44 }}
        >
          <div className="h-1 w-10 rounded-full bg-[#DDDDDD]" />
        </div>

        <div className="px-5 pb-6 pt-2">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
              Filtrar
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                style={jost}
                className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={jost}
                className="bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Sección Ubicación */}
          <div className="mb-5">
            <p style={jost} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
              Ubicación
            </p>
            <div className="flex flex-col gap-3">
              <select
                className={shell}
                value={localEstado}
                onChange={(e) => { setLocalEstado(e.target.value); setLocalCiudad('') }}
              >
                <option value="">Todos los estados</option>
                {estadoOptions.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
              {localEstado && (
                <select
                  className={shell}
                  value={localCiudad}
                  onChange={(e) => setLocalCiudad(e.target.value)}
                >
                  <option value="">Todas las ciudades</option>
                  {ciudadOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Sección Acceso */}
          <div className="mb-6">
            <p style={jost} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
              Acceso
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'todos' as const, label: 'Todos' },
                { id: 'publico' as const, label: 'Público' },
                { id: 'privado' as const, label: 'Privado' },
              ]).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLocalTipo(id)}
                  style={jost}
                  className={`border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                    localTipo === id
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
