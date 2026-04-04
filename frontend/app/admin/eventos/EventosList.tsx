'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  cancelEvent,
  deleteEvent,
  toggleEventPublished,
} from './actions'
const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type AdminEventoRow = {
  id: string
  title: string
  field_id: string | null
  fecha: string
  cupo: number
  disciplina: string | null
  tipo: string | null
  published: boolean
  status: string
  imagen_url: string | null
  field_nombre: string | null
  field_ciudad: string | null
}

type FilterTab = 'todos' | 'publicados' | 'borradores' | 'cancelados'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'todos', label: 'TODOS' },
  { id: 'publicados', label: 'PUBLICADOS' },
  { id: 'borradores', label: 'BORRADORES' },
  { id: 'cancelados', label: 'CANCELADOS' },
]

function statusBadge(status: string, published: boolean) {
  const s = status.toLowerCase()
  if (s === 'cancelado') {
    return (
      <span
        className="inline-block text-[10px] font-semibold tracking-wide text-[#666666]"
        style={{
          padding: '4px 8px',
          backgroundColor: '#EEEEEE',
          ...jostHeading,
        }}
      >
        CANCELADO
      </span>
    )
  }
  if (published && s === 'publicado') {
    return (
      <span
        className="inline-block text-[10px] font-semibold tracking-wide text-[#FFFFFF]"
        style={{
          padding: '4px 8px',
          backgroundColor: '#111111',
          ...jostHeading,
        }}
      >
        PUBLICADO
      </span>
    )
  }
  return (
    <span
      className="inline-block text-[10px] font-semibold tracking-wide text-[#856404]"
      style={{
        padding: '4px 8px',
        backgroundColor: '#FFF3CD',
        ...jostHeading,
      }}
    >
      BORRADOR
    </span>
  )
}

function tipoLabel(tipo: string | null) {
  const t = (tipo ?? '').toLowerCase()
  return t === 'privado' ? 'PRIVADO' : 'PÚBLICO'
}

function formatFecha(iso: string) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return iso
  }
}

export default function EventosList({
  initialRows,
}: {
  initialRows: AdminEventoRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState(initialRows)
  const [tab, setTab] = useState<FilterTab>('todos')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    setRows(initialRows)
  }, [initialRows])

  const filtered = useMemo(() => {
    if (tab === 'todos') return rows
    if (tab === 'cancelados') {
      return rows.filter((r) => r.status.toLowerCase() === 'cancelado')
    }
    if (tab === 'publicados') {
      return rows.filter(
        (r) =>
          r.published && r.status.toLowerCase() === 'publicado'
      )
    }
    if (tab === 'borradores') {
      return rows.filter((r) => {
        if (r.status.toLowerCase() === 'cancelado') return false
        return !r.published || r.status.toLowerCase() === 'borrador'
      })
    }
    return rows
  }, [rows, tab])

  const run = async (
    id: string,
    fn: () => Promise<{ ok?: true; error?: string }>
  ) => {
    setBusyId(id)
    const res = await fn()
    setBusyId(null)
    if (res && typeof res === 'object' && 'error' in res && res.error) {
      window.alert(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div>
      <div
        className="mb-6 flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-4"
        style={latoBody}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[10px] tracking-[0.12em] transition-colors ${
              tab === t.id
                ? 'bg-[#111111] text-[#FFFFFF]'
                : 'bg-[#F4F4F4] text-[#666666] hover:text-[#111111]'
            }`}
            style={jostHeading}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto border border-solid border-[#EEEEEE]">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-solid border-[#EEEEEE] bg-[#F4F4F4]">
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                IMAGEN
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                TÍTULO
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                CAMPO
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                FECHA
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                CUPO
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                DISC.
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                TIPO
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                ESTADO
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                PUB.
              </th>
              <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="p-8 text-center text-[#666666]"
                  style={latoBody}
                >
                  No hay eventos en este filtro.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const disabled = busyId === r.id
                const isCanceled = r.status.toLowerCase() === 'cancelado'
                return (
                  <tr
                    key={r.id}
                    className="border-b border-solid border-[#EEEEEE] align-middle"
                  >
                    <td className="p-2">
                      <div className="h-12 w-12 overflow-hidden bg-[#111111]">
                        {r.imagen_url?.trim() ? (
                          <img
                            src={r.imagen_url.trim()}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[9px] text-[#AAAAAA]">
                            —
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="max-w-[180px] p-2">
                      <p
                        className="line-clamp-2 font-semibold text-[#111111]"
                        style={latoBody}
                      >
                        {r.title}
                      </p>
                    </td>
                    <td className="max-w-[140px] p-2 text-[13px] text-[#666666]" style={latoBody}>
                      {r.field_nombre?.trim() || '—'}
                      {r.field_ciudad?.trim() ? (
                        <span className="block text-[11px] text-[#AAAAAA]">
                          {r.field_ciudad.trim()}
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap p-2 text-[12px] text-[#666666]" style={latoBody}>
                      {formatFecha(r.fecha)}
                    </td>
                    <td className="p-2 text-[12px] text-[#666666]" style={latoBody}>
                      {r.cupo <= 0 ? '∞' : r.cupo}
                    </td>
                    <td className="p-2 text-[11px] uppercase text-[#666666]" style={jostHeading}>
                      {(r.disciplina ?? 'airsoft').slice(0, 8)}
                    </td>
                    <td className="p-2 text-[11px]" style={jostHeading}>
                      {tipoLabel(r.tipo)}
                    </td>
                    <td className="p-2">{statusBadge(r.status, r.published)}</td>
                    <td className="p-2 text-[12px]" style={latoBody}>
                      {r.published ? 'Sí' : 'No'}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/admin/eventos/${r.id}/editar`}
                          className="inline-block bg-[#EEEEEE] px-2 py-1 text-center text-[9px] text-[#111111] hover:bg-[#DDDDDD]"
                          style={jostHeading}
                        >
                          EDITAR
                        </Link>
                        <button
                          type="button"
                          disabled={disabled || isCanceled}
                          onClick={() =>
                            void run(r.id, () =>
                              toggleEventPublished(r.id, !r.published)
                            )
                          }
                          className="bg-[#CC4B37] px-2 py-1 text-[9px] text-[#FFFFFF] disabled:opacity-50"
                          style={jostHeading}
                        >
                          {r.published ? 'DESPUBLICAR' : 'PUBLICAR'}
                        </button>
                        <button
                          type="button"
                          disabled={disabled || isCanceled}
                          onClick={() =>
                            void run(r.id, () => cancelEvent(r.id))
                          }
                          className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1 text-[9px] text-[#666666] disabled:opacity-50"
                          style={jostHeading}
                        >
                          CANCELAR
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (!window.confirm('¿Eliminar evento?')) return
                            void run(r.id, () => deleteEvent(r.id))
                          }}
                          className="bg-[#111111] px-2 py-1 text-[9px] text-[#FFFFFF] disabled:opacity-50"
                          style={jostHeading}
                        >
                          ELIMINAR
                        </button>
                        {r.published ? (
                          <Link
                            href={`/eventos/${r.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-center text-[9px] text-[#CC4B37]"
                            style={jostHeading}
                          >
                            VER PÚBLICO
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
