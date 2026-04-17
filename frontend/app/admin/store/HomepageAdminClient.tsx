'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  createHomepageBlock,
  deleteHomepageBlock,
  reorderHomepageBlock,
  toggleHomepageBlock,
  updateHomepageBlock,
} from './homepage-actions'
import type { HomepageBlock, HomepageBlockTipo } from '@/app/store/types'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const latoBody = { fontFamily: "'Lato', sans-serif" }

type Props = {
  initialBlocks: HomepageBlock[]
  products: { id: string; nombre: string }[]
  categories: { id: string; nombre: string }[]
}

const TIPO_META: Record<
  HomepageBlockTipo,
  { label: string; color: string; descripcion: string }
> = {
  hero: {
    label: 'Hero',
    color: '#111111',
    descripcion: 'Imagen full-width con título, subtítulo y CTA principal.',
  },
  banner_producto: {
    label: 'Banner Producto',
    color: '#CC4B37',
    descripcion: 'Banner horizontal destacando un producto o marca.',
  },
  carrusel_productos: {
    label: 'Carrusel Productos',
    color: '#1D4ED8',
    descripcion: 'Lista horizontal scrollable de productos seleccionados.',
  },
  categorias_grid: {
    label: 'Grid Categorías',
    color: '#16A34A',
    descripcion: 'Rejilla con tarjetas de categorías con imagen y label.',
  },
  blog_destacado: {
    label: 'Blog Destacado',
    color: '#D97706',
    descripcion: 'Card editorial con título, extracto y CTA a blog.',
  },
  texto_libre: {
    label: 'Texto Libre',
    color: '#666666',
    descripcion: 'Bloque de texto con colores configurables.',
  },
}

function defaultConfig(tipo: HomepageBlockTipo): Record<string, unknown> {
  switch (tipo) {
    case 'hero':
      return { imagen_url: '', titulo: '', subtitulo: '', cta_texto: '', cta_link: '' }
    case 'banner_producto':
      return {
        imagen_url: '',
        marca: '',
        titulo: '',
        descripcion: '',
        cta_link: '',
      }
    case 'carrusel_productos':
      return { titulo_seccion: '', product_ids: [] as string[] }
    case 'categorias_grid':
      return { titulo_seccion: '', items: [] as unknown[] }
    case 'blog_destacado':
      return { imagen_url: '', titulo: '', extracto: '', cta_link: '' }
    case 'texto_libre':
      return {
        titulo: '',
        cuerpo: '',
        bg_color: '#111111',
        text_color: '#FFFFFF',
      }
  }
}

function previewText(block: HomepageBlock): string {
  const c = block.config as Record<string, unknown>
  const candidates = [c.titulo, c.titulo_seccion, c.cuerpo]
  const raw = candidates.find((v) => typeof v === 'string' && v.trim().length > 0)
  const text = typeof raw === 'string' ? raw : ''
  if (!text) return '(sin contenido)'
  return text.length > 40 ? `${text.slice(0, 40)}…` : text
}

