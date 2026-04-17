'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { uploadFile } from '@/lib/apiFetch'
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

// ────────────────────────────────────────────────────────────────
// ImageUploadInput — sube un archivo a /upload y devuelve la URL
// ────────────────────────────────────────────────────────────────

function ImageUploadInput({
  value,
  onChange,
  label = 'Imagen',
}: {
  value: string
  onChange: (url: string) => void
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadError('Solo JPG, PNG o WebP')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Máximo 8 MB')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const url = await uploadFile(file)
      onChange(url)
    } catch {
      setUploadError('Error al subir. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p
        className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#666666]"
        style={jostHeading}
      >
        {label}
      </p>
      {value && (
        <div
          className="relative w-full overflow-hidden border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
          style={{ aspectRatio: '16/6' }}
        >
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-black/60 text-xs text-white hover:bg-black/80"
            aria-label="Quitar imagen"
          >
            ×
          </button>
        </div>
      )}
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-3 text-[11px] transition-colors ${
          uploading
            ? 'border-[#CCCCCC] bg-[#F9F9F9] text-[#AAAAAA]'
            : 'border-[#CCCCCC] bg-[#F4F4F4] text-[#666666] hover:border-[#CC4B37] hover:text-[#CC4B37]'
        }`}
        style={latoBody}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
        {uploading ? (
          <>
            <svg
              width="14"
              height="14"
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
            Subiendo…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {value ? 'Cambiar imagen' : 'Subir imagen'}
          </>
        )}
      </label>
      {uploadError && (
        <p className="text-[11px] text-[#CC4B37]" style={latoBody}>
          {uploadError}
        </p>
      )}
    </div>
  )
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

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

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

  async function handleDrop(targetId: string) {
    const currentDragged = draggedId
    setDraggedId(null)
    setDragOverId(null)
    if (!currentDragged || currentDragged === targetId) return

    const sortedNow = [...blocks].sort((a, b) => a.orden - b.orden)
    const fromIdx = sortedNow.findIndex((b) => b.id === currentDragged)
    const toIdx = sortedNow.findIndex((b) => b.id === targetId)
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return

    // Reorder optimistic local
    const reordered = [...sortedNow]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    const updated = reordered.map((b, i) => ({ ...b, orden: i + 1 }))
    setBlocks(updated)

    // Persist como swaps adyacentes usando la acción existente
    setError(null)
    const direction: 'up' | 'down' = fromIdx < toIdx ? 'down' : 'up'
    const steps = Math.abs(toIdx - fromIdx)

    let working = sortedNow.map((b) => ({ id: b.id, orden: b.orden }))

    for (let i = 0; i < steps; i++) {
      const res = await reorderHomepageBlock(currentDragged, direction, working)
      if ('error' in res) {
        setError(res.error)
        setBlocks(initialBlocks)
        refresh()
        return
      }
      // Simular swap sobre working para la próxima iteración
      const srt = [...working].sort((a, b) => a.orden - b.orden)
      const currIdx = srt.findIndex((x) => x.id === currentDragged)
      const swapIdx = direction === 'up' ? currIdx - 1 : currIdx + 1
      if (swapIdx < 0 || swapIdx >= srt.length) break
      const a = srt[currIdx]
      const b = srt[swapIdx]
      working = working.map((x) => {
        if (x.id === a.id) return { ...x, orden: b.orden }
        if (x.id === b.id) return { ...x, orden: a.orden }
        return x
      })
    }

    refresh()
  }

  const sorted = [...blocks].sort((a, b) => a.orden - b.orden)

  return (
    <div className="flex flex-col gap-0" style={latoBody}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2
            className="text-[14px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            Homepage
          </h2>
          <p className="mt-0.5 text-[11px] text-[#999999]" style={latoBody}>
            Arrastra para reordenar · Los cambios se guardan al soltar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-1.5 border border-[#EEEEEE] bg-white px-3 py-2 text-[10px] text-[#666666] hover:border-[#111111] lg:hidden"
            style={{ ...jostHeading, borderRadius: 2 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect
                x="5"
                y="2"
                width="14"
                height="20"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 18h.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Preview
          </button>
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
      </div>

      {error && (
        <p className="mb-3 text-[12px] text-[#CC4B37]" style={latoBody}>
          {error}
        </p>
      )}

      {/* Dos columnas: lista + preview */}
      <div className="flex gap-6">
        {/* ── COLUMNA IZQUIERDA: lista + form ── */}
        <div className="min-w-0 flex-1">
          {creando && (
            <div className="mb-4 border border-solid border-[#EEEEEE] bg-[#FAFAFA] p-4">
              <p
                className="mb-3 text-[11px] tracking-[0.12em] text-[#111111]"
                style={jostHeading}
              >
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
                      <span
                        className="text-[11px] text-[#666666]"
                        style={latoBody}
                      >
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
                Aún no hay bloques. Haz clic en <strong>+ Nuevo bloque</strong>{' '}
                para empezar.
              </p>
            </div>
          ) : (
            <ul
              className="flex flex-col gap-1.5"
              onDragOver={(e) => e.preventDefault()}
            >
              {sorted.map((block, i) => (
                <DraggableBlockRow
                  key={block.id}
                  block={block}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === sorted.length - 1}
                  isEditing={editingId === block.id}
                  saving={saving}
                  products={products}
                  categories={categories}
                  draggedId={draggedId}
                  dragOverId={dragOverId}
                  onDragStart={() => setDraggedId(block.id)}
                  onDragOver={() => setDragOverId(block.id)}
                  onDrop={() => handleDrop(block.id)}
                  onDragEnd={() => {
                    setDraggedId(null)
                    setDragOverId(null)
                  }}
                  onToggle={onToggle}
                  onReorder={onReorder}
                  onDelete={onDelete}
                  onEdit={(id) => setEditingId(editingId === id ? null : id)}
                  onUpdate={onUpdate}
                />
              ))}
            </ul>
          )}
        </div>

        {/* ── COLUMNA DERECHA: preview — solo desktop ── */}
        <div className="hidden w-[320px] shrink-0 lg:block">
          <div className="sticky top-[88px]">
            <p
              className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
              style={jostHeading}
            >
              Preview en vivo
            </p>
            <StorePreview blocks={sorted} />
          </div>
        </div>
      </div>

      {/* Modal preview mobile */}
      {previewOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setPreviewOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[340px] overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-3">
              <p
                className="text-[11px] font-extrabold uppercase tracking-[0.12em]"
                style={jostHeading}
              >
                Preview
              </p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-[#666666] hover:text-[#111111]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <StorePreview blocks={sorted} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// DraggableBlockRow — fila de bloque con drag & drop nativo HTML5
// ────────────────────────────────────────────────────────────────

type DraggableBlockRowProps = {
  block: HomepageBlock
  index: number
  isFirst: boolean
  isLast: boolean
  isEditing: boolean
  saving: boolean
  products: { id: string; nombre: string }[]
  categories: { id: string; nombre: string }[]
  draggedId: string | null
  dragOverId: string | null
  onDragStart: () => void
  onDragOver: () => void
  onDrop: () => void
  onDragEnd: () => void
  onToggle: (id: string, activo: boolean) => void
  onReorder: (id: string, dir: 'up' | 'down') => void
  onDelete: (id: string) => void
  onEdit: (id: string) => void
  onUpdate: (id: string, config: Record<string, unknown>) => void
}

function DraggableBlockRow({
  block,
  isFirst,
  isLast,
  isEditing,
  saving,
  products,
  categories,
  draggedId,
  dragOverId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggle,
  onReorder,
  onDelete,
  onEdit,
  onUpdate,
}: DraggableBlockRowProps) {
  const meta = TIPO_META[block.tipo]
  const isDragging = draggedId === block.id
  const isDropTarget = dragOverId === block.id && draggedId !== null && draggedId !== block.id

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        try {
          e.dataTransfer.setData('text/plain', block.id)
        } catch {
          // noop — algunos navegadores lo bloquean
        }
        onDragStart()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      onDragEnd={onDragEnd}
      className={`border border-solid transition-all ${
        block.activo ? 'border-[#EEEEEE] bg-white' : 'border-[#F4F4F4] bg-[#FAFAFA]'
      } ${isDragging ? 'opacity-40' : ''} ${
        isDropTarget ? 'border-t-2 border-t-[#1D4ED8]' : ''
      }`}
    >
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
        <span
          className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-[#CCCCCC] hover:text-[#666666] active:cursor-grabbing"
          aria-label="Arrastrar para reordenar"
          title="Arrastrar para reordenar"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
            <circle cx="2" cy="3" r="1.2" fill="currentColor" />
            <circle cx="8" cy="3" r="1.2" fill="currentColor" />
            <circle cx="2" cy="8" r="1.2" fill="currentColor" />
            <circle cx="8" cy="8" r="1.2" fill="currentColor" />
            <circle cx="2" cy="13" r="1.2" fill="currentColor" />
            <circle cx="8" cy="13" r="1.2" fill="currentColor" />
          </svg>
        </span>
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
          onClick={() => onEdit(block.id)}
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
            onCancel={() => onEdit(block.id)}
            onSubmit={(cfg) => onUpdate(block.id, cfg)}
            submitLabel="Guardar cambios"
          />
        </div>
      )}
    </li>
  )
}

// ────────────────────────────────────────────────────────────────
// StorePreview — mini preview en vivo de /store
// ────────────────────────────────────────────────────────────────

function StorePreview({ blocks }: { blocks: HomepageBlock[] }) {
  const activeBlocks = blocks.filter((b) => b.activo)

  return (
    <div
      className="overflow-hidden border border-[#EEEEEE] bg-[#F7F7F7]"
      style={{ borderRadius: 8 }}
    >
      {/* Mini browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-[#EEEEEE] bg-white px-3 py-2">
        <div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <div className="h-2 w-2 rounded-full bg-[#28C840]" />
        <div
          className="ml-2 flex-1 rounded bg-[#F4F4F4] px-2 py-0.5 text-[9px] text-[#999999]"
          style={latoBody}
        >
          airnation.online/store
        </div>
      </div>

      {/* Mini header de la store */}
      <div className="border-b border-[#EEEEEE] bg-white px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="flex h-4 w-4 items-center justify-center bg-[#CC4B37]">
            <svg width="7" height="7" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </div>
          <span
            className="text-[9px] font-black uppercase tracking-[0.15em] text-[#111111]"
            style={jostHeading}
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </div>
        <div className="mt-1.5 h-4 rounded bg-[#F4F4F4]" />
      </div>

      {/* Bloques */}
      {activeBlocks.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-[10px] text-[#CCCCCC]" style={latoBody}>
            Sin bloques activos
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {activeBlocks.map((block) => (
            <PreviewBlock key={block.id} block={block} />
          ))}
          {/* Mini grid placeholder de productos */}
          <div className="bg-[#F7F7F7] p-2">
            <div className="grid grid-cols-2 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-[#EEEEEE] bg-white">
                  <div className="bg-[#F4F4F4]" style={{ aspectRatio: '1/1' }} />
                  <div className="p-1">
                    <div className="mb-1 h-2 w-8 rounded bg-[#EEEEEE]" />
                    <div className="h-1.5 w-full rounded bg-[#F4F4F4]" />
                    <div className="mt-1 h-2.5 w-10 rounded bg-[#EEEEEE]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// PreviewBlock — mini versión de cada tipo de bloque
// ────────────────────────────────────────────────────────────────

function PreviewBlock({ block }: { block: HomepageBlock }) {
  const cfg = block.config as Record<string, unknown>
  const titulo = typeof cfg.titulo === 'string' ? cfg.titulo : ''
  const titulo_seccion =
    typeof cfg.titulo_seccion === 'string' ? cfg.titulo_seccion : ''
  const imagen_url = typeof cfg.imagen_url === 'string' ? cfg.imagen_url : ''
  const marca = typeof cfg.marca === 'string' ? cfg.marca : ''

  if (block.tipo === 'hero') {
    return (
      <div className="relative overflow-hidden bg-[#222222]" style={{ minHeight: 80 }}>
        {imagen_url && (
          <img
            src={imagen_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div
          className="relative z-10 flex flex-col justify-end p-3"
          style={{ minHeight: 80 }}
        >
          <p
            className="text-[9px] font-extrabold uppercase leading-tight text-white"
            style={jostHeading}
          >
            {titulo || 'Hero — sin título'}
          </p>
          <div className="mt-1 h-3 w-10 bg-[#CC4B37]" />
        </div>
      </div>
    )
  }

  if (block.tipo === 'banner_producto') {
    return (
      <div className="relative overflow-hidden bg-[#1A1A1A]" style={{ minHeight: 56 }}>
        {imagen_url && (
          <img
            src={imagen_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        <div
          className="relative z-10 flex flex-col justify-center p-2.5"
          style={{ minHeight: 56 }}
        >
          {marca && (
            <div
              className="mb-0.5 inline-block w-fit bg-[#CC4B37] px-1 py-0.5 text-[7px] font-extrabold uppercase text-white"
              style={jostHeading}
            >
              {marca}
            </div>
          )}
          <p
            className="text-[8px] font-extrabold uppercase text-white"
            style={jostHeading}
          >
            {titulo || 'Banner — sin título'}
          </p>
        </div>
      </div>
    )
  }

  if (block.tipo === 'carrusel_productos') {
    const ids = Array.isArray(cfg.product_ids) ? (cfg.product_ids as unknown[]) : []
    return (
      <div className="bg-white px-2 py-2">
        <p
          className="mb-1.5 text-[8px] font-extrabold uppercase text-[#999999]"
          style={jostHeading}
        >
          {titulo_seccion || 'Carrusel'}
        </p>
        <div className="flex gap-1 overflow-hidden">
          {ids.length > 0 ? (
            ids.slice(0, 4).map((_, i) => (
              <div key={i} className="w-10 shrink-0 border border-[#EEEEEE]">
                <div className="bg-[#F4F4F4]" style={{ aspectRatio: '1/1' }} />
                <div className="p-0.5">
                  <div className="h-1.5 w-full rounded bg-[#EEEEEE]" />
                </div>
              </div>
            ))
          ) : (
            <p className="text-[8px] text-[#CCCCCC]" style={latoBody}>
              Sin productos
            </p>
          )}
        </div>
      </div>
    )
  }

  if (block.tipo === 'categorias_grid') {
    const items = Array.isArray(cfg.items) ? (cfg.items as unknown[]) : []
    return (
      <div className="bg-white px-2 py-2">
        {titulo_seccion && (
          <p
            className="mb-1.5 text-[8px] font-extrabold uppercase text-[#999999]"
            style={jostHeading}
          >
            {titulo_seccion}
          </p>
        )}
        <div className="grid grid-cols-3 gap-1">
          {items.length > 0
            ? items.slice(0, 6).map((_, i) => (
                <div
                  key={i}
                  className="border border-[#EEEEEE] bg-[#F4F4F4]"
                  style={{ aspectRatio: '1/1' }}
                />
              ))
            : [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-[#EEEEEE] bg-[#F4F4F4]"
                  style={{ aspectRatio: '1/1' }}
                />
              ))}
        </div>
      </div>
    )
  }

  if (block.tipo === 'blog_destacado') {
    return (
      <div className="relative overflow-hidden bg-[#111111]" style={{ minHeight: 48 }}>
        {imagen_url && (
          <img
            src={imagen_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div
          className="relative z-10 flex flex-col justify-center p-2.5"
          style={{ minHeight: 48 }}
        >
          <div
            className="mb-0.5 inline-block w-fit border border-white/30 px-1 py-0.5 text-[6px] uppercase text-white/60"
            style={jostHeading}
          >
            Blog
          </div>
          <p
            className="text-[8px] font-extrabold uppercase leading-tight text-white"
            style={jostHeading}
          >
            {titulo || 'Blog — sin título'}
          </p>
        </div>
      </div>
    )
  }

  if (block.tipo === 'texto_libre') {
    const bg = typeof cfg.bg_color === 'string' ? cfg.bg_color : '#111111'
    const color = typeof cfg.text_color === 'string' ? cfg.text_color : '#FFFFFF'
    const cuerpo = typeof cfg.cuerpo === 'string' ? cfg.cuerpo : ''
    return (
      <div className="px-3 py-2.5" style={{ backgroundColor: bg }}>
        {titulo && (
          <p
            className="text-[8px] font-extrabold uppercase"
            style={{ ...jostHeading, color }}
          >
            {titulo}
          </p>
        )}
        <p
          className="text-[7px] leading-relaxed opacity-70"
          style={{ ...latoBody, color }}
        >
          {cuerpo.slice(0, 60)}
          {cuerpo.length > 60 ? '…' : ''}
        </p>
      </div>
    )
  }

  return null
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
          <ImageUploadInput
            label="Imagen"
            value={getStr(state.imagen_url)}
            onChange={(url) => setField('imagen_url', url)}
          />
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
          <ImageUploadInput
            label="Imagen *"
            value={getStr(state.imagen_url)}
            onChange={(url) => setField('imagen_url', url)}
          />
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
          {(() => {
            const selectedIds: string[] = Array.isArray(state.product_ids)
              ? ((state.product_ids as unknown[]).filter(
                  (v) => typeof v === 'string'
                ) as string[])
              : []
            return (
              <div className="flex flex-col gap-1">
                <p
                  className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#666666]"
                  style={jostHeading}
                >
                  Productos ({selectedIds.length} seleccionados)
                </p>
                {products.length === 0 ? (
                  <p className="text-[12px] text-[#999999]" style={latoBody}>
                    No hay productos disponibles.
                  </p>
                ) : (
                  <div className="max-h-[240px] overflow-y-auto border border-solid border-[#EEEEEE]">
                    {products.map((p) => {
                      const checked = selectedIds.includes(p.id)
                      return (
                        <label
                          key={p.id}
                          className={`flex cursor-pointer items-center gap-2.5 border-b border-solid border-[#F4F4F4] px-3 py-2 hover:bg-[#F9F9F9] ${
                            checked ? 'bg-[#FFF5F4]' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? selectedIds.filter((id) => id !== p.id)
                                : [...selectedIds, p.id]
                              setField('product_ids', next)
                            }}
                            className="h-3.5 w-3.5 accent-[#CC4B37]"
                          />
                          <span
                            className="text-[12px] text-[#333333]"
                            style={latoBody}
                          >
                            {p.nombre || '(sin nombre)'}
                          </span>
                          {checked && (
                            <span
                              className="ml-auto text-[10px] font-bold text-[#CC4B37]"
                              style={jostHeading}
                            >
                              ✓
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                )}
                <p className="text-[10px] text-[#AAAAAA]" style={latoBody}>
                  El orden en el carrusel sigue el orden de selección.
                </p>
              </div>
            )
          })()}
        </>
      )}

      {tipo === 'categorias_grid' && (
        <CategoriasGridForm state={state} setField={setField} categories={categories} />
      )}

      {tipo === 'blog_destacado' && (
        <>
          <ImageUploadInput
            label="Imagen *"
            value={getStr(state.imagen_url)}
            onChange={(url) => setField('imagen_url', url)}
          />
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
                <ImageUploadInput
                  label="Imagen"
                  value={it.imagen_url}
                  onChange={(url) => updateItem(i, { imagen_url: url })}
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
