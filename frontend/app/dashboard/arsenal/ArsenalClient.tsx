'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const SISTEMAS = ['Rifle de Asalto', 'Subfusil (SMG)', 'Ametralladora Ligera (LMG)', 'DMR', 'Francotirador (Sniper)', 'Pistola', 'Escopeta', 'Otro']
const MECANISMOS = ['AEG', 'GBB', 'HPA', 'Muelle (Spring)', 'CO2']

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://air-nation-production.up.railway.app/api/v1').replace(/\/$/, '')

export type ReplicaRow = {
  id: string
  nombre: string
  sistema: string | null
  mecanismo: string | null
  condicion: string | null
  upgrades: string | null
  serial: string | null
  foto_url: string | null
  descripcion: string | null
  ciudad: string | null
  estado: string | null
  verificada: boolean
  en_venta: boolean
  created_at: string
  pendingTransfer?: boolean
}

export function ArsenalIcon({ active }: { active?: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7L12 3Z"
        stroke={active ? '#CC4B37' : '#AAAAAA'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4"
        stroke={active ? '#CC4B37' : '#AAAAAA'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ReplicaCard({ replica }: { replica: ReplicaRow }) {
  return (
    <Link
      href={`/dashboard/arsenal/${replica.id}`}
      className="group w-full text-left border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden transition-colors hover:border-[#CCCCCC] block"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
        {replica.foto_url ? (
          <img src={replica.foto_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ArsenalIcon />
          </div>
        )}
        {replica.verificada && (
          <span className="absolute left-2 top-2 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white" style={jost}>
            ✓ Verificada
          </span>
        )}
        {replica.en_venta && (
          <span className="absolute right-2 top-2 bg-[#111111] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white" style={jost}>
            En venta
          </span>
        )}
        {replica.pendingTransfer && (
          <span className="absolute right-2 bottom-2 bg-[#F59E0B] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white" style={jost}>
            ⏳ Transferencia pendiente
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-1 text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>{replica.nombre}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {replica.sistema && (
            <span className="border border-[#EEEEEE] px-2 py-0.5 text-[10px] text-[#666666]" style={lato}>{replica.sistema}</span>
          )}
          {replica.mecanismo && (
            <span className="border border-[#EEEEEE] px-2 py-0.5 text-[10px] text-[#666666]" style={lato}>{replica.mecanismo}</span>
          )}
        </div>
        {replica.ciudad && (
          <p className="mt-1.5 text-[11px] text-[#999999]" style={lato}>{replica.ciudad}{replica.estado ? `, ${replica.estado}` : ''}</p>
        )}
      </div>
    </Link>
  )
}

export function RegistrarForm({
  userId,
  userCiudad,
  userEstado,
  onSuccess,
  onCancel,
}: {
  userId: string
  userCiudad: string | null
  userEstado: string | null
  onSuccess: (r: ReplicaRow) => void
  onCancel: () => void
}) {
  const [nombre, setNombre] = useState('')
  const [sistema, setSistema] = useState('')
  const [mecanismo, setMecanismo] = useState('')
  const [condicion, setCondicion] = useState<'stock' | 'upgrades'>('stock')
  const [upgrades, setUpgrades] = useState('')
  const [serial, setSerial] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo JPG, PNG o WebP.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: fd })
      const json = await res.json() as { url?: string }
      if (json.url) setFotoUrl(json.url)
    } catch { setError('Error al subir la foto.') }
    finally { setUploading(false) }
  }

  const handleSave = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!sistema) { setError('Selecciona el sistema de arma.'); return }
    if (!mecanismo) { setError('Selecciona el mecanismo.'); return }
    setSaving(true)
    setError('')
    try {
      const { data, error: dbErr } = await supabase
        .from('arsenal')
        .insert({
          user_id: userId,
          nombre: nombre.trim(),
          sistema,
          mecanismo,
          condicion,
          upgrades: condicion === 'upgrades' ? upgrades.trim() || null : null,
          serial: serial.trim() || null,
          descripcion: descripcion.trim() || null,
          foto_url: fotoUrl || null,
          ciudad: userCiudad,
          estado: userEstado,
          verificada: !!serial.trim(),
        })
        .select()
        .single()
      if (dbErr) throw dbErr
      onSuccess(data as ReplicaRow)
    } catch { setError('Error al guardar. Intenta de nuevo.') }
    finally { setSaving(false) }
  }

  const inputClass = 'w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'
  const labelClass = 'mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#999999]'

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 style={jost} className="text-[20px] font-extrabold uppercase text-[#111111]">Registrar réplica</h2>
        <button type="button" onClick={onCancel} className="text-[#999999] hover:text-[#111111]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <p className={labelClass} style={jost}>Foto</p>
          <div className="relative aspect-video w-full overflow-hidden border border-[#EEEEEE] bg-[#F4F4F4]">
            {fotoUrl ? (
              <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <ArsenalIcon />
                <p className="text-[11px] text-[#999999]" style={lato}>Sin foto</p>
              </div>
            )}
          </div>
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 border border-[#EEEEEE] bg-[#F4F4F4] py-2.5 text-[11px] font-extrabold uppercase text-[#111111]" style={jost}>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFoto} disabled={uploading} />
            {uploading ? 'Subiendo…' : 'Elegir foto'}
          </label>
        </div>

        <div>
          <label className={labelClass} style={jost}>Nombre / Modelo *</label>
          <input type="text" className={inputClass} placeholder="Ej. M4 CQB, AK-74, MP5..." value={nombre} onChange={e => setNombre(e.target.value)} maxLength={80} />
        </div>

        <div>
          <label className={labelClass} style={jost}>Sistema de arma *</label>
          <div className="grid grid-cols-2 gap-2">
            {SISTEMAS.map(s => (
              <button key={s} type="button" onClick={() => setSistema(s)} style={jost}
                className={`border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-left transition-colors ${sistema === s ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} style={jost}>Mecanismo *</label>
          <div className="flex flex-wrap gap-2">
            {MECANISMOS.map(m => (
              <button key={m} type="button" onClick={() => setMecanismo(m)} style={jost}
                className={`border px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${mecanismo === m ? 'border-[#CC4B37] bg-[#CC4B37] text-white' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass} style={jost}>Condición *</label>
          <div className="flex gap-2">
            {(['stock', 'upgrades'] as const).map(c => (
              <button key={c} type="button" onClick={() => setCondicion(c)} style={jost}
                className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${condicion === c ? 'border-[#CC4B37] bg-[#CC4B37] text-white' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                {c === 'stock' ? 'Stock' : 'Con upgrades'}
              </button>
            ))}
          </div>
          {condicion === 'upgrades' && (
            <textarea className={`${inputClass} mt-2 resize-none`} rows={3} placeholder="Describe los upgrades: motor, hopup, inner barrel..." value={upgrades} onChange={e => setUpgrades(e.target.value)} maxLength={300} />
          )}
        </div>

        <div>
          <label className={labelClass} style={jost}>Número de serie <span className="text-[#AAAAAA] normal-case font-normal tracking-normal">(opcional — verifica la réplica)</span></label>
          <input type="text" className={inputClass} placeholder="Ej. ABC123456" value={serial} onChange={e => setSerial(e.target.value)} maxLength={60} />
          {serial.trim() && (
            <p className="mt-1 text-[11px] text-[#CC4B37]" style={lato}>✓ Esta réplica quedará verificada</p>
          )}
        </div>

        <div>
          <label className={labelClass} style={jost}>Descripción <span className="text-[#AAAAAA] normal-case font-normal tracking-normal">(opcional)</span></label>
          <textarea className={`${inputClass} resize-none`} rows={3} placeholder="Notas adicionales..." value={descripcion} onChange={e => setDescripcion(e.target.value)} maxLength={300} />
        </div>

        {error && <p className="text-sm text-[#CC4B37]" style={lato}>{error}</p>}

        <button type="button" onClick={() => void handleSave()} disabled={saving || uploading} style={jost}
          className="w-full bg-[#CC4B37] py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50">
          {saving ? 'Guardando…' : 'Registrar réplica'}
        </button>
      </div>
    </div>
  )
}

export function ArsenalList({
  userId,
  userCiudad,
  userEstado,
  replicas: initialReplicas,
}: {
  userId: string
  userCiudad: string | null
  userEstado: string | null
  replicas: ReplicaRow[]
}) {
  const router = useRouter()
  const [replicas, setReplicas] = useState(initialReplicas)
  const [showForm, setShowForm] = useState(false)

  const handleSuccess = (r: ReplicaRow) => {
    setReplicas(prev => [r, ...prev])
    setShowForm(false)
    requestAnimationFrame(() => {
      const el = document.getElementById('dashboard-scroll-root')
      if (el) el.scrollTo({ top: 0 })
    })
    router.refresh()
  }

  if (showForm) {
    return (
      <RegistrarForm
        userId={userId}
        userCiudad={userCiudad}
        userEstado={userEstado}
        onSuccess={handleSuccess}
        onCancel={() => setShowForm(false)}
      />
    )
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="px-4 pt-6 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={jost} className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]">
              Mi Arsenal
            </h1>
            <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
              {replicas.length === 0 ? 'Registra tu primera réplica' : `${replicas.length} réplica${replicas.length !== 1 ? 's' : ''} registrada${replicas.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button type="button" onClick={() => setShowForm(true)} style={jost}
            className="flex items-center gap-2 bg-[#CC4B37] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
            + Registrar
          </button>
        </div>

        {replicas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ArsenalIcon />
            <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">Tu arsenal está vacío</p>
            <p style={lato} className="mt-2 text-[13px] text-[#999999] max-w-[260px]">Registra tus réplicas para tenerlas identificadas y protegidas</p>
            <button type="button" onClick={() => setShowForm(true)} style={jost}
              className="mt-6 bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white">
              Registrar primera réplica
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {replicas.map(r => (
              <ReplicaCard key={r.id} replica={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