export function HomepageAdminClient({ initialBlocks, products, categories }: Props) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<HomepageBlock[]>(initialBlocks)
  const [creando, setCreando] = useState(false)
  const [tipoNuevo, setTipoNuevo] = useState<HomepageBlockTipo>('hero')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const refresh = () => router.refresh()

  async function onToggle(id: string, activo: boolean) {
    setError(null)
    const res = await toggleHomepageBlock(id, activo)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, activo } : b)))
    refresh()
  }

  async function onReorder(id: string, direction: 'up' | 'down') {
    setError(null)
    const res = await reorderHomepageBlock(
      id,
      direction,
      blocks.map((b) => ({ id: b.id, orden: b.orden }))
    )
    if ('error' in res) {
      setError(res.error)
      return
    }
    refresh()
  }

  async function onDelete(id: string) {
    if (!confirm('¿Eliminar este bloque? Esta acción no se puede deshacer.')) return
    setError(null)
    const res = await deleteHomepageBlock(id)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id))
    refresh()
  }

  async function onCreate(config: Record<string, unknown>) {
    setError(null)
    setSaving(true)
    const res = await createHomepageBlock(tipoNuevo, config)
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setCreando(false)
    refresh()
  }

  async function onUpdate(id: string, config: Record<string, unknown>) {
    setError(null)
    setSaving(true)
    const res = await updateHomepageBlock(id, config)
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, config } : b)))
    setEditingId(null)
    refresh()
  }

  const sorted = [...blocks].sort((a, b) => a.orden - b.orden)

  return (
    <div className="flex flex-col gap-4" style={latoBody}>
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-[14px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            Homepage
          </h2>
          <p className="mt-1 text-[12px] text-[#666666]" style={latoBody}>
            Bloques que se renderizan en orden en <code>/store</code>. Arrastra con las
            flechas para reordenar.
          </p>
        </div>
        {!creando && (
          <button
            type="button"
            onClick={() => {
              setCreando(true)
              setTipoNuevo('hero')
              setError(null)
            }}
            className="bg-[#CC4B37] px-3 py-2 text-[11px] tracking-[0.12em] text-white"
            style={{ ...jostHeading, borderRadius: 2 }}
          >
            + Nuevo bloque
          </button>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-[#CC4B37]" style={latoBody}>
          {error}
        </p>
      )}

      {creando && (
        <div className="border border-solid border-[#EEEEEE] bg-[#FAFAFA] p-4">
          <p className="mb-3 text-[11px] tracking-[0.12em] text-[#111111]" style={jostHeading}>
            Nuevo bloque — elige tipo
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(TIPO_META) as HomepageBlockTipo[]).map((tipo) => {
              const meta = TIPO_META[tipo]
              const active = tipoNuevo === tipo
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoNuevo(tipo)}
                  className={`flex flex-col items-start gap-1 border border-solid p-3 text-left transition-colors ${
                    active
                      ? 'border-[#CC4B37] bg-white'
                      : 'border-[#EEEEEE] bg-white hover:border-[#CCCCCC]'
                  }`}
                >
                  <span
                    className="px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-white"
                    style={{ ...jostHeading, backgroundColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-[#666666]" style={latoBody}>
                    {meta.descripcion}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="mt-4">
            <BlockForm
              tipo={tipoNuevo}
              initial={defaultConfig(tipoNuevo)}
              products={products}
              categories={categories}
              saving={saving}
              onCancel={() => setCreando(false)}
              onSubmit={onCreate}
              submitLabel="Crear bloque"
            />
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="border border-dashed border-[#DDDDDD] bg-[#FAFAFA] px-4 py-10 text-center">
          <p className="text-[12px] text-[#666666]" style={latoBody}>
            Aún no hay bloques configurados. Haz clic en <strong>+ Nuevo bloque</strong> para
            empezar.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((block, i) => {
            const meta = TIPO_META[block.tipo]
            const isFirst = i === 0
            const isLast = i === sorted.length - 1
            const isEditing = editingId === block.id
            return (
              <li
                key={block.id}
                className={`border border-solid ${
                  block.activo ? 'border-[#EEEEEE] bg-white' : 'border-[#F4F4F4] bg-[#FAFAFA]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[11px] text-[#666666]"
                    style={jostHeading}
                  >
                    {block.orden}
                  </span>
                  <span
                    className="shrink-0 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-white"
                    style={{ ...jostHeading, backgroundColor: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className={`flex-1 truncate text-[12px] ${
                      block.activo ? 'text-[#333333]' : 'text-[#999999]'
                    }`}
                    style={latoBody}
                  >
                    {previewText(block)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onReorder(block.id, 'up')}
                      disabled={isFirst}
                      className="flex h-7 w-7 items-center justify-center border border-solid border-[#EEEEEE] bg-white text-[12px] text-[#666666] disabled:opacity-30"
                      aria-label="Subir"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onReorder(block.id, 'down')}
                      disabled={isLast}
                      className="flex h-7 w-7 items-center justify-center border border-solid border-[#EEEEEE] bg-white text-[12px] text-[#666666] disabled:opacity-30"
                      aria-label="Bajar"
                    >
                      ↓
                    </button>
                  </div>
                  <label
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[11px] text-[#666666]"
                    style={latoBody}
                  >
                    <input
                      type="checkbox"
                      checked={block.activo}
                      onChange={(e) => onToggle(block.id, e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#CC4B37]"
                    />
                    {block.activo ? 'Activo' : 'Oculto'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingId(isEditing ? null : block.id)}
                    className="border border-solid border-[#EEEEEE] bg-white px-2 py-1 text-[10px] tracking-[0.12em] text-[#111111]"
                    style={{ ...jostHeading, borderRadius: 2 }}
                  >
                    {isEditing ? 'Cerrar' : 'Editar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(block.id)}
                    className="border border-solid border-[#CC4B37] bg-white px-2 py-1 text-[10px] tracking-[0.12em] text-[#CC4B37]"
                    style={{ ...jostHeading, borderRadius: 2 }}
                  >
                    Eliminar
                  </button>
                </div>
                {isEditing && (
                  <div className="border-t border-solid border-[#EEEEEE] bg-[#FAFAFA] p-4">
                    <BlockForm
                      tipo={block.tipo}
                      initial={block.config}
                      products={products}
                      categories={categories}
                      saving={saving}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(cfg) => onUpdate(block.id, cfg)}
                      submitLabel="Guardar cambios"
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Form inline por tipo
// ────────────────────────────────────────────────────────────────

type BlockFormProps = {
  tipo: HomepageBlockTipo
  initial: Record<string, unknown>
  products: { id: string; nombre: string }[]
  categories: { id: string; nombre: string }[]
  saving: boolean
  onCancel: () => void
  onSubmit: (config: Record<string, unknown>) => void
  submitLabel: string
}

function getStr(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function BlockForm({
  tipo,
  initial,
  products,
  categories,
  saving,
  onCancel,
  onSubmit,
  submitLabel,
}: BlockFormProps) {
  const [state, setState] = useState<Record<string, unknown>>(initial)
  const [formError, setFormError] = useState<string | null>(null)

  function setField(key: string, value: unknown) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function submit() {
    setFormError(null)
    if (tipo === 'hero') {
      if (!getStr(state.titulo).trim()) {
        setFormError('El título es requerido.')
        return
      }
    }
    if (tipo === 'banner_producto') {
      if (!getStr(state.imagen_url).trim() || !getStr(state.titulo).trim()) {
        setFormError('Imagen y título son requeridos.')
        return
      }
    }
    if (tipo === 'carrusel_productos') {
      if (!getStr(state.titulo_seccion).trim()) {
        setFormError('El título de sección es requerido.')
        return
      }
    }
    if (tipo === 'blog_destacado') {
      if (!getStr(state.imagen_url).trim() || !getStr(state.titulo).trim()) {
        setFormError('Imagen y título son requeridos.')
        return
      }
    }
    if (tipo === 'texto_libre') {
      if (!getStr(state.cuerpo).trim()) {
        setFormError('El cuerpo es requerido.')
        return
      }
    }
    onSubmit(state)
  }

  const inputCls =
    'w-full border border-solid border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]'
  const labelCls = 'text-[11px] tracking-[0.1em] text-[#666666]'

  return (
    <div className="flex flex-col gap-3" style={latoBody}>
      {tipo === 'hero' && (
        <>
          <Field label="Imagen URL" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.imagen_url)}
              onChange={(e) => setField('imagen_url', e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Título *" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.titulo)}
              onChange={(e) => setField('titulo', e.target.value)}
            />
          </Field>
          <Field label="Subtítulo" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.subtitulo)}
              onChange={(e) => setField('subtitulo', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="CTA Texto" labelCls={labelCls}>
              <input
                type="text"
                className={inputCls}
                value={getStr(state.cta_texto)}
                onChange={(e) => setField('cta_texto', e.target.value)}
                placeholder="Ver ahora"
              />
            </Field>
            <Field label="CTA Link" labelCls={labelCls}>
              <input
                type="text"
                className={inputCls}
                value={getStr(state.cta_link)}
                onChange={(e) => setField('cta_link', e.target.value)}
                placeholder="/store/..."
              />
            </Field>
          </div>
        </>
      )}

      {tipo === 'banner_producto' && (
        <>
          <Field label="Imagen URL *" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.imagen_url)}
              onChange={(e) => setField('imagen_url', e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Marca" labelCls={labelCls}>
              <input
                type="text"
                className={inputCls}
                value={getStr(state.marca)}
                onChange={(e) => setField('marca', e.target.value)}
              />
            </Field>
            <Field label="Título *" labelCls={labelCls}>
              <input
                type="text"
                className={inputCls}
                value={getStr(state.titulo)}
                onChange={(e) => setField('titulo', e.target.value)}
              />
            </Field>
          </div>
          <Field label="Descripción" labelCls={labelCls}>
            <textarea
              rows={2}
              className={inputCls}
              value={getStr(state.descripcion)}
              onChange={(e) => setField('descripcion', e.target.value)}
            />
          </Field>
          <Field label="Link destino" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.cta_link)}
              onChange={(e) => setField('cta_link', e.target.value)}
              placeholder="/store/..."
            />
          </Field>
        </>
      )}

      {tipo === 'carrusel_productos' && (
        <>
          <Field label="Título de sección *" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.titulo_seccion)}
              onChange={(e) => setField('titulo_seccion', e.target.value)}
            />
          </Field>
          <Field
            label="IDs de productos (uno por línea)"
            labelCls={labelCls}
            helper="Puedes copiar los IDs desde la tab Productos."
          >
            <textarea
              rows={6}
              className={inputCls}
              value={
                Array.isArray(state.product_ids)
                  ? (state.product_ids as string[]).join('\n')
                  : ''
              }
              onChange={(e) =>
                setField(
                  'product_ids',
                  e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Pega los IDs de productos separados por nueva línea"
            />
          </Field>
          {products.length > 0 && (
            <p className="text-[11px] text-[#999999]" style={latoBody}>
              Hay {products.length} productos disponibles.
            </p>
          )}
        </>
      )}

      {tipo === 'categorias_grid' && (
        <CategoriasGridForm state={state} setField={setField} categories={categories} />
      )}

      {tipo === 'blog_destacado' && (
        <>
          <Field label="Imagen URL *" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.imagen_url)}
              onChange={(e) => setField('imagen_url', e.target.value)}
            />
          </Field>
          <Field label="Título *" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.titulo)}
              onChange={(e) => setField('titulo', e.target.value)}
            />
          </Field>
          <Field label="Extracto" labelCls={labelCls}>
            <textarea
              rows={2}
              className={inputCls}
              value={getStr(state.extracto)}
              onChange={(e) => setField('extracto', e.target.value)}
            />
          </Field>
          <Field label="Link" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.cta_link)}
              onChange={(e) => setField('cta_link', e.target.value)}
            />
          </Field>
        </>
      )}

      {tipo === 'texto_libre' && (
        <>
          <Field label="Título" labelCls={labelCls}>
            <input
              type="text"
              className={inputCls}
              value={getStr(state.titulo)}
              onChange={(e) => setField('titulo', e.target.value)}
            />
          </Field>
          <Field label="Cuerpo *" labelCls={labelCls}>
            <textarea
              rows={4}
              className={inputCls}
              value={getStr(state.cuerpo)}
              onChange={(e) => setField('cuerpo', e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Color de fondo" labelCls={labelCls}>
              <input
                type="color"
                className="h-9 w-full border border-solid border-[#E4E4E4] bg-white"
                value={getStr(state.bg_color) || '#111111'}
                onChange={(e) => setField('bg_color', e.target.value)}
              />
            </Field>
            <Field label="Color de texto" labelCls={labelCls}>
              <input
                type="color"
                className="h-9 w-full border border-solid border-[#E4E4E4] bg-white"
                value={getStr(state.text_color) || '#FFFFFF'}
                onChange={(e) => setField('text_color', e.target.value)}
              />
            </Field>
          </div>
        </>
      )}

      {formError && (
        <p className="text-[12px] text-[#CC4B37]" style={latoBody}>
          {formError}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="bg-[#111111] px-4 py-2 text-[11px] tracking-[0.12em] text-white disabled:opacity-50"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          {saving ? 'Guardando…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="border border-solid border-[#EEEEEE] bg-white px-4 py-2 text-[11px] tracking-[0.12em] text-[#666666]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  helper,
  labelCls,
  children,
}: {
  label: string
  helper?: string
  labelCls: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={labelCls} style={jostHeading}>
        {label}
      </span>
      {children}
      {helper && (
        <span className="text-[11px] text-[#999999]" style={latoBody}>
          {helper}
        </span>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Categorías grid: lista dinámica de items
// ────────────────────────────────────────────────────────────────

type GridItem = { categoria_id: string; imagen_url: string; label: string }

function CategoriasGridForm({
  state,
  setField,
  categories,
}: {
  state: Record<string, unknown>
  setField: (key: string, value: unknown) => void
  categories: { id: string; nombre: string }[]
}) {
  const items: GridItem[] = Array.isArray(state.items)
    ? ((state.items as unknown[]).map((it) => {
        const o = (it ?? {}) as Record<string, unknown>
        return {
          categoria_id: getStr(o.categoria_id),
          imagen_url: getStr(o.imagen_url),
          label: getStr(o.label),
        }
      }) as GridItem[])
    : []

  const labelCls = 'text-[11px] tracking-[0.1em] text-[#666666]'
  const inputCls =
    'w-full border border-solid border-[#E4E4E4] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]'

  function updateItem(i: number, patch: Partial<GridItem>) {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it))
    setField('items', next)
  }

  function addItem() {
    setField('items', [...items, { categoria_id: '', imagen_url: '', label: '' }])
  }

  function removeItem(i: number) {
    setField(
      'items',
      items.filter((_, idx) => idx !== i)
    )
  }

  return (
    <>
      <Field label="Título de sección" labelCls={labelCls}>
        <input
          type="text"
          className={inputCls}
          value={getStr(state.titulo_seccion)}
          onChange={(e) => setField('titulo_seccion', e.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className={labelCls} style={jostHeading}>
          Items
        </span>
        {items.length === 0 && (
          <p className="text-[11px] text-[#999999]" style={latoBody}>
            Aún no hay items. Agrega al menos uno.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 border border-solid border-[#EEEEEE] bg-white p-3 sm:flex-row sm:items-start"
            >
              <div className="flex flex-1 flex-col gap-2">
                <input
                  type="text"
                  className={inputCls}
                  value={it.label}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  placeholder="Label (ej. Réplicas)"
                />
                <input
                  type="text"
                  className={inputCls}
                  value={it.imagen_url}
                  onChange={(e) => updateItem(i, { imagen_url: e.target.value })}
                  placeholder="Imagen URL"
                />
                <select
                  className={inputCls}
                  value={it.categoria_id}
                  onChange={(e) => updateItem(i, { categoria_id: e.target.value })}
                >
                  <option value="">— Categoría —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="flex h-9 w-9 shrink-0 items-center justify-center border border-solid border-[#EEEEEE] bg-white text-[14px] text-[#CC4B37]"
                aria-label="Eliminar item"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addItem}
          className="self-start border border-solid border-[#EEEEEE] bg-white px-3 py-1.5 text-[10px] tracking-[0.12em] text-[#111111]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          + Agregar item
        </button>
      </div>
    </>
  )
}
