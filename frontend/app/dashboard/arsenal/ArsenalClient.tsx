'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/apiFetch'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const SISTEMAS = ['Rifle de Asalto', 'Subfusil (SMG)', 'Ametralladora Ligera (LMG)', 'DMR', 'Francotirador (Sniper)', 'Pistola', 'Escopeta', 'Otro']
const MECANISMOS = ['AEG', 'GBB', 'HPA', 'Muelle (Spring)', 'CO2']

const ACCESORIOS_SUBCATS = [
  'Miras y ópticas',
  'Silenciadores y flash hiders',
  'Grips y foregrips',
  'Cargadores',
  'Baterías y cargadores eléctricos',
  'Internos',
  'Externos',
  'Otros',
]

const GEAR_SUBCATS: Record<string, string[]> = {
  'Cabeza': ['Cascos', 'Gorras y boinas', 'Headsets y comunicación'],
  'Cara y ojos': ['Goggles', 'Máscaras completas', 'Protectores faciales', 'Balaclavas'],
  'Torso': ['Plate carriers', 'Chalecos tácticos', 'Chest rigs'],
  'Organización': ['Bolsas MOLLE', 'Pouches', 'Mochilas tácticas'],
  'Ropa': ['Uniformes', 'Camisas y pantalones tácticos'],
  'Manos y pies': ['Guantes', 'Botas tácticas'],
  'Otros': ['Otros'],
}

