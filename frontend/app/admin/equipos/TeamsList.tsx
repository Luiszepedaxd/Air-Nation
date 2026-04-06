'use client'

import { useEffect, useState } from 'react'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { deleteTeam } from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type TeamListItem = {
  id: string
  nombre: string
  ciudad: string | null
  status: string | null
  created_at: string | null
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

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? '').toLowerCase()
  const isActivo = s === 'activo'
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: isActivo ? '#111111' : '#EEEEEE',
        color: isActivo ? '#FFFFFF' : '#666666',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      {(status ?? '—').toUpperCase()}
    </span>
  )
}

export default function TeamsList({
  teams: initialTeams,
}: {
  teams: TeamListItem[]
}) {
  const [teams, setTeams] = useState<TeamListItem[]>(initialTeams)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TeamListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setTeams(initialTeams)
  }, [initialTeams])

  const openDelete = (t: TeamListItem) => {
    setPendingDelete(t)
    setDeleteError(null)
  }

  const closeDelete = () => {
    if (deletingId) return
    setPendingDelete(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    setDeleteError(null)
    const result = await deleteTeam(pendingDelete.id)
    setDeletingId(null)
    if ('error' in result && result.error) {
      setDeleteError(result.error)
      return
    }
    setTeams((prev) => prev.filter((x) => x.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  if (teams.length === 0) {
    return (
      <p className="py-16 text-center text-[#666666]" style={latoBody}>
        No hay equipos registrados
      </p>
    )
  }

  return (
    <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]" style={latoBody}>
      <table className="w-full border-collapse text-left text-sm text-[#111111]">
        <thead>
          <tr className="bg-[#F4F4F4]">
            {(['NOMBRE', 'CIUDAD', 'STATUS', 'FECHA', 'ACCIONES'] as const).map(
              (col) => (
                <th
                  key={col}
                  className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px] text-[#111111]"
                  style={jostHeading}
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr
              key={t.id}
              className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
            >
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                {t.nombre}
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                {t.ciudad ?? '—'}
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                <StatusBadge status={t.status} />
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                {formatFecha(t.created_at)}
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                <button
                  type="button"
                  disabled={deletingId === t.id}
                  onClick={() => openDelete(t)}
                  className="border border-[#CC4B37] px-3 py-1.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white disabled:opacity-50"
                  style={{ borderRadius: 2 }}
                >
                  {deletingId === t.id ? '…' : 'ELIMINAR'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DeleteConfirmModal
        open={pendingDelete !== null}
        resourceLabel={pendingDelete?.nombre ?? ''}
        loading={pendingDelete !== null && deletingId === pendingDelete.id}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
