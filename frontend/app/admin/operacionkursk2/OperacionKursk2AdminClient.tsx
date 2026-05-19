'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
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
import { updateBlockConfig, toggleBlockActive, reorderAllBlocks } from './actions'
import { MediaUploadInput } from './components/MediaUploadInput'
import { ImageUploadInput } from './components/ImageUploadInput'
import { VideoUploadInput } from './components/VideoUploadInput'
import type { OperacionKursk2Slug } from '@/app/operacionkursk2/lib/types'
import type { GaleriaImagen, VideoItem } from '@/app/operacionkursk2/lib/types'
import { OK2_SLUGS } from '@/app/operacionkursk2/lib/types'
const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

export type OK2Record = {
  id: string | null
  slug: OperacionKursk2Slug
  config: Record<string, unknown>
  activo: boolean
  orden: number
}

type SectionDef = {
  slug: OperacionKursk2Slug
  label: string
  descripcion: string
}

const SECTIONS: SectionDef[] = [
  { slug: 'hero', label: 'Hero — Cabecera', descripcion: 'Imagen o video de fondo, textos, CTAs y SEO.' },
  { slug: 'narrativa', label: 'Narrativa — Tres tiempos', descripcion: 'Bloques año + texto.' },
  { slug: 'sede', label: 'Sede', descripcion: 'Galería de imágenes, dirección y mapa.' },
  { slug: 'operativo', label: 'Operativo', descripcion: 'Línea de tiempo de hitos.' },
  { slug: 'countdown', label: 'Countdown', descripcion: 'Fecha ISO y eyebrow.' },
  { slug: 'facciones', label: 'Facciones', descripcion: 'Rusa / Ucraniana, uniformes y contacto.' },
  { slug: 'inscripcion', label: 'Inscripción', descripcion: 'Precios y CTAs.' },
  { slug: 'sponsors', label: 'Sponsors', descripcion: 'Logos en marquesina.' },
  { slug: 'galeria', label: 'Galería', descripcion: 'Masonry + lightbox.' },
  { slug: 'videos', label: 'Videos', descripcion: 'Galería de videos MP4 del evento.' },
  { slug: 'manual', label: 'Manual de campo', descripcion: 'Lista de reglas.' },
  { slug: 'airnation', label: 'AirNation', descripcion: 'Presencia plataforma.' },
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

function datetimeLocalToIsoMexico(dt: string): string {
  if (!dt?.trim()) return ''
  const [dp, tp = '00:00'] = dt.split('T')
  const [hh = '00', mm = '00'] = tp.split(':')
  return `${dp}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00-05:00`
}

function httpUrlOk(v: string): boolean {
  const t = v.trim()
  return !t || /^https?:\/\//i.test(t)
}

function SponsorAdminDetailsRow({
  openByDefault,
  summary,
  children,
}: {
  openByDefault: boolean
  summary: ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  useLayoutEffect(() => {
    if (ref.current && openByDefault) ref.current.open = true
  }, [openByDefault])
  return (
    <details ref={ref} data-sponsors-item className="border border-[#EEEEEE] bg-[#FAFAFA]">
      {summary}
      {children}
    </details>
  )
}

function VideoAdminDetailsRow({
  openByDefault,
  summary,
  children,
}: {
  openByDefault: boolean
  summary: ReactNode
  children: ReactNode
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  useLayoutEffect(() => {
    if (ref.current && openByDefault) ref.current.open = true
  }, [openByDefault])
  return (
    <details ref={ref} data-videos-item className="border border-[#EEEEEE] bg-[#FAFAFA]">
      {summary}
      {children}
    </details>
  )
}

function validateConfig(slug: OperacionKursk2Slug, cfg: Record<string, unknown>): string | null {
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
    if (!httpUrlOk(chk(cfg.cta1_link))) return 'CTA 1 debe ser http(s) o vacío.'
    if (!httpUrlOk(chk(cfg.cta2_link))) return 'CTA 2 debe ser http(s) o vacío.'
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
  if (slug === 'videos') {
    const videos = cfg.videos
    if (Array.isArray(videos)) {
      for (const row of videos) {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          const o = row as { url?: string; poster?: string }
          const u = typeof o.url === 'string' ? o.url : ''
          const p = typeof o.poster === 'string' ? o.poster : ''
          if (u.trim() && !/^https?:\/\//i.test(u.trim())) {
            return 'Cada URL de video debe ser http(s) o vacía.'
          }
          if (p.trim() && !/^https?:\/\//i.test(p.trim())) {
            return 'Cada poster debe ser URL http(s) o vacío.'
          }
        }
      }
    }
  }
  if (slug === 'facciones') {
    const w = (row: unknown) =>
      row && typeof row === 'object' && !Array.isArray(row)
        ? (row as { contacto_whatsapp?: string }).contacto_whatsapp
        : ''
    const wr = w(cfg.rusa)
    const wu = w(cfg.ucraniana)
    if (typeof wr === 'string' && wr.trim() && !/^https?:\/\//i.test(wr.trim())) {
      return 'WhatsApp Rusa debe ser URL http(s) (ej. https://wa.me/...) o vacío.'
    }
    if (typeof wu === 'string' && wu.trim() && !/^https?:\/\//i.test(wu.trim())) {
      return 'WhatsApp Ucrania debe ser URL http(s) o vacío.'
    }
  }
  return null
}

function emptyFaccion() {
  return {
    nombre: '',
    imagen_url: '',
    descripcion: '',
    uniformes: [] as { nombre: string; hex: string }[],
    contacto_nombre: '',
    contacto_whatsapp: '',
  }
}

function getThumb(slug: OperacionKursk2Slug, cfg: Record<string, unknown>): string {
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
    const r = cfg.rusa as { imagen_url?: string } | undefined
    return r?.imagen_url ?? ''
  }
  if (slug === 'videos') {
    const vids = cfg.videos
    if (Array.isArray(vids) && vids.length > 0) {
      const v0 = vids[0] as { poster?: string; url?: string }
      const poster = typeof v0.poster === 'string' ? v0.poster.trim() : ''
      if (poster) return poster
    }
    return ''
  }
  return ''
}

type SortableHandleProps = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>

function SortableSection({
  slug,
  children,
}: {
  slug: OperacionKursk2Slug
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

function sectionFor(slug: OperacionKursk2Slug): SectionDef {
  const def = SECTIONS.find((s) => s.slug === slug)
  if (!def) throw new Error(`Section metadata missing: ${slug}`)
  return def
}

export function OperacionKursk2AdminClient({
  initialBlocks,
}: {
  initialBlocks: OK2Record[]
}) {
  const [configs, setConfigs] = useState<Record<OperacionKursk2Slug, Record<string, unknown>>>(() => {
    const map = {} as Record<OperacionKursk2Slug, Record<string, unknown>>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.config ? { ...found.config } : {}
    }
    return map
  })

  const [ids, setIds] = useState<Record<OperacionKursk2Slug, string | null>>(() => {
    const map = {} as Record<OperacionKursk2Slug, string | null>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.id ?? null
    }
    return map
  })

  const [activos, setActivos] = useState<Record<OperacionKursk2Slug, boolean>>(() => {
    const map = {} as Record<OperacionKursk2Slug, boolean>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.activo ?? true
    }
    return map
  })

  const [orderedSlugs, setOrderedSlugs] = useState<OperacionKursk2Slug[]>(() => {
    const fromBd = initialBlocks.map((b) => b.slug)
    const missing = OK2_SLUGS.filter((s) => !fromBd.includes(s))
    return [...fromBd, ...missing]
  })

  const [toggling, setToggling] = useState<OperacionKursk2Slug | null>(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<OperacionKursk2Slug | null>(null)
  const [saving, setSaving] = useState<OperacionKursk2Slug | null>(null)
  const [saved, setSaved] = useState<OperacionKursk2Slug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function cfg(slug: OperacionKursk2Slug): Record<string, unknown> {
    return configs[slug] ?? {}
  }

  function patch(slug: OperacionKursk2Slug, partial: Record<string, unknown>) {
    setConfigs((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], ...partial },
    }))
  }

  function setField(slug: OperacionKursk2Slug, key: string, value: unknown) {
    setConfigs((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], [key]: value },
    }))
  }

  function str(slug: OperacionKursk2Slug, key: string): string {
    const v = configs[slug]?.[key]
    return typeof v === 'string' ? v : ''
  }

  async function handleSave(slug: OperacionKursk2Slug) {
    let out = { ...(configs[slug] ?? {}) }

    if (slug === 'countdown') {
      const dtLocal = str(slug, '_fecha_local')
      out = {
        ...out,
        fecha_inicio: dtLocal ? datetimeLocalToIsoMexico(dtLocal) : str(slug, 'fecha_inicio'),
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

  async function handleToggle(slug: OperacionKursk2Slug) {
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

    const oldIndex = orderedSlugs.indexOf(active.id as OperacionKursk2Slug)
    const newIndex = orderedSlugs.indexOf(over.id as OperacionKursk2Slug)
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

  function editorFor(slug: OperacionKursk2Slug) {
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
            <label className="flex cursor-pointer items-center gap-2 text-[12px]" style={lato}>
              <input type="checkbox" checked={Boolean(cfg(slug).banderas_animadas ?? true)} onChange={(e) => setField(slug, 'banderas_animadas', e.target.checked)} />
              Reservado para futuras animaciones (sin efecto visual actual)
            </label>
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
        const bloques = (Array.isArray(cfg(slug).bloques) ? cfg(slug).bloques : []) as { anio: string; texto: string }[]
        const norm = bloques.map((b) => ({
          anio: typeof b.anio === 'string' ? b.anio : '',
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
                placeholder="UN CONFLICTO. TRES TIEMPOS."
                value={str(slug, 'eyebrow')}
                onChange={(e) => setField(slug, 'eyebrow', e.target.value)}
              />
            </Field>
            <button
              type="button"
              className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em]" style={jost}
              onClick={() => setBloques([...norm, { anio: '', texto: '' }])}
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
                <Field label="Año">
                  <input className={inputCls} value={b.anio} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], anio: e.target.value }; setBloques(n)
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
            <Field label="Fecha inicio (hora México −05:00 al guardar)">
              <input
                type="datetime-local"
                className={inputCls}
                value={localVal}
                onChange={(e) => {
                  setField(slug, '_fecha_local', e.target.value)
                  setField(slug, 'fecha_inicio', datetimeLocalToIsoMexico(e.target.value))
                }}
              />
            </Field>
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
          </div>
        )
      }
      case 'facciones': {
        const fc = cfg(slug)
        const rusa = { ...emptyFaccion(), ...(typeof fc.rusa === 'object' && fc.rusa ? fc.rusa : {}) }
        const ucraniana = { ...emptyFaccion(), ...(typeof fc.ucraniana === 'object' && fc.ucraniana ? fc.ucraniana : {}) }
        const setFaction = (side: 'rusa' | 'ucraniana', next: ReturnType<typeof emptyFaccion>) => {
          patch(slug, { [side]: next })
        }
        const uniEditor = (side: 'rusa' | 'ucraniana', data: ReturnType<typeof emptyFaccion>) => {
          const uniformes = Array.isArray(data.uniformes) ? data.uniformes.map((u) => ({
            nombre: typeof u.nombre === 'string' ? u.nombre : '',
            hex: typeof u.hex === 'string' ? u.hex : '#000000',
          })) : []
          const setU = (next: typeof uniformes) => {
            setFaction(side, { ...data, uniformes: next })
          }
          return (
            <div className="mt-3 flex flex-col gap-2 border-t border-[#EEEEEE] pt-3">
              <button type="button" className="self-start text-[10px] tracking-[0.12em]" style={jost} onClick={() => setU([...uniformes, { nombre: '', hex: '#556655' }])}>+ Uniforme</button>
              {uniformes.map((u, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 bg-white p-2">
                  <input className={`${inputCls} max-w-[140px]`} placeholder="Nombre" value={u.nombre} onChange={(e) => {
                    const n = [...uniformes]; n[i] = { ...n[i], nombre: e.target.value }; setU(n)
                  }} />
                  <input className={`${inputCls} w-24`} value={u.hex} onChange={(e) => {
                    const n = [...uniformes]; n[i] = { ...n[i], hex: e.target.value }; setU(n)
                  }} />
                  <input type="color" value={u.hex.match(/^#/) ? u.hex.slice(0, 7) : '#000000'} onChange={(e) => {
                    const n = [...uniformes]; n[i] = { ...n[i], hex: e.target.value }; setU(n)
                  }} className="h-9 w-12 cursor-pointer border border-[#ddd]" />
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setU(uniformes.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
            </div>
          )
        }
        const factionPanel = (side: 'rusa' | 'ucraniana', label: string, imgSlug: string, data: ReturnType<typeof emptyFaccion>) => (
          <details className="border border-[#E4E4E4] bg-white p-3">
            <summary className="cursor-pointer text-[11px] tracking-[0.12em]" style={jost}>{label}</summary>
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Nombre"><input className={inputCls} value={data.nombre} onChange={(e) => setFaction(side, { ...data, nombre: e.target.value })} /></Field>
              <Field label="Descripción"><textarea rows={3} className={inputCls} value={data.descripcion} onChange={(e) => setFaction(side, { ...data, descripcion: e.target.value })} /></Field>
              <Field label="Imagen"><ImageUploadInput slug={imgSlug} value={data.imagen_url} onChange={(u) => setFaction(side, { ...data, imagen_url: u })} /></Field>
              {uniEditor(side, data)}
              <Field label="Contacto nombre"><input className={inputCls} value={data.contacto_nombre} onChange={(e) => setFaction(side, { ...data, contacto_nombre: e.target.value })} /></Field>
              <Field label="WhatsApp / URL"><input className={inputCls} value={data.contacto_whatsapp} onChange={(e) => setFaction(side, { ...data, contacto_whatsapp: e.target.value })} /></Field>
            </div>
          </details>
        )
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            {factionPanel('rusa', 'Facción Rusa', 'facciones-rusa', rusa as ReturnType<typeof emptyFaccion>)}
            {factionPanel('ucraniana', 'Facción Ucraniana', 'facciones-ucraniana', ucraniana as ReturnType<typeof emptyFaccion>)}
            <Field label="Nota"><textarea rows={3} className={inputCls} value={str(slug, 'nota')} onChange={(e) => setField(slug, 'nota', e.target.value)} /></Field>
          </div>
        )
      }
      case 'operativo': {
        const hitos = (Array.isArray(cfg(slug).hitos) ? cfg(slug).hitos : []) as {
          hora: string
          titulo: string
          descripcion: string
          nocturno: boolean
          unidad?: string
        }[]
        const norm = hitos.map((h) => ({
          hora: typeof h.hora === 'string' ? h.hora : '',
          titulo: typeof h.titulo === 'string' ? h.titulo : '',
          descripcion: typeof h.descripcion === 'string' ? h.descripcion : '',
          nocturno: Boolean(h.nocturno),
          unidad: typeof h.unidad === 'string' ? h.unidad : '',
        }))
        const setHitos = (next: typeof norm) => {
          setField(slug, 'hitos', next)
        }
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setHitos([...norm, { hora: '', titulo: '', descripcion: '', nocturno: false, unidad: '' }])}>+ Hito</button>
            {norm.map((h, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" disabled={i === 0} className="text-[10px]" style={jost} onClick={() => {
                    const n = [...norm]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setHitos(n)
                  }}>↑</button>
                  <button type="button" disabled={i === norm.length - 1} className="text-[10px]" style={jost} onClick={() => {
                    const n = [...norm]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setHitos(n)
                  }}>↓</button>
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setHitos(norm.filter((_, j) => j !== i))}>Eliminar</button>
                </div>
                <Field label="Hora"><input className={inputCls} value={h.hora} onChange={(e) => {
                  const n = [...norm]; n[i] = { ...n[i], hora: e.target.value }; setHitos(n)
                }} /></Field>
                <Field label="Título"><input className={inputCls} value={h.titulo} onChange={(e) => {
                  const n = [...norm]; n[i] = { ...n[i], titulo: e.target.value }; setHitos(n)
                }} /></Field>
                <Field label="Descripción"><textarea rows={2} className={inputCls} value={h.descripcion} onChange={(e) => {
                  const n = [...norm]; n[i] = { ...n[i], descripcion: e.target.value }; setHitos(n)
                }} /></Field>
                <Field label="Unidad (opcional)">
                  <input
                    className={inputCls}
                    placeholder="ALFA-1, BRAVO-2, TODAS..."
                    value={h.unidad ?? ''}
                    onChange={(e) => {
                      const n = [...norm]
                      n[i] = { ...n[i], unidad: e.target.value }
                      setHitos(n)
                    }}
                  />
                </Field>
                <label className="flex items-center gap-2 text-[12px]" style={lato}>
                  <input type="checkbox" checked={h.nocturno} onChange={(e) => {
                    const n = [...norm]; n[i] = { ...n[i], nocturno: e.target.checked }; setHitos(n)
                  }} />
                  Nocturno
                </label>
              </div>
            ))}
          </div>
        )
      }
      case 'inscripcion':
        return (
          <div className="flex flex-col gap-4">
            {(['eyebrow', 'titulo', 'precio', 'fecha_limite', 'subtitulo'] as const).map((k) => (
              <Field key={k} label={k}>
                <input className={inputCls} value={str(slug, k)} onChange={(e) => setField(slug, k, e.target.value)} />
              </Field>
            ))}
            <Field label="CTA 1 texto"><input className={inputCls} value={str(slug, 'cta1_texto')} onChange={(e) => setField(slug, 'cta1_texto', e.target.value)} /></Field>
            <Field label="CTA 1 link"><input className={inputCls} value={str(slug, 'cta1_link')} onChange={(e) => setField(slug, 'cta1_link', e.target.value)} /></Field>
            <Field label="CTA 2 texto"><input className={inputCls} value={str(slug, 'cta2_texto')} onChange={(e) => setField(slug, 'cta2_texto', e.target.value)} /></Field>
            <Field label="CTA 2 link"><input className={inputCls} value={str(slug, 'cta2_link')} onChange={(e) => setField(slug, 'cta2_link', e.target.value)} /></Field>
          </div>
        )
      case 'sponsors': {
        const logos = (Array.isArray(cfg(slug).logos) ? cfg(slug).logos : []) as {
          nombre: string
          logo_url: string
          link: string
          tier: string
        }[]
        const norm = logos.map((l) => ({
          nombre: typeof l.nombre === 'string' ? l.nombre : '',
          logo_url: typeof l.logo_url === 'string' ? l.logo_url : '',
          link: typeof l.link === 'string' ? l.link : '',
          tier: (['principal', 'aliado', 'patrocinador'].includes(l.tier) ? l.tier : 'patrocinador') as 'principal' | 'aliado' | 'patrocinador',
        }))
        const setLogos = (next: typeof norm) => {
          setField(slug, 'logos', next)
        }
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setLogos([...norm, { nombre: '', logo_url: '', link: '', tier: 'patrocinador' }])}>+ Sponsor</button>
            {norm.length > 2 ? (
              <div className="mb-1 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const containers = document.querySelectorAll(`details[data-sponsors-item]`)
                    containers.forEach((d) => d.removeAttribute('open'))
                  }}
                  className="text-[10px] uppercase tracking-[0.12em] text-[#666] hover:text-[#111]"
                  style={jost}
                >
                  Colapsar todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const containers = document.querySelectorAll(`details[data-sponsors-item]`)
                    containers.forEach((d) => d.setAttribute('open', ''))
                  }}
                  className="text-[10px] uppercase tracking-[0.12em] text-[#666] hover:text-[#111]"
                  style={jost}
                >
                  Expandir todos
                </button>
              </div>
            ) : null}
            {norm.map((l, i) => {
              const labelName = l.nombre?.trim() || `Sponsor ${i + 1}`
              const isLast = i === norm.length - 1
              const isNewEmpty = !l.nombre && !l.logo_url && !l.link
              const openByDefault = isLast && isNewEmpty
              return (
                <SponsorAdminDetailsRow
                  key={i}
                  openByDefault={openByDefault}
                  summary={
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 hover:bg-[#F4F4F4] [&::-webkit-details-marker]:hidden">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#EEEEEE] bg-white">
                        {l.logo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={l.logo_url} alt="" className="max-h-7 max-w-7 object-contain" />
                        ) : (
                          <span className="text-[9px] text-[#999]" style={jost}>
                            S/L
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[12px] text-[#111111]" style={jost}>
                          {labelName}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]" style={jost}>
                          {l.tier || 'patrocinador'}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-[#999]" style={jost}>
                        {i + 1} / {norm.length}
                      </span>
                    </summary>
                  }
                >
                  <div className="border-t border-[#EEEEEE] p-3">
                    <div className="mb-3 flex gap-2">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => {
                          const n = [...norm]
                          ;[n[i - 1], n[i]] = [n[i], n[i - 1]]
                          setLogos(n)
                        }}
                        className="text-[10px] disabled:opacity-30"
                        style={jost}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={i === norm.length - 1}
                        onClick={() => {
                          const n = [...norm]
                          ;[n[i + 1], n[i]] = [n[i], n[i + 1]]
                          setLogos(n)
                        }}
                        className="text-[10px] disabled:opacity-30"
                        style={jost}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-[#CC4B37]"
                        style={jost}
                        onClick={() => setLogos(norm.filter((_, j) => j !== i))}
                      >
                        Eliminar
                      </button>
                    </div>

                    <Field label="Nombre">
                      <input
                        className={inputCls}
                        value={l.nombre}
                        onChange={(e) => {
                          const n = [...norm]
                          n[i] = { ...n[i], nombre: e.target.value }
                          setLogos(n)
                        }}
                      />
                    </Field>
                    <Field label="Logo">
                      <ImageUploadInput
                        slug="sponsors"
                        value={l.logo_url}
                        onChange={(u) => {
                          const n = [...norm]
                          n[i] = { ...n[i], logo_url: u }
                          setLogos(n)
                        }}
                      />
                    </Field>
                    <Field label="Link">
                      <input
                        className={inputCls}
                        value={l.link}
                        onChange={(e) => {
                          const n = [...norm]
                          n[i] = { ...n[i], link: e.target.value }
                          setLogos(n)
                        }}
                      />
                    </Field>
                    <Field label="Tier">
                      <select
                        className={inputCls}
                        value={l.tier}
                        onChange={(e) => {
                          const n = [...norm]
                          n[i] = { ...n[i], tier: e.target.value as typeof l.tier }
                          setLogos(n)
                        }}
                      >
                        <option value="principal">principal</option>
                        <option value="aliado">aliado</option>
                        <option value="patrocinador">patrocinador</option>
                      </select>
                    </Field>
                  </div>
                </SponsorAdminDetailsRow>
              )
            })}
          </div>
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
        const setVideos = (next: VideoItem[]) => {
          setField(slug, 'videos', next)
        }
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow">
              <input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} />
            </Field>
            <Field label="Título">
              <input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} />
            </Field>

            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px]" style={jost}>
                VIDEOS
              </p>
              <button
                type="button"
                className="border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em]"
                style={jost}
                onClick={() => setVideos([...norm, { url: '', poster: '', titulo: '' }])}
              >
                + Video
              </button>
            </div>

            {norm.length > 2 ? (
              <div className="mb-1 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    document.querySelectorAll('details[data-videos-item]').forEach((d) => d.removeAttribute('open'))
                  }}
                  className="text-[10px] uppercase tracking-[0.12em] text-[#666] hover:text-[#111]"
                  style={jost}
                >
                  Colapsar todos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.querySelectorAll('details[data-videos-item]').forEach((d) => d.setAttribute('open', ''))
                  }}
                  className="text-[10px] uppercase tracking-[0.12em] text-[#666] hover:text-[#111]"
                  style={jost}
                >
                  Expandir todos
                </button>
              </div>
            ) : null}

            {norm.map((v, i) => {
              const isLast = i === norm.length - 1
              const isNewEmpty = !v.url && !v.poster && !v.titulo
              const openByDefault = isLast && isNewEmpty
              return (
                <VideoAdminDetailsRow
                  key={i}
                  openByDefault={openByDefault}
                  summary={
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3 hover:bg-[#F4F4F4] [&::-webkit-details-marker]:hidden">
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center border border-[#EEEEEE] bg-white">
                        {v.poster ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={v.poster} alt="" className="max-h-full max-w-full object-contain" />
                        ) : v.url ? (
                          <span className="text-[9px] text-[#999]" style={jost}>
                            VIDEO
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#999]" style={jost}>
                            —
                          </span>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[12px] text-[#111111]" style={jost}>
                          {v.titulo?.trim() || `Video ${i + 1}`}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.12em] text-[#999]" style={jost}>
                          {v.url ? 'cargado' : 'pendiente'}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] text-[#999]" style={jost}>
                        {i + 1} / {norm.length}
                      </span>
                    </summary>
                  }
                >
                  <div className="border-t border-[#EEEEEE] p-3">
                    <div className="mb-3 flex gap-2">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => {
                          const n = [...norm]
                          ;[n[i - 1], n[i]] = [n[i], n[i - 1]]
                          setVideos(n)
                        }}
                        className="text-[10px] disabled:opacity-30"
                        style={jost}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={i === norm.length - 1}
                        onClick={() => {
                          const n = [...norm]
                          ;[n[i + 1], n[i]] = [n[i], n[i + 1]]
                          setVideos(n)
                        }}
                        className="text-[10px] disabled:opacity-30"
                        style={jost}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-[#CC4B37]"
                        style={jost}
                        onClick={() => setVideos(norm.filter((_, j) => j !== i))}
                      >
                        Eliminar
                      </button>
                    </div>

                    <Field label="Video MP4">
                      <VideoUploadInput
                        value={v.url}
                        onChange={(url) => {
                          const n = [...norm]
                          n[i] = { ...n[i], url }
                          setVideos(n)
                        }}
                      />
                    </Field>

                    <Field label="Poster (opcional)">
                      <ImageUploadInput
                        slug="videos"
                        value={v.poster ?? ''}
                        onChange={(url) => {
                          const n = [...norm]
                          n[i] = { ...n[i], poster: url }
                          setVideos(n)
                        }}
                      />
                    </Field>

                    <Field label="Título (opcional)">
                      <input
                        className={inputCls}
                        value={v.titulo ?? ''}
                        onChange={(e) => {
                          const n = [...norm]
                          n[i] = { ...n[i], titulo: e.target.value }
                          setVideos(n)
                        }}
                      />
                    </Field>
                  </div>
                </VideoAdminDetailsRow>
              )
            })}
          </div>
        )
      }
      case 'manual': {
        const reglas = Array.isArray(cfg(slug).reglas)
          ? (cfg(slug).reglas as unknown[]).map((r) => (typeof r === 'string' ? r : ''))
          : []
        const setReglas = (next: string[]) => {
          setField(slug, 'reglas', next)
        }
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setReglas([...reglas, ''])}>+ Regla</button>
            {reglas.map((r, i) => (
              <div key={i} className="flex flex-col gap-2 border border-[#EEEEEE] bg-white p-2">
                <div className="flex gap-2">
                  <button type="button" disabled={i === 0} className="text-[10px]" style={jost} onClick={() => {
                    const n = [...reglas]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setReglas(n)
                  }}>↑</button>
                  <button type="button" disabled={i === reglas.length - 1} className="text-[10px]" style={jost} onClick={() => {
                    const n = [...reglas]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setReglas(n)
                  }}>↓</button>
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setReglas(reglas.filter((_, j) => j !== i))}>Eliminar</button>
                </div>
                <textarea rows={3} className={inputCls} value={r} onChange={(e) => {
                  const n = [...reglas]; n[i] = e.target.value; setReglas(n)
                }} />
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
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>
          Editor de landing — Operación Kursk II
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Cambios visibles en{' '}
          <a href="/operacionkursk2" target="_blank" className="text-[#CC4B37] underline">
            /operacionkursk2
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
                            <a href="/operacionkursk2" target="_blank" className="text-[11px] text-[#CC4B37] hover:underline" style={jost}>Ver landing →</a>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  const jostLbl = { fontFamily: "'Jost', sans-serif", fontWeight: 800 as const, textTransform: 'uppercase' as const }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]" style={jostLbl}>{label}</span>
      {children}
    </div>
  )
}
