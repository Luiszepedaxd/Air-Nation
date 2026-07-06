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
import type { Virus3Slug } from '@/app/virus3/lib/types'
import type { GaleriaImagen, VideoItem } from '@/app/virus3/lib/types'
import { VIRUS3_SLUGS } from '@/app/virus3/lib/types'
import { VideoUploadInput } from '@/app/admin/operacionkursk2/components/VideoUploadInput'
const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

export type Virus3Record = {
  id: string | null
  slug: Virus3Slug
  config: Record<string, unknown>
  activo: boolean
  orden: number
}

type SectionDef = {
  slug: Virus3Slug
  label: string
  descripcion: string
}

const SECTIONS: SectionDef[] = [
  { slug: 'hero', label: 'Hero — Cabecera', descripcion: 'Media de fondo, textos, CTAs y SEO.' },
  { slug: 'narrativa', label: 'Narrativa', descripcion: 'Bloques de texto narrativo.' },
  { slug: 'sede', label: 'Sede', descripcion: 'Hospital abandonado, galería e info.' },
  { slug: 'countdown', label: 'Countdown', descripcion: 'Fecha objetivo.' },
  { slug: 'facciones', label: 'Facciones — 4 bandos', descripcion: 'USASF, NOVA, Resistencia Global, Mercenarios.' },
  { slug: 'inscripcion', label: 'Inscripción', descripcion: 'Ventanas de precio escalonadas.' },
  { slug: 'amenidades', label: 'Amenidades', descripcion: 'Lista de servicios incluidos.' },
  { slug: 'cronograma', label: 'Cronograma', descripcion: 'Línea de tiempo del evento.' },
  { slug: 'sponsors', label: 'Sponsors', descripcion: 'Selección desde catálogo global.' },
  { slug: 'galeria', label: 'Galería', descripcion: 'Imágenes del evento.' },
  { slug: 'videos', label: 'Videos', descripcion: 'Videos MP4.' },
  { slug: 'musica', label: 'Música — Canción oficial', descripcion: 'Reproductor del tema oficial del evento.' },
  { slug: 'airnation', label: 'AirNation', descripcion: 'Bloque presencia AirNation.' },
]

