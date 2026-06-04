'use client'

import type { CSSProperties, ReactNode, ChangeEvent } from 'react'
import { useState } from 'react'
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
import { MediaUploadInput } from '@/app/admin/operacionkursk2/components/MediaUploadInput'
import { ImageUploadInput } from '@/app/admin/operacionkursk2/components/ImageUploadInput'
import type { TacticalGamesSlug, GaleriaImagen } from '@/app/tacticalgames/lib/types'
import { TG_SLUGS } from '@/app/tacticalgames/lib/types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

export type TGRecord = {
  id: string | null
  slug: TacticalGamesSlug
  config: Record<string, unknown>
  activo: boolean
  orden: number
}

type SectionDef = {
  slug: TacticalGamesSlug
  label: string
  descripcion: string
}

const SECTIONS: SectionDef[] = [
  { slug: 'hero', label: 'Portada', descripcion: 'Media, textos y CTAs.' },
  { slug: 'briefing', label: 'Briefing', descripcion: 'Descripción del evento y highlights.' },
  { slug: 'sede', label: 'Localización', descripcion: 'Fotos, dirección y mapa.' },
  { slug: 'countdown', label: 'Countdown', descripcion: 'Fecha objetivo.' },
  { slug: 'equipamiento', label: 'Equipamiento', descripcion: 'Checklist obligatorio/deseable.' },
  { slug: 'inscripcion', label: 'Inscripción', descripcion: 'Ventanas de precio y CTAs.' },
  { slug: 'sponsors', label: 'Patrocinadores', descripcion: 'Logos por tier.' },
  { slug: 'galeria', label: 'Galería', descripcion: 'Fotos del evento.' },
  { slug: 'airnation', label: 'AirNation', descripcion: 'Presencia plataforma.' },
]

