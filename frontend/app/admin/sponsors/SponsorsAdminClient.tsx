'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { ImageUploadInput } from '@/app/admin/operacionkursk2/components/ImageUploadInput'
import {
  deleteSponsor,
  reorderSponsors,
  upsertSponsor,
  type SponsorRow,
} from './actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

type Draft = {
  nombre: string
  logo_url: string
  link: string
  activo: boolean
  orden: number
}

function toDraft(row: SponsorRow): Draft {
  return {
    nombre: row.nombre,
    logo_url: row.logo_url,
    link: row.link,
    activo: row.activo,
    orden: row.orden,
  }
}

function emptyDraft(orden: number): Draft {
  return { nombre: '', logo_url: '', link: '', activo: true, orden }
}

export function SponsorsAdminClient({
  initialSponsors,
}: {
  initialSponsors: SponsorRow[]
}) {
  const router = useRouter()
  const [rows, setRows] = useState<SponsorRow[]>(initialSponsors)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const map: Record<string, Draft> = {}
    for (const row of initialSponsors) {
      map[row.id] = toDraft(row)
    }
    return map
  })
  const [adding, setAdding] = useState(false)
  const [newDraft, setNewDraft] = useState<Draft>(() =>
    emptyDraft((initialSponsors.at(-1)?.orden ?? 0) + 1)
  )
  const [savingId, setSavingId] = useState<string | 'new' | null>(null)
  const [savedId, setSavedId] = useState<string | 'new' | null>(null)
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SponsorRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRows(initialSponsors)
    setDrafts(() => {
      const map: Record<string, Draft> = {}
      for (const row of initialSponsors) {
        map[row.id] = toDraft(row)
      }
      return map
    })
  }, [initialSponsors])

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.orden - b.orden),
    [rows]
  )

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]'

  function setDraftField(id: string, key: keyof Draft, value: unknown) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }))
  }

  function setNewField(key: keyof Draft, value: unknown) {
    setNewDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSaveRow(id: string) {
    const draft = drafts[id]
    if (!draft) return

    setSavingId(id)
    setError(null)
    const res = await upsertSponsor({ id, ...draft })
    setSavingId(null)

    if ('error' in res) {
      setError(res.error)
      return
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              nombre: draft.nombre,
              logo_url: draft.logo_url,
              link: draft.link,
              activo: draft.activo,
              orden: draft.orden,
            }
          : r
      )
    )
    setSavedId(id)
    setTimeout(() => setSavedId((s) => (s === id ? null : s)), 2500)
    router.refresh()
  }

  async function handleSaveNew() {
    setSavingId('new')
    setError(null)
    const res = await upsertSponsor(newDraft)
    setSavingId(null)

    if ('error' in res) {
      setError(res.error)
      return
    }

    setAdding(false)
    setNewDraft(emptyDraft(sorted.length + 1))
    setSavedId('new')
    setTimeout(() => setSavedId(null), 2500)
    router.refresh()
  }

  async function handleToggleActivo(row: SponsorRow) {
    const draft = drafts[row.id] ?? toDraft(row)
    const nextActivo = !draft.activo

    setTogglingId(row.id)
    setError(null)
    const res = await upsertSponsor({
      id: row.id,
      ...draft,
      activo: nextActivo,
    })
    setTogglingId(null)

    if ('error' in res) {
      setError(res.error)
      return
    }

    setDraftField(row.id, 'activo', nextActivo)
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, activo: nextActivo } : r))
    )
    router.refresh()
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const list = [...sorted]
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) return

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= list.length) return

    const reordered = [...list]
    ;[reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]]

    setReorderingId(id)
    setError(null)
    const res = await reorderSponsors(reordered.map((r) => r.id))
    setReorderingId(null)

    if ('error' in res) {
      setError(res.error)
      return
    }

    const withOrder = reordered.map((r, i) => ({ ...r, orden: i + 1 }))
    setRows(withOrder)
    setDrafts((prev) => {
      const next = { ...prev }
      for (const r of withOrder) {
        next[r.id] = { ...(next[r.id] ?? toDraft(r)), orden: r.orden }
      }
      return next
    })
    router.refresh()
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    const res = await deleteSponsor(deleteTarget.id)
    setDeleteLoading(false)

    if ('error' in res) {
      setDeleteError(res.error)
      return
    }

    setDeleteTarget(null)
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id))
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[deleteTarget.id]
      return next
    })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-0" style={lato}>
      {error && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]">{error}</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-[#999999]">
          {sorted.length} sponsor{sorted.length === 1 ? '' : 's'} en el catálogo
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="border border-[#DDDDDD] bg-white px-4 py-2 text-[10px] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
            style={jost}
          >
            + Agregar sponsor
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FAFAFA] p-5">
          <p className="mb-4 text-[11px] tracking-[0.12em] text-[#111111]" style={jost}>
            Nuevo sponsor
          </p>
          <div className="flex flex-col gap-4">
            <Field label="Nombre">
              <input
                className={inputCls}
                value={newDraft.nombre}
                onChange={(e) => setNewField('nombre', e.target.value)}
                placeholder="Nombre del patrocinador"
              />
            </Field>
            <Field label="Link">
              <input
                className={inputCls}
                value={newDraft.link}
                onChange={(e) => setNewField('link', e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Logo">
              <ImageUploadInput
                slug="sponsors-catalog"
                value={newDraft.logo_url}
                onChange={(url) => setNewField('logo_url', url)}
              />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveNew}
              disabled={savingId === 'new'}
              className="bg-[#CC4B37] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60"
              style={jost}
            >
              {savingId === 'new' ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setNewDraft(emptyDraft(sorted.length + 1))
              }}
              className="border border-[#DDDDDD] bg-white px-5 py-2.5 text-[11px] tracking-[0.12em] text-[#666666]"
              style={jost}
            >
              Cancelar
            </button>
            {savedId === 'new' && (
              <span className="self-center text-[10px] font-bold text-[#22C55E]" style={jost}>
                Guardado
              </span>
            )}
          </div>
        </div>
      )}

      {sorted.length === 0 && !adding ? (
        <div className="border border-dashed border-[#DDDDDD] bg-[#FAFAFA] px-6 py-12 text-center">
          <p className="text-[13px] text-[#999999]">No hay sponsors en el catálogo.</p>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-4 border border-[#DDDDDD] bg-white px-4 py-2 text-[10px] tracking-[0.12em] text-[#111111] hover:border-[#CC4B37] hover:text-[#CC4B37]"
            style={jost}
          >
            + Agregar sponsor
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((row, i) => {
            const draft = drafts[row.id] ?? toDraft(row)
            const isSaving = savingId === row.id
            const isSaved = savedId === row.id
            const isReordering = reorderingId === row.id
            const isToggling = togglingId === row.id

            return (
              <div
                key={row.id}
                className={`border border-[#EEEEEE] bg-white transition-opacity ${!draft.activo ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-[#EEEEEE] bg-[#FAFAFA] px-4 py-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#666666]"
                    style={jost}
                  >
                    {i + 1}
                  </span>
                  <div className="flex h-10 w-20 shrink-0 items-center justify-center">
                    {draft.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={draft.logo_url}
                        alt={draft.nombre}
                        className="h-10 w-20 object-contain"
                      />
                    ) : (
                      <span className="text-xs text-[#AAAAAA]">Sin logo</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] text-[#111111]" style={jost}>
                      {draft.nombre || 'Sin nombre'}
                    </p>
                    {draft.link ? (
                      <a
                        href={draft.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[11px] text-[#CC4B37] underline"
                      >
                        {draft.link}
                      </a>
                    ) : (
                      <p className="text-[11px] text-[#AAAAAA]">Sin link</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReorder(row.id, 'up')}
                      disabled={i === 0 || isReordering}
                      className="border border-[#DDDDDD] bg-white px-2 py-1 text-[10px] disabled:opacity-30"
                      style={jost}
                      title="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(row.id, 'down')}
                      disabled={i === sorted.length - 1 || isReordering}
                      className="border border-[#DDDDDD] bg-white px-2 py-1 text-[10px] disabled:opacity-30"
                      style={jost}
                      title="Bajar"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(row)}
                      disabled={isToggling}
                      className={`flex items-center gap-1.5 transition-opacity ${isToggling ? 'opacity-50' : ''}`}
                      title={draft.activo ? 'Activo' : 'Inactivo'}
                    >
                      <span
                        className={`relative block h-5 w-9 transition-colors ${draft.activo ? 'bg-[#22C55E]' : 'bg-[#DDDDDD]'}`}
                        style={{ borderRadius: 10 }}
                      >
                        <span
                          className="absolute top-0.5 block h-4 w-4 bg-white shadow transition-transform"
                          style={{
                            borderRadius: '50%',
                            transform: draft.activo ? 'translateX(18px)' : 'translateX(2px)',
                          }}
                        />
                      </span>
                      <span
                        className={`text-[9px] font-extrabold uppercase ${draft.activo ? 'text-[#22C55E]' : 'text-[#AAAAAA]'}`}
                        style={jost}
                      >
                        {isToggling ? '…' : draft.activo ? 'ON' : 'OFF'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null)
                        setDeleteTarget(row)
                      }}
                      className="text-[10px] text-[#CC4B37] hover:underline"
                      style={jost}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-2">
                  <Field label="Nombre">
                    <input
                      className={inputCls}
                      value={draft.nombre}
                      onChange={(e) => setDraftField(row.id, 'nombre', e.target.value)}
                    />
                  </Field>
                  <Field label="Link">
                    <input
                      className={inputCls}
                      value={draft.link}
                      onChange={(e) => setDraftField(row.id, 'link', e.target.value)}
                      placeholder="https://..."
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Logo">
                      <ImageUploadInput
                        slug="sponsors-catalog"
                        value={draft.logo_url}
                        onChange={(url) => setDraftField(row.id, 'logo_url', url)}
                      />
                    </Field>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-[#EEEEEE] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSaveRow(row.id)}
                    disabled={isSaving}
                    className="bg-[#CC4B37] px-5 py-2 text-[11px] tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60"
                    style={jost}
                  >
                    {isSaving ? 'Guardando…' : 'Guardar'}
                  </button>
                  {isSaved && (
                    <span className="text-[10px] font-bold text-[#22C55E]" style={jost}>
                      Guardado
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-[11px] text-[#AAAAAA]">
        Los sponsors activos del catálogo están disponibles en las landings (ej.{' '}
        <Link href="/admin/virus3" className="text-[#CC4B37] underline">
          Virus 3
        </Link>
        ).
      </p>

      <DeleteConfirmModal
        open={!!deleteTarget}
        resourceLabel={deleteTarget ? `el sponsor «${deleteTarget.nombre || 'sin nombre'}»` : 'este sponsor'}
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]"
        style={jost}
      >
        {label}
      </span>
      {children}
    </div>
  )
}
