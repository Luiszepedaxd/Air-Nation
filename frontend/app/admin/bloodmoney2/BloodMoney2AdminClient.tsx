'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/apiFetch'
import {
  upsertBloodMoney2Block,
  toggleBloodMoney2Block,
  reorderBloodMoney2Block,
} from './actions'
import type { BloodMoney2Slug } from '@/app/bloodmoney2/types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

const BUCKET = 'bloodmoney2'

type Campo =
  | { key: string; label: string; tipo: 'texto'; placeholder?: string }
  | { key: string; label: string; tipo: 'textarea'; placeholder?: string }
  | { key: string; label: string; tipo: 'imagen' }
  | { key: string; label: string; tipo: 'lista_imagenes' }

type BloqueDef = {
  slug: BloodMoney2Slug
  label: string
  descripcion: string
  campos: Campo[]
}

const BLOQUES: BloqueDef[] = [
  {
    slug: 'hero',
    label: 'Hero — Cabecera principal',
    descripcion: 'Imagen de fondo + título + subtítulo + 2 CTAs principales.',
    campos: [
      { key: 'imagen_url', label: 'Imagen de fondo', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta roja superior', tipo: 'texto', placeholder: 'COBERTURA OFICIAL · 16–17 MAYO 2026' },
      { key: 'titulo', label: 'Título principal', tipo: 'texto', placeholder: 'OP. BLOOD MONEY 2' },
      { key: 'subtitulo', label: 'Subtítulo', tipo: 'textarea', placeholder: 'El evento más esperado del año llega a Aguascalientes. AirNation es sponsor oficial.' },
      { key: 'cta1_texto', label: 'CTA 1 (rojo)', tipo: 'texto', placeholder: 'CREAR CUENTA EN AIRNATION' },
      { key: 'cta1_link', label: 'CTA 1 link', tipo: 'texto', placeholder: '/register' },
      { key: 'cta2_texto', label: 'CTA 2 (outline)', tipo: 'texto', placeholder: 'COMPRAR BOLETO EN AEM' },
      { key: 'cta2_link', label: 'CTA 2 link', tipo: 'texto', placeholder: 'https://www.airsoftexperiencemexico.com/bloodmoney' },
      { key: 'seo_title', label: 'SEO Title (browser tab)', tipo: 'texto' },
      { key: 'seo_description', label: 'SEO Description (meta)', tipo: 'textarea' },
    ],
  },
  {
    slug: 'ticker',
    label: 'Ticker rojo — Franja de datos',
    descripcion: 'Chips separados con · en una franja roja scrollable.',
    campos: [
      { key: 'items', label: 'Chips (uno por línea)', tipo: 'textarea', placeholder: '16–17 MAYO 2026\nDRINKINTEAM GOTCHA\nAGUASCALIENTES\n4 FACCIONES\nJUGGERNAUT EN CAMPO\nVIP CONFIRMADO' },
    ],
  },
  {
    slug: 'evento',
    label: 'El evento — Qué es BM2',
    descripcion: 'Texto editorial que explica el evento en voz AirNation.',
    campos: [
      { key: 'eyebrow', label: 'Etiqueta', tipo: 'texto', placeholder: 'EL EVENTO' },
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'QUÉ ES BLOOD MONEY 2' },
      { key: 'cuerpo', label: 'Cuerpo (acepta saltos de línea)', tipo: 'textarea' },
    ],
  },
  {
    slug: 'facciones',
    label: 'Facciones — 4 cards',
    descripcion: 'Las 4 facciones del evento con nombre y descripción breve.',
    campos: [
      { key: 'titulo', label: 'Título sección', tipo: 'texto', placeholder: '¿DE QUÉ LADO ESTARÁS?' },
      { key: 'f1_nombre', label: 'Facción 1 — Nombre', tipo: 'texto', placeholder: 'USASF' },
      { key: 'f1_desc', label: 'Facción 1 — Descripción', tipo: 'textarea' },
      { key: 'f1_imagen', label: 'Facción 1 — Imagen/logo', tipo: 'imagen' },
      { key: 'f2_nombre', label: 'Facción 2 — Nombre', tipo: 'texto', placeholder: 'RESISTENCIA' },
      { key: 'f2_desc', label: 'Facción 2 — Descripción', tipo: 'textarea' },
      { key: 'f2_imagen', label: 'Facción 2 — Imagen/logo', tipo: 'imagen' },
      { key: 'f3_nombre', label: 'Facción 3 — Nombre', tipo: 'texto', placeholder: 'NOVA' },
      { key: 'f3_desc', label: 'Facción 3 — Descripción', tipo: 'textarea' },
      { key: 'f3_imagen', label: 'Facción 3 — Imagen/logo', tipo: 'imagen' },
      { key: 'f4_nombre', label: 'Facción 4 — Nombre', tipo: 'texto', placeholder: 'MERCENARIOS' },
      { key: 'f4_desc', label: 'Facción 4 — Descripción', tipo: 'textarea' },
      { key: 'f4_imagen', label: 'Facción 4 — Imagen/logo', tipo: 'imagen' },
    ],
  },
  {
    slug: 'logistica',
    label: 'Logística — Fecha, sede, hotel',
    descripcion: '3 cards con info práctica.',
    campos: [
      { key: 'fecha_inicio', label: 'Fecha inicio', tipo: 'texto', placeholder: 'Sábado 16 de mayo, 11:00 a.m.' },
      { key: 'fecha_cierre', label: 'Fecha cierre', tipo: 'texto', placeholder: 'Domingo 17 de mayo, 2:00 p.m.' },
      { key: 'sede_nombre', label: 'Sede — Nombre', tipo: 'texto', placeholder: 'Drinkinteam Gotcha' },
      { key: 'sede_direccion', label: 'Sede — Dirección', tipo: 'textarea' },
      { key: 'sede_maps_url', label: 'Sede — Google Maps URL', tipo: 'texto' },
      { key: 'hotel_nombre', label: 'Hotel — Nombre', tipo: 'texto' },
      { key: 'hotel_tarifas', label: 'Hotel — Tarifas (una por línea)', tipo: 'textarea' },
      { key: 'hotel_telefono', label: 'Hotel — Teléfono', tipo: 'texto' },
      { key: 'hotel_email', label: 'Hotel — Email', tipo: 'texto' },
    ],
  },
  {
    slug: 'vip',
    label: 'Invitado VIP — Yio Airsoft',
    descripcion: 'Foto + título + bio corta.',
    campos: [
      { key: 'imagen_url', label: 'Foto del VIP', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta', tipo: 'texto', placeholder: 'VIP CONFIRMADO' },
      { key: 'titulo', label: 'Nombre', tipo: 'texto', placeholder: 'YIO AIRSOFT' },
      { key: 'cuerpo', label: 'Descripción', tipo: 'textarea' },
    ],
  },
  {
    slug: 'juggernaut',
    label: 'Activo Especial — Juggernaut',
    descripcion: 'Imagen + título + descripción del activo táctico.',
    campos: [
      { key: 'imagen_url', label: 'Imagen del Juggernaut', tipo: 'imagen' },
      { key: 'eyebrow', label: 'Etiqueta', tipo: 'texto', placeholder: 'ACTIVO TÁCTICO' },
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'JUGGERNAUT' },
      { key: 'cuerpo', label: 'Descripción', tipo: 'textarea' },
    ],
  },
  {
    slug: 'entradas',
    label: 'Entradas — Pases y precios',
    descripcion: 'Grid 2×2 de pases individuales + team pass + CTA AEM.',
    campos: [
      { key: 'nota_superior', label: 'Nota superior', tipo: 'textarea', placeholder: 'La venta de boletos la opera Airsoft Experience México...' },
      { key: 'precio_individual', label: 'Precio pase individual', tipo: 'texto', placeholder: '$1,499.00' },
      { key: 'comision_individual', label: 'Comisión individual', tipo: 'texto', placeholder: '+$37.48' },
      { key: 'team_pass_precio', label: 'Team Pass — Precio', tipo: 'texto', placeholder: '$4,998' },
      { key: 'team_pass_estado', label: 'Team Pass — Estado', tipo: 'texto', placeholder: 'Venta finalizada' },
      { key: 'fecha_cierre_venta', label: 'Fecha cierre venta', tipo: 'texto', placeholder: '10 mayo, 11:50 p.m.' },
      { key: 'cta_texto', label: 'Botón (texto)', tipo: 'texto', placeholder: 'COMPRAR EN AIRSOFTEXPERIENCEMEXICO.COM' },
      { key: 'cta_link', label: 'Botón (URL)', tipo: 'texto', placeholder: 'https://www.airsoftexperiencemexico.com/bloodmoney' },
    ],
  },
  {
    slug: 'galeria',
    label: 'Galería — Imágenes del evento',
    descripcion: 'Grid de imágenes con lightbox. Antes del evento: flyer + promos. Después: fotos reales.',
    campos: [
      { key: 'titulo', label: 'Título sección', tipo: 'texto', placeholder: 'IMÁGENES DEL EVENTO' },
      { key: 'imagenes', label: 'Imágenes (múltiples)', tipo: 'lista_imagenes' },
    ],
  },
  {
    slug: 'airnation',
    label: 'AirNation en BM2 — CTA registro',
    descripcion: 'Sección que explica la presencia de AirNation + CTA a registro.',
    campos: [
      { key: 'eyebrow', label: 'Etiqueta', tipo: 'texto', placeholder: 'AIRNATION EN CAMPO' },
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: '¿POR QUÉ ESTAMOS AQUÍ?' },
      { key: 'cuerpo', label: 'Cuerpo (acepta saltos de línea)', tipo: 'textarea' },
      { key: 'cta_texto', label: 'Botón (texto)', tipo: 'texto', placeholder: 'CREAR CUENTA GRATIS' },
      { key: 'cta_link', label: 'Botón (URL)', tipo: 'texto', placeholder: '/register' },
    ],
  },
  {
    slug: 'sponsors',
    label: 'Sponsors AEM — Grid de logos',
    descripcion: 'Grid de patrocinadores del evento (crédito a AEM).',
    campos: [
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'PATROCINADORES OFICIALES' },
      { key: 'logos', label: 'Logos (múltiples)', tipo: 'lista_imagenes' },
    ],
  },
  {
    slug: 'cta_final',
    label: 'CTA Final — Banda roja',
    descripcion: 'Banda roja final con 2 CTAs grandes.',
    campos: [
      { key: 'titulo', label: 'Título', tipo: 'texto', placeholder: 'NOS VEMOS EN AGUASCALIENTES' },
      { key: 'subtitulo', label: 'Subtítulo', tipo: 'textarea' },
      { key: 'cta1_texto', label: 'CTA 1 (blanco sólido)', tipo: 'texto', placeholder: 'CREAR CUENTA' },
      { key: 'cta1_link', label: 'CTA 1 link', tipo: 'texto', placeholder: '/register' },
      { key: 'cta2_texto', label: 'CTA 2 (outline)', tipo: 'texto', placeholder: 'SITIO OFICIAL DEL EVENTO' },
      { key: 'cta2_link', label: 'CTA 2 link', tipo: 'texto', placeholder: 'https://www.airsoftexperiencemexico.com/bloodmoney' },
    ],
  },
]

