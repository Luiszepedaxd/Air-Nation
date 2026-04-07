'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { deleteUser, updateUserRole } from './actions'
import { UserTeamAssignSection } from './UserTeamAssignSection'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type User = {
  id: string
  nombre: string | null
  alias: string | null
  email: string | null
  ciudad: string | null
  rol: string | null
  app_role: string | null
  member_number: string | number | null
  created_at: string | null
}

type AppRole = 'player' | 'admin' | 'field_owner'

const ROLE_OPTIONS: { label: string; value: AppRole }[] = [
  { label: 'PLAYER', value: 'player' },
  { label: 'ADMIN', value: 'admin' },
  { label: 'FIELD OWNER', value: 'field_owner' },
]

function formatRegistro(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function AppRoleBadge({ role }: { role: string | null }) {
  const r = role ?? 'player'
  const isAdmin = r === 'admin'
  const isFieldOwner = r === 'field_owner'
  const bg = isAdmin ? '#CC4B37' : isFieldOwner ? '#111111' : '#EEEEEE'
  const color = isAdmin || isFieldOwner ? '#FFFFFF' : '#666666'
  const display =
    r === 'field_owner'
      ? 'FIELD OWNER'
      : r === 'admin'
        ? 'ADMIN'
        : 'PLAYER'

  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: bg,
        color,
        ...jostHeading,
        fontSize: 10,
      }}
    >
      {display}
    </span>
  )
}