function MultiImageUploader({
  slug: _slug,
  value,
  onChange,
}: {
  slug: string
  value: string[]
  onChange: (urls: string[]) => void
}) {
  void _slug
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const invalid = files.find(
      (f) => !f.type.startsWith('image/') || f.type === 'image/svg+xml'
    )
    if (invalid) {
      setErr('Solo imágenes (JPG, PNG, WebP, JFIF, etc.)')
      return
    }
    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024)
    if (tooBig) {
      setErr('Cada imagen máx 5 MB')
      return
    }

    setUploading(true)
    setErr(null)
    try {
      const urls: string[] = [...value]
      for (const file of files) {
        const url = await uploadFile(file)
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white hover:bg-black disabled:opacity-40"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white hover:bg-black disabled:opacity-40"
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="flex h-6 w-6 items-center justify-center bg-[#CC4B37] text-[12px] text-white hover:opacity-90"
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
          accept="image/*"
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

function isoToDatetimeLocal(iso: string): string {
  if (!iso?.trim()) return ''
  const lit = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (lit) return `${lit[1]}T${lit[2]}:${lit[3]}`
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function datetimeLocalToIsoCst(dt: string): string {
  if (!dt?.trim()) return ''
  const [dp, tp = '00:00'] = dt.split('T')
  const [hh = '00', mm = '00'] = tp.split(':')
  return `${dp}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00-06:00`
}

function httpUrlOk(v: string): boolean {
  const t = v.trim()
  return !t || /^https?:\/\//i.test(t)
}

type CatalogSponsor = {
  id: string
  nombre: string
  logo_url: string
  link: string
}

type SponsorLogoEntry = {
  nombre: string
  logo_url: string
  link: string
}

function buildLogosFromCatalog(
  catalog: CatalogSponsor[],
  selectedIds: Set<string>
): SponsorLogoEntry[] {
  return catalog
    .filter((s) => selectedIds.has(s.id))
    .map((s) => ({ nombre: s.nombre, logo_url: s.logo_url, link: s.link }))
}

function selectedIdsFromLogos(
  logos: SponsorLogoEntry[],
  catalog: CatalogSponsor[]
): Set<string> {
  const selected = new Set<string>()
  for (const logo of logos) {
    const match = catalog.find(
      (c) =>
        (logo.logo_url && c.logo_url && c.logo_url.trim() === logo.logo_url.trim()) ||
        (c.nombre.trim().toLowerCase() === logo.nombre.trim().toLowerCase())
    )
    if (match) selected.add(match.id)
  }
  return selected
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
            Agrega sponsors desde{' '}
            <a href="/admin/sponsors" className="text-[#CC4B37] underline">
              /admin/sponsors
            </a>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {catalog.map((sponsor) => (
              <label
                key={sponsor.id}
                className="flex cursor-pointer items-center gap-3 rounded border border-[#EEEEEE] p-3 hover:bg-[#F4F4F4]"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(sponsor.id)}
                  onChange={() => toggleSponsor(sponsor.id)}
                  className="h-4 w-4 accent-[#CC4B37]"
                />
                {sponsor.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.nombre}
                    className="h-8 w-16 object-contain"
                  />
                ) : (
                  <div className="flex h-8 w-16 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#AAAAAA]">
                    Sin logo
                  </div>
                )}
                <span className="text-sm text-[#111111]">{sponsor.nombre}</span>
                {sponsor.link && (
                  <span className="ml-auto text-[11px] text-[#AAAAAA]">{sponsor.link}</span>
                )}
              </label>
            ))}
          </div>
        )}

        {!loading && catalog.length > 0 && logos.length === 0 ? (
          <p className="mt-3 text-[11px] text-[#AAAAAA]">
            Ningún sponsor seleccionado para esta landing.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function validateConfig(slug: Virus3Slug, cfg: Record<string, unknown>): string | null {
  const chk = (val: unknown) => (typeof val === 'string' ? val : '')

  if (slug === 'hero') {
    if (!httpUrlOk(chk(cfg.cta1_link))) return 'CTA 1 link debe ser http(s) o vacío.'
    if (!httpUrlOk(chk(cfg.cta2_link))) return 'CTA 2 link debe ser http(s) o vacío.'
    const seo = chk(cfg.seo_title)
    const sed = chk(cfg.seo_description)
    if (seo.length > 100) return 'SEO title máx 100 caracteres.'
    if (sed.length > 200) return 'SEO description máx 200 caracteres.'
  }
  if (slug === 'sede' && !httpUrlOk(chk(cfg.maps_link))) {
    return 'Maps link debe ser http(s) o vacío.'
  }
  if (slug === 'inscripcion') {
    const ventanas = cfg.ventanas
    if (Array.isArray(ventanas)) {
      for (const row of ventanas) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          const link = (row as { cta_link?: string }).cta_link
          if (typeof link === 'string' && link.trim() && !/^https?:\/\//i.test(link.trim())) {
            return 'Cada CTA de ventana debe ser http(s) o vacío.'
          }
        }
      }
    }
  }
  if (slug === 'airnation' && !httpUrlOk(chk(cfg.cta_link))) {
    return 'CTA link debe ser http(s) o vacío.'
  }
  if (slug === 'sponsors') {
    const logos = cfg.logos
    if (Array.isArray(logos)) {
      for (const row of logos) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          const link = (row as { link?: string }).link
          if (typeof link === 'string' && link.trim() && !/^https?:\/\//i.test(link.trim())) {
            return 'Cada link de sponsor debe ser http(s) o vacío.'
          }
        }
      }
    }
  }
  if (slug === 'facciones') {
    const facciones = cfg.facciones
    if (Array.isArray(facciones)) {
      for (const row of facciones) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          const w = (row as { contacto_whatsapp?: string }).contacto_whatsapp
          if (typeof w === 'string' && w.trim() && !/^https?:\/\//i.test(w.trim())) {
            return 'Cada WhatsApp de facción debe ser URL http(s) o vacío.'
          }
        }
      }
    }
  }
  return null
}

function emptyFaccionV3() {
  return {
    nombre: '',
    imagen_url: '',
    descripcion: '',
    loadout: '',
    contacto_nombre: '',
    contacto_whatsapp: '',
    agotada: false,
  }
}

function getThumb(slug: Virus3Slug, cfg: Record<string, unknown>): string {
  if (slug === 'hero') {
    const m = typeof cfg.media_url === 'string' ? cfg.media_url : ''
    const leg = typeof cfg.imagen_fondo_url === 'string' ? cfg.imagen_fondo_url : ''
    return m || leg
  }
  if (slug === 'sede') {
    const imgs = cfg.imagenes
    if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string' && imgs[0].trim()) {
      return imgs[0]
    }
    return typeof cfg.imagen_url === 'string' ? cfg.imagen_url : ''
  }
  if (slug === 'facciones') {
    const facciones = cfg.facciones
    if (Array.isArray(facciones) && facciones.length > 0) {
      const first = facciones[0] as { imagen_url?: string } | undefined
      return first?.imagen_url ?? ''
    }
  }
  return ''
}

type SortableHandleProps = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>

function SortableSection({
  slug,
  children,
}: {
  slug: Virus3Slug
  children: (handleProps: SortableHandleProps) => React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slug })

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

function sectionFor(slug: Virus3Slug): SectionDef {
  const def = SECTIONS.find((s) => s.slug === slug)
  if (!def) throw new Error(`Section metadata missing: ${slug}`)
  return def
}