export type ReplicaRow = {
  id: string
  user_id?: string | null
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
            Transferencia pendiente
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
      const url = await uploadFile(file)
      setFotoUrl(url)
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
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFoto} disabled={uploading} />
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
      <div className="px-4 pt-6 md:px-6 max-w-[1200px] mx-auto">
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {replicas.map(r => (
              <ReplicaCard key={r.id} replica={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export type MarketplaceListing = {
  id: string
  titulo: string
  precio: number | null
  precio_original: number | null
  modalidad: 'fijo' | 'desde'
  supercategoria: string | null
  fotos_urls: string[]
  status: string
  vendido: boolean
  created_at: string
}

type ArsenalTab = 'arsenal' | 'explorar' | 'mis-ventas'

function MisVentasWrapper({
  userId,
  listings,
  userCiudad,
  userEstado,
  replicas,
}: {
  userId: string
  listings: MarketplaceListing[]
  userCiudad: string | null
  userEstado: string | null
  replicas: ReplicaRow[]
}) {
  const router = useRouter()
  const [showNuevoListing, setShowNuevoListing] = useState(false)

  if (showNuevoListing) {
    return (
      <NuevoListingForm
        userId={userId}
        userCiudad={userCiudad}
        userEstado={userEstado}
        replicas={replicas}
        onSuccess={() => { setShowNuevoListing(false); router.refresh() }}
        onCancel={() => setShowNuevoListing(false)}
      />
    )
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 style={jost} className="text-[18px] font-extrabold uppercase text-[#111111]">
            Mis ventas
          </h2>
          <p style={lato} className="mt-0.5 text-[12px] text-[#999999]">
            {listings.length === 0 ? 'Sin publicaciones activas' : `${listings.length} publicación${listings.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNuevoListing(true)}
          style={jost}
          className="flex items-center gap-1.5 bg-[#CC4B37] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white"
        >
          + Publicar
        </button>
      </div>
      <MisVentasTab
        userId={userId}
        listings={listings}
        onPublish={() => setShowNuevoListing(true)}
      />
    </div>
  )
}

export function ArsenalTabs({
  userId,
  userCiudad,
  userEstado,
  replicas,
  listings,
}: {
  userId: string
  userCiudad: string | null
  userEstado: string | null
  userAlias: string | null
  userAvatar: string | null
  replicas: ReplicaRow[]
  listings: MarketplaceListing[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawTab = searchParams.get('tab')
  const activeTab: ArsenalTab =
    rawTab === 'explorar' ? 'explorar' :
    rawTab === 'mis-ventas' ? 'mis-ventas' :
    'arsenal'

  const setTab = (tab: ArsenalTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'arsenal') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    const query = params.toString()
    router.replace(pathname + (query ? `?${query}` : ''), { scroll: false })
  }

  const [showForm, setShowForm] = useState(false)

  const handleSuccess = (_r: ReplicaRow) => {
    setShowForm(false)
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
      {/* Tabs nav */}
      <div className="sticky top-0 z-30 border-b border-[#EEEEEE] bg-[#FFFFFF]">
        <ScrollableTabsNav>
          {([
            { id: 'arsenal' as ArsenalTab, label: 'MI ARSENAL' },
            { id: 'explorar' as ArsenalTab, label: 'EXPLORAR' },
            { id: 'mis-ventas' as ArsenalTab, label: 'MIS VENTAS' },
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              style={jost}
              className={`shrink-0 border-b-2 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-[#CC4B37] text-[#111111]'
                  : 'border-transparent text-[#999999]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </ScrollableTabsNav>
      </div>

      <div className="px-4 pt-6 md:px-6 max-w-[1200px] mx-auto">
        {activeTab === 'arsenal' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 style={jost} className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]">
                  Mi Arsenal
                </h1>
                <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
                  {replicas.length === 0
                    ? 'Registra tu primera réplica'
                    : `${replicas.length} réplica${replicas.length !== 1 ? 's' : ''} registrada${replicas.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                style={jost}
                className="flex items-center gap-2 bg-[#CC4B37] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white"
              >
                + Registrar
              </button>
            </div>

            {replicas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ArsenalIcon />
                <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">
                  Tu arsenal está vacío
                </p>
                <p style={lato} className="mt-2 text-[13px] text-[#999999] max-w-[260px]">
                  Registra tus réplicas para tenerlas identificadas y protegidas
                </p>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  style={jost}
                  className="mt-6 bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white"
                >
                  Registrar primera réplica
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {replicas.map(r => (
                  <ReplicaCard key={r.id} replica={r} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'explorar' && (
          <ExplorarTab currentUserId={userId} />
        )}

        {activeTab === 'mis-ventas' && (
          <MisVentasWrapper
            userId={userId}
            listings={listings}
            userCiudad={userCiudad}
            userEstado={userEstado}
            replicas={replicas}
          />
        )}
      </div>
    </main>
  )
}

type PaqueteDraft = { id: string; nombre: string; descripcion: string; precio: string }

type ListingFeed = {
  id: string
  titulo: string
  precio: number | null
  precio_original: number | null
  modalidad: 'fijo' | 'desde'
  supercategoria: string | null
  subcategoria: string | null
  fotos_urls: string[]
  ciudad: string | null
  estado: string | null
  nuevo_usado: string
  vendido: boolean
  status: string
  created_at: string
  seller: {
    id: string
    alias: string | null
    nombre: string | null
    avatar_url: string | null
  }
}

export function NuevoListingForm({
  userId,
  userCiudad,
  userEstado,
  replicas,
  onSuccess,
  onCancel,
}: {
  userId: string
  userCiudad: string | null
  userEstado: string | null
  replicas: ReplicaRow[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [supercategoria, setSupercategoria] = useState<'replicas' | 'accesorios' | 'gear' | ''>('')
  const [replicaConectada, setReplicaConectada] = useState<ReplicaRow | null>(null)

  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [subSubcategoria, setSubSubcategoria] = useState('')
  const [mecanismo, setMecanismo] = useState('')
  const [condicionReplica, setCondicionReplica] = useState<'stock' | 'upgrades'>('stock')

  const [nuevoUsado, setNuevoUsado] = useState<'nuevo' | 'usado'>('usado')
  const [modalidad, setModalidad] = useState<'fijo' | 'desde'>('fijo')
  const [precio, setPrecio] = useState('')
  const [paquetes, setPaquetes] = useState<PaqueteDraft[]>([
    { id: '1', nombre: '', descripcion: '', precio: '' },
  ])

  const [fotos, setFotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const inputClass = 'w-full border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'
  const labelClass = 'mb-2 block text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#999999]'

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || fotos.length >= 6) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      setFotos(prev => [...prev, url])
    } catch { setError('Error al subir la foto.') }
    finally { setUploading(false) }
  }

  const addPaquete = () => {
    if (paquetes.length >= 4) return
    setPaquetes(prev => [...prev, {
      id: String(Date.now()),
      nombre: '',
      descripcion: '',
      precio: '',
    }])
  }

  const updatePaquete = (id: string, field: keyof PaqueteDraft, value: string) => {
    setPaquetes(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removePaquete = (id: string) => {
    if (paquetes.length <= 1) return
    setPaquetes(prev => prev.filter(p => p.id !== id))
  }

  const canGoStep2 = !!supercategoria
  const canGoStep3 = titulo.trim().length > 0 && (
    supercategoria === 'replicas' ? !!subcategoria && !!mecanismo :
    supercategoria === 'accesorios' ? !!subcategoria :
    !!subcategoria && !!subSubcategoria
  )
  const canGoStep4 = modalidad === 'fijo'
    ? precio.trim().length > 0 && Number(precio) > 0
    : paquetes.every(p => p.nombre.trim() && Number(p.precio) > 0)

  const handlePublish = async () => {
    setSaving(true)
    setError('')
    try {
      const precioFinal = modalidad === 'fijo' ? Number(precio) : Math.min(...paquetes.map(p => Number(p.precio)))
      const paquetesData = modalidad === 'desde'
        ? paquetes.map((p, i) => ({ nombre: p.nombre.trim(), descripcion: p.descripcion.trim() || null, precio: Number(p.precio), orden: i }))
        : []

      const insertData: Record<string, unknown> = {
        seller_id: userId,
        titulo: titulo.trim(),
        categoria: supercategoria,
        descripcion: descripcion.trim() || null,
        supercategoria,
        subcategoria: subcategoria || null,
        sub_subcategoria: subSubcategoria || null,
        mecanismo: supercategoria === 'replicas' ? mecanismo || null : null,
        condicion_replica: supercategoria === 'replicas' ? condicionReplica : null,
        nuevo_usado: nuevoUsado,
        modalidad,
        precio: precioFinal,
        paquetes: paquetesData,
        fotos_urls: fotos,
        ciudad: userCiudad,
        estado: userEstado,
        status: 'activo',
        vendido: false,
      }

      if (replicaConectada) {
        insertData.replica_id = replicaConectada.id
      }

      const { error: dbErr } = await supabase
        .from('marketplace')
        .insert(insertData)

      if (dbErr) throw dbErr

      if (replicaConectada) {
        await supabase.from('arsenal').update({ en_venta: true }).eq('id', replicaConectada.id)
      }

      onSuccess()
    } catch {
      setError('Error al publicar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[480px] px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep(s => (s - 1) as 1 | 2 | 3 | 4)}
          className="text-[#999999] hover:text-[#111111]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="flex-1">
          <h2 style={jost} className="text-[18px] font-extrabold uppercase text-[#111111]">
            Nueva publicación
          </h2>
          <p style={lato} className="text-[11px] text-[#999999]">Paso {step} de 4</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-6 flex gap-1">
        {[1, 2, 3, 4].map(s => (
          <div
            key={s}
            className={`h-1 flex-1 transition-colors ${s <= step ? 'bg-[#CC4B37]' : 'bg-[#EEEEEE]'}`}
          />
        ))}
      </div>

      {/* PASO 1 */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className={labelClass} style={jost}>¿Qué vas a vender?</p>
            <div className="flex flex-col gap-2">
              {([
                { id: 'replicas', label: 'Réplica', desc: 'AEG, GBB, HPA, Spring...' },
                { id: 'accesorios', label: 'Accesorio', desc: 'Miras, cargadores, baterías...' },
                { id: 'gear', label: 'Gear', desc: 'Cascos, chalecos, uniformes...' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { setSupercategoria(opt.id); setSubcategoria(''); setSubSubcategoria('') }}
                  className={`flex items-center gap-3 border p-4 text-left transition-colors ${
                    supercategoria === opt.id
                      ? 'border-[#CC4B37] bg-[#FFF5F4]'
                      : 'border-[#EEEEEE] bg-[#F4F4F4]'
                  }`}
                >
                  <div className="flex-1">
                    <p style={jost} className={`text-[12px] font-extrabold uppercase ${supercategoria === opt.id ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
                      {opt.label}
                    </p>
                    <p style={lato} className="text-[11px] text-[#999999] mt-0.5">{opt.desc}</p>
                  </div>
                  {supercategoria === opt.id && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="#CC4B37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {supercategoria === 'replicas' && replicas.length > 0 && (
            <div>
              <p className={labelClass} style={jost}>
                Conectar con tu arsenal <span className="text-[#AAAAAA] normal-case font-normal tracking-normal">(opcional)</span>
              </p>
              <p style={lato} className="mb-3 text-[12px] text-[#666666]">
                Si vendes una réplica de tu arsenal, conéctala para mostrar que está verificada.
              </p>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {replicas.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (replicaConectada?.id === r.id) {
                        setReplicaConectada(null)
                        setTitulo('')
                        setSubcategoria('')
                        setMecanismo('')
                        setCondicionReplica('stock')
                        setFotos([])
                      } else {
                        setReplicaConectada(r)
                        if (!titulo.trim()) setTitulo(r.nombre)
                        if (r.sistema) setSubcategoria(r.sistema)
                        if (r.mecanismo) setMecanismo(r.mecanismo)
                        if (r.condicion === 'upgrades') setCondicionReplica('upgrades')
                        else setCondicionReplica('stock')
                        if (r.foto_url) setFotos([r.foto_url])
                      }
                    }}
                    className={`flex items-center gap-3 border p-3 text-left transition-colors ${
                      replicaConectada?.id === r.id
                        ? 'border-[#CC4B37] bg-[#FFF5F4]'
                        : 'border-[#EEEEEE] bg-[#FFFFFF]'
                    }`}
                  >
                    <div className="w-10 h-10 shrink-0 overflow-hidden bg-[#F4F4F4]">
                      {r.foto_url
                        ? <img src={r.foto_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><ArsenalIcon /></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={jost} className="text-[11px] font-extrabold uppercase text-[#111111] truncate">{r.nombre}</p>
                      {r.verificada && (
                        <p style={lato} className="text-[10px] text-[#CC4B37]">✓ Verificada</p>
                      )}
                    </div>
                    {replicaConectada?.id === r.id && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#CC4B37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canGoStep2}
            style={jost}
            className="w-full bg-[#CC4B37] py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {/* PASO 2 — Detalles */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass} style={jost}>Título *</label>
            <input
              type="text"
              className={inputClass}
              placeholder={
                supercategoria === 'replicas' ? 'Ej. M4 CQB Tokyo Marui...' :
                supercategoria === 'accesorios' ? 'Ej. Mira holográfica EOTech...' :
                'Ej. Chest rig Warrior Assault...'
              }
              value={titulo}
              onChange={e => setTitulo(e.target.value.slice(0, 80))}
              maxLength={80}
            />
          </div>

          {supercategoria === 'replicas' && (
            <>
              {replicaConectada && (
                <div className="border border-[#CC4B37] bg-[#FFF5F4] px-3 py-2.5 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#CC4B37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={lato} className="text-[12px] text-[#CC4B37]">
                    Campos prellenados desde tu arsenal. Puedes editarlos.
                  </p>
                </div>
              )}
              <div>
                <label className={labelClass} style={jost}>Tipo de réplica *</label>
                <div className="grid grid-cols-2 gap-2">
                  {SISTEMAS.map(s => (
                    <button key={s} type="button" onClick={() => setSubcategoria(s)} style={jost}
                      className={`border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-left transition-colors ${subcategoria === s ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
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
                    <button key={c} type="button" onClick={() => setCondicionReplica(c)} style={jost}
                      className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${condicionReplica === c ? 'border-[#CC4B37] bg-[#CC4B37] text-white' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                      {c === 'stock' ? 'Stock' : 'Con upgrades'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {supercategoria === 'accesorios' && (
            <div>
              <label className={labelClass} style={jost}>Tipo de accesorio *</label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESORIOS_SUBCATS.map(s => (
                  <button key={s} type="button" onClick={() => setSubcategoria(s)} style={jost}
                    className={`border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-left transition-colors ${subcategoria === s ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {supercategoria === 'gear' && (
            <>
              <div>
                <label className={labelClass} style={jost}>Categoría *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(GEAR_SUBCATS).map(cat => (
                    <button key={cat} type="button"
                      onClick={() => { setSubcategoria(cat); setSubSubcategoria('') }}
                      style={jost}
                      className={`border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-left transition-colors ${subcategoria === cat ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              {subcategoria && GEAR_SUBCATS[subcategoria] && (
                <div>
                  <label className={labelClass} style={jost}>Tipo *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GEAR_SUBCATS[subcategoria].map(sub => (
                      <button key={sub} type="button" onClick={() => setSubSubcategoria(sub)} style={jost}
                        className={`border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-left transition-colors ${subSubcategoria === sub ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className={labelClass} style={jost}>
              Descripción <span className="text-[#AAAAAA] normal-case font-normal tracking-normal">(opcional)</span>
            </label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Describe el estado, accesorios incluidos, historial..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value.slice(0, 500))}
              maxLength={500}
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!canGoStep3}
            style={jost}
            className="w-full bg-[#CC4B37] py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {/* PASO 3 — Precio */}
      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass} style={jost}>Estado del artículo *</label>
            <div className="flex gap-2">
              {(['nuevo', 'usado'] as const).map(nu => (
                <button key={nu} type="button" onClick={() => setNuevoUsado(nu)} style={jost}
                  className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${nuevoUsado === nu ? 'border-[#CC4B37] bg-[#CC4B37] text-white' : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'}`}>
                  {nu === 'nuevo' ? 'Nuevo' : 'Usado'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass} style={jost}>Tipo de venta *</label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setModalidad('fijo')}
                className={`flex items-start gap-3 border p-4 text-left transition-colors ${modalidad === 'fijo' ? 'border-[#CC4B37] bg-[#FFF5F4]' : 'border-[#EEEEEE] bg-[#F4F4F4]'}`}
              >
                <div className="flex-1">
                  <p style={jost} className={`text-[12px] font-extrabold uppercase ${modalidad === 'fijo' ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
                    Precio fijo
                  </p>
                  <p style={lato} className="text-[11px] text-[#999999] mt-0.5">
                    Un solo precio, todo incluido. El comprador toma o deja.
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setModalidad('desde')}
                className={`flex items-start gap-3 border p-4 text-left transition-colors ${modalidad === 'desde' ? 'border-[#CC4B37] bg-[#FFF5F4]' : 'border-[#EEEEEE] bg-[#F4F4F4]'}`}
              >
                <div className="flex-1">
                  <p style={jost} className={`text-[12px] font-extrabold uppercase ${modalidad === 'desde' ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
                    Desde (paquetes)
                  </p>
                  <p style={lato} className="text-[11px] text-[#999999] mt-0.5">
                    Define opciones: solo réplica, réplica + mags, todo incluido. El comprador elige.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {modalidad === 'fijo' && (
            <div>
              <label className={labelClass} style={jost}>Precio (MXN) *</label>
              <div className="relative">
                <span style={lato} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] text-sm">$</span>
                <input
                  type="number"
                  className={`${inputClass} pl-7`}
                  placeholder="0"
                  value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  min={0}
                />
              </div>
            </div>
          )}

          {modalidad === 'desde' && (
            <div className="flex flex-col gap-3">
              <p className={labelClass} style={jost}>
                Paquetes *
                <span className="text-[#AAAAAA] normal-case font-normal tracking-normal ml-1">
                  (mín 1, máx 4)
                </span>
              </p>
              {paquetes.map((p, i) => (
                <div key={p.id} className="border border-[#EEEEEE] p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p style={jost} className="text-[10px] font-extrabold uppercase text-[#999999]">
                      Paquete {i + 1}
                    </p>
                    {paquetes.length > 1 && (
                      <button type="button" onClick={() => removePaquete(p.id)} className="text-[#CC4B37] text-[11px]" style={lato}>
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder='Ej. "Solo réplica" o "Todo incluido"'
                    value={p.nombre}
                    onChange={e => updatePaquete(p.id, 'nombre', e.target.value.slice(0, 60))}
                    maxLength={60}
                  />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="¿Qué incluye este paquete? (opcional)"
                    value={p.descripcion}
                    onChange={e => updatePaquete(p.id, 'descripcion', e.target.value.slice(0, 120))}
                    maxLength={120}
                  />
                  <div className="relative">
                    <span style={lato} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] text-sm">$</span>
                    <input
                      type="number"
                      className={`${inputClass} pl-7`}
                      placeholder="Precio MXN"
                      value={p.precio}
                      onChange={e => updatePaquete(p.id, 'precio', e.target.value)}
                      min={0}
                    />
                  </div>
                </div>
              ))}
              {paquetes.length < 4 && (
                <button
                  type="button"
                  onClick={addPaquete}
                  style={jost}
                  className="w-full border border-dashed border-[#CCCCCC] py-3 text-[11px] font-extrabold uppercase text-[#999999] hover:border-[#CC4B37] hover:text-[#CC4B37] transition-colors"
                >
                  + Agregar paquete
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(4)}
            disabled={!canGoStep4}
            style={jost}
            className="w-full bg-[#CC4B37] py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {/* PASO 4 — Fotos y publicar */}
      {step === 4 && (
        <div className="flex flex-col gap-5">
          <div>
            <p className={labelClass} style={jost}>
              Fotos
              <span className="text-[#AAAAAA] normal-case font-normal tracking-normal ml-1">
                (máx 6, recomendado al menos 1)
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {fotos.map((url, i) => (
                <div key={i} className="relative aspect-square overflow-hidden bg-[#F4F4F4]">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-black/60 text-white text-xs"
                  >
                    ×
                  </button>
                  {i === 0 && (
                    <span style={jost} className="absolute bottom-1 left-1 bg-[#CC4B37] px-1 py-0.5 text-[8px] font-extrabold uppercase text-white">
                      Portada
                    </span>
                  )}
                </div>
              ))}
              {fotos.length < 6 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed border-[#CCCCCC] bg-[#F4F4F4] hover:border-[#CC4B37] transition-colors">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFoto} disabled={uploading} />
                  {uploading ? (
                    <p style={lato} className="text-[10px] text-[#999999]">Subiendo…</p>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#AAAAAA]">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                      <p style={lato} className="mt-1 text-[10px] text-[#999999]">Agregar</p>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="border border-[#EEEEEE] p-4 bg-[#F4F4F4]">
            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#999999] mb-2">Resumen</p>
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">{titulo}</p>
            <p style={lato} className="text-[11px] text-[#666666] mt-0.5">
              {supercategoria === 'replicas' ? `${subcategoria} · ${mecanismo}` :
               supercategoria === 'accesorios' ? subcategoria :
               `${subcategoria} · ${subSubcategoria}`}
              {' · '}
              {nuevoUsado === 'nuevo' ? 'Nuevo' : 'Usado'}
            </p>
            <p style={jost} className="text-[15px] font-extrabold text-[#CC4B37] mt-2">
              {modalidad === 'fijo'
                ? `$${Number(precio).toLocaleString('es-MX')}`
                : `Desde $${Math.min(...paquetes.map(p => Number(p.precio))).toLocaleString('es-MX')}`
              }
            </p>
          </div>

          {error && <p className="text-sm text-[#CC4B37]" style={lato}>{error}</p>}

          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={saving || uploading}
            style={jost}
            className="w-full bg-[#CC4B37] py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {saving ? 'Publicando…' : 'Publicar ahora'}
          </button>
        </div>
      )}
    </div>
  )
}

function ListingCard({ listing }: { listing: ListingFeed }) {
  const foto = listing.fotos_urls?.[0] ?? null

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block rounded-[12px] overflow-hidden border border-[#E4E4E4] shadow-sm hover:shadow-md transition-shadow bg-[#FFFFFF]"
    >
      {/* Foto cuadrada con margen */}
      <div className="relative w-full overflow-hidden bg-[#F0F2F5]" style={{ aspectRatio: '1/1' }}>
        {foto ? (
          <img
            src={foto}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#CCCCCC" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#CCCCCC" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        {listing.vendido && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span style={jost} className="bg-[#111111] px-2 py-1 text-[9px] font-extrabold uppercase text-white">
              Vendido
            </span>
          </div>
        )}
        {listing.nuevo_usado === 'nuevo' && !listing.vendido && (
          <span style={jost} className="absolute left-1.5 top-1.5 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white">
            Nuevo
          </span>
        )}
      </div>

      {/* Info debajo de la foto */}
      <div className="pt-1.5 pb-2 px-2">
        <p style={jost} className="text-[14px] font-extrabold text-[#111111] leading-tight">
          ${listing.precio?.toLocaleString('es-MX') ?? '—'}
          {listing.modalidad === 'desde' && (
            <span style={lato} className="ml-1 text-[10px] font-normal text-[#999999] normal-case">desde</span>
          )}
        </p>
        <p style={lato} className="mt-0.5 text-[12px] text-[#444444] line-clamp-2 leading-snug">
          {listing.titulo}
        </p>
        <p style={lato} className="mt-0.5 text-[11px] text-[#999999] truncate">
          {listing.ciudad ?? ''}
        </p>
      </div>
    </Link>
  )
}

function ExplorarTab({ currentUserId }: { currentUserId: string | null }) {
  const [listings, setListings] = useState<ListingFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroNuevoUsado, setFiltroNuevoUsado] = useState('')
  const [localCategoria, setLocalCategoria] = useState('')
  const [localNuevoUsado, setLocalNuevoUsado] = useState('')

  const activeCount = [filtroCategoria, filtroNuevoUsado].filter(Boolean).length

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let query = supabase
        .from('marketplace')
        .select(`
          id, titulo, precio, precio_original, modalidad,
          supercategoria, subcategoria, fotos_urls,
          ciudad, estado, nuevo_usado, vendido, status, created_at,
          users!seller_id ( id, alias, nombre, avatar_url )
        `)
        .eq('status', 'activo')
        .eq('vendido', false)
        .order('created_at', { ascending: false })
        .limit(40)

      if (filtroCategoria) query = query.eq('supercategoria', filtroCategoria)
      if (filtroNuevoUsado) query = query.eq('nuevo_usado', filtroNuevoUsado)

      const { data } = await query

      setListings((data ?? []).map(row => {
        const r = row as Record<string, unknown>
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        const uo = (u ?? {}) as Record<string, unknown>
        return {
          id: String(r.id),
          titulo: String(r.titulo ?? ''),
          precio: r.precio ? Number(r.precio) : null,
          precio_original: r.precio_original ? Number(r.precio_original) : null,
          modalidad: (r.modalidad as 'fijo' | 'desde') ?? 'fijo',
          supercategoria: r.supercategoria ? String(r.supercategoria) : null,
          subcategoria: r.subcategoria ? String(r.subcategoria) : null,
          fotos_urls: Array.isArray(r.fotos_urls) ? r.fotos_urls as string[] : [],
          ciudad: r.ciudad ? String(r.ciudad) : null,
          estado: r.estado ? String(r.estado) : null,
          nuevo_usado: String(r.nuevo_usado ?? 'usado'),
          vendido: Boolean(r.vendido),
          status: String(r.status ?? 'activo'),
          created_at: String(r.created_at),
          seller: {
            id: String(uo.id ?? ''),
            alias: uo.alias ? String(uo.alias) : null,
            nombre: uo.nombre ? String(uo.nombre) : null,
            avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
          },
        }
      }))
      setLoading(false)
    }
    void load()
  }, [filtroCategoria, filtroNuevoUsado])

  const handleOpen = () => {
    setLocalCategoria(filtroCategoria)
    setLocalNuevoUsado(filtroNuevoUsado)
    setSheetOpen(true)
  }

  const handleApply = () => {
    setFiltroCategoria(localCategoria)
    setFiltroNuevoUsado(localNuevoUsado)
    setSheetOpen(false)
  }

  const handleClear = () => {
    setLocalCategoria('')
    setLocalNuevoUsado('')
  }

  return (
    <div className="px-4">
      {/* Botón filtrar */}
      <div className="mb-4 flex items-center justify-end gap-2">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => { setFiltroCategoria(''); setFiltroNuevoUsado('') }}
            style={lato}
            className="text-[12px] text-[#999999] underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
        <button
          type="button"
          onClick={handleOpen}
          className={`flex items-center gap-1.5 border px-3 py-2 text-[12px] transition-colors ${
            activeCount > 0
              ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]'
              : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
          }`}
          style={lato}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Overlay */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSheetOpen(false)} />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 z-50 bg-white transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          bottom: 'calc(64px + env(safe-area-inset-bottom))',
          borderRadius: '12px 12px 0 0',
          paddingBottom: '8px',
        }}
      >
        <div
          className="flex w-full cursor-pointer justify-center py-4"
          onClick={() => setSheetOpen(false)}
        >
          <div className="h-1 w-10 rounded-full bg-[#DDDDDD]" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">Filtrar</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleClear} style={jost}
                className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline">
                Limpiar
              </button>
              <button type="button" onClick={handleApply} style={jost}
                className="bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white">
                Aplicar
              </button>
            </div>
          </div>

          <div className="mb-5">
            <p style={jost} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: '', label: 'Todo' },
                { id: 'replicas', label: 'Réplicas' },
                { id: 'accesorios', label: 'Accesorios' },
                { id: 'gear', label: 'Gear' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalCategoria(opt.id)}
                  style={jost}
                  className={`border px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    localCategoria === opt.id
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={jost} className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]">
              Estado
            </p>
            <div className="flex gap-2">
              {([
                { id: '', label: 'Todos' },
                { id: 'nuevo', label: 'Nuevo' },
                { id: 'usado', label: 'Usado' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalNuevoUsado(opt.id)}
                  style={jost}
                  className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    localNuevoUsado === opt.id
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="overflow-hidden">
              <div className="w-full bg-[#F4F4F4] animate-pulse" style={{ paddingBottom: '100%' }} />
              <div className="pt-2 space-y-1.5">
                <div className="h-4 w-20 bg-[#F4F4F4] animate-pulse" />
                <div className="h-3 w-full bg-[#F4F4F4] animate-pulse" />
                <div className="h-3 w-16 bg-[#F4F4F4] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#AAAAAA" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">
            Sin publicaciones
          </p>
          <p style={lato} className="mt-2 text-[13px] text-[#999999] max-w-[260px]">
            Sé el primero en publicar algo en el marketplace
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

type MisVentasListing = MarketplaceListing & {
  nuevo_usado?: string
  subcategoria?: string | null
}

function MisVentasCard({
  listing,
  onUpdate,
  onDelete,
}: {
  listing: MarketplaceListing
  onUpdate: (id: string, updates: Partial<MarketplaceListing>) => void
  onDelete: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editandoPrecio, setEditandoPrecio] = useState(false)
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [saving, setSaving] = useState(false)
  const foto = listing.fotos_urls?.[0] ?? null

  const handlePausar = async () => {
    setMenuOpen(false)
    const nuevoStatus = listing.status === 'pausado' ? 'activo' : 'pausado'
    const { error } = await supabase
      .from('marketplace')
      .update({ status: nuevoStatus })
      .eq('id', listing.id)
    if (!error) onUpdate(listing.id, { status: nuevoStatus })
  }

  const handleVendido = async () => {
    setMenuOpen(false)
    const { error } = await supabase
      .from('marketplace')
      .update({ vendido: true, status: 'activo' })
      .eq('id', listing.id)
    if (!error) onUpdate(listing.id, { vendido: true })
  }

  const handleEliminar = async () => {
    setMenuOpen(false)
    if (!confirm('¿Eliminar esta publicación?')) return
    const { data: listingRow } = await supabase
      .from('marketplace')
      .select('replica_id')
      .eq('id', listing.id)
      .maybeSingle()
    const { error } = await supabase
      .from('marketplace')
      .delete()
      .eq('id', listing.id)
    if (!error) {
      if (listingRow?.replica_id) {
        await supabase
          .from('arsenal')
          .update({ en_venta: false })
          .eq('id', listingRow.replica_id)
      }
      onDelete(listing.id)
    }
  }

  const handleEditarPrecio = async () => {
    if (!nuevoPrecio || Number(nuevoPrecio) <= 0) return
    setSaving(true)
    const { error } = await supabase
      .from('marketplace')
      .update({
        precio_original: listing.precio,
        precio: Number(nuevoPrecio),
      })
      .eq('id', listing.id)
    if (!error) {
      onUpdate(listing.id, {
        precio_original: listing.precio,
        precio: Number(nuevoPrecio),
      })
      setEditandoPrecio(false)
      setNuevoPrecio('')
    }
    setSaving(false)
  }

  return (
    <div className="rounded-[12px] overflow-visible border border-[#E4E4E4] shadow-sm bg-[#FFFFFF]">
      {/* Foto */}
      <div className="relative w-full overflow-hidden rounded-t-[12px] bg-[#F0F2F5]" style={{ aspectRatio: '1/1' }}>
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#CCCCCC" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#CCCCCC" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        {listing.vendido && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span style={jost} className="bg-[#111111] px-2 py-1 text-[9px] font-extrabold uppercase text-white">
              Vendido
            </span>
          </div>
        )}
        {listing.status === 'pausado' && !listing.vendido && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span style={jost} className="bg-[#999999] px-2 py-1 text-[9px] font-extrabold uppercase text-white">
              Pausado
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2 pt-1.5 pb-2">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {listing.precio_original && listing.precio_original !== listing.precio && (
                <span style={lato} className="text-[11px] text-[#999999] line-through">
                  ${listing.precio_original.toLocaleString('es-MX')}
                </span>
              )}
              <span style={jost} className="text-[14px] font-extrabold text-[#111111]">
                ${listing.precio?.toLocaleString('es-MX') ?? '—'}
              </span>
            </div>
            <p style={lato} className="text-[12px] text-[#444444] line-clamp-1 mt-0.5">
              {listing.titulo}
            </p>
          </div>

          {/* Menu */}
          <div className="relative shrink-0 z-10">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center justify-center w-7 h-7 text-[#999999] hover:text-[#111111]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-[100] min-w-[160px] border border-[#EEEEEE] bg-white shadow-lg rounded-[8px] overflow-hidden">
                  {!listing.vendido && <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setEditandoPrecio(true) }}
                    style={lato}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-[#111111] hover:bg-[#F4F4F4]"
                  >
                    Bajar precio
                  </button>}
                  {!listing.vendido && <button
                    type="button"
                    onClick={() => void handlePausar()}
                    style={lato}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-[#111111] hover:bg-[#F4F4F4]"
                  >
                    {listing.status === 'pausado' ? 'Reactivar' : 'Pausar'}
                  </button>}
                  {!listing.vendido && <button
                    type="button"
                    onClick={() => void handleVendido()}
                    style={lato}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-[#111111] hover:bg-[#F4F4F4]"
                  >
                    Marcar como vendido
                  </button>}
                  <button
                    type="button"
                    onClick={() => void handleEliminar()}
                    style={lato}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-[#CC4B37] hover:bg-[#FFF8F7]"
                  >
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form editar precio */}
        {editandoPrecio && (
          <div className="mt-2 border-t border-[#EEEEEE] pt-2">
            <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999] mb-1.5">
              Nuevo precio
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span style={lato} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#999999] text-sm">$</span>
                <input
                  type="number"
                  className="w-full border border-[#EEEEEE] bg-[#F4F4F4] pl-6 pr-2 py-2 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
                  placeholder="0"
                  value={nuevoPrecio}
                  onChange={e => setNuevoPrecio(e.target.value)}
                  min={0}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleEditarPrecio()}
                disabled={saving}
                style={jost}
                className="bg-[#CC4B37] px-3 py-2 text-[10px] font-extrabold uppercase text-white disabled:opacity-50"
              >
                {saving ? '...' : 'OK'}
              </button>
              <button
                type="button"
                onClick={() => { setEditandoPrecio(false); setNuevoPrecio('') }}
                style={jost}
                className="border border-[#EEEEEE] px-3 py-2 text-[10px] font-extrabold uppercase text-[#666666]"
              >
                X
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MisVentasTab({
  userId,
  listings: initialListings,
  onPublish,
}: {
  userId: string
  listings: MarketplaceListing[]
  onPublish: () => void
}) {
  const [listings, setListings] = useState(initialListings)

  useEffect(() => {
    setListings(initialListings)
  }, [initialListings])

  const handleUpdate = (id: string, updates: Partial<MarketplaceListing>) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }

  const handleDelete = (id: string) => {
    setListings(prev => prev.filter(l => l.id !== id))
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#AAAAAA" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">
          Sin publicaciones
        </p>
        <p style={lato} className="mt-2 text-[13px] text-[#999999] max-w-[260px]">
          Publica réplicas, accesorios o gear para vender a la comunidad
        </p>
        <button
          type="button"
          onClick={onPublish}
          style={jost}
          className="mt-6 bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white"
        >
          Publicar ahora
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {listings.map(listing => (
        <MisVentasCard
          key={listing.id}
          listing={listing}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
