'use client'

import { useMemo, useState } from 'react'
import { CampoCard } from './CampoCard'
import { FiltrosCampos, type TipoFiltro } from './FiltrosCampos'
import type { CampoListRow } from '../types'

const lato = { fontFamily: "'Lato', sans-serif" } as const

function normalizeTipo(raw: string | null | undefined): 'publico' | 'privado' {
  const t = (raw ?? '').toLowerCase().trim()
  if (t === 'privado' || t === 'private') return 'privado'
  return 'publico'
}

/** Sin `foto_portada_url` al final, conservando el orden relativo del resto. */
function sortSinFotoAlFinal(rows: CampoListRow[]): CampoListRow[] {
  return [...rows].sort((a, b) => {
    const aNo = !a.foto_portada_url?.trim()
    const bNo = !b.foto_portada_url?.trim()
    if (aNo === bNo) return 0
    return aNo ? 1 : -1
  })
}

export function CamposGrid({ fields }: { fields: CampoListRow[] }) {
  const [ciudad, setCiudad] = useState('')
  const [tipo, setTipo] = useState<TipoFiltro>('todos')

  const ciudades = useMemo(() => {
    const s = new Set<string>()
    for (const f of fields) {
      const c = f.ciudad?.trim()
      if (c) s.add(c)
    }
    return Array.from(s)
  }, [fields])

  const filtered = useMemo(() => {
    let list = fields
    if (ciudad) {
      list = list.filter((f) => (f.ciudad ?? '').trim() === ciudad)
    }
    if (tipo !== 'todos') {
      list = list.filter((f) => normalizeTipo(f.tipo) === tipo)
    }
    return sortSinFotoAlFinal(list)
  }, [fields, ciudad, tipo])

  return (
    <div className="space-y-4">
      <FiltrosCampos
        ciudades={ciudades}
        ciudad={ciudad}
        onCiudad={setCiudad}
        tipo={tipo}
        onTipo={setTipo}
      />
      {filtered.length === 0 ? (
        <p
          className="py-12 text-center text-sm text-[#666666]"
          style={lato}
        >
          No hay campos que coincidan con los filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <CampoCard key={f.id} field={f} />
          ))}
        </div>
      )}
    </div>
  )
}