/** Acepta vacío, http(s) o anclas internas (#seccion). NO rechaza "#". */
function linkOk(v: string): boolean {
  const t = v.trim()
  return !t || /^https?:\/\//i.test(t) || t.startsWith('#')
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

/** Convierte datetime-local a ISO con offset -06:00 (CST central México). */
function datetimeLocalToIsoMexico(dt: string): string {
  if (!dt?.trim()) return ''
  const [dp, tp = '00:00'] = dt.split('T')
  const [hh = '00', mm = '00'] = tp.split(':')
  return `${dp}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:00-06:00`
}

function validateConfig(slug: TacticalGamesSlug, cfg: Record<string, unknown>): string | null {
  const chk = (val: unknown) => (typeof val === 'string' ? val : '')

  if (slug === 'hero') {
    if (!linkOk(chk(cfg.cta1_link))) return 'CTA 1 link debe ser http(s), ancla (#) o vacío.'
    if (!linkOk(chk(cfg.cta2_link))) return 'CTA 2 link debe ser http(s), ancla (#) o vacío.'
    if (chk(cfg.seo_title).length > 100) return 'SEO title máx 100 caracteres.'
    if (chk(cfg.seo_description).length > 200) return 'SEO description máx 200 caracteres.'
  }
  if (slug === 'sede' && !linkOk(chk(cfg.maps_link))) {
    return 'Maps link debe ser http(s), ancla (#) o vacío.'
  }
  if (slug === 'inscripcion') {
    if (!linkOk(chk(cfg.cta1_link))) return 'CTA 1 debe ser http(s), ancla (#) o vacío.'
    if (!linkOk(chk(cfg.cta2_link))) return 'CTA 2 debe ser http(s), ancla (#) o vacío.'
  }
  if (slug === 'airnation' && !linkOk(chk(cfg.cta_link))) {
    return 'CTA link debe ser http(s), ancla (#) o vacío.'
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
  return null
}

function getThumb(slug: TacticalGamesSlug, cfg: Record<string, unknown>): string {
  if (slug === 'hero') {
    return typeof cfg.media_url === 'string' ? cfg.media_url : ''
  }
  if (slug === 'sede') {
    const imgs = cfg.imagenes
    if (Array.isArray(imgs) && imgs.length > 0 && typeof imgs[0] === 'string') return imgs[0]
    return ''
  }
  return ''
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

    const invalid = files.find((f) => !f.type.startsWith('image/') || f.type === 'image/svg+xml')
    if (invalid) {
      setErr('Solo imágenes (JPG, PNG, WebP, etc.)')
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
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-square overflow-hidden border border-[#EEEEEE] bg-[#F4F4F4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white hover:bg-black disabled:opacity-40">←</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="flex h-6 w-6 items-center justify-center bg-black/70 text-[10px] text-white hover:bg-black disabled:opacity-40">→</button>
                </div>
                <button type="button" onClick={() => remove(i)} className="flex h-6 w-6 items-center justify-center bg-[#CC4B37] text-[12px] text-white hover:opacity-90">×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-2.5 text-[11px] transition-colors ${uploading ? 'border-[#CCCCCC] text-[#AAAAAA]' : 'border-[#CCCCCC] bg-[#F9F9F9] text-[#666666] hover:border-[#CC4B37] hover:text-[#CC4B37]'}`} style={lato}>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        {uploading ? 'Subiendo…' : value.length === 0 ? '+ Agregar imágenes' : '+ Agregar más'}
      </label>

      {err && <p className="text-[11px] text-[#CC4B37]" style={lato}>{err}</p>}
      <p className="text-[11px] text-[#AAAAAA]" style={lato}>{value.length} imagen{value.length === 1 ? '' : 'es'}</p>
    </div>
  )
}

type SortableHandleProps = Pick<ReturnType<typeof useSortable>, 'attributes' | 'listeners'>

function SortableSection({
  slug,
  children,
}: {
  slug: TacticalGamesSlug
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

function sectionFor(slug: TacticalGamesSlug): SectionDef {
  const def = SECTIONS.find((s) => s.slug === slug)
  if (!def) throw new Error(`Section metadata missing: ${slug}`)
  return def
}

export function TacticalGamesAdminClient({ initialBlocks }: { initialBlocks: TGRecord[] }) {
  const [configs, setConfigs] = useState<Record<TacticalGamesSlug, Record<string, unknown>>>(() => {
    const map = {} as Record<TacticalGamesSlug, Record<string, unknown>>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.config ? { ...found.config } : {}
    }
    return map
  })

  const [ids, setIds] = useState<Record<TacticalGamesSlug, string | null>>(() => {
    const map = {} as Record<TacticalGamesSlug, string | null>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.id ?? null
    }
    return map
  })

  const [activos, setActivos] = useState<Record<TacticalGamesSlug, boolean>>(() => {
    const map = {} as Record<TacticalGamesSlug, boolean>
    for (const def of SECTIONS) {
      const found = initialBlocks.find((b) => b.slug === def.slug)
      map[def.slug] = found?.activo ?? true
    }
    return map
  })

  const [orderedSlugs, setOrderedSlugs] = useState<TacticalGamesSlug[]>(() => {
    const fromBd = initialBlocks.map((b) => b.slug)
    const missing = TG_SLUGS.filter((s) => !fromBd.includes(s))
    return [...fromBd, ...missing]
  })

  const [toggling, setToggling] = useState<TacticalGamesSlug | null>(null)
  const [reordering, setReordering] = useState(false)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [expandido, setExpandido] = useState<TacticalGamesSlug | null>(null)
  const [saving, setSaving] = useState<TacticalGamesSlug | null>(null)
  const [saved, setSaved] = useState<TacticalGamesSlug | null>(null)
  const [error, setError] = useState<string | null>(null)

  function cfg(slug: TacticalGamesSlug): Record<string, unknown> {
    return configs[slug] ?? {}
  }
  function setField(slug: TacticalGamesSlug, key: string, value: unknown) {
    setConfigs((prev) => ({ ...prev, [slug]: { ...prev[slug], [key]: value } }))
  }
  function str(slug: TacticalGamesSlug, key: string): string {
    const v = configs[slug]?.[key]
    return typeof v === 'string' ? v : ''
  }

  async function handleSave(slug: TacticalGamesSlug) {
    let out = { ...(configs[slug] ?? {}) }

    if (slug === 'countdown') {
      const dtLocal = str(slug, '_fecha_local')
      out = {
        ...out,
        fecha_inicio: dtLocal ? datetimeLocalToIsoMexico(dtLocal) : str(slug, 'fecha_inicio'),
      }
      delete (out as Record<string, unknown>)['_fecha_local']
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

  async function handleToggle(slug: TacticalGamesSlug) {
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

    const oldIndex = orderedSlugs.indexOf(active.id as TacticalGamesSlug)
    const newIndex = orderedSlugs.indexOf(over.id as TacticalGamesSlug)
    if (oldIndex === -1 || newIndex === -1) return

    setReorderError(null)
    const prevOrder = orderedSlugs
    const newOrder = [...orderedSlugs]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    setOrderedSlugs(newOrder)

    setReordering(true)
    try {
      const idsInOrder = newOrder.map((s) => ids[s]).filter((id): id is string => typeof id === 'string')
      if (idsInOrder.length !== newOrder.length) {
        throw new Error('Hay secciones sin guardar — guárdalas antes de reordenar.')
      }
      const res = await reorderAllBlocks(idsInOrder)
      if ('error' in res) throw new Error(res.error)
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

  function StringListEditor({
    slug,
    field,
    addLabel,
    placeholder,
    multiline,
  }: {
    slug: TacticalGamesSlug
    field: string
    addLabel: string
    placeholder?: string
    multiline?: boolean
  }) {
    const arr = (Array.isArray(cfg(slug)[field]) ? cfg(slug)[field] : []) as unknown[]
    const norm = arr.map((x) => (typeof x === 'string' ? x : ''))
    const set = (next: string[]) => setField(slug, field, next)
    return (
      <div className="flex flex-col gap-2">
        <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em]" style={jost} onClick={() => set([...norm, ''])}>
          {addLabel}
        </button>
        {norm.map((val, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex flex-col gap-1 pt-1">
              <button type="button" disabled={i === 0} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(n) }}>↑</button>
              <button type="button" disabled={i === norm.length - 1} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set(n) }}>↓</button>
            </div>
            {multiline ? (
              <textarea rows={3} className={inputCls} placeholder={placeholder} value={val} onChange={(e) => { const n = [...norm]; n[i] = e.target.value; set(n) }} />
            ) : (
              <input className={inputCls} placeholder={placeholder} value={val} onChange={(e) => { const n = [...norm]; n[i] = e.target.value; set(n) }} />
            )}
            <button type="button" className="pt-1 text-[10px] text-[#CC4B37]" style={jost} onClick={() => set(norm.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
    )
  }

  function editorFor(slug: TacticalGamesSlug) {
    switch (slug) {
      case 'hero':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Subtítulo"><input className={inputCls} value={str(slug, 'subtitulo')} onChange={(e) => setField(slug, 'subtitulo', e.target.value)} /></Field>
            <MediaUploadInput
              label="MEDIA DE FONDO (IMAGEN O VIDEO)"
              currentUrl={str(slug, 'media_url')}
              currentType={cfg(slug).media_type === 'video' ? 'video' : 'image'}
              slug="hero"
              onChange={(url, type) => {
                setConfigs((prev) => ({ ...prev, hero: { ...(prev.hero ?? {}), media_url: url, media_type: type } }))
              }}
            />
            <Field label="CTA 1 texto (Inscripción)"><input className={inputCls} value={str(slug, 'cta1_texto')} onChange={(e) => setField(slug, 'cta1_texto', e.target.value)} /></Field>
            <Field label="CTA 1 link (Google Form / http / #ancla)"><input className={inputCls} value={str(slug, 'cta1_link')} onChange={(e) => setField(slug, 'cta1_link', e.target.value)} /></Field>
            <Field label="CTA 2 texto (Más info)"><input className={inputCls} value={str(slug, 'cta2_texto')} onChange={(e) => setField(slug, 'cta2_texto', e.target.value)} /></Field>
            <Field label="CTA 2 link (WhatsApp / http / #ancla)"><input className={inputCls} value={str(slug, 'cta2_link')} onChange={(e) => setField(slug, 'cta2_link', e.target.value)} /></Field>
            <Field label="SEO title (máx 100)"><input maxLength={100} className={inputCls} value={str(slug, 'seo_title')} onChange={(e) => setField(slug, 'seo_title', e.target.value)} /></Field>
            <Field label="SEO description (máx 200)"><textarea maxLength={200} rows={3} className={inputCls} value={str(slug, 'seo_description')} onChange={(e) => setField(slug, 'seo_description', e.target.value)} /></Field>
          </div>
        )
      case 'briefing':
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} placeholder="BRIEFING" value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} placeholder="BRIEFING" value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Párrafos">
              <StringListEditor slug={slug} field="parrafos" addLabel="+ Agregar párrafo" placeholder="Texto del párrafo…" multiline />
            </Field>
            <Field label="Highlights (formato «ETIQUETA: valor»)">
              <StringListEditor slug={slug} field="highlights" addLabel="+ Agregar highlight" placeholder="FORMATO: Individual" />
            </Field>
          </div>
        )
      case 'sede': {
        const rawImgs = cfg(slug).imagenes
        const imagenesArr: string[] = Array.isArray(rawImgs) ? rawImgs.filter((u): u is string => typeof u === 'string') : []
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Galería sede (varias imágenes)">
              <MultiImageUploader value={imagenesArr} onChange={(urls) => setField(slug, 'imagenes', urls)} />
            </Field>
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
                  setField(slug, 'fecha_inicio', datetimeLocalToIsoMexico(e.target.value))
                }}
              />
            </Field>
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
          </div>
        )
      }
      case 'equipamiento': {
        const tabsRaw = (Array.isArray(cfg(slug).tabs) ? cfg(slug).tabs : []) as { nombre: string; items: { nombre: string; obligatorio: boolean }[] }[]
        const norm = tabsRaw.map((t) => ({
          nombre: typeof t.nombre === 'string' ? t.nombre : '',
          items: Array.isArray(t.items)
            ? t.items.map((it) => ({ nombre: typeof it.nombre === 'string' ? it.nombre : '', obligatorio: Boolean(it.obligatorio) }))
            : [],
        }))
        const setTabs = (next: typeof norm) => setField(slug, 'tabs', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} placeholder="EQUIPAMIENTO" value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} placeholder="EQUIPAMIENTO" value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Subtítulo"><input className={inputCls} value={str(slug, 'subtitulo')} onChange={(e) => setField(slug, 'subtitulo', e.target.value)} /></Field>
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={jost}>CATEGORÍAS (TABS)</p>
              <button type="button" className="border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setTabs([...norm, { nombre: '', items: [] }])}>+ Agregar categoría</button>
            </div>
            {norm.map((tab, ti) => {
              const setItems = (items: typeof tab.items) => { const n = [...norm]; n[ti] = { ...n[ti], items }; setTabs(n) }
              return (
                <div key={ti} className="border border-[#EEEEEE] bg-white p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <button type="button" disabled={ti === 0} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[ti - 1], n[ti]] = [n[ti], n[ti - 1]]; setTabs(n) }}>↑</button>
                    <button type="button" disabled={ti === norm.length - 1} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[ti + 1], n[ti]] = [n[ti], n[ti + 1]]; setTabs(n) }}>↓</button>
                    <span className="text-[10px] text-[#999]" style={jost}>Categoría {ti + 1}</span>
                    <button
                      type="button"
                      className="ml-auto text-[10px] text-[#CC4B37]"
                      style={jost}
                      onClick={() => {
                        if (tab.items.length > 0 && !window.confirm(`Eliminar la categoría "${tab.nombre || ti + 1}" con ${tab.items.length} item(s)?`)) return
                        setTabs(norm.filter((_, j) => j !== ti))
                      }}
                    >
                      Eliminar categoría
                    </button>
                  </div>
                  <Field label="Nombre de la categoría"><input className={inputCls} placeholder="RÉPLICAS Y MUNICIÓN" value={tab.nombre} onChange={(e) => { const n = [...norm]; n[ti] = { ...n[ti], nombre: e.target.value }; setTabs(n) }} /></Field>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#666]" style={jost}>ITEMS</p>
                    <button type="button" className="border border-[#DDDDDD] bg-white px-2 py-1 text-[10px]" style={jost} onClick={() => setItems([...tab.items, { nombre: '', obligatorio: true }])}>+ Item</button>
                  </div>
                  {tab.items.map((it, i) => (
                    <div key={i} className="mt-2 flex flex-wrap items-center gap-2 border border-[#EEEEEE] bg-[#FAFAFA] p-2">
                      <button type="button" disabled={i === 0} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...tab.items]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setItems(n) }}>↑</button>
                      <button type="button" disabled={i === tab.items.length - 1} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...tab.items]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setItems(n) }}>↓</button>
                      <input className={`${inputCls} min-w-[140px] flex-1`} placeholder="Nombre del item" value={it.nombre} onChange={(e) => { const n = [...tab.items]; n[i] = { ...n[i], nombre: e.target.value }; setItems(n) }} />
                      <label className="flex items-center gap-1.5 text-[11px]" style={lato}>
                        <input type="checkbox" checked={it.obligatorio} onChange={(e) => { const n = [...tab.items]; n[i] = { ...n[i], obligatorio: e.target.checked }; setItems(n) }} />
                        Obligatorio
                      </label>
                      <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setItems(tab.items.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                </div>
              )
            })}
            <Field label="Nota BBS"><input className={inputCls} placeholder="BBS de 0.25 únicamente" value={str(slug, 'nota_bbs')} onChange={(e) => setField(slug, 'nota_bbs', e.target.value)} /></Field>
            <Field label="Nota extra"><textarea rows={2} className={inputCls} value={str(slug, 'nota_extra')} onChange={(e) => setField(slug, 'nota_extra', e.target.value)} /></Field>
          </div>
        )
      }
      case 'inscripcion': {
        const ventanas = (Array.isArray(cfg(slug).ventanas) ? cfg(slug).ventanas : []) as { fecha_desde: string; fecha_hasta: string; label: string; precio: number }[]
        const norm = ventanas.map((v) => ({
          fecha_desde: typeof v.fecha_desde === 'string' ? v.fecha_desde.slice(0, 10) : '',
          fecha_hasta: typeof v.fecha_hasta === 'string' ? v.fecha_hasta.slice(0, 10) : '',
          label: typeof v.label === 'string' ? v.label : '',
          precio: Number(v.precio) || 0,
        }))
        const setVentanas = (next: typeof norm) => setField(slug, 'ventanas', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} placeholder="INSCRIPCIÓN" value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} placeholder="INSCRIPCIÓN" value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <Field label="Subtítulo"><input className={inputCls} value={str(slug, 'subtitulo')} onChange={(e) => setField(slug, 'subtitulo', e.target.value)} /></Field>
            <div className="flex items-center justify-between">
              <p className="text-[11px]" style={jost}>VENTANAS DE PRECIO</p>
              <button type="button" className="border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setVentanas([...norm, { fecha_desde: '', fecha_hasta: '', label: '', precio: 0 }])}>+ Ventana</button>
            </div>
            {norm.map((v, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" disabled={i === 0} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setVentanas(n) }}>↑</button>
                  <button type="button" disabled={i === norm.length - 1} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setVentanas(n) }}>↓</button>
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setVentanas(norm.filter((_, j) => j !== i))}>Eliminar</button>
                </div>
                <Field label="Label"><input className={inputCls} placeholder="Preventa / Precio regular" value={v.label} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], label: e.target.value }; setVentanas(n) }} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Desde"><input type="date" className={inputCls} value={v.fecha_desde} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], fecha_desde: e.target.value }; setVentanas(n) }} /></Field>
                  <Field label="Hasta"><input type="date" className={inputCls} value={v.fecha_hasta} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], fecha_hasta: e.target.value }; setVentanas(n) }} /></Field>
                </div>
                <Field label="Precio (MXN)"><input type="number" min={0} className={inputCls} value={v.precio} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], precio: Number(e.target.value) || 0 }; setVentanas(n) }} /></Field>
              </div>
            ))}
            <Field label="Tu inscripción incluye">
              <StringListEditor slug={slug} field="incluye" addLabel="+ Agregar item" placeholder="Ej. Acceso 2 días" />
            </Field>
            <Field label="Nota general"><textarea rows={2} className={inputCls} value={str(slug, 'nota')} onChange={(e) => setField(slug, 'nota', e.target.value)} /></Field>
            <Field label="CTA 1 texto (Inscribirme)"><input className={inputCls} value={str(slug, 'cta1_texto')} onChange={(e) => setField(slug, 'cta1_texto', e.target.value)} /></Field>
            <Field label="CTA 1 link (Google Form)"><input className={inputCls} value={str(slug, 'cta1_link')} onChange={(e) => setField(slug, 'cta1_link', e.target.value)} /></Field>
            <Field label="CTA 2 texto (WhatsApp)"><input className={inputCls} value={str(slug, 'cta2_texto')} onChange={(e) => setField(slug, 'cta2_texto', e.target.value)} /></Field>
            <Field label="CTA 2 link (wa.me)"><input className={inputCls} value={str(slug, 'cta2_link')} onChange={(e) => setField(slug, 'cta2_link', e.target.value)} /></Field>
          </div>
        )
      }
      case 'sponsors': {
        const logos = (Array.isArray(cfg(slug).logos) ? cfg(slug).logos : []) as { nombre: string; logo_url: string; link: string; tier: string }[]
        const norm = logos.map((l) => ({
          nombre: typeof l.nombre === 'string' ? l.nombre : '',
          logo_url: typeof l.logo_url === 'string' ? l.logo_url : '',
          link: typeof l.link === 'string' ? l.link : '',
          tier: (['principal', 'aliado', 'patrocinador'].includes(l.tier) ? l.tier : 'patrocinador') as 'principal' | 'aliado' | 'patrocinador',
        }))
        const setLogos = (next: typeof norm) => setField(slug, 'logos', next)
        return (
          <div className="flex flex-col gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={str(slug, 'eyebrow')} onChange={(e) => setField(slug, 'eyebrow', e.target.value)} /></Field>
            <Field label="Título"><input className={inputCls} value={str(slug, 'titulo')} onChange={(e) => setField(slug, 'titulo', e.target.value)} /></Field>
            <button type="button" className="self-start border border-[#DDDDDD] bg-white px-3 py-2 text-[10px]" style={jost} onClick={() => setLogos([...norm, { nombre: '', logo_url: '', link: '', tier: 'patrocinador' }])}>+ Sponsor</button>
            {norm.map((l, i) => (
              <div key={i} className="border border-[#EEEEEE] bg-white p-3">
                <div className="mb-2 flex gap-2">
                  <button type="button" disabled={i === 0} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setLogos(n) }}>↑</button>
                  <button type="button" disabled={i === norm.length - 1} className="text-[10px] disabled:opacity-30" style={jost} onClick={() => { const n = [...norm]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setLogos(n) }}>↓</button>
                  <button type="button" className="text-[10px] text-[#CC4B37]" style={jost} onClick={() => setLogos(norm.filter((_, j) => j !== i))}>Eliminar</button>
                </div>
                <Field label="Nombre"><input className={inputCls} value={l.nombre} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], nombre: e.target.value }; setLogos(n) }} /></Field>
                <Field label="Logo"><ImageUploadInput slug="sponsors" value={l.logo_url} onChange={(u) => { const n = [...norm]; n[i] = { ...n[i], logo_url: u }; setLogos(n) }} /></Field>
                <Field label="Link"><input className={inputCls} value={l.link} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], link: e.target.value }; setLogos(n) }} /></Field>
                <Field label="Tier">
                  <select className={inputCls} value={l.tier} onChange={(e) => { const n = [...norm]; n[i] = { ...n[i], tier: e.target.value as typeof l.tier }; setLogos(n) }}>
                    <option value="principal">principal</option>
                    <option value="aliado">aliado</option>
                    <option value="patrocinador">patrocinador</option>
                  </select>
                </Field>
              </div>
            ))}
          </div>
        )
      }
      case 'galeria': {
        const imagenes = (Array.isArray(cfg(slug).imagenes) ? cfg(slug).imagenes : []) as GaleriaImagen[]
        const norm = imagenes.map((im) => ({
          url: typeof im.url === 'string' ? im.url : '',
          orientacion: (['vertical', 'horizontal', 'cuadrada'].includes(im.orientacion) ? im.orientacion : 'vertical') as GaleriaImagen['orientacion'],
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
            <Field label="Texto botón redes"><input className={inputCls} placeholder="SEGUIR EN INSTAGRAM" value={str(slug, 'social_texto')} onChange={(e) => setField(slug, 'social_texto', e.target.value)} /></Field>
            <Field label="Link redes"><input className={inputCls} placeholder="https://www.instagram.com/airsofttacticalgamesmx" value={str(slug, 'social_link')} onChange={(e) => setField(slug, 'social_link', e.target.value)} /></Field>
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
          Editor de landing — Airsoft Tactical Games
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
          Cambios visibles en{' '}
          <a href="/tacticalgames" target="_blank" className="text-[#CC4B37] underline">/tacticalgames</a>
        </p>
      </div>

      {error && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]" style={lato}>{error}</p>
        </div>
      )}

      {reordering ? (
        <div className="mb-3 border border-[#CC4B37] bg-[#fff5f3] px-3 py-2 text-[11px] text-[#CC4B37]" style={jost}>Guardando nuevo orden…</div>
      ) : null}
      {reorderError ? (
        <div className="mb-3 border border-[#CC4B37] bg-[#fff5f3] px-3 py-2 text-[11px] text-[#CC4B37]" style={jost}>⚠ {reorderError}</div>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                      <div className={`flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAFAFA] ${!activos[slug] ? 'opacity-60' : ''}`}>
                        <button type="button" {...attributes} {...listeners} className="flex h-7 w-5 shrink-0 cursor-grab items-center justify-center text-[#999999] hover:text-[#CC4B37] active:cursor-grabbing" aria-label="Arrastrar para reordenar">
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
                            {isSaved && <span className="flex items-center gap-1 text-[10px] font-bold text-[#22C55E]" style={jost}>Guardado</span>}
                            {!isConfigured && <span className="border border-[#DDDDDD] px-2 py-0.5 text-[9px] text-[#AAAAAA]" style={jost}>Sin configurar</span>}
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); if (toggling !== slug) handleToggle(slug) }}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (toggling !== slug) handleToggle(slug) } }}
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
                            <a href="/tacticalgames" target="_blank" className="text-[11px] text-[#CC4B37] hover:underline" style={jost}>Ver landing →</a>
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
