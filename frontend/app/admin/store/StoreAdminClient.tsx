'use client'

import { uploadFile } from '@/lib/apiFetch'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
  createBrand,
  createCategory,
  createProduct,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  toggleProductActivo,
  toggleProductDestacado,
} from './actions'
import type { StoreAdminBrandRow, StoreAdminCategoryRow, StoreAdminProductRow } from './data-types'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

function slugFromNombre(n: string): string {
  return n.trim().toLowerCase().replace(/\s+/g, '-')
}

function rowStr(row: StoreAdminProductRow, key: string): string {
  const v = row[key]
  return v != null ? String(v) : ''
}

function rowNum(row: StoreAdminProductRow, key: string, fallback = 0): number {
  const v = row[key]
  if (v == null) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function rowBool(row: StoreAdminProductRow, key: string): boolean {
  return Boolean(row[key])
}

type TabId = 'productos' | 'categorias' | 'marcas'

type Props = {
  products: StoreAdminProductRow[]
  categories: StoreAdminCategoryRow[]
  brands: StoreAdminBrandRow[]
  initialTab?: TabId
}

export function StoreAdminClient({ products, categories, brands, initialTab }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>(initialTab ?? 'productos')
  const [productModalOpen, setProductModalOpen] = useState(false)

  const [productFormError, setProductFormError] = useState<string | null>(null)
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null)
  const [brandFormError, setBrandFormError] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const [productNombre, setProductNombre] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [productSlugManual, setProductSlugManual] = useState(false)
  const [stockVisible, setStockVisible] = useState(false)
  const [productDestacado, setProductDestacado] = useState(false)
  const [productFotos, setProductFotos] = useState<string[]>([])
  const [fotosUploading, setFotosUploading] = useState(false)
  const [catNivel1, setCatNivel1] = useState('')
  const [catNivel2, setCatNivel2] = useState('')
  const [catNivel3, setCatNivel3] = useState('')

  const [catNombre, setCatNombre] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catSlugManual, setCatSlugManual] = useState(false)
  const [catLevel1, setCatLevel1] = useState('')
  const [catLevel2, setCatLevel2] = useState('')
  const [catLevel3, setCatLevel3] = useState('')
  const [catLevel4, setCatLevel4] = useState('')

  const [brandNombre, setBrandNombre] = useState('')
  const [brandSlug, setBrandSlug] = useState('')
  const [brandSlugManual, setBrandSlugManual] = useState(false)

  const cats1 = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories]
  )
  const cats2 = useMemo(
    () => categories.filter((c) => c.parent_id === catNivel1),
    [categories, catNivel1]
  )
  const cats3 = useMemo(
    () => categories.filter((c) => c.parent_id === catNivel2),
    [categories, catNivel2]
  )

  const selectedCategoriaId = catNivel3 || catNivel2 || catNivel1 || ''

  const parentCats1 = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories]
  )
  const parentCats2 = useMemo(
    () => (catLevel1 ? categories.filter((c) => c.parent_id === catLevel1) : []),
    [categories, catLevel1]
  )
  const parentCats3 = useMemo(
    () => (catLevel2 ? categories.filter((c) => c.parent_id === catLevel2) : []),
    [categories, catLevel2]
  )
  const parentCats4 = useMemo(
    () => (catLevel3 ? categories.filter((c) => c.parent_id === catLevel3) : []),
    [categories, catLevel3]
  )

  const selectedParentId = catLevel4 || catLevel3 || catLevel2 || catLevel1 || ''

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  const stockLabel = (stock: number, stock_visible: boolean) => {
    if (stock_visible) return String(stock)
    return '10+'
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'productos', label: 'PRODUCTOS' },
    { id: 'categorias', label: 'CATEGORÍAS' },
    { id: 'marcas', label: 'MARCAS' },
  ]

  async function handleProductFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (!files.length || productFotos.length >= 6) return
    const allowed = files.slice(0, 6 - productFotos.length)
    setFotosUploading(true)
    try {
      const urls: string[] = []
      for (const file of allowed) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue
        const url = await uploadFile(file)
        urls.push(url)
      }
      setProductFotos((prev) => [...prev, ...urls])
    } catch {
      setProductFormError('Error al subir las fotos.')
    } finally {
      setFotosUploading(false)
    }
  }

  async function onCreateProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProductFormError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('stock_visible', stockVisible ? 'true' : 'false')
    fd.set('destacado', productDestacado ? 'true' : 'false')
    fd.set('fotos_urls', JSON.stringify(productFotos))
    const res = await createProduct(fd)
    if ('error' in res) {
      setProductFormError(res.error)
      return
    }
    form.reset()
    setProductNombre('')
    setProductSlug('')
    setProductSlugManual(false)
    setStockVisible(false)
    setProductDestacado(false)
    setProductModalOpen(false)
    setCatNivel1('')
    setCatNivel2('')
    setCatNivel3('')
    setProductFotos([])
    setFotosUploading(false)
    refresh()
  }

  async function onCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCategoryFormError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const res = await createCategory(fd)
    if ('error' in res) {
      setCategoryFormError(res.error)
      return
    }
    form.reset()
    setCatNombre('')
    setCatSlug('')
    setCatSlugManual(false)
    setCatLevel1('')
    setCatLevel2('')
    setCatLevel3('')
    setCatLevel4('')
    refresh()
  }

  async function onCreateBrand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBrandFormError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const res = await createBrand(fd)
    if ('error' in res) {
      setBrandFormError(res.error)
      return
    }
    form.reset()
    setBrandNombre('')
    setBrandSlug('')
    setBrandSlugManual(false)
    refresh()
  }

  async function onToggleDestacado(id: string, current: boolean) {
    setListError(null)
    const res = await toggleProductDestacado(id, !current)
    if ('error' in res) {
      setListError(res.error)
      return
    }
    refresh()
  }

  async function onToggleActivo(id: string, current: boolean) {
    setListError(null)
    const res = await toggleProductActivo(id, !current)
    if ('error' in res) {
      setListError(res.error)
      return
    }
    refresh()
  }

  async function onDeleteProduct(id: string) {
    if (!confirm('¿Eliminar este producto?')) return
    setListError(null)
    const res = await deleteProduct(id)
    if ('error' in res) {
      setListError(res.error)
      return
    }
    refresh()
  }

  async function onDeleteCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría?')) return
    setCategoryFormError(null)
    const res = await deleteCategory(id)
    if ('error' in res) {
      setCategoryFormError(res.error)
      return
    }
    refresh()
  }

  async function onDeleteBrand(id: string) {
    if (!confirm('¿Eliminar esta marca?')) return
    setBrandFormError(null)
    const res = await deleteBrand(id)
    if ('error' in res) {
      setBrandFormError(res.error)
      return
    }
    refresh()
  }

  return (
    <div className="flex flex-col gap-6" style={latoBody}>
      <div className="flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setListError(null)
              }}
              className={`px-3 py-2 text-[11px] tracking-[0.12em] transition-colors ${
                active
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 2 }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {listError ? (
        <p className="text-sm text-[#CC4B37]" style={latoBody}>
          {listError}
        </p>
      ) : null}

      {tab === 'productos' ? (
        <>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setProductFormError(null)
                setProductModalOpen(true)
              }}
              className="inline-flex items-center justify-center bg-[#111111] px-4 py-2.5 text-[10px] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
              style={{ ...jostHeading, borderRadius: 2 }}
            >
              + NUEVO PRODUCTO
            </button>
          </div>

          {products.length === 0 ? (
            <p className="py-12 text-center text-[#666666]">No hay productos</p>
          ) : (
            <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
              <table className="w-full border-collapse text-left text-sm text-[#111111]">
                <thead>
                  <tr className="bg-[#F4F4F4]">
                    {(
                      [
                        'ID',
                        'NOMBRE',
                        'PRECIO',
                        'STOCK',
                        'CONDICIÓN',
                        'DESTACADO',
                        'ACTIVO',
                        'ACCIONES',
                      ] as const
                    ).map((col) => (
                      <th
                        key={col}
                        className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px] text-[#111111]"
                        style={jostHeading}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => {
                    const id = rowStr(p, 'id')
                    const nombre = rowStr(p, 'nombre')
                    const precio = rowNum(p, 'precio')
                    const stock = rowNum(p, 'stock')
                    const stock_visible = rowBool(p, 'stock_visible')
                    const condRaw = rowStr(p, 'condicion').toLowerCase()
                    const condicion = condRaw === 'outlet' ? 'outlet' : 'nuevo'
                    const destacado = rowBool(p, 'destacado')
                    const activo = rowBool(p, 'activo')
                    return (
                      <tr
                        key={id || i}
                        className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
                      >
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                          {id ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                  navigator.clipboard.writeText(id).catch(() => {})
                                }
                              }}
                              title="Copiar ID completo"
                              className="flex items-center gap-1 font-mono text-[10px] text-[#999999] transition-colors hover:text-[#CC4B37]"
                              style={{ borderRadius: 2 }}
                            >
                              {id.slice(0, 8)}…
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="1"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                                <path
                                  d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          ) : (
                            <span className="font-mono text-[10px] text-[#CCCCCC]">—</span>
                          )}
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2 font-semibold">
                          {nombre || '—'}
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2 tabular-nums">
                          ${precio.toLocaleString('es-MX')}
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                          {stockLabel(stock, stock_visible)}
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                          {condicion === 'outlet' ? (
                            <span
                              className="inline-block text-[10px] font-semibold tracking-wide text-[#FFFFFF]"
                              style={{
                                padding: '4px 8px',
                                borderRadius: 2,
                                backgroundColor: '#CC4B37',
                                ...jostHeading,
                              }}
                            >
                              OUTLET
                            </span>
                          ) : (
                            <span
                              className="inline-block text-[10px] font-semibold tracking-wide text-[#666666]"
                              style={{
                                padding: '4px 8px',
                                borderRadius: 2,
                                backgroundColor: '#EEEEEE',
                                ...jostHeading,
                              }}
                            >
                              NUEVO
                            </span>
                          )}
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onToggleDestacado(id, destacado)}
                            className={`border px-2 py-1 text-[10px] uppercase transition-colors ${
                              destacado
                                ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                                : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:border-[#111111] hover:text-[#111111]'
                            }`}
                            style={{ ...jostHeading, borderRadius: 2 }}
                          >
                            {destacado ? 'Destacado' : 'Normal'}
                          </button>
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onToggleActivo(id, activo)}
                            className={`border px-2 py-1 text-[10px] uppercase transition-colors ${
                              activo
                                ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                                : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:border-[#111111] hover:text-[#111111]'
                            }`}
                            style={{ ...jostHeading, borderRadius: 2 }}
                          >
                            {activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(id)}
                            className="border border-[#CC4B37] bg-[#CC4B37] px-3 py-1.5 text-[10px] uppercase text-[#FFFFFF] transition-opacity hover:opacity-90"
                            style={{ ...jostHeading, borderRadius: 2 }}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {productModalOpen ? (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111]/50 p-4"
              role="presentation"
              onClick={() => setProductModalOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-5 shadow-lg"
                style={{ borderRadius: 2 }}
                onClick={(ev) => ev.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2
                    className="text-lg tracking-[0.1em] text-[#111111]"
                    style={jostHeading}
                  >
                    NUEVO PRODUCTO
                  </h2>
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="text-[11px] text-[#666666] underline"
                    style={jostHeading}
                  >
                    Cerrar
                  </button>
                </div>
                {productFormError ? (
                  <p className="mb-3 text-sm text-[#CC4B37]">{productFormError}</p>
                ) : null}
                <form onSubmit={onCreateProduct} className="flex flex-col gap-3">
                  <label className="block text-[11px] text-[#666666]">
                    Nombre
                    <input
                      name="nombre"
                      required
                      value={productNombre}
                      onChange={(e) => {
                        const v = e.target.value
                        setProductNombre(v)
                        if (!productSlugManual) setProductSlug(slugFromNombre(v))
                      }}
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Slug
                    <input
                      name="slug"
                      required
                      value={productSlug}
                      onChange={(e) => {
                        setProductSlugManual(true)
                        setProductSlug(e.target.value)
                      }}
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Precio
                    <input
                      name="precio"
                      type="number"
                      min={0.01}
                      step="0.01"
                      required
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Precio costo (opcional)
                    <input
                      name="precio_costo"
                      type="number"
                      min={0}
                      step="0.01"
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Stock
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={0}
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#111111]">
                    <input
                      type="checkbox"
                      checked={stockVisible}
                      onChange={(e) => setStockVisible(e.target.checked)}
                    />
                    Stock visible (muestra cantidad exacta)
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Condición
                    <select
                      name="condicion"
                      defaultValue="nuevo"
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    >
                      <option value="nuevo">Nuevo</option>
                      <option value="outlet">Outlet</option>
                    </select>
                  </label>
                  <input type="hidden" name="categoria_id" value={selectedCategoriaId} />

                  <label className="block text-[11px] text-[#666666]">
                    Categoría
                    <select
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                      value={catNivel1}
                      onChange={(e) => {
                        setCatNivel1(e.target.value)
                        setCatNivel2('')
                        setCatNivel3('')
                      }}
                    >
                      <option value="">—</option>
                      {cats1.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  {cats2.length > 0 && (
                    <label className="block text-[11px] text-[#666666]">
                      Subcategoría
                      <select
                        className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                        style={{ borderRadius: 2 }}
                        value={catNivel2}
                        onChange={(e) => {
                          setCatNivel2(e.target.value)
                          setCatNivel3('')
                        }}
                      >
                        <option value="">—</option>
                        {cats2.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {cats3.length > 0 && (
                    <label className="block text-[11px] text-[#666666]">
                      Sub-subcategoría
                      <select
                        className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                        style={{ borderRadius: 2 }}
                        value={catNivel3}
                        onChange={(e) => setCatNivel3(e.target.value)}
                      >
                        <option value="">—</option>
                        {cats3.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="block text-[11px] text-[#666666]">
                    Marca
                    <select
                      name="brand_id"
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                      defaultValue=""
                    >
                      <option value="">—</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#111111]">
                    <input
                      type="checkbox"
                      checked={productDestacado}
                      onChange={(e) => setProductDestacado(e.target.checked)}
                    />
                    Destacado
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Días de manejo
                    <input
                      name="dias_manejo"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={3}
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Deporte
                    <select
                      name="deporte"
                      defaultValue="general"
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    >
                      <option value="airsoft">Airsoft</option>
                      <option value="gotcha">Gotcha</option>
                      <option value="gelsoft">Gelsoft</option>
                      <option value="general">General</option>
                    </select>
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Descripción (opcional)
                    <textarea
                      name="descripcion"
                      rows={2}
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <label className="block text-[11px] text-[#666666]">
                    Qué incluye (opcional)
                    <textarea
                      name="que_incluye"
                      rows={2}
                      className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    />
                  </label>
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] text-[#666666]" style={jostHeading}>
                      FOTOS{' '}
                      <span className="font-normal normal-case tracking-normal text-[#AAAAAA]">
                        (máx 6)
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {productFotos.map((url, i) => (
                        <div key={i} className="relative" style={{ aspectRatio: '1/1' }}>
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full border border-[#EEEEEE] object-cover"
                          />
                          {i === 0 && (
                            <span
                              className="absolute bottom-1 left-1 bg-[#CC4B37] px-1 py-0.5 text-[8px] font-extrabold uppercase text-white"
                              style={jostHeading}
                            >
                              Portada
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setProductFotos((prev) => prev.filter((_, j) => j !== i))
                            }
                            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-black/60 text-xs text-white"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {productFotos.length < 6 && (
                        <label
                          className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#CCCCCC] bg-[#F4F4F4] transition-colors hover:border-[#CC4B37]"
                          style={{ aspectRatio: '1/1' }}
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleProductFoto}
                            disabled={fotosUploading}
                          />
                          {fotosUploading ? (
                            <span className="text-[10px] text-[#999999]" style={latoBody}>
                              Subiendo…
                            </span>
                          ) : (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M12 5v14M5 12h14"
                                stroke="#CCCCCC"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </label>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-2 bg-[#111111] px-4 py-2.5 text-[10px] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                    style={{ ...jostHeading, borderRadius: 2 }}
                  >
                    CREAR PRODUCTO
                  </button>
                </form>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === 'categorias' ? (
        <div className="flex flex-col gap-4">
          <div
            className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4"
            style={{ borderRadius: 2 }}
          >
            <h3 className="mb-3 text-[11px] tracking-[0.12em] text-[#111111]" style={jostHeading}>
              NUEVA CATEGORÍA
            </h3>
            {categoryFormError ? (
              <p className="mb-2 text-sm text-[#CC4B37]">{categoryFormError}</p>
            ) : null}
            <form onSubmit={onCreateCategory} className="flex flex-col gap-3">
              <input type="hidden" name="parent_id" value={selectedParentId} />

              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
                <label
                  className="block min-w-[160px] flex-1 text-[11px] text-[#666666]"
                  style={latoBody}
                >
                  Nombre
                  <input
                    name="nombre"
                    required
                    value={catNombre}
                    onChange={(e) => {
                      const v = e.target.value
                      setCatNombre(v)
                      if (!catSlugManual) {
                        const base = slugFromNombre(v)
                        const parent = categories.find((c) => c.id === selectedParentId)
                        const prefix = parent ? `${parent.slug}-` : ''
                        setCatSlug(prefix + base)
                      }
                    }}
                    className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px]"
                    style={{ borderRadius: 2 }}
                  />
                </label>
                <label
                  className="block min-w-[160px] flex-1 text-[11px] text-[#666666]"
                  style={latoBody}
                >
                  Slug
                  <input
                    name="slug"
                    required
                    value={catSlug}
                    onChange={(e) => {
                      setCatSlugManual(true)
                      setCatSlug(e.target.value)
                    }}
                    className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px]"
                    style={{ borderRadius: 2 }}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-[#666666]" style={jostHeading}>
                  UBICAR DENTRO DE
                  <span className="ml-1 font-normal normal-case tracking-normal text-[#AAAAAA]">
                    (opcional — dejar vacío para categoría raíz)
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <span className="w-3 shrink-0 text-[10px] text-[#AAAAAA]">—</span>
                  <select
                    value={catLevel1}
                    onChange={(e) => {
                      const v = e.target.value
                      setCatLevel1(v)
                      setCatLevel2('')
                      setCatLevel3('')
                      setCatLevel4('')
                      if (!catSlugManual && catNombre) {
                        const parent = categories.find((c) => c.id === v)
                        const prefix = parent ? `${parent.slug}-` : ''
                        setCatSlug(prefix + slugFromNombre(catNombre))
                      }
                    }}
                    className="flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[12px] text-[#111111]"
                    style={{ borderRadius: 2 }}
                  >
                    <option value="">Raíz (sin padre)</option>
                    {parentCats1.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {catLevel1 && parentCats2.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 shrink-0 text-[10px] text-[#AAAAAA]">└</span>
                    <select
                      value={catLevel2}
                      onChange={(e) => {
                        const v = e.target.value
                        setCatLevel2(v)
                        setCatLevel3('')
                        setCatLevel4('')
                        if (!catSlugManual && catNombre) {
                          const parent =
                            categories.find((c) => c.id === v) ??
                            categories.find((c) => c.id === catLevel1)
                          const prefix = parent ? `${parent.slug}-` : ''
                          setCatSlug(prefix + slugFromNombre(catNombre))
                        }
                      }}
                      className="flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[12px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    >
                      <option value="">
                        Directo bajo {categories.find((c) => c.id === catLevel1)?.nombre}
                      </option>
                      {parentCats2.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {catLevel2 && parentCats3.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 shrink-0 text-[10px] text-[#AAAAAA]">└</span>
                    <select
                      value={catLevel3}
                      onChange={(e) => {
                        const v = e.target.value
                        setCatLevel3(v)
                        setCatLevel4('')
                        if (!catSlugManual && catNombre) {
                          const parent =
                            categories.find((c) => c.id === v) ??
                            categories.find((c) => c.id === catLevel2)
                          const prefix = parent ? `${parent.slug}-` : ''
                          setCatSlug(prefix + slugFromNombre(catNombre))
                        }
                      }}
                      className="flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[12px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    >
                      <option value="">
                        Directo bajo {categories.find((c) => c.id === catLevel2)?.nombre}
                      </option>
                      {parentCats3.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {catLevel3 && parentCats4.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 shrink-0 text-[10px] text-[#AAAAAA]">└</span>
                    <select
                      value={catLevel4}
                      onChange={(e) => {
                        const v = e.target.value
                        setCatLevel4(v)
                        if (!catSlugManual && catNombre) {
                          const parent =
                            categories.find((c) => c.id === v) ??
                            categories.find((c) => c.id === catLevel3)
                          const prefix = parent ? `${parent.slug}-` : ''
                          setCatSlug(prefix + slugFromNombre(catNombre))
                        }
                      }}
                      className="flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[12px] text-[#111111]"
                      style={{ borderRadius: 2 }}
                    >
                      <option value="">
                        Directo bajo {categories.find((c) => c.id === catLevel3)?.nombre}
                      </option>
                      {parentCats4.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-fit bg-[#111111] px-4 py-2.5 text-[10px] text-[#FFFFFF] hover:bg-[#CC4B37]"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                CREAR
              </button>
            </form>
          </div>

          {categories.length === 0 ? (
            <p className="py-8 text-center text-[#666666]" style={latoBody}>
              No hay categorías
            </p>
          ) : (
            <div className="border border-solid border-[#EEEEEE]">
              {categories
                .filter((c) => c.parent_id === null)
                .map((nivel1) => (
                  <div key={nivel1.id}>
                    <div className="flex items-center justify-between gap-2 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="text-[10px] text-[#AAAAAA]" style={jostHeading}>
                          {'\u25B6'}
                        </span>
                        <span className="text-[13px] font-bold text-[#111111]" style={jostHeading}>
                          {nivel1.nombre}
                        </span>
                        <span className="text-[10px] text-[#AAAAAA]" style={latoBody}>
                          {nivel1.slug}
                        </span>
                        {!nivel1.activo && (
                          <span
                            className="border border-[#CC4B37] px-1 text-[9px] text-[#CC4B37]"
                            style={jostHeading}
                          >
                            INACTIVO
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(nivel1.id)}
                        className="shrink-0 text-[10px] text-[#CC4B37] hover:underline"
                        style={jostHeading}
                      >
                        Eliminar
                      </button>
                    </div>
                    {categories
                      .filter((c) => c.parent_id === nivel1.id)
                      .map((nivel2) => (
                        <div key={nivel2.id}>
                          <div className="flex items-center justify-between gap-2 border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2 pl-8">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-[10px] text-[#CCCCCC]">└</span>
                              <span className="text-[12px] font-semibold text-[#333333]">
                                {nivel2.nombre}
                              </span>
                              <span className="text-[10px] text-[#AAAAAA]" style={latoBody}>
                                {nivel2.slug}
                              </span>
                              {!nivel2.activo && (
                                <span
                                  className="border border-[#CC4B37] px-1 text-[9px] text-[#CC4B37]"
                                  style={jostHeading}
                                >
                                  INACTIVO
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeleteCategory(nivel2.id)}
                              className="shrink-0 text-[10px] text-[#CC4B37] hover:underline"
                              style={jostHeading}
                            >
                              Eliminar
                            </button>
                          </div>
                          {categories
                            .filter((c) => c.parent_id === nivel2.id)
                            .map((nivel3) => (
                              <div
                                key={nivel3.id}
                                className="flex items-center justify-between gap-2 border-b border-[#EEEEEE] bg-[#FAFAFA] px-4 py-2 pl-14"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="text-[10px] text-[#CCCCCC]">└</span>
                                  <span className="text-[11px] text-[#555555]">{nivel3.nombre}</span>
                                  <span className="text-[10px] text-[#AAAAAA]" style={latoBody}>
                                    {nivel3.slug}
                                  </span>
                                  {!nivel3.activo && (
                                    <span
                                      className="border border-[#CC4B37] px-1 text-[9px] text-[#CC4B37]"
                                      style={jostHeading}
                                    >
                                      INACTIVO
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onDeleteCategory(nivel3.id)}
                                  className="shrink-0 text-[10px] text-[#CC4B37] hover:underline"
                                  style={jostHeading}
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))}
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'marcas' ? (
        <div className="flex flex-col gap-4">
          <div
            className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4"
            style={{ borderRadius: 2 }}
          >
            <h3 className="mb-3 text-[11px] tracking-[0.12em] text-[#111111]" style={jostHeading}>
              NUEVA MARCA
            </h3>
            {brandFormError ? (
              <p className="mb-2 text-sm text-[#CC4B37]">{brandFormError}</p>
            ) : null}
            <form onSubmit={onCreateBrand} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                <label className="block min-w-[160px] flex-1 text-[11px] text-[#666666]">
                  Nombre
                  <input
                    name="nombre"
                    required
                    value={brandNombre}
                    onChange={(e) => {
                      const v = e.target.value
                      setBrandNombre(v)
                      if (!brandSlugManual) setBrandSlug(slugFromNombre(v))
                    }}
                    className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px]"
                    style={{ borderRadius: 2 }}
                  />
                </label>
                <label className="block min-w-[160px] flex-1 text-[11px] text-[#666666]">
                  Slug
                  <input
                    name="slug"
                    required
                    value={brandSlug}
                    onChange={(e) => {
                      setBrandSlugManual(true)
                      setBrandSlug(e.target.value)
                    }}
                    className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px]"
                    style={{ borderRadius: 2 }}
                  />
                </label>
              </div>
              <label className="block text-[11px] text-[#666666]">
                Logo URL
                <input
                  name="logo_url"
                  type="url"
                  className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px]"
                  style={{ borderRadius: 2 }}
                />
              </label>
              <label className="block text-[11px] text-[#666666]">
                Descripción
                <textarea
                  name="descripcion"
                  rows={2}
                  className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1.5 text-[13px]"
                  style={{ borderRadius: 2 }}
                />
              </label>
              <button
                type="submit"
                className="w-fit bg-[#111111] px-4 py-2.5 text-[10px] text-[#FFFFFF] hover:bg-[#CC4B37]"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                CREAR MARCA
              </button>
            </form>
          </div>

          {brands.length === 0 ? (
            <p className="py-8 text-center text-[#666666]">No hay marcas</p>
          ) : (
            <ul className="divide-y divide-solid divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
              {brands.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 bg-[#FFFFFF] px-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {b.logo_url ? (
                      <img
                        src={b.logo_url}
                        alt=""
                        width={32}
                        height={32}
                        className="h-8 w-8 shrink-0 object-contain"
                      />
                    ) : (
                      <div
                        className="h-8 w-8 shrink-0 bg-[#EEEEEE]"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-[#111111]">{b.nombre}</div>
                      <div className="text-[12px] text-[#666666]">{b.slug}</div>
                      <span
                        className="mt-1 inline-block text-[10px] text-[#111111]"
                        style={jostHeading}
                      >
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 2,
                            backgroundColor: b.activo ? '#EEEEEE' : '#F4F4F4',
                          }}
                        >
                          {b.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteBrand(b.id)}
                    className="shrink-0 text-[10px] uppercase text-[#CC4B37] underline"
                    style={jostHeading}
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
