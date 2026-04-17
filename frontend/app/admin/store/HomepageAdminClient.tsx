'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { uploadFile } from '@/lib/apiFetch'
import { createHomepageBlock, updateHomepageBlock } from './homepage-actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

// ─────────────────────────────────────────────────────────────
// Tipos de bloques fijos — deben coincidir con EDITORIAL en StoreExploreClient
// ─────────────────────────────────────────────────────────────
export type BloqueSlug = 'hero' | 'banner1' | 'banner2' | 'promoBanner'

type Campo = {
  key: string
  label: string
  tipo: 'texto' | 'textarea' | 'imagen'
  placeholder?: string
}

const BLOQUES: {
  slug: BloqueSlug
  label: string
  descripcion: string
  campos: Campo[]
}[] = [
  {
    slug: 'hero',
    label: 'Hero principal',
    descripcion: 'Sección de entrada. Imagen de fondo, claim y botón de acción.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo', tipo: 'imagen' },
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'Equipo táctico. Sin pretextos.' },
      {
        key: 'subtitulo',
        label: 'Subtítulo',
        tipo: 'texto',
        placeholder: 'Réplicas, accesorios y equipo de protección...',
      },
      { key: 'cta_texto', label: 'Texto del botón', tipo: 'texto', placeholder: 'Ver catálogo' },
      { key: 'cta_link', label: 'Link del botón', tipo: 'texto', placeholder: '#productos' },
    ],
  },
  {
    slug: 'banner1',
    label: 'Banner izquierdo (oscuro)',
    descripcion:
      'Banner editorial de fondo negro. Ideal para nuevo ingreso o colección destacada.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta superior', tipo: 'texto', placeholder: 'Nuevo ingreso' },
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'Tokyo Marui MWS...' },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'textarea',
        placeholder: 'Blowback realista...',
      },
      { key: 'cta_link', label: 'Link', tipo: 'texto', placeholder: '/store/...' },
    ],
  },
  {
    slug: 'banner2',
    label: 'Banner derecho (rojo)',
    descripcion: 'Banner editorial de fondo rojo. Ideal para outlet o promoción urgente.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta superior', tipo: 'texto', placeholder: 'Outlet' },
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'Hasta 30% en réplicas...' },
      {
        key: 'descripcion',
        label: 'Descripción',
        tipo: 'textarea',
        placeholder: 'Stock limitado...',
      },
      { key: 'cta_link', label: 'Link', tipo: 'texto', placeholder: '/store/...' },
    ],
  },
  {
    slug: 'promoBanner',
    label: 'Banner promo (full width)',
    descripcion: 'Banner horizontal oscuro entre categorías y el grid de productos.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo', tipo: 'imagen' },
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
      { key: 'cta_link', label: 'Link', tipo: 'texto', placeholder: '/store/...' },
    ],
  },
]

export type BloqueRecord = {
  id: string | null
  slug: BloqueSlug
  config: Record<string, string>
}

