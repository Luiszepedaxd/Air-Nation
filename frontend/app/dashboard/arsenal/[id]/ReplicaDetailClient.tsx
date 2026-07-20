'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/apiFetch'
import { ArsenalIcon, SISTEMAS, MECANISMOS, type ReplicaRow } from '../ArsenalClient'

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
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState({
    nombre: initialReplica.nombre,
    sistema: initialReplica.sistema ?? '',
    mecanismo: initialReplica.mecanismo ?? '',
    condicion: (initialReplica.condicion as 'stock' | 'upgrades') ?? 'stock',
    upgrades: initialReplica.upgrades ?? '',
    descripcion: initialReplica.descripcion ?? '',
    serial: initialReplica.serial ?? '',
  })

  const handleSaveEdit = async () => {
    if (!editForm.nombre.trim()) { setEditError('El nombre es obligatorio.'); return }
    if (!editForm.sistema) { setEditError('Selecciona el sistema.'); return }
    if (!editForm.mecanismo) { setEditError('Selecciona el mecanismo.'); return }
    setEditing(true)
    setEditError('')
    try {
      const payload = {
        nombre: editForm.nombre.trim(),
        sistema: editForm.sistema,
        mecanismo: editForm.mecanismo,
        condicion: editForm.condicion,
        upgrades: editForm.condicion === 'upgrades' ? (editForm.upgrades.trim() || null) : null,
        descripcion: editForm.descripcion.trim() || null,
        serial: editForm.serial.trim() || null,
        verificada: !!editForm.serial.trim(),
      }
      const { error } = await supabase
        .from('arsenal')
        .update(payload)
        .eq('id', replica.id)
      if (error) throw error
      setReplica(r => ({ ...r, ...payload }))
      setShowEdit(false)
    } catch {
      setEditError('Error al guardar. Intenta de nuevo.')
    } finally {
      setEditing(false)
    }
  }

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

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten imágenes JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen no debe pesar más de 10 MB.')
      return
    }

    setUploadingFoto(true)
    setError(null)
    try {
      const url = await uploadFile(file)
      const { error: dbError } = await supabase
        .from('arsenal')
        .update({ foto_url: url })
        .eq('id', replica.id)
      if (dbError) throw new Error(dbError.message)
      setReplica(r => ({ ...r, foto_url: url }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`No se pudo subir la foto: ${msg}. Intenta de nuevo.`)
    } finally {
      setUploadingFoto(false)
    }
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
  const labelClass = 'mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#999999]'

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="mx-auto max-w-[640px] px-4 py-6 md:px-6">

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
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
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFoto} disabled={uploadingFoto} />
              {uploadingFoto ? 'Subiendo…' : 'Cambiar foto'}
            </label>
          )}
        </div>

        {error && (
          <p
            className="mt-2 text-[12px] text-[#CC4B37]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {error}
          </p>
        )}

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
              onClick={() => {
                setEditForm({
                  nombre: replica.nombre,
                  sistema: replica.sistema ?? '',
                  mecanismo: replica.mecanismo ?? '',
                  condicion: (replica.condicion as 'stock' | 'upgrades') ?? 'stock',
                  upgrades: replica.upgrades ?? '',
                  descripcion: replica.descripcion ?? '',
                  serial: replica.serial ?? '',
                })
                setEditError('')
                setShowEdit(true)
              }}
              style={jost}
              className="w-full border border-[#EEEEEE] bg-[#FFFFFF] py-3 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] hover:bg-[#F4F4F4] transition-colors"
            >
              Editar datos
            </button>

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

      {showEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center" onClick={() => !editing && setShowEdit(false)}>
          <div className="bg-white w-full max-w-[480px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 style={jost} className="text-[18px] font-extrabold uppercase text-[#111111]">Editar réplica</h2>
                <button type="button" onClick={() => !editing && setShowEdit(false)} className="text-[#999999] hover:text-[#111111]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className={labelClass} style={jost}>Nombre / Modelo *</label>
                  <input type="text" className={inputClass} value={editForm.nombre} maxLength={80}
                    onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} />
                </div>

                <div>
                  <label className={labelClass} style={jost}>Sistema de arma *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SISTEMAS.map(s => (
                      <button key={s} type="button" style={jost}
                        onClick={() => setEditForm(f => ({ ...f, sistema: s }))}
                        className={`border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-left transition-colors ${editForm.sistema === s ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass} style={jost}>Mecanismo *</label>
                  <div className="flex flex-wrap gap-2">
                    {MECANISMOS.map(m => (
                      <button key={m} type="button" style={jost}
                        onClick={() => setEditForm(f => ({ ...f, mecanismo: m }))}
                        className={`border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${editForm.mecanismo === m ? 'border-[#CC4B37] bg-[#CC4B37] text-white' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass} style={jost}>Condición *</label>
                  <div className="flex gap-2">
                    {(['stock', 'upgrades'] as const).map(c => (
                      <button key={c} type="button" style={jost}
                        onClick={() => setEditForm(f => ({ ...f, condicion: c }))}
                        className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${editForm.condicion === c ? 'border-[#CC4B37] bg-[#CC4B37] text-white' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                        {c === 'stock' ? 'Stock' : 'Con upgrades'}
                      </button>
                    ))}
                  </div>
                  {editForm.condicion === 'upgrades' && (
                    <textarea className={`${inputClass} mt-2 resize-none`} rows={3}
                      placeholder="Describe los upgrades: motor, hopup, inner barrel..."
                      value={editForm.upgrades} maxLength={300}
                      onChange={e => setEditForm(f => ({ ...f, upgrades: e.target.value }))} />
                  )}
                </div>

                <div>
                  <label className={labelClass} style={jost}>
                    Número de serie <span className="text-[#AAAAAA] normal-case font-normal tracking-normal">(opcional — verifica la réplica)</span>
                  </label>
                  <input type="text" className={inputClass} value={editForm.serial} maxLength={40}
                    onChange={e => setEditForm(f => ({ ...f, serial: e.target.value }))} />
                </div>

                <div>
                  <label className={labelClass} style={jost}>Descripción</label>
                  <textarea className={`${inputClass} resize-none`} rows={3} maxLength={300}
                    value={editForm.descripcion}
                    onChange={e => setEditForm(f => ({ ...f, descripcion: e.target.value }))} />
                </div>

                {editError && (
                  <p style={lato} className="text-[12px] text-[#CC4B37]">{editError}</p>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEdit(false)} disabled={editing}
                    style={jost}
                    className="flex-1 border border-[#EEEEEE] py-3 text-[11px] font-extrabold uppercase text-[#666666] disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="button" onClick={() => void handleSaveEdit()} disabled={editing}
                    style={jost}
                    className="flex-1 bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase text-white disabled:opacity-50">
                    {editing ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