export default function UsersTable({
  users: initialUsers,
  currentUserId,
}: {
  users: User[]
  currentUserId: string | null
}) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [modalUser, setModalUser] = useState<User | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [teamAssignUserId, setTeamAssignUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'verificados' | 'pendientes'>(
    'verificados'
  )
  const [sendingMail, setSendingMail] = useState(false)
  const [mailResult, setMailResult] = useState<string | null>(null)

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const verificados = useMemo(
    () => users.filter((u) => u.nombre && u.nombre.trim() !== ''),
    [users]
  )

  const pendientes = useMemo(
    () => users.filter((u) => !u.nombre || u.nombre.trim() === ''),
    [users]
  )

  const filteredVerificados = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return verificados
    return verificados.filter((u) => {
      const nombre = (u.nombre ?? '').toLowerCase()
      const alias = (u.alias ?? '').toLowerCase()
      return nombre.includes(q) || alias.includes(q)
    })
  }, [verificados, search])

  const filteredPendientes = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pendientes
    return pendientes.filter((u) => {
      const nombre = (u.nombre ?? '').toLowerCase()
      const alias = (u.alias ?? '').toLowerCase()
      const email = (u.email ?? '').toLowerCase()
      return nombre.includes(q) || alias.includes(q) || email.includes(q)
    })
  }, [pendientes, search])

  const tableRows =
    activeTab === 'verificados' ? filteredVerificados : filteredPendientes

  const openModal = (u: User) => {
    setModalUser(u)
    setModalError(null)
    setPendingRole(null)
  }

  const closeModal = () => {
    setModalUser(null)
    setModalError(null)
    setPendingRole(null)
  }

  const openDeleteModal = (u: User) => {
    setDeleteTarget(u)
    setDeleteError(null)
  }

  const closeDeleteModal = () => {
    if (deleteLoading) return
    setDeleteTarget(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    const result = await deleteUser(deleteTarget.id)
    setDeleteLoading(false)
    if ('error' in result && result.error) {
      setDeleteError(result.error)
      return
    }
    setUsers((prev) => prev.filter((x) => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const deleteResourceLabel = deleteTarget
    ? `${deleteTarget.alias?.trim() || '—'} (${deleteTarget.email?.trim() || 'sin email'})`
    : ''

  const rawRole = modalUser?.app_role
  const currentModalRole: AppRole =
    rawRole === 'admin' || rawRole === 'field_owner' || rawRole === 'player'
      ? rawRole
      : 'player'

  const handleSelectRole = async (newRole: AppRole) => {
    if (!modalUser || newRole === currentModalRole) return
    setModalError(null)
    setPendingRole(newRole)
    const result = await updateUserRole(modalUser.id, newRole)
    setPendingRole(null)
    if ('error' in result && result.error) {
      setModalError(result.error)
      return
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === modalUser.id ? { ...u, app_role: newRole } : u
      )
    )
    closeModal()
  }

  const handleSendReminders = async () => {
    const targets = filteredPendientes.filter((u) => u.email)
    if (targets.length === 0) return
    setSendingMail(true)
    setMailResult(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setMailResult('Sesión expirada. Recarga la página.')
        return
      }
      const API_URL = (
        process.env.NEXT_PUBLIC_API_URL ||
        'https://air-nation-production.up.railway.app/api/v1'
      ).replace(/\/$/, '')
      const res = await fetch(`${API_URL}/admin/send-onboarding-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          users: targets.map((u) => ({ email: u.email })),
        }),
      })
      const data = (await res.json()) as { sent?: number; failed?: number }
      setMailResult(
        `Enviados: ${data.sent ?? 0} · Fallidos: ${data.failed ?? 0}`
      )
    } catch {
      setMailResult('Error al enviar. Intenta de nuevo.')
    } finally {
      setSendingMail(false)
    }
  }

  return (
    <div style={latoBody}>
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre o alias..."
        className="mb-6 w-full max-w-[400px] text-[#111111] outline-none placeholder:text-[#999999]"
        style={{
          ...latoBody,
          border: '1px solid #EEEEEE',
          borderRadius: 2,
          padding: '8px 12px',
        }}
      />

      <div className="mb-6 flex gap-0 border-b border-[#EEEEEE]">
        <button
          type="button"
          onClick={() => setActiveTab('verificados')}
          style={jostHeading}
          className={`border-b-2 px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
            activeTab === 'verificados'
              ? 'border-[#CC4B37] text-[#111111]'
              : 'border-transparent text-[#999999]'
          }`}
        >
          VERIFICADOS ({verificados.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pendientes')}
          style={jostHeading}
          className={`border-b-2 px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
            activeTab === 'pendientes'
              ? 'border-[#CC4B37] text-[#111111]'
              : 'border-transparent text-[#999999]'
          }`}
        >
          PENDIENTES ({pendientes.length})
        </button>
      </div>

      {activeTab === 'pendientes' && (
        <div className="mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => void handleSendReminders()}
            disabled={
              sendingMail || filteredPendientes.filter((u) => u.email).length === 0
            }
            style={jostHeading}
            className="bg-[#CC4B37] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {sendingMail
              ? 'ENVIANDO...'
              : `ENVIAR RECORDATORIO A ${filteredPendientes.filter((u) => u.email).length} USUARIOS`}
          </button>
          {mailResult && (
            <p style={jostHeading} className="text-[11px] text-[#666666]">
              {mailResult}
            </p>
          )}
        </div>
      )}

      <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
        <table className="w-full border-collapse text-left text-sm text-[#111111]">
          <thead>
            <tr className="bg-[#F4F4F4]">
              {(
                [
                  'NOMBRE',
                  'ALIAS',
                  'CIUDAD',
                  'ROL',
                  'APP ROLE',
                  'Nº MIEMBRO',
                  'REGISTRO',
                  'ACCIONES',
                  '',
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
            {tableRows.map((u, i) => (
              <Fragment key={u.id}>
                <tr
                  className={
                    i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'
                  }
                >
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {activeTab === 'pendientes'
                      ? u.nombre && u.nombre.trim() !== ''
                        ? u.nombre
                        : (u.email ?? '—')
                      : (u.nombre ?? '—')}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {u.alias ?? '—'}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {u.ciudad ?? '—'}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {u.rol ?? '—'}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <AppRoleBadge role={u.app_role} />
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {u.member_number != null ? String(u.member_number) : '—'}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {formatRegistro(u.created_at)}
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(u)}
                        className="bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                        style={{
                          ...jostHeading,
                          fontSize: 11,
                          padding: '4px 10px',
                          borderRadius: 2,
                        }}
                      >
                        CAMBIAR ROL
                      </button>
                      {currentUserId && u.id !== currentUserId ? (
                        <button
                          type="button"
                          onClick={() => openDeleteModal(u)}
                          className="border border-[#CC4B37] px-3 py-1.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white"
                          style={{ borderRadius: 2 }}
                        >
                          ELIMINAR
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="border border-solid border-[#EEEEEE] px-2 py-2 align-top">
                    <button
                      type="button"
                      onClick={() =>
                        setTeamAssignUserId((prev) =>
                          prev === u.id ? null : u.id
                        )
                      }
                      className="whitespace-nowrap border border-solid border-[#111111] bg-[#FFFFFF] px-2 py-1.5 text-[10px] text-[#111111] transition-colors hover:bg-[#EEEEEE]"
                      style={{ ...jostHeading, borderRadius: 2 }}
                      aria-expanded={teamAssignUserId === u.id}
                    >
                      {teamAssignUserId === u.id ? 'CERRAR' : 'EQUIPO'}
                    </button>
                  </td>
                </tr>
                {teamAssignUserId === u.id ? (
                  <tr
                    className={
                      i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'
                    }
                  >
                    <td
                      colSpan={9}
                      className="border border-solid border-[#EEEEEE] px-3 py-3"
                    >
                      <UserTeamAssignSection userId={u.id} />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {modalUser && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/50 p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            className="relative w-full max-w-md border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#111111]"
            style={{ padding: 24, borderRadius: 0 }}
            role="dialog"
            aria-labelledby="modal-role-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-xl leading-none text-[#666666] transition-colors hover:text-[#111111]"
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2
              id="modal-role-title"
              className="mb-6 pr-10 text-lg tracking-[0.1em] text-[#111111]"
              style={jostHeading}
            >
              CAMBIAR ROL DE {modalUser.alias ?? modalUser.nombre ?? '—'}
            </h2>

            {modalError && (
              <p className="mb-4 text-sm" style={{ color: '#CC4B37' }}>
                {modalError}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map(({ label, value }) => {
                const isCurrent = value === currentModalRole
                const isLoading = pendingRole === value
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isCurrent || isLoading || pendingRole !== null}
                    onClick={() => handleSelectRole(value)}
                    className={
                      isCurrent
                        ? 'cursor-not-allowed bg-[#EEEEEE] text-[#666666]'
                        : 'bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37] disabled:opacity-70'
                    }
                    style={{
                      ...jostHeading,
                      padding: '10px 16px',
                      borderRadius: 2,
                      fontSize: 12,
                    }}
                  >
                    {isLoading ? '…' : label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={deleteTarget !== null}
        resourceLabel={deleteResourceLabel}
        loading={deleteLoading}
        error={deleteError}
        onClose={closeDeleteModal}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
