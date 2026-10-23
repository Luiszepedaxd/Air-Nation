'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { uploadFile } from '@/lib/apiFetch'
import {
  getSponsorsCatalog,
  updateBlockConfig,
  toggleBlockActive,
  reorderAllBlocks,
} from './actions'
import { MediaUploadInput } from '@/app/admin/operacionkursk2/components/MediaUploadInput'
import { ImageUploadInput } from '@/app/admin/operacionkursk2/components/ImageUploadInput'
import { VideoUploadInput } from '@/app/admin/operacionkursk2/components/VideoUploadInput'
import type { Biohazard2Slug, GaleriaImagen, VideoItem } from '@/app/biohazard2/lib/types'
import {
  buildLogosFromCatalog,
  selectedIdsFromLogos,
  type CatalogSponsor,
  type SponsorLogoEntry,
} from '@/app/biohazard2/lib/sponsors'
import { BH2_SLUGS } from '@/app/biohazard2/lib/types'
import { datetimeLocalToIsoCancun } from '@/app/biohazard2/lib/fechas'
import { httpUrlOk, linkOk } from '@/app/biohazard2/lib/enlaces'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }
const HEX = /^#[0-9a-fA-F]{6}$/
const MAX_FACCIONES = 4
const MAX_OBJETIVOS = 6
const MAX_DATOS = 10

export type Biohazard2Record = {
  id: string | null
  slug: Biohazard2Slug
  config: Record<string, unknown>
  activo: boolean
  orden: number
}

type SectionDef = {
  slug: Biohazard2Slug
  label: string
  descripcion: string
}

const SECTIONS: SectionDef[] = [
  { slug: 'hero', label: 'Hero — Cabecera', descripcion: 'Póster/video de fondo, títulos, fecha, lema, CTAs y SEO.' },
  { slug: 'narrativa', label: 'Narrativa', descripcion: 'Expediente: Tailandia → inteligencia satelital → Día Cero.' },
  { slug: 'countdown', label: 'Countdown', descripcion: 'Fecha y hora de despliegue (hora Cancún).' },
  { slug: 'mision', label: 'Misión', descripcion: 'Objetivos de la operación.' },
  { slug: 'soldado_cero', label: 'Súper Soldado 0', descripcion: 'Ficha de amenaza clasificada.' },
  { slug: 'facciones', label: 'Facciones — Alpha vs Delta', descripcion: 'Bandos, comandantes, doctrina, uniformidad y contacto.' },
  { slug: 'sede', label: 'Sede', descripcion: 'Selva Ojo de Halcón · Instalaciones S.P.E.A.R.' },
  { slug: 'inscripcion', label: 'Inscripción', descripcion: 'Ventanas de precio y CTA de registro.' },
  { slug: 'cronograma', label: 'Cronograma', descripcion: 'Hitos por día (sábado / domingo).' },
  { slug: 'reglamento', label: 'Reglamento', descripcion: 'Reglas del evento.' },
  { slug: 'productor', label: 'Productor', descripcion: 'No se muestra en la landing. El sitio http queda como organizer del evento.' },
  { slug: 'sponsors', label: 'Sponsors', descripcion: 'Selección desde catálogo global.' },
  { slug: 'galeria', label: 'Galería', descripcion: 'Imágenes del evento.' },
  { slug: 'videos', label: 'Videos', descripcion: 'Videos del evento.' },
  { slug: 'airnation', label: 'AirNation', descripcion: 'Bloque presencia AirNation.' },
]

function asRecords(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x))
}

function strOf(o: Record<string, unknown>, key: string): string {
  const v = o[key]
  return typeof v === 'string' ? v : ''
}

function strsOf(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((s): s is string => typeof s === 'string')
}

function mover<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir
  if (j < 0 || j >= arr.length) return arr
  const next = [...arr]
  const tmp = next[i]
  next[i] = next[j]
  next[j] = tmp
  return next
}

function fechaInput(v: string): string {
  const d = v.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ''
}