export type BM2Record = {
  id: string | null
  slug: BloodMoney2Slug
  config: Record<string, unknown>
  activo: boolean
  orden: number
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '')
  const cleaned = base.replace(/[^\w.\-]+/g, '_')
  return cleaned.toLowerCase()
}

async function uploadToBM2Bucket(slug: string, file: File): Promise<string> {
  const safe = sanitizeFileName(file.name)
  const path = `${slug}/${Date.now()}-${safe}`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
  if (error) throw new Error(error.message || 'Error al subir la imagen.')
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return pub.publicUrl
}

// ─────────────────────────────────────────────────────────────
// ImageUploadInput — sube al bucket `bloodmoney2` directo
// ─────────────────────────────────────────────────────────────
function ImageUploadInput({
  slug,
  value,
  onChange,
}: {
  slug: BloodMoney2Slug
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
      let url: string
      try {
        url = await uploadToBM2Bucket(slug, file)
      } catch {
        url = await uploadFile(file)
      }
      onChange(url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al subir')
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
// MultiImageUploader — lista de URLs con + agregar
// ─────────────────────────────────────────────────────────────
function MultiImageUploader({
  slug,
  value,
  onChange,
}: {
  slug: BloodMoney2Slug
  value: string[]
  onChange: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const invalid = files.find(
      (f) => !['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
    )
    if (invalid) {
      setErr('Solo JPG, PNG o WebP')
      return
    }
    const tooBig = files.find((f) => f.size > 8 * 1024 * 1024)
    if (tooBig) {
      setErr('Cada imagen máx 8 MB')
      return
    }

    setUploading(true)
    setErr(null)
    try {
      const urls: string[] = [...value]
      for (const file of files) {
        let url: string
        try {
          url = await uploadToBM2Bucket(slug, file)
        } catch {
          url = await uploadFile(file)
        }
        urls.push(url)
      }
      onChange(urls)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...value]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="group relative aspect-square overflow-hidden border border-[#EEEEEE] bg-[#F4F4F4]"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white hover:bg-black disabled:opacity-40"
                    title="Mover izquierda"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white hover:bg-black disabled:opacity-40"
                    title="Mover derecha"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex h-6 w-6 items-center justify-center bg-[#CC4B37] text-[12px] text-white hover:opacity-90"
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
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
          multiple
          className="hidden"
          onChange={handleFiles}
          disabled={uploading}
        />
        {uploading ? 'Subiendo…' : value.length === 0 ? '+ Agregar imágenes' : '+ Agregar más'}
      </label>

      {err && (
        <p className="text-[11px] text-[#CC4B37]" style={lato}>
          {err}
        </p>
      )}
      <p className="text-[11px] text-[#AAAAAA]" style={lato}>
        {value.length} imagen{value.length === 1 ? '' : 'es'}
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Helper — extraer lista de imágenes del config
// ─────────────────────────────────────────────────────────────
function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
  }
  if (typeof v === 'string') {
    return v
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
  }
  return []
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export function BloodMoney2AdminClient({
  initialBlocks,
}: {
  initialBlocks: BM2Record[]
}) {
  const router = useRouter()

  const [configs, setConfigs] = useState<Record<BloodMoney2Slug, Record<string, unknown>>>(() => {
    const map = {} as Record<BloodMoney2Slug, Record<string, unknown>>
    for (const def of BLOQUES) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.config ?? {}
    }
    return map
  })

  const [ids, setIds] = useState<Record<BloodMoney2Slug, string | null>>(() => {
    const map = {} as Record<BloodMoney2Slug, string | null>
    for (const def of BLOQUES) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.id ?? null
    }
    return map
  })

  const [ordens, setOrdens] = useState<Record<BloodMoney2Slug, number>>(() => {
    const map = {} as Record<BloodMoney2Slug, number>
    BLOQUES.forEach((def, i) => {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.orden ?? i + 1
    })
    return map
  })

  const [activos, setActivos] = useState<Record<BloodMoney2Slug, boolean>>(() => {
    const map = {} as Record<BloodMoney2Slug, boolean>
    for (const def of BLOQUES) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.activo ?? true
    }
    return map
  })

  const [toggling, setToggling] = useState<BloodMoney2Slug | null>(null)
  const [reordering, setReordering] = useState<BloodMoney2Slug | null>(null)
  const [expandido, setExpandido] = useState<BloodMoney2Slug | null>(null)
  const [saving, setSaving] = useState<BloodMoney2Slug | null>(null)
  const [saved, setSaved] = useState<BloodMoney2Slug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function getField(slug: BloodMoney2Slug, key: string): string {
    const v = configs[slug]?.[key]
    return typeof v === 'string' ? v : ''
  }

  function setField(slug: BloodMoney2Slug, key: string, value: unknown) {
    setConfigs((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: value } }))
  }

  async function handleSave(slug: BloodMoney2Slug) {
    setSaving(slug)
    setError(null)
    const res = await upsertBloodMoney2Block(slug, configs[slug] ?? {})
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

  async function handleToggle(slug: BloodMoney2Slug) {
    const currentId = ids[slug]
    const newActivo = !activos[slug]

    setToggling(slug)
    setError(null)

    if (!currentId) {
      const res = await upsertBloodMoney2Block(slug, configs[slug] ?? {})
      if ('error' in res) {
        setError(res.error)
        setToggling(null)
        return
      }
      setIds((prev) => ({ ...prev, [slug]: res.id }))
      const res2 = await toggleBloodMoney2Block(res.id, newActivo)
      setToggling(null)
      if ('error' in res2) {
        setError(res2.error)
        return
      }
    } else {
      const res = await toggleBloodMoney2Block(currentId, newActivo)
      setToggling(null)
      if ('error' in res) {
        setError(res.error)
        return
      }
    }

    setActivos((prev) => ({ ...prev, [slug]: newActivo }))
    router.refresh()
  }

  async function handleReorder(slug: BloodMoney2Slug, direction: 'up' | 'down') {
    const currentId = ids[slug]
    if (!currentId) {
      setError('Guarda el bloque primero para poder reordenarlo.')
      return
    }
    const blocks = BLOQUES
      .map((def) => {
        const id = ids[def.slug]
        return id ? { id, orden: ordens[def.slug] } : null
      })
      .filter((x): x is { id: string; orden: number } => x !== null)

    setReordering(slug)
    setError(null)
    const res = await reorderBloodMoney2Block(currentId, direction, blocks)
    setReordering(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]'

  return (
    <div className="flex flex-col gap-0" style={lato}>
      <div className="mb-5 border-b border-[#EEEEEE] pb-4">
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>
          Editor de landing — Blood Money 2
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Edita textos e imágenes. Cambios visibles al instante en{' '}
          <a href="/bloodmoney2" target="_blank" className="text-[#CC4B37] underline">
            airnation.online/bloodmoney2
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
              <button
                type="button"
                onClick={() => setExpandido(isOpen ? null : def.slug)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA] ${!activos[def.slug] ? 'opacity-60' : ''}`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#666666]"
                  style={jost}
                >
                  {i + 1}
                </span>
                {imgUrl ? (
                  <div className="h-9 w-14 shrink-0 overflow-hidden border border-[#EEEEEE]">
                    <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-9 w-14 shrink-0 items-center justify-center border border-dashed border-[#DDDDDD] bg-[#F7F7F7]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#CCCCCC]" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                    style={jost}
                  >
                    {def.label}
                  </p>
                  <p className="truncate text-[11px] text-[#AAAAAA]" style={lato}>
                    {getField(def.slug, 'titulo') || def.descripcion}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {isSaved && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#22C55E]" style={jost}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Guardado
                    </span>
                  )}
                  {!isConfigured && (
                    <span className="border border-[#DDDDDD] px-2 py-0.5 text-[9px] text-[#AAAAAA]" style={jost}>
                      Sin configurar
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (toggling !== def.slug) handleToggle(def.slug)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        if (toggling !== def.slug) handleToggle(def.slug)
                      }
                    }}
                    aria-pressed={activos[def.slug]}
                    aria-disabled={toggling === def.slug}
                    className={`flex items-center gap-1.5 transition-opacity ${toggling === def.slug ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                    title={activos[def.slug] ? 'Visible — click para ocultar' : 'Oculto — click para mostrar'}
                  >
                    <span
                      className={`relative block h-5 w-9 transition-colors ${activos[def.slug] ? 'bg-[#22C55E]' : 'bg-[#DDDDDD]'}`}
                      style={{ borderRadius: 10 }}
                    >
                      <span
                        className="absolute top-0.5 block h-4 w-4 bg-white shadow transition-transform"
                        style={{
                          borderRadius: '50%',
                          transform: activos[def.slug] ? 'translateX(18px)' : 'translateX(2px)',
                        }}
                      />
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wide ${activos[def.slug] ? 'text-[#22C55E]' : 'text-[#AAAAAA]'}`}
                      style={jost}
                    >
                      {toggling === def.slug ? '…' : activos[def.slug] ? 'ON' : 'OFF'}
                    </span>
                  </span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className={`text-[#999999] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </button>

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
                            slug={def.slug}
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
                            rows={3}
                            className={inputCls}
                            value={getField(def.slug, campo.key)}
                            placeholder={campo.placeholder}
                            onChange={(e) => setField(def.slug, campo.key, e.target.value)}
                          />
                        )}
                        {campo.tipo === 'lista_imagenes' && (
                          <MultiImageUploader
                            slug={def.slug}
                            value={toStringArray(configs[def.slug]?.[campo.key])}
                            onChange={(urls) => setField(def.slug, campo.key, urls)}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#EEEEEE] pt-4">
                    <button
                      type="button"
                      onClick={() => handleSave(def.slug)}
                      disabled={!!saving}
                      className="flex items-center gap-2 bg-[#CC4B37] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={jost}
                    >
                      {isSaving ? 'Guardando…' : 'Guardar'}
                    </button>
                    {isConfigured && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReorder(def.slug, 'up')}
                          disabled={reordering === def.slug}
                          className="flex items-center gap-1 border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em] text-[#666666] transition-colors hover:border-[#111111] hover:text-[#111111] disabled:opacity-60"
                          style={jost}
                        >
                          ↑ Subir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorder(def.slug, 'down')}
                          disabled={reordering === def.slug}
                          className="flex items-center gap-1 border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em] text-[#666666] transition-colors hover:border-[#111111] hover:text-[#111111] disabled:opacity-60"
                          style={jost}
                        >
                          ↓ Bajar
                        </button>
                      </>
                    )}
                    <a
                      href="/bloodmoney2"
                      target="_blank"
                      className="text-[11px] text-[#CC4B37] hover:underline"
                      style={jost}
                    >
                      Ver landing →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 border border-[#EEEEEE] bg-[#F9F9F9] px-4 py-3">
        <p className="text-[11px] text-[#888888]" style={lato}>
          <strong style={{ ...jost, fontSize: 10 }}>TIP:</strong> Cada bloque se guarda por
          separado. Si desactivas un bloque (toggle OFF), no se renderiza en la landing pública.
          Para reordenar, primero guarda el bloque y usa los botones ↑/↓.
        </p>
      </div>
    </div>
  )
}
