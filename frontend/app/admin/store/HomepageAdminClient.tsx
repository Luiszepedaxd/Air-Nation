'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { uploadFile } from '@/lib/apiFetch'
import { upsertHomepageBlock } from './homepage-actions'
import type { BloqueSlug } from './homepage-actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────
type Campo =
  | { key: string; label: string; tipo: 'texto'; placeholder?: string }
  | { key: string; label: string; tipo: 'textarea'; placeholder?: string }
  | { key: string; label: string; tipo: 'imagen' }
  | { key: string; label: string; tipo: 'lista_textos'; placeholder?: string }
  | { key: string; label: string; tipo: 'lista_categorias' }

type BloqueDef = {
  slug: BloqueSlug
  label: string
  descripcion: string
  campos: Campo[]
}

// ─────────────────────────────────────────────────────────────
// Definición de los 8 bloques editables
// ─────────────────────────────────────────────────────────────
const BLOQUES: BloqueDef[] = [
  {
    slug: 'header',
    label: 'Header — Promo bar',
    descripcion: 'La franja negra superior con los textos de promoción.',
    campos: [
      {
        key: 'texto_descuento',
        label: 'Texto descuento (parte roja)',
        tipo: 'texto',
        placeholder: '4% DE DESCUENTO',
      },
      {
        key: 'texto_medio',
        label: 'Texto medio',
        tipo: 'texto',
        placeholder: 'AL PAGAR CON TRANSFERENCIA',
      },
      {
        key: 'texto_envio',
        label: 'Texto envío (parte roja)',
        tipo: 'texto',
        placeholder: 'TODO MÉXICO',
      },
      {
        key: 'texto_derecha',
        label: 'Texto derecha (solo desktop)',
        tipo: 'texto',
        placeholder: 'PEDIDO PROTEGIDO EN CADA COMPRA',
      },
    ],
  },
  {
    slug: 'hero',
    label: 'Hero — Sección principal',
    descripcion:
      'Imagen de fondo, título grande, subtítulo y botón principal. El botón "Novedades" es fijo.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo', tipo: 'imagen' },
      {
        key: 'titulo',
        label: 'Título',
        tipo: 'texto',
        placeholder: 'Equipo táctico. Sin pretextos.',
      },
      {
        key: 'subtitulo',
        label: 'Subtítulo',
        tipo: 'texto',
        placeholder: 'Réplicas, accesorios y equipo de protección...',
      },
      { key: 'cta_texto', label: 'Texto del botón principal', tipo: 'texto', placeholder: 'Ver catálogo' },
      { key: 'cta_link', label: 'Link del botón principal', tipo: 'texto', placeholder: '#productos' },
    ],
  },
  {
    slug: 'ticker',
    label: 'Ticker — Franja animada roja',
    descripcion: 'Los textos que se desplazan en la franja roja. Separa cada mensaje con ·',
    campos: [
      { key: 'item1', label: 'Mensaje 1', tipo: 'texto', placeholder: 'Envíos a todo México' },
      {
        key: 'item2',
        label: 'Mensaje 2',
        tipo: 'texto',
        placeholder: '4% descuento con transferencia',
      },
      { key: 'item3', label: 'Mensaje 3', tipo: 'texto', placeholder: 'Stock real en productos' },
      { key: 'item4', label: 'Mensaje 4', tipo: 'texto', placeholder: 'Pedido protegido' },
      {
        key: 'item5',
        label: 'Mensaje 5',
        tipo: 'texto',
        placeholder: 'Nuevo inventario cada semana',
      },
    ],
  },
  {
    slug: 'banner1',
    label: 'Banner izquierdo — Fondo negro',
    descripcion: 'Banner editorial oscuro. Ideal para nuevo ingreso o producto destacado.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo (opcional)', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta roja superior', tipo: 'texto', placeholder: 'Nuevo ingreso' },
      {
        key: 'titulo',
        label: 'Título',
        tipo: 'texto',
        placeholder: 'Tokyo Marui MWS — GBBR de gas de alta gama',
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'textarea',
        placeholder: 'Blowback realista, compatibilidad total con partes M4.',
      },
      { key: 'cta_texto', label: 'Texto del botón', tipo: 'texto', placeholder: 'Ver producto' },
      { key: 'cta_link', label: 'Link del botón', tipo: 'texto', placeholder: '/store/...' },
    ],
  },
  {
    slug: 'banner2',
    label: 'Banner derecho — Fondo rojo',
    descripcion: 'Banner editorial rojo. Ideal para outlet o promoción urgente.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo (opcional)', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta negra superior', tipo: 'texto', placeholder: 'Outlet' },
      {
        key: 'titulo',
        label: 'Título',
        tipo: 'texto',
        placeholder: 'Hasta 30% en réplicas eléctricas seleccionadas',
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'textarea',
        placeholder: 'Stock limitado. Última oportunidad.',
      },
      { key: 'cta_texto', label: 'Texto del botón', tipo: 'texto', placeholder: 'Ver outlet' },
      { key: 'cta_link', label: 'Link del botón', tipo: 'texto', placeholder: '/store/...' },
    ],
  },
  {
    slug: 'categorias_carousel',
    label: 'Categorías — Carrusel',
    descripcion:
      'Cards de categorías con imagen. Se muestran en carrusel con swipe. Agrega, edita o quita cards.',
    campos: [{ key: 'items', label: 'Cards de categorías', tipo: 'lista_categorias' }],
  },
  {
    slug: 'promoBanner',
    label: 'Banner promo — Full width',
    descripcion: 'Banner horizontal oscuro entre categorías y el grid de productos.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo (opcional)', tipo: 'imagen' },
      {
        key: 'titulo',
        label: 'Título',
        tipo: 'texto',
        placeholder: 'BBs de alta precisión desde $149',
      },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'textarea',
        placeholder: 'Bolsas de 2,000 y 5,000 unidades...',
      },
      { key: 'cta_texto', label: 'Texto del botón', tipo: 'texto', placeholder: 'Ver productos' },
      { key: 'cta_link', label: 'Link del botón', tipo: 'texto', placeholder: '/store/...' },
    ],
  },
  {
    slug: 'footer',
    label: 'Footer — Bullets de confianza',
    descripcion: 'Los 4 items del footer oscuro con ícono, título y descripción.',
    campos: [
      {
        key: 'item1_titulo',
        label: 'Item 1 — Título',
        tipo: 'texto',
        placeholder: 'Pedido protegido',
      },
      {
        key: 'item1_desc',
        label: 'Item 1 — Descripción',
        tipo: 'texto',
        placeholder: 'Tu compra está asegurada en cada paso.',
      },
      {
        key: 'item2_titulo',
        label: 'Item 2 — Título',
        tipo: 'texto',
        placeholder: 'Envío a todo México',
      },
      {
        key: 'item2_desc',
        label: 'Item 2 — Descripción',
        tipo: 'texto',
        placeholder: 'Coordinamos desde Guadalajara.',
      },
      {
        key: 'item3_titulo',
        label: 'Item 3 — Título',
        tipo: 'texto',
        placeholder: '4% con transferencia',
      },
      {
        key: 'item3_desc',
        label: 'Item 3 — Descripción',
        tipo: 'texto',
        placeholder: 'Descuento automático al pagar con banco.',
      },
      {
        key: 'item4_titulo',
        label: 'Item 4 — Título',
        tipo: 'texto',
        placeholder: 'Stock real',
      },
      {
        key: 'item4_desc',
        label: 'Item 4 — Descripción',
        tipo: 'texto',
        placeholder: 'Solo publicamos lo que tenemos en almacén.',
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────
// BloqueRecord — estado de cada bloque (id null = no existe aún en DB)
// ─────────────────────────────────────────────────────────────
export type BloqueRecord = {
  id: string | null
  slug: BloqueSlug
  config: Record<string, unknown>
}

// ─────────────────────────────────────────────────────────────
// ImageUploadInput
// ─────────────────────────────────────────────────────────────
function ImageUploadInput({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErr('Solo JPG, PNG o WebP')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setErr('Máx 8 MB')
      return
    }
    setUploading(true)
    setErr(null)
    try {
      const url = await uploadFile(file)
      onChange(url)
    } catch {
      setErr('Error al subir')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {value && (
        <div
          className="relative overflow-hidden border border-[#EEEEEE]"
          style={{ aspectRatio: '16/5' }}
        >
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-black/70 text-sm text-white hover:bg-black"
          >
            ×
          </button>
        </div>
      )}
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-2.5 text-[11px] transition-colors ${
          uploading
            ? 'border-[#CCCCCC] text-[#AAAAAA]'
            : 'border-[#CCCCCC] bg-[#F9F9F9] text-[#666666] hover:border-[#CC4B37] hover:text-[#CC4B37]'
        }`}
        style={lato}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
        {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : '+ Subir imagen'}
      </label>
      {err && (
        <p className="text-[11px] text-[#CC4B37]" style={lato}>
          {err}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ListaCategoriasEditor — agrega/quita/edita cards del carousel
// ─────────────────────────────────────────────────────────────
type CatItem = { imagen_url: string; nombre: string; link: string }

function ListaCategoriasEditor({
  value,
  onChange,
}: {
  value: CatItem[]
  onChange: (items: CatItem[]) => void
}) {
  function update(i: number, patch: Partial<CatItem>) {
    onChange(value.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function add() {
    onChange([...value, { imagen_url: '', nombre: '', link: '' }])
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-[11px] text-[#AAAAAA]" style={lato}>
          Sin cards aún. Agrega la primera.
        </p>
      )}
      {value.map((item, i) => (
        <div key={i} className="border border-[#EEEEEE] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span
              className="text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
              style={jost}
            >
              Card {i + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-[11px] text-[#CC4B37] hover:underline"
              style={jost}
            >
              Eliminar
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <p
                className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-[#888888]"
                style={jost}
              >
                Imagen
              </p>
              <ImageUploadInput
                value={item.imagen_url}
                onChange={(url) => update(i, { imagen_url: url })}
              />
            </div>
            <div>
              <p
                className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-[#888888]"
                style={jost}
              >
                Nombre
              </p>
              <input
                type="text"
                value={item.nombre}
                onChange={(e) => update(i, { nombre: e.target.value })}
                placeholder="Ej: Réplicas"
                className="w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
                style={lato}
              />
            </div>
            <div>
              <p
                className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-[#888888]"
                style={jost}
              >
                Link
              </p>
              <input
                type="text"
                value={item.link}
                onChange={(e) => update(i, { link: e.target.value })}
                placeholder="/store?categoria=..."
                className="w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
                style={lato}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start border border-[#EEEEEE] bg-white px-4 py-2 text-[10px] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
        style={jost}
      >
        + Agregar card
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────
export function HomepageAdminClient({ initialBlocks }: { initialBlocks: BloqueRecord[] }) {
  const router = useRouter()

  const [configs, setConfigs] = useState<Record<BloqueSlug, Record<string, unknown>>>(() => {
    const map = {} as Record<BloqueSlug, Record<string, unknown>>
    for (const def of BLOQUES) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.config ?? {}
    }
    return map
  })

  const [ids, setIds] = useState<Record<BloqueSlug, string | null>>(() => {
    const map = {} as Record<BloqueSlug, string | null>
    for (const def of BLOQUES) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.id ?? null
    }
    return map
  })

  const [expandido, setExpandido] = useState<BloqueSlug | null>('hero')
  const [saving, setSaving] = useState<BloqueSlug | null>(null)
  const [saved, setSaved] = useState<BloqueSlug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function getField(slug: BloqueSlug, key: string): string {
    const v = configs[slug]?.[key]
    return typeof v === 'string' ? v : ''
  }

  function setField(slug: BloqueSlug, key: string, value: unknown) {
    setConfigs((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: value } }))
  }

  function getCatItems(slug: BloqueSlug): CatItem[] {
    const v = configs[slug]?.items
    if (!Array.isArray(v)) return []
    return v.map((it: unknown) => {
      const o = (it ?? {}) as Record<string, unknown>
      return {
        imagen_url: typeof o.imagen_url === 'string' ? o.imagen_url : '',
        nombre: typeof o.nombre === 'string' ? o.nombre : '',
        link: typeof o.link === 'string' ? o.link : '',
      }
    })
  }

  async function handleSave(slug: BloqueSlug) {
    setSaving(slug)
    setError(null)
    const res = await upsertHomepageBlock(slug, configs[slug] ?? {})
    setSaving(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    if (ids[slug] === null) {
      setIds((prev) => ({ ...prev, [slug]: res.id }))
    }
    setSaved(slug)
    setTimeout(() => setSaved((s) => (s === slug ? null : s)), 2500)
    router.refresh()
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]'

  return (
    <div className="flex flex-col gap-0" style={lato}>
      {/* Intro */}
      <div className="mb-5 border-b border-[#EEEEEE] pb-4">
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>
          Editor de homepage — Store
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Edita textos e imágenes. Cambios visibles al instante en{' '}
          <a href="/store" target="_blank" className="text-[#CC4B37] underline">
            airnation.online/store
          </a>
        </p>
      </div>

      {error && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]" style={lato}>
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {BLOQUES.map((def, i) => {
          const isOpen = expandido === def.slug
          const isSaving = saving === def.slug
          const isSaved = saved === def.slug
          const isConfigured = ids[def.slug] !== null
          const imgUrl = getField(def.slug, 'imagen_url')

          return (
            <div
              key={def.slug}
              className={`border transition-colors ${isOpen ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'}`}
            >
              {/* Header del bloque */}
              <button
                type="button"
                onClick={() => setExpandido(isOpen ? null : def.slug)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#666666]"
                  style={jost}
                >
                  {i + 1}
                </span>
                {/* Thumbnail */}
                {imgUrl ? (
                  <div className="h-9 w-14 shrink-0 overflow-hidden border border-[#EEEEEE]">
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-9 w-14 shrink-0 items-center justify-center border border-dashed border-[#DDDDDD] bg-[#F7F7F7]">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-[#CCCCCC]"
                      aria-hidden
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M3 16l5-5 4 4 3-3 6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                    style={jost}
                  >
                    {def.label}
                  </p>
                  <p className="truncate text-[11px] text-[#AAAAAA]" style={lato}>
                    {getField(def.slug, 'titulo') ||
                      getField(def.slug, 'texto_descuento') ||
                      getField(def.slug, 'item1') ||
                      def.descripcion}
                  </p>
                </div>
                {/* Badges */}
                <div className="flex shrink-0 items-center gap-2">
                  {isSaved && (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold text-[#22C55E]"
                      style={jost}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path
                          d="M1.5 5l2.5 2.5 4.5-4.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Guardado
                    </span>
                  )}
                  {!isConfigured && (
                    <span
                      className="border border-[#DDDDDD] px-2 py-0.5 text-[9px] text-[#AAAAAA]"
                      style={jost}
                    >
                      Sin configurar
                    </span>
                  )}
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className={`text-[#999999] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </button>

              {/* Formulario */}
              {isOpen && (
                <div className="border-t border-[#EEEEEE] bg-[#FAFAFA] p-5">
                  <p className="mb-4 text-[11px] text-[#888888]" style={lato}>
                    {def.descripcion}
                  </p>

                  <div className="flex flex-col gap-4">
                    {def.campos.map((campo) => (
                      <div key={campo.key} className="flex flex-col gap-1.5">
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]"
                          style={jost}
                        >
                          {campo.label}
                        </span>
                        {campo.tipo === 'imagen' && (
                          <ImageUploadInput
                            value={getField(def.slug, campo.key)}
                            onChange={(url) => setField(def.slug, campo.key, url)}
                          />
                        )}
                        {campo.tipo === 'texto' && (
                          <input
                            type="text"
                            className={inputCls}
                            value={getField(def.slug, campo.key)}
                            placeholder={campo.placeholder}
                            onChange={(e) => setField(def.slug, campo.key, e.target.value)}
                          />
                        )}
                        {campo.tipo === 'textarea' && (
                          <textarea
                            rows={2}
                            className={inputCls}
                            value={getField(def.slug, campo.key)}
                            placeholder={campo.placeholder}
                            onChange={(e) => setField(def.slug, campo.key, e.target.value)}
                          />
                        )}
                        {campo.tipo === 'lista_categorias' && (
                          <ListaCategoriasEditor
                            value={getCatItems(def.slug)}
                            onChange={(items) => setField(def.slug, 'items', items)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Acciones */}
                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#EEEEEE] pt-4">
                    <button
                      type="button"
                      onClick={() => handleSave(def.slug)}
                      disabled={!!saving}
                      className="flex items-center gap-2 bg-[#CC4B37] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={jost}
                    >
                      {isSaving ? (
                        <>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            className="animate-spin"
                            aria-hidden
                          >
                            <circle
                              cx="12"
                              cy="12"
                              r="9"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeDasharray="28"
                              strokeDashoffset="10"
                            />
                          </svg>
                          Guardando…
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M17 21v-8H7v8M7 3v5h8"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          Guardar
                        </>
                      )}
                    </button>
                    <a
                      href="/store"
                      target="_blank"
                      className="text-[11px] text-[#CC4B37] hover:underline"
                      style={jost}
                    >
                      Ver store →
                    </a>
                    {isSaved && (
                      <span
                        className="flex items-center gap-1 text-[11px] font-bold text-[#22C55E]"
                        style={jost}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                          <path
                            d="M1.5 5l2.5 2.5 4.5-4.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Cambios guardados
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 border border-[#EEEEEE] bg-[#F9F9F9] px-4 py-3">
        <p className="text-[11px] text-[#888888]" style={lato}>
          <strong style={{ ...jost, fontSize: 10 }}>TIP:</strong> Las imágenes son opcionales en
          todos los bloques. Si no subes una, el bloque usa un fondo geométrico por defecto. Guarda
          cada bloque por separado.
        </p>
      </div>
    </div>
  )
}
