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

function sortSinFotoAlFinal(rows: CampoListRow[]): CampoListRow[] {
  return [...rows].sort((a, b) => {
    const aNo = !a.foto_portada_url?.trim()
    const bNo = !b.foto_portada_url?.trim()
    if (aNo === bNo) return 0
    return aNo ? 1 : -1
  })
}

export function CamposGrid({ fields }: { fields: CampoListRow[] }) {
  const [estado, setEstado] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [tipo, setTipo] = useState<TipoFiltro>('todos')

  const estados = useMemo(() => {
    const s = new Set<string>()
    for (const f of fields) {
      if (f.estado?.trim()) s.add(f.estado.trim())
    }
    return Array.from(s)
  }, [fields])

  const ciudades = useMemo(() => {
    const s = new Set<string>()
    for (const f of fields) {
      if (estado && f.estado?.trim() !== estado) continue
      if (f.ciudad?.trim()) s.add(f.ciudad.trim())
    }
    return Array.from(s)
  }, [fields, estado])

  const activeCount = useMemo(() => {
    let n = 0
    if (estado) n++
    if (ciudad) n++
    if (tipo !== 'todos') n++
    return n
  }, [estado, ciudad, tipo])

  const filtered = useMemo(() => {
    let list = fields
    if (estado) list = list.filter((f) => f.estado?.trim() === estado)
    if (ciudad) list = list.filter((f) => (f.ciudad ?? '').trim() === ciudad)
    if (tipo !== 'todos') list = list.filter((f) => normalizeTipo(f.tipo) === tipo)
    return sortSinFotoAlFinal(list)
  }, [fields, estado, ciudad, tipo])

  return (
    <div className="space-y-4">
      <FiltrosCampos
        estados={estados}
        estado={estado}
        onEstado={(v) => { setEstado(v); setCiudad('') }}
        ciudades={ciudades}
        ciudad={ciudad}
        onCiudad={setCiudad}
        tipo={tipo}
        onTipo={setTipo}
        activeCount={activeCount}
      />
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#666666]" style={lato}>
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
