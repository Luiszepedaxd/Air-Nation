'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/apiFetch'
import { ArsenalIcon } from '../ArsenalClient'
import type { ReplicaRow } from '../ArsenalClient'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type PendingTransfer = {
  id: string
  nota: string | null
  created_at: string
  to_user: { alias: string | null; nombre: string | null; avatar_url: string | null }
}

type IncomingTransfer = {
  id: string
  nota: string | null
  created_at: string
  from_user: { alias: string | null; nombre: string | null; avatar_url: string | null }
}

export function ReplicaDetailClient({
  replica: initialReplica,
  isOwner,
  currentUserId,
  pendingTransfer,
  incomingTransfer,
  originalOwnerId,
}: {
  replica: ReplicaRow
  isOwner: boolean
  currentUserId: string
  pendingTransfer: PendingTransfer | null
  incomingTransfer: IncomingTransfer | null
  originalOwnerId: string
}) {
  const router = useRouter()
  const [replica, setReplica] = useState(initialReplica)
  const [transferAlias, setTransferAlias] = useState('')
  const [transferNota, setTransferNota] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState('')
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const handleToggleVenta = async () => {
    const { error } = await supabase
      .from('arsenal')
      .update({ en_venta: !replica.en_venta })
      .eq('id', replica.id)
    if (!error) setReplica(r => ({ ...r, en_venta: !r.en_venta }))
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta réplica? Esta acción no se puede deshacer.')) return
    await supabase.from('arsenal').delete().eq('id', replica.id)
    router.push('/dashboard/arsenal')
  }

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadingFoto(true)
    try {
      const url = await uploadFile(file)
      await supabase.from('arsenal').update({ foto_url: url }).eq('id', replica.id)
      setReplica(r => ({ ...r, foto_url: url }))
    } catch { /* noop */ }
    finally { setUploadingFoto(false) }
  }

  const handleTransfer = async () => {
    if (!transferAlias.trim()) { setTransferError('Escribe el alias del jugador.'); return }
    setTransferring(true)
    setTransferError('')
    try {
      const { data: targetUser } = await supabase
        .from('users')
        .select('id, alias')
        .ilike('alias', transferAlias.trim())
        .maybeSingle()
      if (!targetUser) { setTransferError('No se encontró un jugador con ese alias.'); return }
      if (targetUser.id === currentUserId) { setTransferError('No puedes transferirte a ti mismo.'); return }
      const { error } = await supabase.from('arsenal_transfers').insert({
        replica_id: replica.id,
        from_user_id: currentUserId,
        to_user_id: targetUser.id,
        nota: transferNota.trim() || null,
        status: 'pendiente',
      })
      if (error) throw error
      setShowTransferForm(false)
      setTransferAlias('')
      setTransferNota('')
      router.refresh()
    } catch { setTransferError('Error al enviar la transferencia.') }
    finally { setTransferring(false) }
  }

  const handleAcceptTransfer = async () => {
    if (!incomingTransfer) return
    setAccepting(true)
    try {
      const { error } = await supabase.rpc('accept_arsenal_transfer', {
        p_transfer_id: incomingTransfer.id,
        p_user_id: currentUserId,
      })
      if (error) throw error
      router.push('/dashboard/arsenal')
    } catch { /* noop */ }
    finally { setAccepting(false) }
  }

  const handleCancelTransfer = async () => {
    if (!pendingTransfer) return
    await supabase.from('arsenal_transfers').delete().eq('id', pendingTransfer.id)
    router.refresh()
  }

  const inputClass = 'w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="mx-auto max-w-[640px] px-4 py-6 md:px-6">

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link href="/dashboard/arsenal" className="text-[#999999] hover:text-[#111111]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 style={jost} className="flex-1 text-[18px] font-extrabold uppercase text-[#111111] line-clamp-1">
            {replica.nombre}
          </h1>
          {replica.verificada && (
            <span style={jost} className="bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
              ✓ Verificada
            </span>
          )}
        </div>

        {/* Foto */}
        <div className="relative aspect-video w-full overflow-hidden border border-[#EEEEEE] bg-[#111111]">
          {replica.foto_url
            ? <img src={replica.foto_url} alt="" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center"><ArsenalIcon /></div>
          }
          {isOwner && (
            <label className="absolute bottom-2 right-2 cursor-pointer bg-black/60 px-3 py-1.5 text-[10px] font-extrabold uppercase text-white" style={jost}>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFoto} disabled={uploadingFoto} />
              {uploadingFoto ? 'Subiendo…' : 'Cambiar foto'}
            </label>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {replica.sistema && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Sistema</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111]">{replica.sistema}</p>
            </div>
          )}
          {replica.mecanismo && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Mecanismo</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111]">{replica.mecanismo}</p>
            </div>
          )}
          {replica.condicion && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Condición</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111] capitalize">{replica.condicion}</p>
            </div>
          )}
          {replica.ciudad && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Ubicación</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111]">{replica.ciudad}{replica.estado ? `, ${replica.estado}` : ''}</p>
            </div>
          )}
          {replica.serial && (
            <div className="border border-[#EEEEEE] p-3 col-span-2">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Serial</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111] font-mono">{replica.serial}</p>
            </div>
          )}
        </div>

        {replica.upgrades && (
          <div className="mt-3 border border-[#EEEEEE] p-3">
            <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Upgrades</p>
            <p style={lato} className="mt-1 text-[13px] leading-relaxed text-[#111111]">{replica.upgrades}</p>
          </div>
        )}

        {replica.descripcion && (
          <div className="mt-3 border border-[#EEEEEE] p-3">
            <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Descripción</p>
            <p style={lato} className="mt-1 text-[13px] leading-relaxed text-[#111111]">{replica.descripcion}</p>
          </div>
        )}

        {/* Link a perfil público */}
        <div className="mt-4">
          <Link
            href={`/replicas/${replica.id}`}
            style={jost}
            className="flex items-center justify-center gap-2 border border-[#EEEEEE] py-2.5 text-[10px] font-extrabold uppercase text-[#666666] hover:border-[#CC4B37] hover:text-[#CC4B37] transition-colors"
          >
            Ver página pública
          </Link>
        </div>

        {/* Acciones del dueño */}
        {isOwner && (
          <div className="mt-6 flex flex-col gap-3">
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#999999]">Acciones</p>

            <button
              type="button"
              onClick={() => void handleToggleVenta()}
              style={jost}
              className={`w-full py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                replica.en_venta
                  ? 'border border-[#EEEEEE] text-[#666666]'
                  : 'bg-[#111111] text-white'
              }`}
            >
              {replica.en_venta ? 'Quitar de venta' : 'Poner en venta'}
            </button>

            {!pendingTransfer && (
              <button
                type="button"
                onClick={() => setShowTransferForm(v => !v)}
                style={jost}
                className="w-full border border-[#EEEEEE] py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] hover:border-[#CC4B37]"
              >
                Transferir réplica
              </button>
            )}

            {showTransferForm && (
              <div className="border border-[#EEEEEE] p-4 flex flex-col gap-3">
                <p style={jost} className="text-[10px] font-extrabold uppercase text-[#999999]">Transferir a</p>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Alias del jugador"
                  value={transferAlias}
                  onChange={e => setTransferAlias(e.target.value)}
                />
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Nota opcional"
                  value={transferNota}
                  onChange={e => setTransferNota(e.target.value)}
                  maxLength={200}
                />
                {transferError && <p style={lato} className="text-[12px] text-[#CC4B37]">{transferError}</p>}
                <button
                  type="button"
                  onClick={() => void handleTransfer()}
                  disabled={transferring}
                  style={jost}
                  className="w-full bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase text-white disabled:opacity-50"
                >
                  {transferring ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            )}

            {pendingTransfer && (
              <div className="border border-[#F59E0B] bg-[#FFFBEB] p-4">
                <p style={jost} className="text-[10px] font-extrabold uppercase text-[#F59E0B]">Transferencia pendiente</p>
                <p style={lato} className="mt-1 text-[13px] text-[#111111]">
                  Enviada a {pendingTransfer.to_user.alias ?? pendingTransfer.to_user.nombre ?? 'jugador'}
                </p>
                <button
                  type="button"
                  onClick={() => void handleCancelTransfer()}
                  style={jost}
                  className="mt-3 w-full border border-[#EEEEEE] py-2.5 text-[10px] font-extrabold uppercase text-[#666666]"
                >
                  Cancelar transferencia
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleDelete()}
              style={jost}
              className="w-full border border-[#CC4B37] py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#CC4B37] hover:bg-[#CC4B37] hover:text-white transition-colors"
            >
              Eliminar réplica
            </button>
          </div>
        )}

        {/* Transferencia entrante */}
        {!isOwner && incomingTransfer && (
          <div className="mt-6 border border-[#CC4B37] bg-[#FFF5F4] p-4">
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#CC4B37]">Te están transfiriendo esta réplica</p>
            <p style={lato} className="mt-1 text-[13px] text-[#111111]">
              De: {incomingTransfer.from_user.alias ?? incomingTransfer.from_user.nombre ?? 'jugador'}
            </p>
            {incomingTransfer.nota && (
              <p style={lato} className="mt-1 text-[12px] text-[#666666]">{incomingTransfer.nota}</p>
            )}
            <button
              type="button"
              onClick={() => void handleAcceptTransfer()}
              disabled={accepting}
              style={jost}
              className="mt-3 w-full bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase text-white disabled:opacity-50"
            >
              {accepting ? 'Aceptando…' : 'Aceptar réplica'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