type Props = {
  initialBlocks: BloqueRecord[]
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
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-black/60 text-sm text-white hover:bg-black/80"
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
// Componente principal
// ─────────────────────────────────────────────────────────────
export function HomepageAdminClient({ initialBlocks }: Props) {
  const router = useRouter()
  const [bloques, setBloques] = useState<BloqueRecord[]>(initialBlocks)
  const [expandido, setExpandido] = useState<BloqueSlug | null>('hero')
  const [saving, setSaving] = useState<BloqueSlug | null>(null)
  const [saved, setSaved] = useState<BloqueSlug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function getBloque(slug: BloqueSlug): BloqueRecord {
    return bloques.find((b) => b.slug === slug) ?? { id: null, slug, config: {} }
  }

  function setConfig(slug: BloqueSlug, key: string, value: string) {
    setBloques((prev) => {
      const existing = prev.find((b) => b.slug === slug)
      if (existing) {
        return prev.map((b) =>
          b.slug === slug ? { ...b, config: { ...b.config, [key]: value } } : b
        )
      }
      return [...prev, { id: null, slug, config: { [key]: value } }]
    })
  }

  async function handleSave(slug: BloqueSlug) {
    const bloque = getBloque(slug)
    setSaving(slug)
    setError(null)

    let res: { ok: true } | { ok: true; id: string } | { error: string }

    if (bloque.id) {
      res = await updateHomepageBlock(bloque.id, bloque.config)
    } else {
      res = await createHomepageBlock(slug, bloque.config)
      if ('ok' in res && 'id' in res) {
        const newId = res.id
        setBloques((prev) => {
          const exists = prev.some((b) => b.slug === slug)
          if (exists) {
            return prev.map((b) => (b.slug === slug ? { ...b, id: newId } : b))
          }
          return [...prev, { id: newId, slug, config: bloque.config }]
        })
      }
    }

    setSaving(null)
    if ('error' in res) {
      setError(res.error)
      return
    }

    setSaved(slug)
    setTimeout(() => setSaved(null), 2500)
    router.refresh()
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]'
  const labelCls = 'text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]'

  return (
    <div className="flex flex-col gap-0" style={lato}>
      {/* Intro */}
      <div className="mb-6 border-b border-[#EEEEEE] pb-4">
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>
          Editor de bloques — Store homepage
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Edita textos e imágenes de cada sección. Los cambios se reflejan al instante en{' '}
          <a href="/store" target="_blank" className="text-[#CC4B37] underline">
            airnation.online/store
          </a>
          .
        </p>
      </div>

      {error && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]" style={lato}>
            {error}
          </p>
        </div>
      )}

      {/* Bloques */}
      <div className="flex flex-col gap-2">
        {BLOQUES.map((def, i) => {
          const bloque = getBloque(def.slug)
          const isOpen = expandido === def.slug
          const isSaving = saving === def.slug
          const isSaved = saved === def.slug
          const hasImage = !!bloque.config.imagen_url

          return (
            <div
              key={def.slug}
              className={`border transition-all ${isOpen ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'}`}
            >
              {/* Header del bloque */}
              <button
                type="button"
                onClick={() => setExpandido(isOpen ? null : def.slug)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#F4F4F4] text-[11px] text-[#666666]"
                  style={jost}
                >
                  {i + 1}
                </span>
                {hasImage ? (
                  <div className="h-9 w-14 shrink-0 overflow-hidden border border-[#EEEEEE]">
                    <img
                      src={bloque.config.imagen_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
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
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[12px] font-extrabold uppercase tracking-wide text-[#111111]"
                    style={jost}
                  >
                    {def.label}
                  </p>
                  <p className="truncate text-[11px] text-[#AAAAAA]" style={lato}>
                    {bloque.config.titulo || def.descripcion}
                  </p>
                </div>
                {isSaved && (
                  <span
                    className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-[#22C55E]"
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
                {!bloque.id && (
                  <span
                    className="shrink-0 border border-[#DDDDDD] px-2 py-0.5 text-[9px] text-[#AAAAAA]"
                    style={jost}
                  >
                    Sin configurar
                  </span>
                )}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  className={`shrink-0 text-[#999999] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* Formulario expandido */}
              {isOpen && (
                <div className="border-t border-[#EEEEEE] bg-[#FAFAFA] p-5">
                  <p className="mb-4 text-[11px] text-[#888888]" style={lato}>
                    {def.descripcion}
                  </p>
                  <div className="flex flex-col gap-4">
                    {def.campos.map((campo) => (
                      <div key={campo.key} className="flex flex-col gap-1.5">
                        <span className={labelCls}>{campo.label}</span>
                        {campo.tipo === 'imagen' ? (
                          <ImageUploadInput
                            value={bloque.config[campo.key] ?? ''}
                            onChange={(url) => setConfig(def.slug, campo.key, url)}
                          />
                        ) : campo.tipo === 'textarea' ? (
                          <textarea
                            rows={2}
                            className={inputCls}
                            value={bloque.config[campo.key] ?? ''}
                            placeholder={campo.placeholder}
                            onChange={(e) => setConfig(def.slug, campo.key, e.target.value)}
                          />
                        ) : (
                          <input
                            type="text"
                            className={inputCls}
                            value={bloque.config[campo.key] ?? ''}
                            placeholder={campo.placeholder}
                            onChange={(e) => setConfig(def.slug, campo.key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Acciones */}
                  <div className="mt-5 flex items-center gap-3 border-t border-[#EEEEEE] pt-4">
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
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                          Guardar {def.label}
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

      {/* Tip */}
      <div className="mt-6 border border-[#EEEEEE] bg-[#F9F9F9] px-4 py-3">
        <p className="text-[11px] text-[#888888]" style={lato}>
          <strong style={{ ...jost, fontSize: 10 }}>TIP:</strong> Las imágenes son opcionales — si no
          subes una, el bloque usa un fondo geométrico oscuro por defecto. Los textos y links son los
          únicos campos requeridos para que la sección se vea completa.
        </p>
      </div>
    </div>
  )
}