export function Virus3AdminClient({
  initialBlocks,
}: {
  initialBlocks: Virus3Record[]
}) {
  const [configs, setConfigs] = useState<Record<Virus3Slug, Record<string, unknown>>>(() => {
    const map = {} as Record<Virus3Slug, Record<string, unknown>>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.config ? { ...found.config } : {}
    }
    return map
  })

  const [ids, setIds] = useState<Record<Virus3Slug, string | null>>(() => {
    const map = {} as Record<Virus3Slug, string | null>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.id ?? null
    }
    return map
  })

  const [activos, setActivos] = useState<Record<Virus3Slug, boolean>>(() => {
    const map = {} as Record<Virus3Slug, boolean>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.activo ?? true
    }
    return map
  })

  const [orderedSlugs, setOrderedSlugs] = useState<Virus3Slug[]>(() => {
    const fromBd = initialBlocks.map((b) => b.slug)
    const missing = VIRUS3_SLUGS.filter((s) => !fromBd.includes(s))
    return [...fromBd, ...missing]
  })

  const [toggling, setToggling] = useState<Virus3Slug | null>(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<Virus3Slug | null>(null)
  const [saving, setSaving] = useState<Virus3Slug | null>(null)
  const [saved, setSaved] = useState<Virus3Slug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function cfg(slug: Virus3Slug): Record<string, unknown> {
    return configs[slug] ?? {}
  }

  function patch(slug: Virus3Slug, partial: Record<string, unknown>) {
    setConfigs((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], ...partial },
    }))
  }

  function setField(slug: Virus3Slug, key: string, value: unknown) {
    setConfigs((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [key]: value },
    }))
  }

  function str(slug: Virus3Slug, key: string): string {
    const v = configs[slug]?.[key]
    return typeof v === 'string' ? v : ''
  }

  async function handleSave(slug: Virus3Slug) {
    let out = { ...(configs[slug] ?? {}) }

    if (slug === 'countdown') {
      const dtLocal = str(slug, '_fecha_local')
      out = {
        ...out,
        fecha_inicio: dtLocal ? datetimeLocalToIsoCst(dtLocal) : str(slug, 'fecha_inicio'),
      }
      delete (out as Record<string, unknown>)['_fecha_local']
    }

    if (slug === 'hero') {
      const h = { ...(out as Record<string, unknown>) }
      const legacy =
        typeof h.imagen_fondo_url === 'string' ? h.imagen_fondo_url.trim() : ''
      const media = typeof h.media_url === 'string' ? h.media_url.trim() : ''
      if (!media && legacy) {
        h.media_url = legacy
        h.media_type = h.media_type === 'video' ? 'video' : 'image'
      }
      delete h.imagen_fondo_url
      out = h
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

  async function handleToggle(slug: Virus3Slug) {
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
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    if (reordering) return
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = orderedSlugs.indexOf(active.id as Virus3Slug)
    const newIndex = orderedSlugs.indexOf(over.id as Virus3Slug)
    if (oldIndex === -1 || newIndex === -1) return

    setReorderError(null)
    const prevOrder = orderedSlugs
    const newOrder = [...orderedSlugs]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    setOrderedSlugs(newOrder)

    setReordering(true)
    setReorderError(null)
    try {
      const idsInOrder = newOrder.map((s) => ids[s]).filter((id): id is string => typeof id === 'string')
      if (idsInOrder.length !== newOrder.length) {
        throw new Error('Hay secciones sin guardar — guárdalas antes de reordenar.')
      }
      const res = await reorderAllBlocks(idsInOrder)
      if ('error' in res) {
        throw new Error(res.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al reordenar'
      setReorderError(msg)
      setOrderedSlugs(prevOrder)
    } finally {
      setReordering(false)
    }
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#CC4B37]'

  function editorFor(slug: Virus3Slug) {
    switch (slug) {
      case 'hero':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow">
              <input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} />
            </Field>
            <Field label="Título">
              <input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} />
            </Field>
            <Field label="Subtítulo">
              <textarea rows={3} className={inputCls} value={str(slug, 'subtitulo')} onChange={(e) => setField(slug, 'subtitulo', e.target.value)} />
            </Field>
            <MediaUploadInput
              label="MEDIA DE FONDO (IMAGEN O VIDEO)"
              currentUrl={str(slug, 'media_url') || str(slug, 'imagen_fondo_url')}
              currentType={cfg(slug).media_type === 'video' ? 'video' : 'image'}
              slug="hero"
              onChange={(url, type) => {
                setConfigs((prev) => {
                  const hero = { ...(prev.hero ?? {}) }
                  hero.media_url = url
                  hero.media_type = type
                  delete hero.imagen_fondo_url
                  return { ...prev, hero }
                })
              }}
            />
            <Field label="CTA 1 texto">
              <input className={inputCls} value={str(slug, 'cta1_texto')} onChange={(e) => setField(slug, 'cta1_texto', e.target.value)} />
            </Field>
            <Field label="CTA 1 link (http/https)">
              <input className={inputCls} value={str(slug, 'cta1_link')} onChange={(e) => setField(slug, 'cta1_link', e.target.value)} />
            </Field>
            <Field label="CTA 2 texto">
              <input className={inputCls} value={str(slug, 'cta2_texto')} onChange={(e) => setField(slug, 'cta2_texto', e.target.value)} />
            </Field>
            <Field label="CTA 2 link (http/https)">
              <input className={inputCls} value={str(slug, 'cta2_link')} onChange={(e) => setField(slug, 'cta2_link', e.target.value)} />
            </Field>
            <Field label="SEO title (máx 100)">
              <input maxLength={100} className={inputCls} value={str(slug, 'seo_title')} onChange={(e) => setField(slug, 'seo_title', e.target.value)} />
            </Field>
            <Field label="SEO description (máx 200)">
              <textarea maxLength={200} rows={3} className={inputCls} value={str(slug, 'seo_description')} onChange={(e) => setField(slug, 'seo_description', e.target.value)} />
            </Field>
          </div>
        )
      case 'narrativa': {
        const bloques = (Array.isArray(cfg(slug).bloques) ? cfg(slug).bloques : []) as {
          titulo: string
          texto: string
        }[]
        const norm = bloques.map((b) => ({
          titulo: typeof b.titulo === 'string' ? b.titulo : '',
          texto: typeof b.texto === 'string' ? b.texto : '',
        }))
        const setBloques = (next: typeof norm) => {
          setField(slug, 'bloques', next)
        }
        return (
          <div className="flex flex-col gap-3">
            <Field label="Eyebrow">
              <input
                className={inputCls}
                placeholder="LA HISTORIA"
                value={str(slug, 'eyebrow')}
                onChange={(e) => setField(slug, 'eyebrow', e.target.value)}
              />
            </Field>
            <Field label="Título (opcional)">
              <input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} />
            </Field>
            <button
              type="button"
              className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em]" style={jost}
              onClick={() => setBloques([...norm, { titulo: '', texto: '' }])}
            >
              + Agregar bloque
            </button>
            {norm.map((b, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex flex-wrap gap-2">
                  <button type="button" className="text-[10px] text-[#666]" style={jost} disabled={i === 0} onClick={() => {
                    const n = [...norm]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setBloques(n)
                  }}>↑</button>
                  <button type="button" className="text-[10px] text-[#666]" style={jost} disabled={i === norm.length - 1} onClick={() => {
                    const n = [...norm]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setBloques(n)
                  }}>↓</button>
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setBloques(norm.filter((_, j) => j !== i))}>Eliminar</button>
                </div>
                <Field label="Título">
                  <input className={inputCls} value={b.titulo} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setBloques(n)
                  }} />
                </Field>
                <Field label="Texto">
                  <textarea rows={4} className={inputCls} value={b.texto} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], texto: e.target.value }; setBloques(n)
                  }} />
                </Field>
              </div>
            ))}
          </div>
        )
      }
      case 'sede': {
        const sch = cfg(slug)
        const legacyUrl = typeof sch.imagen_url === 'string' ? sch.imagen_url : ''
        const rawImgs = sch.imagenes
        const imagenesArr: string[] =
          Array.isArray(rawImgs) && rawImgs.length > 0
            ? rawImgs.filter((u): u is string => typeof u === 'string')
            : legacyUrl
              ? [legacyUrl]
              : []
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Galería sede (varias imágenes)">
              <MultiImageUploader
                slug="sede"
                value={imagenesArr}
                onChange={(urls) => {
                  setField(slug, 'imagenes', urls)
                  setField(slug, 'imagen_url', urls[0] ?? '')
                }}
              />
            </Field>
            <p className="text-[11px] text-[#888]" style={lato}>
              La primera imagen rellena el campo interno legacy para datos antiguos.
            </p>
            <Field label="Descripción"><textarea rows={4} className={inputCls} value={str(slug, 'descripcion')} onChange={(e) => setField(slug, 'descripcion', e.target.value)} /></Field>
            <Field label="Dirección"><input className={inputCls} value={str(slug, 'direccion')} onChange={(e) => setField(slug, 'direccion', e.target.value)} /></Field>
            <Field label="Coordenadas"><input className={inputCls} value={str(slug, 'coordenadas')} onChange={(e) => setField(slug, 'coordenadas', e.target.value)} /></Field>
            <Field label="Maps link"><input className={inputCls} value={str(slug, 'maps_link')} onChange={(e) => setField(slug, 'maps_link', e.target.value)} /></Field>
          </div>
        )
      }
      case 'countdown': {
        const fechaIso = str(slug, 'fecha_inicio')
        const localVal = str(slug, '_fecha_local') || isoToDatetimeLocal(fechaIso)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Fecha inicio (hora México −06:00 al guardar)">
              <input
                type="datetime-local"
                className={inputCls}
                value={localVal}
                onChange={(e) => {
                  setField(slug, '_fecha_local', e.target.value)
                  setField(slug, 'fecha_inicio', datetimeLocalToIsoCst(e.target.value))
                }}
              />
            </Field>
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
          </div>
        )
      }
      case 'facciones': {
        const raw = cfg(slug).facciones
        const existing = (Array.isArray(raw) ? raw : []) as ReturnType<typeof emptyFaccionV3>[]
        const labels = ['Facción 1', 'Facción 2', 'Facción 3', 'Facción 4']
        const norm = labels.map((_, i) => ({
          ...emptyFaccionV3(),
          ...(existing[i] && typeof existing[i] === 'object' ? existing[i] : {}),
          agotada: Boolean(existing[i]?.agotada),
        }))
        const setFacciones = (next: typeof norm) => setField(slug, 'facciones', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow">
              <input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} />
            </Field>
            <Field label="Título">
              <input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} />
            </Field>
            {norm.map((f, i) => (
              <details key={i} className="border border-[#E4E4E4] bg-white p-3" open={i === 0}>
                <summary className="cursor-pointer text-[11px] tracking-[0.12em]" style={jost}>
                  {labels[i]} — {f.nombre?.trim() || 'Sin nombre'}
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <Field label="Nombre">
                    <input className={inputCls} value={f.nombre} onChange={(e) => {
                      const n = [...norm]; n[i] = { ...n[i], nombre: e.target.value }; setFacciones(n)
                    }} />
                  </Field>
                  <Field label="Descripción">
                    <textarea rows={3} className={inputCls} value={f.descripcion} onChange={(e) => {
                      const n = [...norm]; n[i] = { ...n[i], descripcion: e.target.value }; setFacciones(n)
                    }} />
                  </Field>
                  <Field label="Loadout">
                    <textarea rows={2} className={inputCls} value={f.loadout} onChange={(e) => {
                      const n = [...norm]; n[i] = { ...n[i], loadout: e.target.value }; setFacciones(n)
                    }} />
                  </Field>
                  <Field label="Imagen">
                    <ImageUploadInput slug={`facciones-f${i}`} value={f.imagen_url} onChange={(u) => {
                      const n = [...norm]; n[i] = { ...n[i], imagen_url: u }; setFacciones(n)
                    }} />
                  </Field>
                  <Field label="Contacto nombre">
                    <input className={inputCls} value={f.contacto_nombre} onChange={(e) => {
                      const n = [...norm]; n[i] = { ...n[i], contacto_nombre: e.target.value }; setFacciones(n)
                    }} />
                  </Field>
                  <Field label="WhatsApp / URL">
                    <input className={inputCls} value={f.contacto_whatsapp} onChange={(e) => {
                      const n = [...norm]; n[i] = { ...n[i], contacto_whatsapp: e.target.value }; setFacciones(n)
                    }} />
                  </Field>
                  <label className="flex items-center gap-2 text-[12px] text-[#444]" style={lato}>
                    <input
                      type="checkbox"
                      checked={f.agotada}
                      onChange={(e) => {
                        const n = [...norm]; n[i] = { ...n[i], agotada: e.target.checked }; setFacciones(n)
                      }}
                    />
                    Agotada (SOLD OUT)
                  </label>
                </div>
              </details>
            ))}
          </div>
        )
      }
      case 'inscripcion': {
        const ventanas = (Array.isArray(cfg(slug).ventanas) ? cfg(slug).ventanas : []) as {
          nombre: string
          fecha_inicio: string
          fecha_fin: string
          precio: string
          incluye: string[] | string
          estado: string
          cta_texto: string
          cta_link: string
        }[]
        const norm = ventanas.map((v) => ({
          nombre: typeof v.nombre === 'string' ? v.nombre : '',
          fecha_inicio: typeof v.fecha_inicio === 'string' ? v.fecha_inicio : '',
          fecha_fin: typeof v.fecha_fin === 'string' ? v.fecha_fin : '',
          precio: typeof v.precio === 'string' ? v.precio : '',
          incluye: Array.isArray(v.incluye)
            ? v.incluye.filter((s): s is string => typeof s === 'string')
            : [],
          estado: (['activa', 'agotada', 'proxima', 'finalizada'].includes(v.estado)
            ? v.estado
            : 'proxima') as 'activa' | 'agotada' | 'proxima' | 'finalizada',
          cta_texto: typeof v.cta_texto === 'string' ? v.cta_texto : '',
          cta_link: typeof v.cta_link === 'string' ? v.cta_link : '',
        }))
        const setVentanas = (next: typeof norm) => setField(slug, 'ventanas', next)
        const emptyVentana = () => ({
          nombre: '',
          fecha_inicio: '',
          fecha_fin: '',
          precio: '',
          incluye: [] as string[],
          estado: 'proxima' as const,
          cta_texto: '',
          cta_link: '',
        })
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow">
              <input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} />
            </Field>
            <Field label="Título">
              <input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} />
            </Field>
            <Field label="Nota">
              <textarea rows={2} className={inputCls} value={str(slug, 'nota')} onChange={(e) => setField(slug, 'nota', e.target.value)} />
            </Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setVentanas([...norm, emptyVentana()])}>
              + Agregar ventana
            </button>
            {norm.map((v, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setVentanas(norm.filter((_, j) => j !== i))}>✕ Eliminar</button>
                </div>
                <Field label="Nombre">
                  <input className={inputCls} value={v.nombre} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], nombre: e.target.value }; setVentanas(n) }} />
                </Field>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Fecha inicio">
                    <input className={inputCls} value={v.fecha_inicio} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], fecha_inicio: e.target.value }; setVentanas(n) }} />
                  </Field>
                  <Field label="Fecha fin">
                    <input className={inputCls} value={v.fecha_fin} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], fecha_fin: e.target.value }; setVentanas(n) }} />
                  </Field>
                </div>
                <Field label="Precio">
                  <input className={inputCls} value={v.precio} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], precio: e.target.value }; setVentanas(n) }} />
                </Field>
                <Field label="Incluye (uno por línea)">
                  <textarea rows={4} className={inputCls} value={v.incluye.join('\n')} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], incluye: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) }; setVentanas(n)
                  }} />
                </Field>
                <Field label="Estado">
                  <select className={inputCls} value={v.estado} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], estado: e.target.value as typeof v.estado }; setVentanas(n)
                  }}>
                    <option value="activa">activa</option>
                    <option value="agotada">agotada</option>
                    <option value="proxima">proxima</option>
                    <option value="finalizada">finalizada</option>
                  </select>
                </Field>
                <Field label="CTA texto">
                  <input className={inputCls} value={v.cta_texto} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], cta_texto: e.target.value }; setVentanas(n) }} />
                </Field>
                <Field label="CTA link">
                  <input className={inputCls} value={v.cta_link} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], cta_link: e.target.value }; setVentanas(n) }} />
                </Field>
              </div>
            ))}
          </div>
        )
      }
      case 'amenidades': {
        const items = Array.isArray(cfg(slug).items)
          ? (cfg(slug).items as unknown[]).filter((s): s is string => typeof s === 'string')
          : []
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Items (uno por línea)">
              <textarea
                rows={8}
                className={inputCls}
                value={items.join('\n')}
                onChange={(e) => setField(slug, 'items', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              />
            </Field>
          </div>
        )
      }
      case 'cronograma': {
        const hitos = (Array.isArray(cfg(slug).hitos) ? cfg(slug).hitos : []) as {
          hora: string
          titulo: string
          descripcion: string
          nocturno: boolean
        }[]
        const norm = hitos.map((h) => ({
          hora: typeof h.hora === 'string' ? h.hora : '',
          titulo: typeof h.titulo === 'string' ? h.titulo : '',
          descripcion: typeof h.descripcion === 'string' ? h.descripcion : '',
          nocturno: Boolean(h.nocturno),
        }))
        const setHitos = (next: typeof norm) => setField(slug, 'hitos', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setHitos([...norm, { hora: '', titulo: '', descripcion: '', nocturno: false }])}>
              + Agregar hito
            </button>
            {norm.map((h, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setHitos(norm.filter((_, j) => j !== i))}>✕ Eliminar</button>
                </div>
                <Field label="Hora">
                  <input className={inputCls} value={h.hora} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], hora: e.target.value }; setHitos(n) }} />
                </Field>
                <Field label="Título">
                  <input className={inputCls} value={h.titulo} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setHitos(n) }} />
                </Field>
                <Field label="Descripción">
                  <textarea rows={2} className={inputCls} value={h.descripcion} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], descripcion: e.target.value }; setHitos(n) }} />
                </Field>
                <label className="flex items-center gap-2 text-[12px] text-[#444]" style={lato}>
                  <input type="checkbox" checked={h.nocturno} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], nocturno: e.target.checked }; setHitos(n) }} />
                  Nocturno
                </label>
              </div>
            ))}
          </div>
        )
      }
      case 'sponsors': {
        const logos = (Array.isArray(cfg(slug).logos) ? cfg(slug).logos : []) as SponsorLogoEntry[]
        const norm: SponsorLogoEntry[] = logos.map((l) => ({
          nombre: typeof l.nombre === 'string' ? l.nombre : '',
          logo_url: typeof l.logo_url === 'string' ? l.logo_url : '',
          link: typeof l.link === 'string' ? l.link : '',
        }))
        return (
          <SponsorsCatalogPicker
            logos={norm}
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
        const imagenes = (Array.isArray(cfg(slug).imagenes) ? cfg(slug).imagenes : []) as GaleriaImagen[]
        const norm = imagenes.map((im) => ({
          url: typeof im.url === 'string' ? im.url : '',
          orientacion: (['vertical', 'horizontal', 'cuadrada'].includes(im.orientacion) ? im.orientacion : 'vertical') as GaleriaImagen['orientacion'],
        }))
        const setImg = (next: typeof norm) => {
          setField(slug, 'imagenes', next)
        }
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <p className="text-[11px] text-[#888]" style={lato}>Sube imágenes y define orientación por ítem.</p>
            <MultiImageUploader
              slug="galeria"
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
                  <select className={`${inputCls} text-[11px]`} value={im.orientacion} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], orientacion: e.target.value as GaleriaImagen['orientacion'] }; setImg(n)
                  }}>
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
        const raw = cfg(slug).videos
        const vids = (Array.isArray(raw) ? raw : []) as unknown[]
        const norm: VideoItem[] = vids.map((row) => {
          if (row && typeof row === 'object' && !Array.isArray(row)) {
            const o = row as { url?: string; poster?: string; titulo?: string }
            return {
              url: typeof o.url === 'string' ? o.url : '',
              poster: typeof o.poster === 'string' ? o.poster : '',
              titulo: typeof o.titulo === 'string' ? o.titulo : '',
            }
          }
          return { url: '', poster: '', titulo: '' }
        })
        const setVideos = (next: VideoItem[]) => setField(slug, 'videos', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setVideos([...norm, { url: '', poster: '', titulo: '' }])}>+ Video</button>
            {norm.map((v, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setVideos(norm.filter((_, j) => j !== i))}>✕ Eliminar</button>
                </div>
                <Field label="Video MP4">
                  <VideoUploadInput value={v.url} onChange={(url) => { const n = [...norm]; n[i] = { ...n[i], url }; setVideos(n) }} />
                </Field>
                <Field label="Poster (opcional)">
                  <ImageUploadInput slug="videos" value={v.poster ?? ''} onChange={(url) => { const n = [...norm]; n[i] = { ...n[i], poster: url }; setVideos(n) }} />
                </Field>
                <Field label="Título (opcional)">
                  <input className={inputCls} value={v.titulo ?? ''} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setVideos(n) }} />
                </Field>
              </div>
            ))}
          </div>
        )
      }
      case 'musica':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow">
              <input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} />
            </Field>
            <Field label="Título de la canción">
              <input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} />
            </Field>
            <Field label="Artista">
              <input className={inputCls} value={str(slug, 'artista')} onChange={(e) => setField(slug, 'artista', e.target.value)} />
            </Field>
            <Field label="Audio MP3 / WAV">
              <VideoUploadInput
                value={str(slug, 'audio_url')}
                onChange={(url) => setField(slug, 'audio_url', url)}
                accept="audio/*"
              />
            </Field>
            <Field label="Cover art (opcional)">
              <ImageUploadInput
                slug="musica"
                value={str(slug, 'cover_url')}
                onChange={(url) => setField(slug, 'cover_url', url)}
              />
            </Field>
          </div>
        )
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
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>
          Editor de landing — Op. Virus 3
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Cambios visibles en{' '}
          <a href="/virus3" target="_blank" className="text-[#CC4B37] underline">
            /virus3
          </a>
        </p>
      </div>

      {error && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]" style={lato}>{error}</p>
        </div>
      )}

      {reordering ? (
        <div className="mb-3 border border-[#CC4B37] bg-[#fff5f3] px-3 py-2 text-[11px] text-[#CC4B37]" style={jost}>
          Guardando nuevo orden…
        </div>
      ) : null}

      {reorderError ? (
        <div className="mb-3 border border-[#CC4B37] bg-[#fff5f3] px-3 py-2 text-[11px] text-[#CC4B37]" style={jost}>
          ⚠ {reorderError}
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedSlugs} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {orderedSlugs.map((slug, i) => {
              const def = sectionFor(slug)
              const isOpen = expandido === slug
              const isSaving = saving === slug
              const isSaved = saved === slug
              const isConfigured = ids[slug] !== null
              const thumb = getThumb(slug, cfg(slug))
              const tituloPreview = str(slug, 'titulo') || def.descripcion

              return (
                <SortableSection key={slug} slug={slug}>
                  {({ attributes, listeners }) => (
                    <div className={`border transition-colors ${isOpen ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'}`}>
                      <div
                        className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAFAFA] ${!activos[slug] ? 'opacity-60' : ''}`}
                      >
                        <button
                          type="button"
                          {...attributes}
                          {...listeners}
                          className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-[#999999] hover:text-[#CC4B37] active:cursor-grabbing"
                          aria-label="Arrastrar para reordenar"
                        >
                          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
                            <circle cx="2" cy="2" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="2" r="1.2" fill="currentColor" />
                            <circle cx="2" cy="7" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="7" r="1.2" fill="currentColor" />
                            <circle cx="2" cy="12" r="1.2" fill="currentColor" />
                            <circle cx="8" cy="12" r="1.2" fill="currentColor" />
                          </svg>
                        </button>

                        <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[#F4F4F4] text-[10px] text-[#666666]" style={jost}>
                          {i + 1}
                        </span>

                        <button
                          type="button"
                          onClick={() => setExpandido(isOpen ? null : slug)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          {thumb ? (
                            <div className="h-9 w-14 shrink-0 overflow-hidden border border-[#EEEEEE]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-9 w-14 shrink-0 items-center justify-center border border-dashed border-[#DDDDDD] bg-[#F7F7F7]">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#CCCCCC]" aria-hidden>
                                <rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#111111]" style={jost}>{def.label}</p>
                            <p className="truncate text-[11px] text-[#AAAAAA]" style={lato}>{tituloPreview}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {isSaved && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#22C55E]" style={jost}>Guardado</span>
                            )}
                            {!isConfigured && (
                              <span className="border border-[#DDDDDD] px-2 py-0.5 text-[9px] text-[#AAAAAA]" style={jost}>Sin configurar</span>
                            )}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (toggling !== slug) handleToggle(slug)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (toggling !== slug) handleToggle(slug)
                                }
                              }}
                              className={`flex items-center gap-1.5 ${toggling === slug ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
                            >
                              <span className={`relative block h-5 w-9 transition-colors ${activos[slug] ? 'bg-[#22C55E]' : 'bg-[#DDDDDD]'}`} style={{ borderRadius: 10 }}>
                                <span className="absolute top-0.5 block h-4 w-4 bg-white shadow transition-transform" style={{ borderRadius: '50%', transform: activos[slug] ? 'translateX(18px)' : 'translateX(2px)' }} />
                              </span>
                              <span className={`text-[9px] font-extrabold uppercase ${activos[slug] ? 'text-[#22C55E]' : 'text-[#AAAAAA]'}`} style={jost}>
                                {toggling === slug ? '…' : activos[slug] ? 'ON' : 'OFF'}
                              </span>
                            </span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className={`text-[#999999] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </div>
                        </button>
                      </div>

                      {isOpen && (
                        <div className="border-t border-[#EEEEEE] bg-[#FAFAFA] p-5">
                          <p className="mb-4 text-[11px] text-[#888888]" style={lato}>{def.descripcion}</p>
                          {editorFor(slug)}
                          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#EEEEEE] pt-4">
                            <button type="button" onClick={() => handleSave(slug)} disabled={!!saving} className="flex items-center gap-2 bg-[#CC4B37] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white hover:opacity-90 disabled:opacity-60" style={jost}>
                              {isSaving ? 'Guardando…' : 'Guardar'}
                            </button>
                            <a href="/virus3" target="_blank" className="text-[11px] text-[#CC4B37] hover:underline" style={jost}>Ver landing →</a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </SortableSection>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-5 border border-[#EEEEEE] bg-[#F9F9F9] px-4 py-3">
        <p className="text-[11px] text-[#888888]" style={lato}>
          <strong style={{ ...jost, fontSize: 10 }}>TIP:</strong> Guarda cada bloque por separado. Reordena con el asa a la izquierda. Toggle OFF oculta en la landing pública.
        </p>
      </div>
    </div>
  )
}

function StringListEditor({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (next: string[]) => void
}) {
  const jostLbl = {
    fontFamily: "'Jost', sans-serif",
    fontWeight: 800 as const,
    textTransform: 'uppercase' as const,
  }
  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#CC4B37]'
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]" style={jostLbl}>
        {label}
      </span>
      <button
        type="button"
        className="self-start border border-[#DDDDDD] bg-white px-3 py-1.5 text-[10px]"
        style={jostLbl}
        onClick={() => onChange([...values, ''])}
      >
        + Agregar
      </button>
      {values.map((val, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={val}
            onChange={(e) => {
              const n = [...values]
              n[i] = e.target.value
              onChange(n)
            }}
          />
          <button
            type="button"
            className="shrink-0 px-2 text-[10px] text-[#CC4B37]"
            style={jostLbl}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const jostLbl = { fontFamily: "'Jost', sans-serif", fontWeight: 800 as const, textTransform: 'uppercase' as const }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]" style={jostLbl}>{label}</span>
      {children}
    </div>
  )
}
