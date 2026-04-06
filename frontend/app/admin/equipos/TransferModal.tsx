'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  searchUsersAction,
  type UserSearchRow,
} from '../search-users-action'
import { transferTeamAction } from './transfer-actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type TransferModalProps = {
  open: boolean
  onClose: () => void
  teamId: string
  resourceName: string
  onSuccess: () => void
}

export function TransferModal({
  open,
  onClose,
  teamId,
  resourceName,
  onSuccess,
}: TransferModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSearchRow[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setSelectedUser(null)
      setError('')
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = window.setTimeout(() => {
      void (async () => {
        const res = await searchUsersAction(q)
        setLoading(false)
        if ('error' in res) {
          setError(res.error)
          setResults([])
          return
        }
        setError('')
        setResults(res.users)
      })()
    }, 300)
    return () => window.clearTimeout(t)
  }, [query, open])

  useEffect(() => {
    setSelectedUser(null)
  }, [query])

  if (!open) return null

  const handleConfirm = async () => {
    if (!selectedUser) return
    setConfirming(true)
    setError('')
    const res = await transferTeamAction(teamId, selectedUser.id)
    setConfirming(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    onClose()
    onSuccess()
  }

  const nameDisplay = resourceName.trim() || 'EQUIPO'

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-team-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <h2
            id="transfer-team-modal-title"
            className="text-base font-black uppercase leading-tight text-[#111111]"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            TRANSFERIR {nameDisplay}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[12px] text-[#666666] hover:text-[#111111]"
            style={latoBody}
          >
            Cerrar
          </button>
        </div>

        <label className="mt-4 block text-[12px] text-[#666666]" style={latoBody}>
          Buscar por alias o email
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por alias o email..."
            autoComplete="off"
            className="mt-1 w-full border border-solid border-[#EEEEEE] px-3 py-2 text-sm text-[#111111]"
            style={{ ...latoBody, borderRadius: 2 }}
          />
        </label>

        {query.trim().length > 0 && query.trim().length < 2 ? (
          <p className="mt-3 text-[12px] text-[#666666]" style={latoBody}>
            Escribe al menos 2 caracteres.
          </p>
        ) : null}

        {loading ? (
          <p className="mt-3 text-[12px] text-[#666666]" style={latoBody}>
            Buscando…
          </p>
        ) : null}

        {query.trim().length >= 2 && !loading ? (
          <ul className="mt-4 flex flex-col gap-2">
            {results.length === 0 ? (
              <li className="text-[13px] text-[#666666]" style={latoBody}>
                Sin resultados.
              </li>
            ) : (
              results.map((u) => {
                const selected = selectedUser?.id === u.id
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      className={`flex w-full items-center gap-3 border border-solid p-3 text-left transition-colors ${
                        selected
                          ? 'border-[#CC4B37] bg-[#FFF8F7]'
                          : 'border-[#EEEEEE] bg-[#FFFFFF] hover:bg-[#F9F9F9]'
                      }`}
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-[11px] text-[#CC4B37]"
                            style={jostHeading}
                          >
                            {(u.alias?.[0] || u.nombre?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[13px] font-bold text-[#111111]"
                          style={latoBody}
                        >
                          {u.alias?.trim()
                            ? `@${u.alias.trim()}`
                            : u.nombre?.trim() || '—'}
                        </p>
                        <p className="truncate text-xs text-[#666666]" style={latoBody}>
                          {u.email ?? '—'}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        ) : null}

        {selectedUser ? (
          <div className="mt-4 border-t border-solid border-[#EEEEEE] pt-4">
            <button
              type="button"
              disabled={confirming}
              onClick={() => void handleConfirm()}
              className="w-full bg-[#1B5E20] px-3 py-2.5 text-[10px] text-[#FFFFFF] transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ ...jostHeading, borderRadius: 2 }}
            >
              {confirming ? '…' : 'CONFIRMAR TRANSFERENCIA'}
            </button>
          </div>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-[#CC4B37]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function TransferTeamTrigger({
  teamId,
  resourceName,
}: {
  teamId: string
  resourceName: string
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center border border-[#111111] px-3 py-1.5 font-bold text-[0.7rem] uppercase tracking-[0.15em] text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
        style={jostHeading}
      >
        TRANSFERIR
      </button>
      <TransferModal
        open={open}
        onClose={() => setOpen(false)}
        teamId={teamId}
        resourceName={resourceName}
        onSuccess={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}
