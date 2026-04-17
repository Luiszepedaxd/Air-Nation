'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { StoreBrand, StoreCategory, StoreProduct } from './types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function ProductCard({ product, brands }: { product: StoreProduct; brands: StoreBrand[] }) {
  const foto = product.fotos_urls?.[0] ?? null
  const brand = brands.find((b) => b.id === product.brand_id)

  return (
    <Link
      href={`/store/${product.id}`}
      className="group flex flex-col overflow-hidden border border-[#E8E8E8] bg-white transition-all hover:border-[#CC4B37] hover:shadow-sm"
    >
      <div className="relative w-full bg-[#F4F4F4]" style={{ aspectRatio: '1/1' }}>
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-contain p-2" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#CCCCCC]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
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
          </div>
        )}
        {product.condicion === 'outlet' && (
          <span
            className="absolute left-1 top-1 bg-[#CC4B37] px-1 py-0.5 text-[8px] font-extrabold uppercase text-white"
            style={jost}
          >
            OUTLET
          </span>
        )}
        {product.destacado && (
          <span
            className="absolute right-1 top-1 bg-[#111111] px-1 py-0.5 text-[8px] font-extrabold uppercase text-white"
            style={jost}
          >
            ★
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-2">
        {brand && (
          <p className="mb-0.5 text-[10px] font-bold uppercase text-[#CC4B37]" style={jost}>
            {brand.nombre}
          </p>
        )}
        <p className="line-clamp-2 text-[11px] leading-snug text-[#333333]" style={lato}>
          {product.nombre}
        </p>
        <div className="mt-auto pt-1.5">
          <p className="text-[14px] font-extrabold text-[#111111]" style={jost}>
            ${product.precio.toLocaleString('es-MX')}
          </p>
          {product.stock === 0 ? (
            <p className="text-[10px] text-[#CC4B37]" style={lato}>
              Agotado
            </p>
          ) : product.stock_visible ? (
            <p className="text-[10px] text-[#22C55E]" style={lato}>
              ✓ {product.stock} en stock
            </p>
          ) : (
            <p className="text-[10px] text-[#22C55E]" style={lato}>
              ✓ 10+ en stock
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export function StoreExploreClient({
  products,
  categories,
  brands,
}: {
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroCondicion, setFiltroCondicion] = useState<'' | 'nuevo' | 'outlet'>('')
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('')
  const [filtroMarcaId, setFiltroMarcaId] = useState('')
  const [filtroSoloStock, setFiltroSoloStock] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [carritoCount] = useState(0)

  const [localCondicion, setLocalCondicion] = useState<'' | 'nuevo' | 'outlet'>('')
  const [localCategoriaId, setLocalCategoriaId] = useState('')
  const [localMarcaId, setLocalMarcaId] = useState('')
  const [localSoloStock, setLocalSoloStock] = useState(false)

  const filtered = useMemo(() => {
    let list = products
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      list = list.filter((p) => p.nombre.toLowerCase().includes(q))
    }
    if (filtroCondicion) list = list.filter((p) => p.condicion === filtroCondicion)
    if (filtroCategoriaId) {
      const childIds = new Set(
        categories
          .filter((c) => c.parent_id === filtroCategoriaId || c.id === filtroCategoriaId)
          .map((c) => c.id)
      )
      list = list.filter((p) => p.categoria_id != null && childIds.has(p.categoria_id))
    }
    if (filtroMarcaId) list = list.filter((p) => p.brand_id === filtroMarcaId)
    if (filtroSoloStock) list = list.filter((p) => p.stock > 0)
    return list
  }, [
    products,
    busqueda,
    filtroCondicion,
    filtroCategoriaId,
    filtroMarcaId,
    filtroSoloStock,
    categories,
  ])

  const activeCount = [
    filtroCondicion,
    filtroCategoriaId,
    filtroMarcaId,
    filtroSoloStock ? 's' : '',
  ].filter(Boolean).length

  const topCategories = categories.filter((c) => c.parent_id === null)

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-[#111111] shadow-sm">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="flex h-12 items-center justify-between gap-3">
            <span
              className="text-[1.1rem] font-extrabold uppercase tracking-[0.18em] text-white"
              style={jost}
            >
              AN<span className="text-[#CC4B37]">STORE</span>
            </span>
            <div className="flex items-center gap-3">
              <span
                className="hidden bg-[#CC4B37] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white sm:inline"
                style={jost}
              >
                ADMIN PREVIEW
              </span>
              <button type="button" className="relative p-1 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 6h18M16 10a4 4 0 01-8 0"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                {carritoCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white"
                    style={jost}
                  >
                    {carritoCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="pb-3">
            <div className="flex items-center gap-2 border border-[#333333] bg-[#1A1A1A] px-3 py-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="shrink-0 text-[#666666]"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M21 21l-4.35-4.35"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="search"
                placeholder="Buscar productos, marcas..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="flex-1 bg-transparent text-[13px] text-white placeholder-[#666666] outline-none"
                style={lato}
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="text-xs text-[#666666] hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── BODY: sidebar + grid ── */}
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6 md:py-6">
        <div className="flex gap-6">
          {/* SIDEBAR */}
          <aside className="hidden w-[200px] shrink-0 md:block">
            <div className="sticky top-[88px] flex flex-col gap-5">
              <div>
                <p
                  className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Categorías
                </p>
                <ul className="flex flex-col gap-0.5">
                  <li>
                    <button
                      type="button"
                      onClick={() => setFiltroCategoriaId('')}
                      className={`w-full px-2 py-1.5 text-left text-[12px] transition-colors ${
                        !filtroCategoriaId
                          ? 'bg-[#CC4B37] font-bold text-white'
                          : 'text-[#444444] hover:bg-[#EEEEEE]'
                      }`}
                      style={lato}
                    >
                      Todos
                    </button>
                  </li>
                  {topCategories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setFiltroCategoriaId(filtroCategoriaId === cat.id ? '' : cat.id)
                        }
                        className={`w-full px-2 py-1.5 text-left text-[12px] transition-colors ${
                          filtroCategoriaId === cat.id
                            ? 'bg-[#CC4B37] font-bold text-white'
                            : 'text-[#444444] hover:bg-[#EEEEEE]'
                        }`}
                        style={lato}
                      >
                        {cat.nombre}
                      </button>
                      {filtroCategoriaId === cat.id &&
                        categories.filter((c) => c.parent_id === cat.id).length > 0 && (
                          <ul className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-[#EEEEEE] pl-2">
                            {categories
                              .filter((c) => c.parent_id === cat.id)
                              .map((sub) => (
                                <li key={sub.id}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setFiltroCategoriaId(sub.id)
                                    }}
                                    className="w-full py-1 text-left text-[11px] text-[#666666] transition-colors hover:text-[#CC4B37]"
                                    style={lato}
                                  >
                                    {sub.nombre}
                                  </button>
                                </li>
                              ))}
                          </ul>
                        )}
                    </li>
                  ))}
                </ul>
              </div>

              {brands.length > 0 && (
                <div>
                  <p
                    className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                    style={jost}
                  >
                    Marcas
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    <li>
                      <button
                        type="button"
                        onClick={() => setFiltroMarcaId('')}
                        className={`w-full px-2 py-1.5 text-left text-[12px] transition-colors ${
                          !filtroMarcaId
                            ? 'font-bold text-[#111111]'
                            : 'text-[#666666] hover:bg-[#EEEEEE]'
                        }`}
                        style={lato}
                      >
                        Todas
                      </button>
                    </li>
                    {brands.map((b) => (
                      <li key={b.id}>
                        <button
                          type="button"
                          onClick={() => setFiltroMarcaId(filtroMarcaId === b.id ? '' : b.id)}
                          className={`w-full px-2 py-1.5 text-left text-[12px] transition-colors ${
                            filtroMarcaId === b.id
                              ? 'font-bold text-[#CC4B37]'
                              : 'text-[#666666] hover:bg-[#EEEEEE]'
                          }`}
                          style={lato}
                        >
                          {b.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p
                  className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Condición
                </p>
                <div className="flex flex-col gap-0.5">
                  {(
                    [
                      ['', 'Todos'],
                      ['nuevo', 'Nuevo'],
                      ['outlet', 'Outlet'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val || 'all'}
                      type="button"
                      onClick={() => setFiltroCondicion(val)}
                      className={`w-full px-2 py-1.5 text-left text-[12px] transition-colors ${
                        filtroCondicion === val
                          ? 'font-bold text-[#CC4B37]'
                          : 'text-[#666666] hover:bg-[#EEEEEE]'
                      }`}
                      style={lato}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setFiltroSoloStock((v) => !v)}
                  className={`flex w-full items-center gap-2 px-2 py-1.5 text-[12px] transition-colors ${
                    filtroSoloStock
                      ? 'font-bold text-[#CC4B37]'
                      : 'text-[#666666] hover:bg-[#EEEEEE]'
                  }`}
                  style={lato}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
                      filtroSoloStock ? 'border-[#CC4B37] bg-[#CC4B37]' : 'border-[#CCCCCC]'
                    }`}
                  >
                    {filtroSoloStock && (
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5l2.5 2.5 4.5-4.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </span>
                  Solo en stock
                </button>
              </div>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroCondicion('')
                    setFiltroCategoriaId('')
                    setFiltroMarcaId('')
                    setFiltroSoloStock(false)
                  }}
                  className="px-2 text-left text-[11px] text-[#999999] underline-offset-2 hover:underline"
                  style={lato}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </aside>

          {/* MAIN */}
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between md:hidden">
              <p className="text-[12px] text-[#999999]" style={lato}>
                {filtered.length} productos
              </p>
              <button
                type="button"
                onClick={() => {
                  setLocalCondicion(filtroCondicion)
                  setLocalCategoriaId(filtroCategoriaId)
                  setLocalMarcaId(filtroMarcaId)
                  setLocalSoloStock(filtroSoloStock)
                  setSheetOpen(true)
                }}
                className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] transition-colors ${
                  activeCount > 0
                    ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]'
                    : 'border-[#EEEEEE] bg-white text-[#666666]'
                }`}
                style={lato}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
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

            <p className="mb-3 hidden text-[12px] text-[#999999] md:block" style={lato}>
              {filtered.length} productos
            </p>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-[#CCCCCC]"
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
                <p
                  className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]"
                  style={jost}
                >
                  Sin productos
                </p>
                <p className="mt-2 max-w-[260px] text-[13px] text-[#999999]" style={lato}>
                  {products.length === 0
                    ? 'Aún no hay productos en la tienda'
                    : 'Sin resultados con estos filtros'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} brands={brands} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM SHEET filtros mobile ── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSheetOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto bg-white transition-transform duration-300 ease-out md:hidden ${
          sheetOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        style={{
          borderRadius: '12px 12px 0 0',
          paddingBottom: 'max(8px,env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="flex w-full cursor-pointer justify-center py-4"
          onClick={() => setSheetOpen(false)}
        >
          <div className="h-1 w-10 rounded-full bg-[#DDDDDD]" />
        </div>
        <div className="px-5 pb-6 pt-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-extrabold uppercase" style={jost}>
              Filtrar
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocalCondicion('')
                  setLocalCategoriaId('')
                  setLocalMarcaId('')
                  setLocalSoloStock(false)
                }}
                className="text-[11px] font-extrabold uppercase text-[#999999]"
                style={jost}
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroCondicion(localCondicion)
                  setFiltroCategoriaId(localCategoriaId)
                  setFiltroMarcaId(localMarcaId)
                  setFiltroSoloStock(localSoloStock)
                  setSheetOpen(false)
                }}
                className="bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-white"
                style={jost}
              >
                Aplicar
              </button>
            </div>
          </div>

          <p
            className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            style={jost}
          >
            Condición
          </p>
          <div className="mb-4 flex gap-2">
            {(
              [
                ['', 'Todos'],
                ['nuevo', 'Nuevo'],
                ['outlet', 'Outlet'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val || 'all'}
                type="button"
                onClick={() => setLocalCondicion(val)}
                className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase ${
                  localCondicion === val
                    ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                    : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                }`}
                style={jost}
              >
                {label}
              </button>
            ))}
          </div>

          <p
            className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            style={jost}
          >
            Categoría
          </p>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setLocalCategoriaId('')}
              className={`border px-3 py-2 text-[10px] font-extrabold uppercase ${
                !localCategoriaId
                  ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                  : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
              }`}
              style={jost}
            >
              Todos
            </button>
            {topCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setLocalCategoriaId(localCategoriaId === cat.id ? '' : cat.id)}
                className={`border px-3 py-2 text-[10px] font-extrabold uppercase ${
                  localCategoriaId === cat.id
                    ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                    : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                }`}
                style={jost}
              >
                {cat.nombre}
              </button>
            ))}
          </div>

          {brands.length > 0 && (
            <>
              <p
                className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
                style={jost}
              >
                Marca
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLocalMarcaId('')}
                  className={`border px-3 py-2 text-[10px] font-extrabold uppercase ${
                    !localMarcaId
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                  style={jost}
                >
                  Todas
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setLocalMarcaId(localMarcaId === b.id ? '' : b.id)}
                    className={`border px-3 py-2 text-[10px] font-extrabold uppercase ${
                      localMarcaId === b.id
                        ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                        : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                    }`}
                    style={jost}
                  >
                    {b.nombre}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setLocalSoloStock((v) => !v)}
            className={`flex items-center gap-2 border px-4 py-2 text-[10px] font-extrabold uppercase ${
              localSoloStock
                ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
            }`}
            style={jost}
          >
            Solo en stock
          </button>
        </div>
      </div>
    </div>
  )
}
