'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { StoreBrand, StoreCategory, StoreProduct } from './types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function ShoppingBagIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M3 6h18M16 10a4 4 0 01-8 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ProductCard({ product }: { product: StoreProduct }) {
  const foto = product.fotos_urls?.[0] ?? null

  return (
    <Link
      href={`/store/${product.id}`}
      className="group block overflow-hidden rounded-[12px] border border-[#EEEEEE] bg-[#FFFFFF] shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="relative w-full overflow-hidden bg-[#F0F2F5]"
        style={{ aspectRatio: '1/1' }}
      >
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EEEEEE] text-[#CCCCCC]">
            <ShoppingBagIcon size={32} />
          </div>
        )}
        {product.condicion === 'outlet' && (
          <span
            style={jost}
            className="absolute left-1.5 top-1.5 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white"
          >
            OUTLET
          </span>
        )}
        {product.destacado && (
          <span
            style={jost}
            className="absolute right-1.5 top-1.5 bg-[#111111] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white"
          >
            DESTACADO
          </span>
        )}
        <span
          style={lato}
          className="absolute bottom-1.5 left-1.5 rounded-full border border-[#EEEEEE] bg-[#F4F4F4]/95 px-2 py-0.5 text-[9px] font-medium text-[#666666] shadow-sm"
        >
          Vendido por AirNation
        </span>
      </div>

      <div className="px-2 pb-2 pt-1.5">
        <p style={jost} className="text-[14px] font-extrabold leading-tight text-[#111111]">
          ${product.precio.toLocaleString('es-MX')}
        </p>
        <p style={lato} className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#444444]">
          {product.nombre}
        </p>
        {product.stock === 0 ? (
          <p style={lato} className="mt-0.5 text-[11px] text-[#999999]">
            Agotado
          </p>
        ) : product.stock_visible ? (
          <p style={lato} className="mt-0.5 text-[11px] text-[#666666]">
            Stock: {product.stock}
          </p>
        ) : (
          <p style={lato} className="mt-0.5 text-[11px] text-[#666666]">
            10+ disponibles
          </p>
        )}
      </div>
    </Link>
  )
}

function toggleCategoryId(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((x) => x !== id)
  return [...ids, id]
}

export function StoreExploreClient({
  products,
  categories,
  brands: _brands,
}: {
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
}) {
  void _brands

  const topLevelCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories]
  )

  const [sheetOpen, setSheetOpen] = useState(false)
  const [filtroCondicion, setFiltroCondicion] = useState<'' | 'nuevo' | 'outlet'>('')
  const [filtroCategoriaIds, setFiltroCategoriaIds] = useState<string[]>([])
  const [filtroSoloStock, setFiltroSoloStock] = useState(false)

  const [localCondicion, setLocalCondicion] = useState<'' | 'nuevo' | 'outlet'>('')
  const [localCategoriaIds, setLocalCategoriaIds] = useState<string[]>([])
  const [localSoloStock, setLocalSoloStock] = useState(false)

  const activeCount = [
    filtroCondicion ? 'c' : '',
    filtroCategoriaIds.length > 0 ? 'cat' : '',
    filtroSoloStock ? 's' : '',
  ].filter(Boolean).length

  const filtered = useMemo(() => {
    let list = products
    if (filtroCondicion) {
      list = list.filter((p) => p.condicion === filtroCondicion)
    }
    if (filtroCategoriaIds.length > 0) {
      const set = new Set(filtroCategoriaIds)
      list = list.filter((p) => p.categoria_id != null && set.has(p.categoria_id))
    }
    if (filtroSoloStock) {
      list = list.filter((p) => p.stock > 0)
    }
    return list
  }, [products, filtroCondicion, filtroCategoriaIds, filtroSoloStock])

  const handleOpen = () => {
    setLocalCondicion(filtroCondicion)
    setLocalCategoriaIds([...filtroCategoriaIds])
    setLocalSoloStock(filtroSoloStock)
    setSheetOpen(true)
  }

  const handleApply = () => {
    setFiltroCondicion(localCondicion)
    setFiltroCategoriaIds([...localCategoriaIds])
    setFiltroSoloStock(localSoloStock)
    setSheetOpen(false)
  }

  const handleClear = () => {
    setLocalCondicion('')
    setLocalCategoriaIds([])
    setLocalSoloStock(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setFiltroCondicion('')
              setFiltroCategoriaIds([])
              setFiltroSoloStock(false)
            }}
            style={lato}
            className="text-[12px] text-[#999999] underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
        <button
          type="button"
          onClick={handleOpen}
          className={`flex items-center gap-1.5 border px-3 py-2 text-[12px] transition-colors ${
            activeCount > 0
              ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]'
              : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
          }`}
          style={lato}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSheetOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed left-0 right-0 z-50 max-h-[85vh] overflow-y-auto bg-white transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        style={{
          bottom: 0,
          borderRadius: '12px 12px 0 0',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="flex w-full cursor-pointer justify-center py-4"
          onClick={() => setSheetOpen(false)}
        >
          <div className="h-1 w-10 rounded-full bg-[#DDDDDD]" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
              Filtrar
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                style={jost}
                className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={jost}
                className="bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white"
              >
                Aplicar
              </button>
            </div>
          </div>

          <div className="mb-5">
            <p
              style={jost}
              className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            >
              Condición
            </p>
            <div className="flex gap-2">
              {(
                [
                  { id: '' as const, label: 'Todos' },
                  { id: 'nuevo' as const, label: 'Nuevo' },
                  { id: 'outlet' as const, label: 'Outlet' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id || 'all'}
                  type="button"
                  onClick={() => setLocalCondicion(opt.id)}
                  style={jost}
                  className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    localCondicion === opt.id
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p
              style={jost}
              className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            >
              Categoría
            </p>
            {topLevelCategories.length === 0 ? (
              <p style={lato} className="text-[12px] text-[#999999]">
                Sin categorías disponibles
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topLevelCategories.map((cat) => {
                  const on = localCategoriaIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setLocalCategoriaIds((prev) => toggleCategoryId(prev, cat.id))
                      }
                      style={jost}
                      className={`border px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                        on
                          ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                          : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <p
              style={jost}
              className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            >
              Stock
            </p>
            <button
              type="button"
              onClick={() => setLocalSoloStock((v) => !v)}
              style={jost}
              className={`border px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                localSoloStock
                  ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                  : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
              }`}
            >
              Solo en stock
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-[#AAAAAA]">
            <ShoppingBagIcon size={40} />
          </div>
          <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">
            Sin productos
          </p>
          <p style={lato} className="mt-2 max-w-[260px] text-[13px] text-[#999999]">
            {products.length === 0
              ? 'Aún no hay productos activos en la tienda'
              : 'No hay resultados con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