function MultiImageUploader({
  value,
  onChange,
}: {
  value: string[]
  onChange: (urls: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    if (files.some((f) => !f.type.startsWith('image/') || f.type === 'image/svg+xml')) {
      setErr('Solo imágenes (JPG, PNG, WebP, JFIF, etc.)')
      return
    }
    if (files.some((f) => f.size > 5 * 1024 * 1024)) {
      setErr('Cada imagen máx 5 MB')
      return
    }
    setUploading(true)
    setErr(null)
    try {
      const urls = [...value]
      for (const file of files) urls.push(await uploadFile(file))
      onChange(urls)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden border border-[#EEEEEE] bg-[#F4F4F4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => onChange(mover(value, i, -1))} disabled={i === 0} className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white disabled:opacity-40">←</button>
                  <button type="button" onClick={() => onChange(mover(value, i, 1))} disabled={i === value.length - 1} className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white disabled:opacity-40">→</button>
                </div>
                <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="flex h-6 w-6 items-center justify-center bg-[#CC4B37] text-[12px] text-white">×</button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <label className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-2.5 text-[11px] ${uploading ? 'text-[#AAAAAA]' : 'bg-[#F9F9F9] text-[#666666] hover:border-[#CC4B37] hover:text-[#CC4B37]'}`} style={lato}>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        {uploading ? 'Subiendo…' : value.length === 0 ? '+ Agregar imágenes' : '+ Agregar más'}
      </label>
      {err ? <p className="text-[11px] text-[#CC4B37]" style={lato}>{err}</p> : null}
      <p className="text-[11px] text-[#AAAAAA]" style={lato}>{value.length} imagen{value.length === 1 ? '' : 'es'}</p>
    </div>
  )
}

function isoToDatetimeLocal(iso: string): string {
  if (!iso?.trim()) return ''
  const lit = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (lit) return `${lit[1]}T${lit[2]}:${lit[3]}`
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function SponsorsCatalogPicker({
  logos,
  eyebrow,
  titulo,
  onEyebrowChange,
  onTituloChange,
  onLogosChange,
  inputCls,
}: {
  logos: SponsorLogoEntry[]
  eyebrow: string
  titulo: string
  onEyebrowChange: (value: string) => void
  onTituloChange: (value: string) => void
  onLogosChange: (logos: SponsorLogoEntry[]) => void
  inputCls: string
}) {
  const [catalog, setCatalog] = useState<CatalogSponsor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getSponsorsCatalog().then((data) => {
      if (!cancelled) {
        setCatalog(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedIds = selectedIdsFromLogos(logos, catalog)

  function toggleSponsor(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onLogosChange(buildLogosFromCatalog(catalog, next))
  }

  return (
    <div className="flex flex-col gap-4">
      <Field label="Eyebrow">
        <input className={inputCls} value={eyebrow} onChange={(e) => onEyebrowChange(e.target.value)} />
      </Field>
      <Field label="Título">
        <input className={inputCls} value={titulo} onChange={(e) => onTituloChange(e.target.value)} />
      </Field>
      <div className="border-t border-[#EEEEEE] pt-4">
        <p className="mb-3 text-[11px] text-[#888888]" style={lato}>
          Selecciona sponsors del catálogo global. El orden en la landing sigue el orden del catálogo.
        </p>
        {loading ? (
          <p className="text-[12px] text-[#999999]">Cargando catálogo…</p>
        ) : catalog.length === 0 ? (
          <p className="text-[12px] text-[#999999]">
            Agrega sponsors desde <a href="/admin/sponsors" className="text-[#CC4B37] underline">/admin/sponsors</a>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {catalog.map((sponsor) => (
              <label key={sponsor.id} className="flex cursor-pointer items-center gap-3 rounded border border-[#EEEEEE] p-3 hover:bg-[#F4F4F4]">
                <input type="checkbox" checked={selectedIds.has(sponsor.id)} onChange={() => toggleSponsor(sponsor.id)} className="h-4 w-4 accent-[#CC4B37]" />
                {sponsor.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sponsor.logo_url} alt={sponsor.nombre} className="h-8 w-16 object-contain" />
                ) : (
                  <div className="flex h-8 w-16 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#AAAAAA]">Sin logo</div>
                )}
                <span className="text-sm text-[#111111]">{sponsor.nombre}</span>
                {sponsor.link ? <span className="ml-auto text-[11px] text-[#AAAAAA]">{sponsor.link}</span> : null}
              </label>
            ))}
          </div>
        )}
        {!loading && catalog.length > 0 && logos.length === 0 ? (
          <p className="mt-3 text-[11px] text-[#AAAAAA]">Ningún sponsor seleccionado para esta landing.</p>
        ) : null}
      </div>
    </div>
  )
}

function validateConfig(slug: Biohazard2Slug, cfg: Record<string, unknown>): string | null {
  const chk = (val: unknown) => (typeof val === 'string' ? val : '')
  if (slug === 'hero') {
    if (!linkOk(chk(cfg.cta1_link))) return 'CTA 1: usa #ancla, /ruta, http(s) o déjalo vacío.'
    if (!linkOk(chk(cfg.cta2_link))) return 'CTA 2: usa #ancla, /ruta, http(s) o déjalo vacío.'
    if (chk(cfg.seo_title).length > 100) return 'SEO title máx 100 caracteres.'
    if (chk(cfg.seo_description).length > 200) return 'SEO description máx 200 caracteres.'
  }
  if (slug === 'sede' && !httpUrlOk(chk(cfg.maps_link))) return 'Maps link debe ser http(s) o vacío.'
  if (slug === 'mision' && Array.isArray(cfg.objetivos) && cfg.objetivos.length > MAX_OBJETIVOS) {
    return 'Máximo 6 objetivos.'
  }
  if (slug === 'soldado_cero' && Array.isArray(cfg.datos) && cfg.datos.length > MAX_DATOS) {
    return 'Máximo 10 datos de amenaza.'
  }
  if (slug === 'facciones' && Array.isArray(cfg.facciones)) {
    if (cfg.facciones.length > MAX_FACCIONES) return 'Máximo 4 facciones.'
    for (const row of cfg.facciones) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue
      const f = row as Record<string, unknown>
      if (!HEX.test(typeof f.color === 'string' ? f.color : '')) return 'Cada facción necesita un color hex (#RRGGBB).'
      if (!httpUrlOk(typeof f.contacto_whatsapp === 'string' ? f.contacto_whatsapp : '')) {
        return 'El WhatsApp de cada facción debe ser http(s) o vacío.'
      }
    }
  }
  if (slug === 'inscripcion' && Array.isArray(cfg.ventanas)) {
    for (const row of cfg.ventanas) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue
      const link = (row as { cta_link?: string }).cta_link
      if (typeof link === 'string' && !linkOk(link)) return 'Cada CTA de ventana: #ancla, /ruta, http(s) o vacío.'
    }
  }
  if (slug === 'productor') {
    for (const key of ['instagram', 'facebook', 'whatsapp', 'sitio'] as const) {
      if (!httpUrlOk(chk(cfg[key]))) return `${key} debe ser http(s) o vacío.`
    }
  }
  if (slug === 'airnation' && !linkOk(chk(cfg.cta_link))) return 'CTA: usa #ancla, /ruta, http(s) o déjalo vacío.'
  if (slug === 'sponsors' && Array.isArray(cfg.logos)) {
    for (const row of cfg.logos) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue
      const link = (row as { link?: string }).link
      if (typeof link === 'string' && !httpUrlOk(link)) return 'Cada link de sponsor debe ser http(s) o vacío.'
    }
  }
  return null
}

function faccionVacia() {
  return {
    id: '',
    nombre: '',
    subtitulo: '',
    pais: '',
    bandera: '',
    color: '#CC4B37',
    comandante: '',
    doctrina: '',
    uniformidad: [] as string[],
    descripcion: '',
    imagen_url: '',
    logo_url: '',
    contacto_nombre: '',
    contacto_whatsapp: '',
    cupo_texto: '',
    agotada: false,
  }
}

type FaccionForm = ReturnType<typeof faccionVacia>

function leerFaccion(raw: Record<string, unknown> | undefined): FaccionForm {
  const base = faccionVacia()
  if (!raw) return base
  return {
    ...base,
    id: strOf(raw, 'id'),
    nombre: strOf(raw, 'nombre'),
    subtitulo: strOf(raw, 'subtitulo'),
    pais: strOf(raw, 'pais'),
    bandera: strOf(raw, 'bandera'),
    color: typeof raw.color === 'string' ? raw.color : '#CC4B37',
    comandante: strOf(raw, 'comandante'),
    doctrina: strOf(raw, 'doctrina'),
    uniformidad: strsOf(raw.uniformidad),
    descripcion: strOf(raw, 'descripcion'),
    imagen_url: strOf(raw, 'imagen_url'),
    logo_url: strOf(raw, 'logo_url'),
    contacto_nombre: strOf(raw, 'contacto_nombre'),
    contacto_whatsapp: strOf(raw, 'contacto_whatsapp'),
    cupo_texto: strOf(raw, 'cupo_texto'),
    agotada: Boolean(raw.agotada),
  }
}

function getThumb(slug: Biohazard2Slug, cfg: Record<string, unknown>): string {
  if (slug === 'hero') {
    if (cfg.media_type === 'video') return ''
    return typeof cfg.media_url === 'string' ? cfg.media_url : ''
  }
  if (slug === 'sede') {
    const imgs = cfg.imagenes
    if (Array.isArray(imgs) && typeof imgs[0] === 'string' && imgs[0].trim()) return imgs[0]
  }
  if (slug === 'facciones') {
    const first = asRecords(cfg.facciones)[0]
    return first ? strOf(first, 'imagen_url') : ''
  }
  if (slug === 'soldado_cero') return typeof cfg.imagen_url === 'string' ? cfg.imagen_url : ''
  if (slug === 'productor') return typeof cfg.logo_url === 'string' ? cfg.logo_url : ''
  return ''
}

type SortableHandleProps = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>

function SortableSection({
  slug,
  children,
}: {
  slug: Biohazard2Slug
  children: (handleProps: SortableHandleProps) => React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slug })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  )
}

function sectionFor(slug: Biohazard2Slug): SectionDef {
  const def = SECTIONS.find((s) => s.slug === slug)
  if (!def) throw new Error(`Falta metadata de sección: ${slug}`)
  return def
}

export function Biohazard2AdminClient({ initialBlocks }: { initialBlocks: Biohazard2Record[] }) {
  const [configs, setConfigs] = useState<Record<Biohazard2Slug, Record<string, unknown>>>(() => {
    const map = {} as Record<Biohazard2Slug, Record<string, unknown>>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.config ? { ...found.config } : {}
    }
    return map
  })
  const [ids, setIds] = useState<Record<Biohazard2Slug, string | null>>(() => {
    const map = {} as Record<Biohazard2Slug, string | null>
    for (const def of SECTIONS) map[def.slug] = initialBlocks.find((b) => b.slug === def.slug)?.id ?? null
    return map
  })
  const [activos, setActivos] = useState<Record<Biohazard2Slug, boolean>>(() => {
    const map = {} as Record<Biohazard2Slug, boolean>
    for (const def of SECTIONS) map[def.slug] = initialBlocks.find((b) => b.slug === def.slug)?.activo ?? true
    return map
  })
  const [orderedSlugs, setOrderedSlugs] = useState<Biohazard2Slug[]>(() => {
    const fromBd = initialBlocks.map((b) => b.slug)
    return [...fromBd, ...BH2_SLUGS.filter((s) => !fromBd.includes(s))]
  })
  const [toggling, setToggling] = useState<Biohazard2Slug | null>(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<Biohazard2Slug | null>(null)
  const [saving, setSaving] = useState<Biohazard2Slug | null>(null)
  const [saved, setSaved] = useState<Biohazard2Slug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function cfg(slug: Biohazard2Slug): Record<string, unknown> {
    return configs[slug] ?? {}
  }
  function setField(slug: Biohazard2Slug, key: string, value: unknown) {
    setConfigs((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: value } }))
  }
  function str(slug: Biohazard2Slug, key: string): string {
    const v = configs[slug]?.[key]
    return typeof v === 'string' ? v : ''
  }

  async function handleSave(slug: Biohazard2Slug) {
    let out: Record<string, unknown> = { ...(configs[slug] ?? {}) }
    if (slug === 'countdown') {
      const dtLocal = str(slug, '_fecha_local')
      out = {
        ...out,
        fecha_inicio: dtLocal ? datetimeLocalToIsoCancun(dtLocal) : str(slug, 'fecha_inicio'),
      }
      delete out._fecha_local
    }
    const errV = validateConfig(slug, out)
    if (errV) {
      setError(errV)
      return
    }
    setSaving(slug)
    setError(null)
    const res = await updateBlockConfig(slug, out)
    setSaving(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setConfigs((prev) => ({ ...prev, [slug]: out }))
    if (ids[slug] === null) setIds((prev) => ({ ...prev, [slug]: res.id }))
    setSaved(slug)
    setTimeout(() => setSaved((s) => (s === slug ? null : s)), 2000)
  }

  async function handleToggle(slug: Biohazard2Slug) {
    const newActivo = !activos[slug]
    setToggling(slug)
    setError(null)
    const res = await toggleBlockActive(slug, newActivo)
    setToggling(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setActivos((prev) => ({ ...prev, [slug]: newActivo }))
    setIds((prev) => ({ ...prev, [slug]: res.id }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    if (reordering) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedSlugs.indexOf(active.id as Biohazard2Slug)
    const newIndex = orderedSlugs.indexOf(over.id as Biohazard2Slug)
    if (oldIndex === -1 || newIndex === -1) return
    const prevOrder = orderedSlugs
    const newOrder = [...orderedSlugs]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    setOrderedSlugs(newOrder)
    setReordering(true)
    setReorderError(null)
    try {
      const idsInOrder = newOrder.map((s) => ids[s]).filter((id): id is string => typeof id === 'string')
      if (idsInOrder.length !== newOrder.length) throw new Error('Hay secciones sin guardar — guárdalas antes de reordenar.')
      const res = await reorderAllBlocks(idsInOrder)
      if ('error' in res) throw new Error(res.error)
    } catch (err: unknown) {
      setReorderError(err instanceof Error ? err.message : 'Error al reordenar')
      setOrderedSlugs(prevOrder)
    } finally {
      setReordering(false)
    }
  }

  const inputCls = 'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#CC4B37]'

  function editorFor(slug: Biohazard2Slug) {
    switch (slug) {
      case 'hero':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Subtítulo"><input className={inputCls} value={str(slug, 'subtitulo')} onChange={(e) => setField(slug, 'subtitulo', e.target.value)} /></Field>
            <Field label="Lema"><input className={inputCls} value={str(slug, 'lema')} onChange={(e) => setField(slug, 'lema', e.target.value)} /></Field>
            <Field label="Fecha (texto)"><input className={inputCls} value={str(slug, 'fecha_texto')} onChange={(e) => setField(slug, 'fecha_texto', e.target.value)} /></Field>
            <Field label="Ubicación (texto)"><input className={inputCls} value={str(slug, 'ubicacion_texto')} onChange={(e) => setField(slug, 'ubicacion_texto', e.target.value)} /></Field>
            <MediaUploadInput
              label="MEDIA DE FONDO (IMAGEN O VIDEO)"
              currentUrl={str(slug, 'media_url')}
              currentType={cfg(slug).media_type === 'video' ? 'video' : 'image'}
              slug="hero"
              onChange={(url, type) => {
                setConfigs((prev) => ({ ...prev, hero: { ...(prev.hero ?? {}), media_url: url, media_type: type } }))
              }}
            />
            <Field label="CTA 1 texto"><input className={inputCls} value={str(slug, 'cta1_texto')} onChange={(e) => setField(slug, 'cta1_texto', e.target.value)} /></Field>
            <Field label="CTA 1 link (#ancla, /ruta o http)"><input className={inputCls} value={str(slug, 'cta1_link')} onChange={(e) => setField(slug, 'cta1_link', e.target.value)} /></Field>
            <Field label="CTA 2 texto"><input className={inputCls} value={str(slug, 'cta2_texto')} onChange={(e) => setField(slug, 'cta2_texto', e.target.value)} /></Field>
            <Field label="CTA 2 link (#ancla, /ruta o http)"><input className={inputCls} value={str(slug, 'cta2_link')} onChange={(e) => setField(slug, 'cta2_link', e.target.value)} /></Field>
            <Field label={`SEO title (${str(slug, 'seo_title').length}/100)`}>
              <input maxLength={100} className={inputCls} value={str(slug, 'seo_title')} onChange={(e) => setField(slug, 'seo_title', e.target.value)} />
            </Field>
            <Field label={`SEO description (${str(slug, 'seo_description').length}/200)`}>
              <textarea maxLength={200} rows={3} className={inputCls} value={str(slug, 'seo_description')} onChange={(e) => setField(slug, 'seo_description', e.target.value)} />
            </Field>
          </div>
        )
      case 'narrativa': {
        const norm = asRecords(cfg(slug).bloques).map((b) => ({ titulo: strOf(b, 'titulo'), texto: strOf(b, 'texto') }))
        const setBloques = (next: typeof norm) => setField(slug, 'bloques', next)
        return (
          <div className="flex flex-col gap-3">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em]" style={jost} onClick={() => setBloques([...norm, { titulo: '', texto: '' }])}>+ Agregar bloque</button>
            {norm.map((b, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <Ctrl i={i} total={norm.length} onMove={(dir) => setBloques(mover(norm, i, dir))} onDelete={() => setBloques(norm.filter((_, j) => j !== i))} />
                <Field label="Título"><input className={inputCls} value={b.titulo} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setBloques(n) }} /></Field>
                <Field label="Texto"><textarea rows={4} className={inputCls} value={b.texto} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], texto: e.target.value }; setBloques(n) }} /></Field>
              </div>
            ))}
          </div>
        )
      }
      case 'countdown': {
        const localVal = str(slug, '_fecha_local') || isoToDatetimeLocal(str(slug, 'fecha_inicio'))
        return (
          <div className="flex flex-col gap-4">
            <Field label="Fecha inicio (hora Cancún −05:00 al guardar)">
              <input
                type="datetime-local"
                className={inputCls}
                value={localVal}
                onChange={(e) => {
                  setField(slug, '_fecha_local', e.target.value)
                  setField(slug, 'fecha_inicio', datetimeLocalToIsoCancun(e.target.value))
                }}
              />
            </Field>
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
          </div>
        )
      }
      case 'mision': {
        const norm = asRecords(cfg(slug).objetivos).map((o) => ({ codigo: strOf(o, 'codigo'), titulo: strOf(o, 'titulo'), descripcion: strOf(o, 'descripcion') }))
        const setObjs = (next: typeof norm) => setField(slug, 'objetivos', next)
        return (
          <div className="flex flex-col gap-3">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Descripción"><textarea rows={4} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="Cierre"><input className={inputCls} value={str(slug, 'cierre')} onChange={(e) => setField(slug, 'cierre', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} disabled={norm.length >= MAX_OBJETIVOS} onClick={() => setObjs([...norm, { codigo: '', titulo: '', descripcion: '' }])}>+ Objetivo</button>
            {norm.map((o, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <Ctrl i={i} total={norm.length} onMove={(dir) => setObjs(mover(norm, i, dir))} onDelete={() => setObjs(norm.filter((_, j) => j !== i))} />
                <Field label="Código"><input className={inputCls} value={o.codigo} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], codigo: e.target.value }; setObjs(n) }} /></Field>
                <Field label="Título"><input className={inputCls} value={o.titulo} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setObjs(n) }} /></Field>
                <Field label="Descripción"><textarea rows={3} className={inputCls} value={o.descripcion} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], descripcion: e.target.value }; setObjs(n) }} /></Field>
              </div>
            ))}
          </div>
        )
      }
      case 'soldado_cero': {
        const norm = asRecords(cfg(slug).datos).map((d) => ({ label: strOf(d, 'label'), valor: strOf(d, 'valor') }))
        const setDatos = (next: typeof norm) => setField(slug, 'datos', next)
        return (
          <div className="flex flex-col gap-3">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Nombre clave"><input className={inputCls} value={str(slug, 'nombre_clave')} onChange={(e) => setField(slug, 'nombre_clave', e.target.value)} /></Field>
            <Field label="Estado"><input className={inputCls} value={str(slug, 'estado')} onChange={(e) => setField(slug, 'estado', e.target.value)} /></Field>
            <Field label="Clasificación"><input className={inputCls} value={str(slug, 'clasificacion')} onChange={(e) => setField(slug, 'clasificacion', e.target.value)} /></Field>
            <Field label="Imagen">
              <ImageUploadInput slug="soldado-cero" value={str(slug, 'imagen_url')} onChange={(u) => setField(slug, 'imagen_url', u)} />
            </Field>
            <Field label="Descripción"><textarea rows={4} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="Advertencia"><textarea rows={2} className={inputCls} value={str(slug, 'advertencia')} onChange={(e) => setField(slug, 'advertencia', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} disabled={norm.length >= MAX_DATOS} onClick={() => setDatos([...norm, { label: '', valor: '' }])}>+ Dato</button>
            {norm.map((d, i) => (
              <div key={i} className="flex flex-col gap-2 border border-[#EEEEEE] bg-white p-3">
                <button type="button" className="self-start text-[10px] text-[#CC4B37]" style={jost} onClick={() => setDatos(norm.filter((_, j) => j !== i))}>Eliminar</button>
                <Field label="Label"><input className={inputCls} value={d.label} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], label: e.target.value }; setDatos(n) }} /></Field>
                <Field label="Valor"><input className={inputCls} value={d.valor} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], valor: e.target.value }; setDatos(n) }} /></Field>
              </div>
            ))}
          </div>
        )
      }
      case 'facciones': {
        const norm = asRecords(cfg(slug).facciones).map((f) => leerFaccion(f))
        const setFacciones = (next: FaccionForm[]) => setField(slug, 'facciones', next)
        const patchF = (i: number, partial: Partial<FaccionForm>) => {
          const n = [...norm]
          n[i] = { ...n[i], ...partial }
          setFacciones(n)
        }
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Descripción"><textarea rows={3} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="Nota"><textarea rows={2} className={inputCls} value={str(slug, 'nota')} onChange={(e) => setField(slug, 'nota', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} disabled={norm.length >= MAX_FACCIONES} onClick={() => setFacciones([...norm, faccionVacia()])}>+ Facción</button>
            {norm.map((f, i) => (
              <details key={i} className="border border-[#E4E4E4] bg-white p-3" {...(i === 0 ? { open: true } : {})}>
                <summary className="cursor-pointer text-[11px] tracking-[0.12em]" style={jost}>{f.nombre.trim() || `Facción ${i + 1}`}</summary>
                <div className="mt-3 flex flex-col gap-3">
                  <Ctrl i={i} total={norm.length} onMove={(dir) => setFacciones(mover(norm, i, dir))} onDelete={() => setFacciones(norm.filter((_, j) => j !== i))} />
                  <Field label="ID"><input className={inputCls} value={f.id} onChange={(e) => patchF(i, { id: e.target.value })} /></Field>
                  <Field label="Nombre"><input className={inputCls} value={f.nombre} onChange={(e) => patchF(i, { nombre: e.target.value })} /></Field>
                  <Field label="Subtítulo"><input className={inputCls} value={f.subtitulo} onChange={(e) => patchF(i, { subtitulo: e.target.value })} /></Field>
                  <Field label="País"><input className={inputCls} value={f.pais} onChange={(e) => patchF(i, { pais: e.target.value })} /></Field>
                  <Field label="Bandera"><input className={inputCls} value={f.bandera} onChange={(e) => patchF(i, { bandera: e.target.value })} /></Field>
                  <Field label="Color">
                    <div className="flex items-center gap-2">
                      <input type="color" value={HEX.test(f.color) ? f.color : '#CC4B37'} onChange={(e) => patchF(i, { color: e.target.value })} className="h-9 w-12 cursor-pointer border border-[#E4E4E4] bg-white" aria-label="Color de la facción" />
                      <input className={inputCls} value={f.color} onChange={(e) => patchF(i, { color: e.target.value })} />
                    </div>
                  </Field>
                  <Field label="Comandante"><input className={inputCls} value={f.comandante} onChange={(e) => patchF(i, { comandante: e.target.value })} /></Field>
                  <Field label="Doctrina"><textarea rows={3} className={inputCls} value={f.doctrina} onChange={(e) => patchF(i, { doctrina: e.target.value })} /></Field>
                  <StringListEditor label="Uniformidad" values={f.uniformidad} onChange={(next) => patchF(i, { uniformidad: next })} />
                  <Field label="Descripción"><textarea rows={3} className={inputCls} value={f.descripcion} onChange={(e) => patchF(i, { descripcion: e.target.value })} /></Field>
                  <Field label="Imagen"><ImageUploadInput slug={`faccion-${i}`} value={f.imagen_url} onChange={(u) => patchF(i, { imagen_url: u })} /></Field>
                  <Field label="Logo"><ImageUploadInput slug={`faccion-logo-${i}`} value={f.logo_url} onChange={(u) => patchF(i, { logo_url: u })} /></Field>
                  <Field label="Contacto"><input className={inputCls} value={f.contacto_nombre} onChange={(e) => patchF(i, { contacto_nombre: e.target.value })} /></Field>
                  <Field label="WhatsApp (https://wa.me/…)"><input className={inputCls} value={f.contacto_whatsapp} onChange={(e) => patchF(i, { contacto_whatsapp: e.target.value })} /></Field>
                  <Field label="Cupo (texto)"><input className={inputCls} value={f.cupo_texto} onChange={(e) => patchF(i, { cupo_texto: e.target.value })} /></Field>
                  <label className="flex items-center gap-2 text-[12px] text-[#444]" style={lato}>
                    <input type="checkbox" checked={f.agotada} onChange={(e) => patchF(i, { agotada: e.target.checked })} />
                    Agotada (CUPO LLENO)
                  </label>
                </div>
              </details>
            ))}
          </div>
        )
      }
      case 'sede': {
        const imagenesArr = strsOf(cfg(slug).imagenes)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Galería sede">
              <MultiImageUploader value={imagenesArr} onChange={(urls) => setField(slug, 'imagenes', urls)} />
            </Field>
            <Field label="Descripción"><textarea rows={4} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="Dirección"><input className={inputCls} value={str(slug, 'direccion')} onChange={(e) => setField(slug, 'direccion', e.target.value)} /></Field>
            <Field label="Coordenadas"><input className={inputCls} value={str(slug, 'coordenadas')} onChange={(e) => setField(slug, 'coordenadas', e.target.value)} /></Field>
            <Field label="Maps link"><input className={inputCls} value={str(slug, 'maps_link')} onChange={(e) => setField(slug, 'maps_link', e.target.value)} /></Field>
          </div>
        )
      }
      case 'inscripcion': {
        const estados = ['activa', 'agotada', 'proxima', 'finalizada'] as const
        const norm = asRecords(cfg(slug).ventanas).map((v) => ({
          nombre: strOf(v, 'nombre'),
          fecha_inicio: strOf(v, 'fecha_inicio'),
          fecha_fin: strOf(v, 'fecha_fin'),
          precio: strOf(v, 'precio'),
          incluye: strsOf(v.incluye),
          estado: (estados as readonly string[]).includes(strOf(v, 'estado')) ? (strOf(v, 'estado') as (typeof estados)[number]) : 'proxima',
          cta_texto: strOf(v, 'cta_texto'),
          cta_link: strOf(v, 'cta_link'),
        }))
        const setVentanas = (next: typeof norm) => setField(slug, 'ventanas', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Nota"><textarea rows={2} className={inputCls} value={str(slug, 'nota')} onChange={(e) => setField(slug, 'nota', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setVentanas([...norm, { nombre: '', fecha_inicio: '', fecha_fin: '', precio: '', incluye: [], estado: 'proxima', cta_texto: '', cta_link: '' }])}>+ Agregar ventana</button>
            {norm.map((v, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <button type="button" className="mb-2 text-[10px] text-[#CC4B37]" style={jost} onClick={() => setVentanas(norm.filter((_, j) => j !== i))}>✕ Eliminar</button>
                <Field label="Nombre"><input className={inputCls} value={v.nombre} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], nombre: e.target.value }; setVentanas(n) }} /></Field>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Fecha inicio"><input type="date" className={inputCls} value={fechaInput(v.fecha_inicio)} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], fecha_inicio: e.target.value }; setVentanas(n) }} /></Field>
                  <Field label="Fecha fin"><input type="date" className={inputCls} value={fechaInput(v.fecha_fin)} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], fecha_fin: e.target.value }; setVentanas(n) }} /></Field>
                </div>
                <Field label="Precio"><input className={inputCls} value={v.precio} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], precio: e.target.value }; setVentanas(n) }} /></Field>
                <StringListEditor label="Incluye" values={v.incluye} onChange={(next) => { const n = [...norm]; n[i] = { ...n[i], incluye: next }; setVentanas(n) }} />
                <Field label="Estado">
                  <select className={inputCls} value={v.estado} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], estado: e.target.value as typeof v.estado }; setVentanas(n) }}>
                    <option value="activa">activa</option>
                    <option value="agotada">agotada</option>
                    <option value="proxima">proxima</option>
                    <option value="finalizada">finalizada</option>
                  </select>
                </Field>
                <Field label="CTA texto"><input className={inputCls} value={v.cta_texto} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], cta_texto: e.target.value }; setVentanas(n) }} /></Field>
                <Field label="CTA link"><input className={inputCls} value={v.cta_link} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], cta_link: e.target.value }; setVentanas(n) }} /></Field>
              </div>
            ))}
          </div>
        )
      }
      case 'cronograma': {
        const norm = asRecords(cfg(slug).hitos).map((h) => ({
          dia: strOf(h, 'dia'),
          hora: strOf(h, 'hora'),
          titulo: strOf(h, 'titulo'),
          descripcion: strOf(h, 'descripcion'),
          nocturno: Boolean(h.nocturno),
        }))
        const setHitos = (next: typeof norm) => setField(slug, 'hitos', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setHitos([...norm, { dia: '', hora: '', titulo: '', descripcion: '', nocturno: false }])}>+ Agregar hito</button>
            {norm.map((h, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <Ctrl i={i} total={norm.length} onMove={(dir) => setHitos(mover(norm, i, dir))} onDelete={() => setHitos(norm.filter((_, j) => j !== i))} />
                <Field label="Día"><input className={inputCls} placeholder="SÁB 14" value={h.dia} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], dia: e.target.value }; setHitos(n) }} /></Field>
                <Field label="Hora"><input className={inputCls} value={h.hora} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], hora: e.target.value }; setHitos(n) }} /></Field>
                <Field label="Título"><input className={inputCls} value={h.titulo} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setHitos(n) }} /></Field>
                <Field label="Descripción"><textarea rows={2} className={inputCls} value={h.descripcion} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], descripcion: e.target.value }; setHitos(n) }} /></Field>
                <label className="flex items-center gap-2 text-[12px] text-[#444]" style={lato}>
                  <input type="checkbox" checked={h.nocturno} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], nocturno: e.target.checked }; setHitos(n) }} />
                  Nocturno
                </label>
              </div>
            ))}
          </div>
        )
      }
      case 'reglamento':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <StringListEditor label="Reglas" values={strsOf(cfg(slug).reglas)} onChange={(next) => setField(slug, 'reglas', next)} />
            <Field label="Pie de página"><input className={inputCls} value={str(slug, 'pie_pagina')} onChange={(e) => setField(slug, 'pie_pagina', e.target.value)} /></Field>
          </div>
        )
      case 'productor':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Nombre"><input className={inputCls} value={str(slug, 'nombre')} onChange={(e) => setField(slug, 'nombre', e.target.value)} /></Field>
            <Field label="Logo"><ImageUploadInput slug="productor" value={str(slug, 'logo_url')} onChange={(u) => setField(slug, 'logo_url', u)} /></Field>
            <Field label="Descripción"><textarea rows={4} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="Instagram"><input className={inputCls} value={str(slug, 'instagram')} onChange={(e) => setField(slug, 'instagram', e.target.value)} /></Field>
            <Field label="Facebook"><input className={inputCls} value={str(slug, 'facebook')} onChange={(e) => setField(slug, 'facebook', e.target.value)} /></Field>
            <Field label="WhatsApp"><input className={inputCls} value={str(slug, 'whatsapp')} onChange={(e) => setField(slug, 'whatsapp', e.target.value)} /></Field>
            <Field label="Sitio"><input className={inputCls} value={str(slug, 'sitio')} onChange={(e) => setField(slug, 'sitio', e.target.value)} /></Field>
          </div>
        )
      case 'sponsors': {
        const logos = asRecords(cfg(slug).logos).map((l) => ({
          id: strOf(l, 'id') || undefined,
          nombre: strOf(l, 'nombre'),
          logo_url: strOf(l, 'logo_url'),
          link: strOf(l, 'link'),
        }))
        return (
          <SponsorsCatalogPicker
            logos={logos}
            eyebrow={str(slug, 'eyebrow')}
            titulo={str(slug, 'titulo')}
            onEyebrowChange={(v) => setField(slug, 'eyebrow', v)}
            onTituloChange={(v) => setField(slug, 'titulo', v)}
            onLogosChange={(next) => setField(slug, 'logos', next)}
            inputCls={inputCls}
          />
        )
      }
      case 'galeria': {
        const norm = asRecords(cfg(slug).imagenes).map((im) => ({
          url: strOf(im, 'url'),
          orientacion: (['vertical', 'horizontal', 'cuadrada'].includes(strOf(im, 'orientacion')) ? strOf(im, 'orientacion') : 'vertical') as GaleriaImagen['orientacion'],
        }))
        const setImg = (next: typeof norm) => setField(slug, 'imagenes', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <MultiImageUploader
              value={norm.map((x) => x.url).filter(Boolean)}
              onChange={(urls) => {
                const oldByUrl = new Map(norm.map((x) => [x.url, x]))
                setImg(urls.map((u) => oldByUrl.get(u) ?? { url: u, orientacion: 'vertical' as const }))
              }}
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {norm.map((im, i) => (
                <div key={`${im.url}-${i}`} className="border border-[#EEEEEE] p-2">
                  <div className="relative mb-2 aspect-square overflow-hidden bg-[#f4f4f4]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <select className={`${inputCls} text-[11px]`} value={im.orientacion} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], orientacion: e.target.value as GaleriaImagen['orientacion'] }; setImg(n) }}>
                    <option value="vertical">vertical</option>
                    <option value="horizontal">horizontal</option>
                    <option value="cuadrada">cuadrada</option>
                  </select>
                  <button type="button" className="mt-2 text-[10px] text-[#CC4B37]" style={jost} onClick={() => setImg(norm.filter((_, j) => j !== i))}>Quitar</button>
                </div>
              ))}
            </div>
          </div>
        )
      }
      case 'videos': {
        const norm: VideoItem[] = asRecords(cfg(slug).videos).map((o) => ({
          url: strOf(o, 'url'),
          poster: strOf(o, 'poster'),
          titulo: strOf(o, 'titulo'),
        }))
        const setVideos = (next: VideoItem[]) => setField(slug, 'videos', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setVideos([...norm, { url: '', poster: '', titulo: '' }])}>+ Video</button>
            {norm.map((v, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <button type="button" className="mb-2 text-[10px] text-[#CC4B37]" style={jost} onClick={() => setVideos(norm.filter((_, j) => j !== i))}>✕ Eliminar</button>
                <Field label="Video MP4"><VideoUploadInput value={v.url} onChange={(url) => { const n = [...norm]; n[i] = { ...n[i], url }; setVideos(n) }} /></Field>
                <Field label="Poster (opcional)"><ImageUploadInput slug="videos" value={v.poster ?? ''} onChange={(url) => { const n = [...norm]; n[i] = { ...n[i], poster: url }; setVideos(n) }} /></Field>
                <Field label="Título (opcional)"><input className={inputCls} value={v.titulo ?? ''} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setVideos(n) }} /></Field>
              </div>
            ))}
          </div>
        )
      }
      case 'airnation':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Descripción"><textarea rows={4} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="CTA texto"><input className={inputCls} value={str(slug, 'cta_texto')} onChange={(e) => setField(slug, 'cta_texto', e.target.value)} /></Field>
            <Field label="CTA link"><input className={inputCls} value={str(slug, 'cta_link')} onChange={(e) => setField(slug, 'cta_link', e.target.value)} /></Field>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-0" style={lato}>
      <div className="mb-5 border-b border-[#EEEEEE] pb-4">
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>Editor de landing — Biohazard 2</h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Cambios visibles en <a href="/biohazard2" target="_blank" className="text-[#CC4B37] underline">/biohazard2</a>
        </p>
      </div>
      {error ? (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]" style={lato}>{error}</p>
        </div>
      ) : null}
      {reordering ? <div className="mb-3 border border-[#CC4B37] bg-[#fff5f3] px-3 py-2 text-[11px] text-[#CC4B37]" style={jost}>Guardando nuevo orden…</div> : null}
      {reorderError ? <div className="mb-3 border border-[#CC4B37] bg-[#fff5f3] px-3 py-2 text-[11px] text-[#CC4B37]" style={jost}>⚠ {reorderError}</div> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedSlugs} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {orderedSlugs.map((slug, i) => {
              const def = sectionFor(slug)
              const isOpen = expandido === slug
              const thumb = getThumb(slug, cfg(slug))
              return (
                <SortableSection key={slug} slug={slug}>
                  {({ attributes, listeners }) => (
                    <div className={`border transition-colors ${isOpen ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'}`}>
                      <div className={`flex w-full items-center gap-3 px-4 py-3.5 hover:bg-[#FAFAFA] ${!activos[slug] ? 'opacity-60' : ''}`}>
                        <button type="button" {...attributes} {...listeners} className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-[#999999] hover:text-[#CC4B37]" aria-label="Arrastrar para reordenar">
                          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
                            <circle cx="2" cy="2" r="1.2" fill="currentColor" /><circle cx="8" cy="2" r="1.2" fill="currentColor" />
                            <circle cx="2" cy="7" r="1.2" fill="currentColor" /><circle cx="8" cy="7" r="1.2" fill="currentColor" />
                            <circle cx="2" cy="12" r="1.2" fill="currentColor" /><circle cx="8" cy="12" r="1.2" fill="currentColor" />
                          </svg>
                        </button>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#666666]" style={jost}>{i + 1}</span>
                        <button type="button" onClick={() => setExpandido(isOpen ? null : slug)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          {thumb ? (
                            <div className="h-9 w-14 shrink-0 overflow-hidden border border-[#EEEEEE]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-9 w-14 shrink-0 border border-dashed border-[#DDDDDD] bg-[#F7F7F7]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#111111]" style={jost}>{def.label}</p>
                            <p className="truncate text-[11px] text-[#AAAAAA]" style={lato}>{str(slug, 'titulo') || def.descripcion}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {saved === slug ? <span className="text-[10px] font-bold text-[#22C55E]" style={jost}>Guardado</span> : null}
                            {ids[slug] === null ? <span className="border border-[#DDDDDD] px-2 py-0.5 text-[9px] text-[#AAAAAA]" style={jost}>Sin configurar</span> : null}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); if (toggling !== slug) handleToggle(slug) }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (toggling !== slug) handleToggle(slug)
                                }
                              }}
                              className={`flex items-center gap-1.5 ${toggling === slug ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                            >
                              <span className={`relative block h-5 w-9 ${activos[slug] ? 'bg-[#22C55E]' : 'bg-[#DDDDDD]'}`} style={{ borderRadius: 10 }}>
                                <span className="absolute top-0.5 block h-4 w-4 bg-white shadow" style={{ borderRadius: '50%', transform: activos[slug] ? 'translateX(18px)' : 'translateX(2px)' }} />
                              </span>
                              <span className={`text-[9px] font-extrabold uppercase ${activos[slug] ? 'text-[#22C55E]' : 'text-[#AAAAAA]'}`} style={jost}>
                                {toggling === slug ? '…' : activos[slug] ? 'ON' : 'OFF'}
                              </span>
                            </span>
                          </div>
                        </button>
                      </div>
                      {isOpen ? (
                        <div className="border-t border-[#EEEEEE] bg-[#FAFAFA] p-5">
                          <p className="mb-4 text-[11px] text-[#888888]" style={lato}>{def.descripcion}</p>
                          {editorFor(slug)}
                          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#EEEEEE] pt-4">
                            <button type="button" onClick={() => handleSave(slug)} disabled={!!saving} className="bg-[#CC4B37] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60" style={jost}>
                              {saving === slug ? 'Guardando…' : 'Guardar'}
                            </button>
                            <a href="/biohazard2" target="_blank" className="text-[11px] text-[#CC4B37] hover:underline" style={jost}>Ver landing →</a>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </SortableSection>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function Ctrl({ i, total, onMove, onDelete }: { i: number; total: number; onMove: (dir: -1 | 1) => void; onDelete: () => void }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <button type="button" className="text-[10px] text-[#666]" style={jost} disabled={i === 0} onClick={() => onMove(-1)}>↑</button>
      <button type="button" className="text-[10px] text-[#666]" style={jost} disabled={i === total - 1} onClick={() => onMove(1)}>↓</button>
      <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={onDelete}>Eliminar</button>
    </div>
  )
}

function StringListEditor({ label, values, onChange }: { label: string; values: string[]; onChange: (next: string[]) => void }) {
  const inputCls = 'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#CC4B37]'
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]" style={jost}>{label}</span>
      <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-1.5 text-[10px]" style={jost} onClick={() => onChange([...values, ''])}>+ Agregar</button>
      {values.map((val, i) => (
        <div key={i} className="flex gap-2">
          <input className={inputCls} value={val} onChange={(e) => { const n = [...values]; n[i] = e.target.value; onChange(n) }} />
          <button type="button" className="shrink-0 px-2 text-[10px] text-[#CC4B37]" style={jost} onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]" style={jost}>{label}</span>
      {children}
    </div>
  )
}
