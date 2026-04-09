'use client'

import { useMemo } from 'react'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

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
}: Props) {
  const estadoOptions = useMemo(
    () => [...estados].sort((a, b) => a.localeCompare(b, 'es')),
    [estados]
  )
  const options = useMemo(
    () => [...ciudades].sort((a, b) => a.localeCompare(b, 'es')),
    [ciudades]
  )

  return (
    <div
      className="flex flex-col gap-3 border border-[#EEEEEE] bg-[#FFFFFF] p-4 md:flex-row md:items-end md:gap-4"
      style={lato}
    >
      <div className="min-w-0 flex-1">
        <label
          className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
          style={jost}
          htmlFor="filtro-estado"
        >
          Estado
        </label>
        <select
          id="filtro-estado"
          className={shell}
          value={estado}
          onChange={(e) => { onEstado(e.target.value); onCiudad('') }}
        >
          <option value="">Todos los estados</option>
          {estadoOptions.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1">
        <label
          className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
          style={jost}
          htmlFor="filtro-ciudad"
        >
          Ciudad
        </label>
        <select
          id="filtro-ciudad"
          className={shell}
          value={ciudad}
          onChange={(e) => onCiudad(e.target.value)}
          disabled={!estado}
        >
          <option value="">Todas las ciudades</option>
          {options.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1">
        <span
          className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
          style={jost}
        >
          Tipo
        </span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'todos' as const, label: 'Todos' },
              { id: 'publico' as const, label: 'Público' },
              { id: 'privado' as const, label: 'Privado' },
            ] as const
          ).map(({ id, label }) => {
            const active = tipo === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTipo(id)}
                className={`border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.12em] transition-colors ${
                  active
                    ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                    : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:border-[#CCCCCC]'
                }`}
                style={{ ...jost, borderRadius: 2 }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
