'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { insertTransferNotif } from '@/lib/user-notifications'
import type { ReplicaRow } from '../ArsenalClient'
import { ArsenalIcon } from '../ArsenalClient'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type PendingTransferData = {
  id: string
  nota: string | null
  created_at: string
  to_user: { alias: string | null; nombre: string | null; avatar_url: string | null }
}

type IncomingTransferData = {
  id: string
  nota: string | null
  created_at: string
  from_user: { alias: string | null; nombre: string | null; avatar_url: string | null }
}

export function ReplicaDetailClient({
  replica: initialReplica,
  isOwner,
  currentUserId,
  pendingTransfer: initialPendingTransfer,
  incomingTransfer: initialIncomingTransfer,
}: {
  replica: ReplicaRow
  isOwner: boolean
  currentUserId: string
  pendingTransfer: PendingTransferData | null
  incomingTransfer: IncomingTransferData | null
}) {
  const router = useRouter()
  const [replica] = useState(initialReplica)
  const [pendingTransfer, setPendingTransfer] = useState(initialPendingTransfer)
  const [incomingTransfer, setIncomingTransfer] = useState(initialIncomingTransfer)
  const [processingTransfer, setProcessingTransfer] = useState(false)
  const [transferResolved, setTransferResolved] = useState<'accepted' | 'rejected' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferAlias, setTransferAlias] = useState('')
  const [transferNota, setTransferNota] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [searchingUser, setSearchingUser] = useState(false)
  const [foundUser, setFoundUser] = useState<{ id: string; alias: string | null; nombre: string | null; avatar_url: string | null } | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta réplica? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    const { error } = await supabase.from('arsenal').delete().eq('id', replica.id)
    if (!error) {
      router.push('/dashboard/arsenal')
      router.refresh()
    }
    setDeleting(false)
  }

  const handleTransfer = async () => {
    if (!transferAlias.trim()) { setTransferError('Escribe el alias del receptor.'); return }
    setTransferring(true)
    setTransferError('')
    try {
      const targetUser = foundUser
      if (!targetUser) { setTransferError('Escribe un alias válido y espera a que aparezca el operador.'); return }
      if (targetUser.id === currentUserId) { setTransferError('No puedes transferirte a ti mismo.'); return }

      const { error } = await supabase.from('arsenal_transfers').insert({
        replica_id: replica.id,
        from_user_id: currentUserId,
        to_user_id: targetUser.id,
        nota: transferNota.trim() || null,
        status: 'pendiente',
      })

      if (error) throw error

      const { data: newTransfer } = await supabase
        .from('arsenal_transfers')
        .select('id, nota, created_at')
        .eq('replica_id', replica.id)
        .eq('status', 'pendiente')
        .maybeSingle()

      setPendingTransfer(newTransfer ? {
        id: String(newTransfer.id),
        nota: (newTransfer.nota as string | null) ?? null,
        created_at: String(newTransfer.created_at),
        to_user: {
          alias: targetUser.alias ?? null,
          nombre: targetUser.nombre ?? null,
          avatar_url: targetUser.avatar_url ?? null,
        },
      } : null)

      await insertTransferNotif(supabase, {
        actorId: currentUserId,
        recipientId: targetUser.id,
        replicaNombre: replica.nombre,
        transferId: '',
        type: 'transfer_request',
        replicaId: replica.id,
      })
      setTransferSuccess(true)
      setShowTransfer(false)
      router.refresh()
    } catch { setTransferError('Error al enviar la solicitud. Intenta de nuevo.') }
    finally { setTransferring(false) }
  }

  const handleAcceptTransfer = async () => {
    if (!incomingTransfer) return
    setProcessingTransfer(true)
    try {
      const { error } = await supabase.rpc('accept_arsenal_transfer', {
        p_transfer_id: incomingTransfer.id,
        p_user_id: currentUserId,
      })
      if (error) throw error

      await insertTransferNotif(supabase, {
        actorId: currentUserId,
        recipientId: replica.user_id ?? '',
        replicaNombre: replica.nombre,
        transferId: incomingTransfer.id,
        type: 'transfer_accepted',
        replicaId: replica.id,
      })

      setTransferResolved('accepted')
      setIncomingTransfer(null)
      router.refresh()
    } catch { /* noop */ }
    finally { setProcessingTransfer(false) }
  }

  const handleRejectTransfer = async () => {
    if (!incomingTransfer) return
    setProcessingTransfer(true)
    try {
      const { error } = await supabase
        .from('arsenal_transfers')
        .update({ status: 'rechazada', updated_at: new Date().toISOString() })
        .eq('id', incomingTransfer.id)
      if (error) throw error

      await insertTransferNotif(supabase, {
        actorId: currentUserId,
        recipientId: replica.user_id ?? '',
        replicaNombre: replica.nombre,
        transferId: incomingTransfer.id,
        type: 'transfer_rejected',
        replicaId: replica.id,
      })

      setTransferResolved('rejected')
      setIncomingTransfer(null)
      router.refresh()
    } catch { /* noop */ }
    finally { setProcessingTransfer(false) }
  }

  const inputClass = 'w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="mx-auto max-w-[480px] px-4 py-6">
        <Link href="/dashboard/arsenal" style={jost} className="mb-4 flex items-center gap-2 text-[11px] font-extrabold uppercase text-[#999999]">
          ← Mi Arsenal
        </Link>

        <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
          {replica.foto_url ? (
            <img src={replica.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center"><ArsenalIcon /></div>
          )}
          {replica.verificada && (
            <span className="absolute left-3 top-3 bg-[#CC4B37] px-2 py-1 text-[10px] font-extrabold uppercase text-white" style={jost}>✓ Verificada</span>
          )}
          {replica.en_venta && (
            <span className="absolute right-3 top-3 bg-[#111111] px-2 py-1 text-[10px] font-extrabold uppercase text-white" style={jost}>En venta</span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <h1 style={jost} className="text-[22px] font-extrabold uppercase text-[#111111]">{replica.nombre}</h1>

          <div className="flex flex-wrap gap-2">
            {replica.sistema && <span className="border border-[#EEEEEE] px-3 py-1 text-[11px] text-[#666666]" style={lato}>{replica.sistema}</span>}
            {replica.mecanismo && <span className="border border-[#EEEEEE] px-3 py-1 text-[11px] text-[#666666]" style={lato}>{replica.mecanismo}</span>}
            {replica.condicion && <span className="border border-[#EEEEEE] px-3 py-1 text-[11px] text-[#666666]" style={lato}>{replica.condicion === 'upgrades' ? 'Con upgrades' : 'Stock'}</span>}
          </div>

          {replica.upgrades && (
            <div className="border-l-2 border-[#CC4B37] pl-3">
              <p className="text-[11px] font-bold uppercase text-[#999999]" style={jost}>Upgrades</p>
              <p className="text-[13px] text-[#111111]" style={lato}>{replica.upgrades}</p>
            </div>
          )}

          {replica.serial && (
            <p className="text-[12px] text-[#666666]" style={lato}>Serie: <span className="font-semibold text-[#111111]">{replica.serial}</span></p>
          )}

          {replica.descripcion && (
            <p className="text-[13px] text-[#111111] leading-relaxed" style={lato}>{replica.descripcion}</p>
          )}

          {replica.ciudad && (
            <p className="text-[12px] text-[#999999]" style={lato}>{replica.ciudad}{replica.estado ? `, ${replica.estado}` : ''}</p>
          )}
        </div>

        {!isOwner && incomingTransfer && !transferResolved && (
          <div className="mt-8 border-2 border-[#CC4B37] p-4">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#CC4B37] mb-3">
              Te quieren transferir esta réplica
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                {incomingTransfer.from_user.avatar_url ? (
                  <img src={incomingTransfer.from_user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[12px] font-bold text-[#CC4B37]" style={jost}>
                    {(incomingTransfer.from_user.alias || incomingTransfer.from_user.nombre || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p style={lato} className="text-[13px] font-semibold text-[#111111]">
                  {incomingTransfer.from_user.nombre || incomingTransfer.from_user.alias}
                </p>
                {incomingTransfer.from_user.alias && (
                  <p style={lato} className="text-[11px] text-[#999999]">@{incomingTransfer.from_user.alias}</p>
                )}
              </div>
            </div>
            {incomingTransfer.nota && (
              <div className="mb-3 border-l-2 border-[#EEEEEE] pl-3">
                <p style={lato} className="text-[12px] text-[#666666]">{incomingTransfer.nota}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={() => void handleAcceptTransfer()} disabled={processingTransfer} style={jost}
                className="flex-1 bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase text-white disabled:opacity-50">
                {processingTransfer ? 'Procesando…' : 'Aceptar'}
              </button>
              <button type="button" onClick={() => void handleRejectTransfer()} disabled={processingTransfer} style={jost}
                className="flex-1 border border-[#EEEEEE] py-3 text-[11px] font-extrabold uppercase text-[#666666] disabled:opacity-50">
                Rechazar
              </button>
            </div>
          </div>
        )}

        {!isOwner && transferResolved && (
          <div className="mt-8 border border-[#EEEEEE] bg-[#F4F4F4] p-4 text-center">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
              {transferResolved === 'accepted' ? 'Réplica aceptada' : 'Transferencia rechazada'}
            </p>
            <p style={lato} className="mt-1 text-[12px] text-[#666666]">
              {transferResolved === 'accepted'
                ? 'La réplica ahora aparece en tu arsenal'
                : 'Le notificamos al remitente'}
            </p>
            {transferResolved === 'accepted' && (
              <Link href="/dashboard/arsenal" style={jost}
                className="mt-3 inline-flex items-center justify-center bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-white">
                Ver mi arsenal
              </Link>
            )}
          </div>
        )}

        {isOwner && !showTransfer && (
          <div className="mt-8 flex flex-col gap-3">
            {pendingTransfer ? (
              <div className="border border-[#F59E0B] bg-[#FFFBEB] p-4">
                <p style={jost} className="text-[11px] font-extrabold uppercase text-[#D97706]">Transferencia pendiente</p>
                <p style={lato} className="mt-1 text-[12px] text-[#666666]">
                  Enviada a{' '}
                  <span className="font-semibold text-[#111111]">
                    {pendingTransfer.to_user.alias ? `@${pendingTransfer.to_user.alias}` : pendingTransfer.to_user.nombre ?? 'Operador'}
                  </span>
                </p>
                {pendingTransfer.nota && (
                  <p style={lato} className="mt-1 text-[12px] text-[#999999]">{pendingTransfer.nota}</p>
                )}
                <p style={lato} className="mt-2 text-[11px] text-[#999999]">
                  Esperando que el receptor acepte o rechace
                </p>
              </div>
            ) : (
              <>
                <button type="button" onClick={() => setShowTransfer(true)} style={jost}
                  className="w-full border border-[#111111] py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-white">
                  Transferir réplica
                </button>
                <button type="button" onClick={() => void handleDelete()} disabled={deleting} style={jost}
                  className="w-full border border-[#EEEEEE] py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#CC4B37] transition-colors hover:border-[#CC4B37] disabled:opacity-50">
                  {deleting ? 'Eliminando…' : 'Eliminar réplica'}
                </button>
              </>
            )}
          </div>
        )}

        {isOwner && showTransfer && !transferSuccess && (
          <div className="mt-8 border border-[#EEEEEE] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">Transferir réplica</p>
              <button type="button" onClick={() => { setShowTransfer(false); setTransferError('') }} className="text-[#999999] hover:text-[#111111]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <p className="mb-4 text-[12px] text-[#666666]" style={lato}>
              El receptor recibirá una solicitud de transferencia. La réplica cambia de dueño solo si la acepta.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#999999]" style={jost}>
                  Alias del receptor *
                </label>
                <input type="text" className={inputClass} placeholder="@alias del operador" value={transferAlias}
                onChange={e => {
                  const val = e.target.value.replace('@', '')
                  setTransferAlias(val)
                  setFoundUser(null)
                  setTransferError('')
                  if (searchTimeout.current) clearTimeout(searchTimeout.current)
                  if (val.trim().length < 2) {
                    setSearchingUser(false)
                    return
                  }
                  setSearchingUser(true)
                  searchTimeout.current = setTimeout(async () => {
                    const q = val.trim()
                    const { data } = await supabase
                      .from('users')
                      .select('id, alias, nombre, avatar_url')
                      .or(`alias.ilike.%${q}%,nombre.ilike.%${q}%`)
                      .neq('id', currentUserId)
                      .limit(1)
                      .maybeSingle()
                    setSearchingUser(false)
                    if (data) setFoundUser(data)
                    else setTransferError('No se encontró ningún operador con ese alias.')
                  }, 500)
                }}
              />
              {searchingUser && (
                <p className="mt-1 text-[11px] text-[#999999]" style={lato}>Buscando…</p>
              )}
              {foundUser && !searchingUser && (
                <div className="mt-2 flex items-center gap-3 border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[#EEEEEE]">
                    {foundUser.avatar_url ? (
                      <img src={foundUser.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] font-bold text-[#CC4B37]" style={jost}>
                        {(foundUser.alias || foundUser.nombre || '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#111111]" style={lato}>{foundUser.nombre || foundUser.alias}</p>
                    {foundUser.alias && <p className="text-[11px] text-[#999999]" style={lato}>@{foundUser.alias}</p>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="ml-auto text-[#CC4B37]">
                    <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#999999]" style={jost}>
                  Nota <span className="normal-case font-normal tracking-normal text-[#AAAAAA]">(opcional)</span>
                </label>
                <textarea className={`${inputClass} resize-none`} rows={2} placeholder="Ej. Vendida, acordado $X" value={transferNota}
                  onChange={e => setTransferNota(e.target.value)} maxLength={200} />
              </div>
              {transferError && <p className="text-[12px] text-[#CC4B37]" style={lato}>{transferError}</p>}
              <button type="button" onClick={() => void handleTransfer()} disabled={transferring} style={jost}
                className="w-full bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50">
                {transferring ? 'Enviando…' : 'Enviar solicitud de transferencia'}
              </button>
            </div>
          </div>
        )}

        {transferSuccess && !pendingTransfer && (
          <div className="mt-8 border border-[#EEEEEE] bg-[#F4F4F4] p-4 text-center">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">Solicitud enviada</p>
            <p style={lato} className="mt-1 text-[12px] text-[#666666]">El receptor debe aceptar para completar la transferencia</p>
          </div>
        )}
      </div>
    </main>
  )
}
