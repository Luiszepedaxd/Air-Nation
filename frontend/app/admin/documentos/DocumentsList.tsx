'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { deleteDocument, toggleDocumentPublish, type Authority } from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type DocumentListItem = {
  id: string
  title: string
  authority: string
  ciudad: string | null
  file_url: string | null
  published: boolean
  created_at: string | null
}

type FilterTab = 'todos' | Authority

function AuthorityBadge({ authority }: { authority: string }) {
  const a = authority as Authority
  if (a === 'GN') {
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
        GN
      </span>
    )
  }
  if (a === 'SSP') {
    return (
      <span
        className="inline-block text-[11px] font-semibold tracking-wide text-[#FFFFFF]"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#CC4B37',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        SSP
      </span>
    )
  }
  if (a === 'SCT') {
    return (
      <span
        className="inline-block border border-solid border-[#EEEEEE] text-[11px] font-semibold tracking-wide text-[#111111]"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#F4F4F4',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        SCT
      </span>
    )
  }
  if (a === 'PM') {
    return (
      <span
        className="inline-block text-[11px] font-semibold tracking-wide text-[#FFFFFF]"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#666666',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        PM
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
      {authority}
    </span>
  )
}

function PublishedBadge({ published }: { published: boolean }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: published ? '#CC4B37' : '#EEEEEE',
        color: published ? '#FFFFFF' : '#666666',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      {published ? 'PUBLICADO' : 'BORRADOR'}
    </span>
  )
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'todos', label: 'TODOS' },
  { id: 'GN', label: 'GN' },
  { id: 'SSP', label: 'SSP' },
  { id: 'SCT', label: 'SCT' },
  { id: 'PM', label: 'PM' },
]

export default function DocumentsList({
  documents: initialDocuments,
}: {
  documents: DocumentListItem[]
}) {
  const router = useRouter()
  const [documents, setDocuments] = useState<DocumentListItem[]>(initialDocuments)
  const [tab, setTab] = useState<FilterTab>('todos')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const filtered = useMemo(() => {
    if (tab === 'todos') return documents
    return documents.filter((d) => d.authority === tab)
  }, [documents, tab])

  const handleTogglePublish = async (id: string, nextPublished: boolean) => {
    setBusyId(id)
    const result = await toggleDocumentPublish(id, nextPublished)
    setBusyId(null)
    if ('error' in result && result.error) {
      window.alert(result.error)
      return
    }
    setDocuments((list) =>
      list.map((d) => (d.id === id ? { ...d, published: nextPublished } : d))
    )
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) {
      return
    }
    setDeletingId(id)
    const result = await deleteDocument(id)
    setDeletingId(null)
    if ('error' in result && result.error) {
      window.alert(result.error)
      return
    }
    setDocuments((list) => list.filter((d) => d.id !== id))
    router.refresh()
  }

  if (documents.length === 0) {
    return (
      <p
        className="py-16 text-center text-[#666666]"
        style={latoBody}
      >
        No hay documentos aún
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
          No hay documentos en esta categoría
        </p>
      ) : (
        <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
          <table className="w-full border-collapse text-left text-sm text-[#111111]">
            <thead>
              <tr className="bg-[#F4F4F4]">
                {(
                  [
                    'TÍTULO',
                    'AUTORIDAD',
                    'CIUDAD',
                    'ESTADO',
                    'FECHA',
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
              {filtered.map((d, i) => (
                <tr
                  key={d.id}
                  className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
                >
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {d.title}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <AuthorityBadge authority={d.authority} />
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {d.ciudad ?? '—'}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <PublishedBadge published={d.published} />
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {formatFecha(d.created_at)}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {d.file_url ? (
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                          style={{
                            ...jostHeading,
                            fontSize: 11,
                            padding: '4px 10px',
                            borderRadius: 2,
                          }}
                        >
                          VER PDF
                        </a>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center text-[#666666]"
                          style={{ ...jostHeading, fontSize: 11 }}
                        >
                          —
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={busyId === d.id}
                        onClick={() =>
                          handleTogglePublish(d.id, !d.published)
                        }
                        className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-50"
                        style={{
                          ...jostHeading,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 2,
                        }}
                      >
                        {busyId === d.id
                          ? '…'
                          : d.published
                            ? 'DESPUBLICAR'
                            : 'PUBLICAR'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === d.id}
                        onClick={() => handleDelete(d.id)}
                        className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#CC4B37] transition-colors hover:bg-[#FFF3F0] disabled:opacity-50"
                        style={{
                          ...jostHeading,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 2,
                        }}
                      >
                        {deletingId === d.id ? '…' : 'ELIMINAR'}
                      </button>
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
