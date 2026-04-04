'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { updateFieldStatus, toggleDestacado } from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type FieldListItem = {
  id: string
  nombre: string
  ciudad: string | null
  status: 'pending' | 'aprobado' | 'rejected'
  destacado: boolean
  orden_destacado: number | null
  foto_portada_url: string | null
  created_at: string | null
}

type FilterTab = 'todos' | 'pending' | 'aprobado' | 'rejected'

function StatusBadge({ status }: { status: FieldListItem['status'] }) {
  if (status === 'pending') {
    return (
      <span
        className="inline-block text-[11px] font-semibold tracking-wide"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#FFF3CD',
          color: '#856404',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        PENDIENTE
      </span>
    )
  }
  if (status === 'aprobado') {
    return (
      <span
        className="inline-block text-[11px] font-semibold tracking-wide text-[#FFFFFF]"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#111111',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        APROBADO
      </span>
    )
  }
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide text-[#666666]"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: '#EEEEEE',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      RECHAZADO
    </span>
  )
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'todos', label: 'TODOS' },
  { id: 'pending', label: 'PENDIENTES' },
  { id: 'aprobado', label: 'APROBADOS' },
  { id: 'rejected', label: 'RECHAZADOS' },
]

export default function FieldsList({
  fields: initialFields,
}: {
  fields: FieldListItem[]
}) {
  const router = useRouter()
  const [fields, setFields] = useState<FieldListItem[]>(initialFields)
  const [tab, setTab] = useState<FilterTab>('todos')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null)

  useEffect(() => {
    setFields(initialFields)
  }, [initialFields])

  const filtered = useMemo(() => {
    if (tab === 'todos') return fields
    return fields.filter((f) => f.status === tab)
  }, [fields, tab])

  const handleToggleDestacado = async (id: string, next: boolean) => {
    setToggleBusyId(id)
    const prev = fields
    setFields((list) =>
      list.map((f) => (f.id === id ? { ...f, destacado: next } : f))
    )
    const result = await toggleDestacado(id, next)
    setToggleBusyId(null)
    if ('error' in result && result.error) {
      setFields(prev)
      window.alert(result.error)
      return
    }
    router.refresh()
  }

  const handleStatus = async (
    id: string,
    status: 'aprobado' | 'rejected' | 'pending'
  ) => {
    setBusyId(id)
    const result = await updateFieldStatus(id, status)
    setBusyId(null)
    if ('error' in result && result.error) {
      window.alert(result.error)
      return
    }
    setFields((list) =>
      list.map((f) => (f.id === id ? { ...f, status } : f))
    )
    router.refresh()
  }

  if (fields.length === 0) {
    return (
      <p className="py-16 text-center text-[#666666]" style={latoBody}>
        No hay campos registrados
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4" style={latoBody}>
      <div className="flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-[11px] tracking-[0.12em] transition-colors ${
                active
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 2 }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[#666666]">
          No hay campos en esta categoría
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
          <table className="w-full border-collapse text-left text-sm text-[#111111]">
            <thead>
              <tr className="bg-[#F4F4F4]">
                {(
                  [
                    'FOTO',
                    'NOMBRE',
                    'CIUDAD',
                    'STATUS',
                    'DESTACADO',
                    'ACCIONES',
                  ] as const
                ).map((col) => (
                  <th
                    key={col}
                    className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px] text-[#111111]"
                    style={jostHeading}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr
                  key={f.id}
                  className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
                >
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                    {f.foto_portada_url ? (
                      <img
                        src={f.foto_portada_url}
                        alt=""
                        width={60}
                        height={60}
                        className="h-[60px] w-[60px] object-cover"
                        style={{ borderRadius: 0 }}
                      />
                    ) : (
                      <div
                        className="h-[60px] w-[60px] shrink-0 bg-[#EEEEEE]"
                        aria-hidden
                      />
                    )}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                    {f.nombre}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                    {f.ciudad ?? '—'}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={f.destacado}
                      disabled={toggleBusyId === f.id}
                      onChange={(e) =>
                        handleToggleDestacado(f.id, e.target.checked)
                      }
                      className="h-4 w-4 accent-[#CC4B37] disabled:opacity-50"
                      aria-label="Destacado"
                    />
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/campos/${f.id}`}
                        className="inline-flex items-center justify-center bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                        style={{
                          ...jostHeading,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 2,
                        }}
                      >
                        VER
                      </Link>
                      {f.status === 'pending' && (
                        <button
                          type="button"
                          disabled={busyId === f.id}
                          onClick={() => handleStatus(f.id, 'aprobado')}
                          className="inline-flex items-center justify-center bg-[#1B5E20] text-[#FFFFFF] transition-colors hover:opacity-90 disabled:opacity-50"
                          style={{
                            ...jostHeading,
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 2,
                          }}
                        >
                          APROBAR
                        </button>
                      )}
                      {(f.status === 'pending' || f.status === 'aprobado') && (
                        <button
                          type="button"
                          disabled={busyId === f.id}
                          onClick={() => handleStatus(f.id, 'rejected')}
                          className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-50"
                          style={{
                            ...jostHeading,
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 2,
                          }}
                        >
                          RECHAZAR
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
