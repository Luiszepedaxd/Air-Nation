'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type {
  BannerProductoConfig,
  BlogDestacadoConfig,
  CarruselProductosConfig,
  CategoriasGridConfig,
  HeroConfig,
  HomepageBlock,
  StoreBrand,
  StoreCategory,
  StoreProduct,
  TextoLibreConfig,
} from './types'

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
  blocks = [],
}: {
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
  blocks?: HomepageBlock[]
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroCondicion, setFiltroCondicion] = useState<'' | 'nuevo' | 'outlet'>('')
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('')
  const [filtroMarcaId, setFiltroMarcaId] = useState('')
  const [filtroSoloStock, setFiltroSoloStock] = useState(false)
  const [carritoCount] = useState(0)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileBusquedaOpen, setMobileBusquedaOpen] = useState(false)
  // Estado acordeón — qué categoría está expandida en el drawer
  const [drawerCatExpandida, setDrawerCatExpandida] = useState<string | null>(null)

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
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* ── BARRA PROMO ── */}
        <div className="bg-[#111111] px-4 py-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white" style={jost}>
            <span className="text-[#CC4B37]">4% DE DESCUENTO</span> AL PAGAR CON TRANSFERENCIA
            <span className="mx-3 text-white/30">·</span>
            ENVIAMOS A <span className="text-[#CC4B37]">TODO MÉXICO</span>
            <span className="mx-3 text-white/30">·</span>
            <span className="hidden sm:inline">PEDIDO PROTEGIDO EN CADA COMPRA</span>
          </p>
        </div>

        {/* ── HEADER PRINCIPAL ── */}
        <div className="border-b border-[#EEEEEE]">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="flex h-14 items-center gap-3 md:h-16">
              {/* Hamburguesa mobile */}
              <button type="button" onClick={() => setDrawerOpen(true)}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] md:hidden"
                aria-label="Filtros">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="#444444" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {activeCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white" style={jost}>
                    {activeCount}
                  </span>
                )}
              </button>

              {/* Logo */}
              <Link href="/store" className="flex shrink-0 items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
                  </svg>
                </span>
                <span className="text-[1rem] font-black uppercase tracking-[0.18em] text-[#111111]" style={jost}>
                  AIR<span className="text-[#CC4B37]">NATION</span>
                </span>
                <span className="hidden bg-[#CC4B37] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white sm:inline" style={jost}>
                  STORE
                </span>
              </Link>

              {/* Buscador — crece en desktop */}
              <div className="hidden flex-1 md:block">
                <div className="flex items-center gap-2 border border-[#EEEEEE] bg-[#F7F7F7] px-3 py-2.5 hover:border-[#CCCCCC] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#AAAAAA]">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input type="search" placeholder="Buscar productos, marcas, categorías..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder-[#AAAAAA] outline-none"
                    style={lato}/>
                  {busqueda && (
                    <button type="button" onClick={() => setBusqueda('')} className="text-xs text-[#AAAAAA] hover:text-[#111111]">✕</button>
                  )}
                </div>
              </div>

              {/* Íconos derecha */}
              <div className="ml-auto flex items-center gap-1 md:ml-0">
                {/* Búsqueda mobile */}
                <button type="button"
                  onClick={() => setMobileBusquedaOpen(v => !v)}
                  className="flex h-9 w-9 items-center justify-center text-[#444444] hover:text-[#CC4B37] transition-colors md:hidden">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {/* Admin preview badge */}
                <span className="hidden bg-[#F4F4F4] px-2 py-0.5 text-[8px] font-extrabold uppercase text-[#999999] md:inline" style={jost}>
                  ADMIN PREVIEW
                </span>
                {/* Carrito */}
                <button type="button"
                  className="relative flex h-9 w-9 items-center justify-center text-[#444444] transition-colors hover:text-[#CC4B37]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  {carritoCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white" style={jost}>
                      {carritoCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Buscador mobile — se despliega */}
            {mobileBusquedaOpen && (
              <div className="pb-3 md:hidden">
                <div className="flex items-center gap-2 border border-[#EEEEEE] bg-[#F7F7F7] px-3 py-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#AAAAAA]">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input type="search" placeholder="Buscar productos..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder-[#AAAAAA] outline-none"
                    style={lato}/>
                  {busqueda && (
                    <button type="button" onClick={() => setBusqueda('')} className="text-xs text-[#AAAAAA] hover:text-[#111111]">✕</button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── NAVBAR DE CATEGORÍAS — solo desktop ── */}
        <div className="hidden border-b border-[#EEEEEE] md:block">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="flex items-center gap-0 overflow-x-auto">
              <button type="button"
                onClick={() => setFiltroCategoriaId('')}
                className={`shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors border-b-2 ${!filtroCategoriaId ? 'border-[#CC4B37] text-[#CC4B37]' : 'border-transparent text-[#555555] hover:text-[#111111]'}`}
                style={jost}>
                Todo
              </button>
              {topCategories.map(cat => (
                <button key={cat.id} type="button"
                  onClick={() => setFiltroCategoriaId(filtroCategoriaId === cat.id ? '' : cat.id)}
                  className={`shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors border-b-2 ${filtroCategoriaId === cat.id ? 'border-[#CC4B37] text-[#CC4B37]' : 'border-transparent text-[#555555] hover:text-[#111111]'}`}
                  style={jost}>
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── BLOQUES HOMEPAGE ── */}
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          products={products}
          brands={brands}
          categories={categories}
        />
      ))}

      {/* ── BODY: sidebar + grid ── */}
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6 md:py-6">
        <div className="flex gap-6">
          {/* SIDEBAR DESKTOP */}
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
                          onClick={() =>
                            setFiltroMarcaId(filtroMarcaId === b.id ? '' : b.id)
                          }
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
            {/* Mobile: solo contador, el filtro está en hamburguesa del header */}
            <div className="mb-3 flex items-center justify-between md:hidden">
              <p className="text-[12px] text-[#999999]" style={lato}>
                {filtered.length} productos
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroCondicion('')
                    setFiltroCategoriaId('')
                    setFiltroMarcaId('')
                    setFiltroSoloStock(false)
                  }}
                  className="text-[11px] text-[#CC4B37] underline-offset-2 hover:underline"
                  style={lato}
                >
                  Limpiar filtros
                </button>
              )}
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

      {/* ── DRAWER LATERAL IZQUIERDO (mobile) ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[280px] overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-4">
          <span
            className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#111111]"
            style={jost}
          >
            Filtros
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-1.5 text-[12px] text-[#666666]"
            style={lato}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Cerrar
          </button>
        </div>

        <div className="px-0 py-2">
          {/* Categorías en acordeón */}
          <div className="border-b border-[#EEEEEE] pb-2">
            {/* Todos */}
            <button
              type="button"
              onClick={() => {
                setFiltroCategoriaId('')
                setDrawerCatExpandida(null)
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                !filtroCategoriaId
                  ? 'text-[#CC4B37]'
                  : 'text-[#111111] hover:bg-[#F7F7F7]'
              }`}
              style={jost}
            >
              Todos los productos
            </button>
            {/* Categorías raíz */}
            {topCategories.map((cat) => {
              const subs = categories.filter((c) => c.parent_id === cat.id)
              const isExpanded = drawerCatExpandida === cat.id
              const isSelected =
                filtroCategoriaId === cat.id ||
                categories.some(
                  (c) => c.parent_id === cat.id && c.id === filtroCategoriaId
                )
              return (
                <div key={cat.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (subs.length > 0) {
                        setDrawerCatExpandida(isExpanded ? null : cat.id)
                        setFiltroCategoriaId(cat.id)
                      } else {
                        setFiltroCategoriaId(filtroCategoriaId === cat.id ? '' : cat.id)
                        setDrawerCatExpandida(null)
                      }
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-[13px] font-bold uppercase tracking-wide transition-colors ${
                      isSelected
                        ? 'text-[#CC4B37]'
                        : 'text-[#111111] hover:bg-[#F7F7F7]'
                    }`}
                    style={jost}
                  >
                    {cat.nombre}
                    {subs.length > 0 && (
                      <span
                        className={`flex h-6 w-6 items-center justify-center transition-transform ${
                          isExpanded ? 'rotate-180 bg-[#CC4B37]' : 'bg-[#EEEEEE]'
                        }`}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M6 9l6 6 6-6"
                            stroke={isExpanded ? 'white' : '#666'}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                  {/* Subcategorías */}
                  {isExpanded && subs.length > 0 && (
                    <div className="bg-[#F7F7F7]">
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() =>
                            setFiltroCategoriaId(
                              filtroCategoriaId === sub.id ? cat.id : sub.id
                            )
                          }
                          className={`flex w-full items-center gap-2 px-8 py-2.5 text-left text-[12px] transition-colors ${
                            filtroCategoriaId === sub.id
                              ? 'font-bold text-[#CC4B37]'
                              : 'text-[#555555] hover:text-[#111111]'
                          }`}
                          style={lato}
                        >
                          <span className="text-[#CCCCCC]">›</span>
                          {sub.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Marcas */}
          {brands.length > 0 && (
            <div className="border-b border-[#EEEEEE] px-4 py-3">
              <p
                className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#AAAAAA]"
                style={jost}
              >
                Marca
              </p>
              <div className="flex flex-col gap-0.5">
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setFiltroMarcaId(filtroMarcaId === b.id ? '' : b.id)}
                    className={`w-full py-2 text-left text-[13px] transition-colors ${
                      filtroMarcaId === b.id
                        ? 'font-bold text-[#CC4B37]'
                        : 'text-[#444444] hover:text-[#111111]'
                    }`}
                    style={lato}
                  >
                    {b.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Condición */}
          <div className="border-b border-[#EEEEEE] px-4 py-3">
            <p
              className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#AAAAAA]"
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
                  className={`w-full py-2 text-left text-[13px] transition-colors ${
                    filtroCondicion === val
                      ? 'font-bold text-[#CC4B37]'
                      : 'text-[#444444] hover:text-[#111111]'
                  }`}
                  style={lato}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => setFiltroSoloStock((v) => !v)}
              className={`flex w-full items-center gap-2.5 py-2 text-[13px] transition-colors ${
                filtroSoloStock ? 'font-bold text-[#CC4B37]' : 'text-[#444444]'
              }`}
              style={lato}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
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

          {/* Limpiar + Aplicar */}
          {activeCount > 0 && (
            <div className="border-t border-[#EEEEEE] px-4 py-4">
              <button
                type="button"
                onClick={() => {
                  setFiltroCondicion('')
                  setFiltroCategoriaId('')
                  setFiltroMarcaId('')
                  setFiltroSoloStock(false)
                  setDrawerOpen(false)
                }}
                className="w-full bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase tracking-wide text-white"
                style={jost}
              >
                Limpiar y cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// BlockRenderer — renderiza cada bloque del homepage según su tipo
// ────────────────────────────────────────────────────────────────

function BlockRenderer({
  block,
  products,
  brands,
  categories: _categories,
}: {
  block: HomepageBlock
  products: StoreProduct[]
  brands: StoreBrand[]
  categories: StoreCategory[]
}) {
  void _categories
  const cfg = block.config

  // ── HERO ──────────────────────────────────────────────────────────────────
  if (block.tipo === 'hero') {
    const c = cfg as HeroConfig
    return (
      <div className="relative w-full overflow-hidden bg-[#0A0A0A]" style={{ minHeight: 420, maxWidth: '100vw' }}>
        {c.imagen_url && (
          <>
            <img src={c.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
          </>
        )}
        {!c.imagen_url && <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A]"/>}

        <div className="absolute left-0 top-0 h-full w-1 bg-[#CC4B37]"/>

        <div className="relative z-10 flex h-full flex-col justify-center px-8 py-16 md:px-16 md:py-20" style={{ minHeight: 420 }}>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[#CC4B37]"/>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#CC4B37]" style={jost}>
              AirNation Store
            </span>
          </div>
          <h2 className="max-w-[600px] text-4xl font-extrabold uppercase leading-[1.05] text-white md:text-6xl" style={jost}>
            {c.titulo}
          </h2>
          {c.subtitulo && (
            <p className="mt-4 max-w-[440px] text-[15px] leading-relaxed text-white/70 md:text-[17px]" style={lato}>
              {c.subtitulo}
            </p>
          )}
          {c.cta_texto && c.cta_link && (
            <div className="mt-8 flex items-center gap-4">
              <Link href={c.cta_link}
                className="inline-flex items-center gap-2 bg-[#CC4B37] px-7 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-[#B03C2C] hover:shadow-lg"
                style={jost}>
                {c.cta_texto}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          )}
        </div>

        <div className="absolute bottom-6 right-8 hidden items-center gap-2 md:flex">
          <div className="h-1.5 w-6 bg-[#CC4B37]"/>
          <div className="h-1.5 w-1.5 rounded-full bg-white/30"/>
          <div className="h-1.5 w-1.5 rounded-full bg-white/30"/>
        </div>
      </div>
    )
  }

  // ── BANNER PRODUCTO ───────────────────────────────────────────────────────
  if (block.tipo === 'banner_producto') {
    const c = cfg as BannerProductoConfig
    return (
      <div className="relative w-full overflow-hidden bg-[#0A0A0A]" style={{ minHeight: 260 }}>
        {c.imagen_url && (
          <img src={c.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45"/>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"/>
        <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-[#CC4B37] via-[#CC4B37]/50 to-transparent"/>

        <div className="relative z-10 flex h-full flex-col justify-center px-8 py-10 md:px-16 md:py-14" style={{ minHeight: 260 }}>
          {c.marca && (
            <span className="mb-3 inline-block bg-[#CC4B37] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-white w-fit" style={jost}>
              {c.marca}
            </span>
          )}
          <h3 className="max-w-[480px] text-3xl font-extrabold uppercase leading-tight text-white md:text-4xl" style={jost}>
            {c.titulo}
          </h3>
          {c.descripcion && (
            <p className="mt-2 max-w-[380px] line-clamp-2 text-[13px] leading-relaxed text-white/60" style={lato}>
              {c.descripcion}
            </p>
          )}
          {c.cta_link && (
            <Link href={c.cta_link}
              className="mt-5 inline-flex items-center gap-2 border border-white/40 bg-white/10 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-all hover:bg-white hover:text-[#111111] w-fit"
              style={jost}>
              Ver producto
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          )}
        </div>

        <div className="absolute right-12 top-1/2 hidden -translate-y-1/2 select-none text-[120px] font-extrabold leading-none text-white/5 md:block" style={jost}>
          01
        </div>
      </div>
    )
  }

  // ── CARRUSEL PRODUCTOS ────────────────────────────────────────────────────
  if (block.tipo === 'carrusel_productos') {
    const c = cfg as CarruselProductosConfig
    const blockProducts = (c.product_ids ?? [])
      .map(id => products.find(p => p.id === id))
      .filter((p): p is StoreProduct => Boolean(p))
    if (blockProducts.length === 0) return null

    return (
      <div className="bg-white py-8 border-y border-[#F0F0F0]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-[#CC4B37]"/>
              <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#111111]" style={jost}>
                {c.titulo_seccion}
              </p>
            </div>
            <Link href="/store" className="text-[11px] font-bold text-[#CC4B37] hover:underline" style={jost}>
              Ver todos →
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
            {blockProducts.map(product => {
              const foto = product.fotos_urls?.[0] ?? null
              const brand = brands.find(b => b.id === product.brand_id)
              return (
                <Link key={product.id} href={`/store/${product.id}`}
                  className="group flex w-[160px] shrink-0 flex-col overflow-hidden bg-white border border-[#EEEEEE] transition-all hover:border-[#CC4B37] hover:shadow-md sm:w-[200px]"
                  style={{ scrollSnapAlign: 'start' }}>
                  <div className="relative w-full bg-[#F7F7F7]" style={{ aspectRatio: '1/1' }}>
                    {foto
                      ? <img src={foto} alt="" className="h-full w-full object-contain p-3 transition-transform group-hover:scale-105"/>
                      : <div className="flex h-full w-full items-center justify-center text-[#DDDDDD]">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                            <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                          </svg>
                        </div>
                    }
                    {product.condicion === 'outlet' && (
                      <span className="absolute left-2 top-2 bg-[#CC4B37] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white" style={jost}>OUTLET</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    {brand && <p className="mb-0.5 text-[9px] font-bold uppercase text-[#CC4B37]" style={jost}>{brand.nombre}</p>}
                    <p className="line-clamp-2 flex-1 text-[11px] leading-snug text-[#333333]" style={lato}>{product.nombre}</p>
                    <div className="mt-2">
                      <p className="text-[14px] font-extrabold text-[#111111]" style={jost}>${product.precio.toLocaleString('es-MX')}</p>
                      {product.stock === 0
                        ? <p className="text-[10px] text-[#CC4B37]" style={lato}>Agotado</p>
                        : <p className="text-[10px] text-[#22C55E]" style={lato}>✓ En stock</p>
                      }
                    </div>
                  </div>
                </Link>
              )
            })}
            <Link href="/store"
              className="flex w-[120px] shrink-0 flex-col items-center justify-center gap-2 border border-dashed border-[#DDDDDD] bg-[#FAFAFA] text-center transition-colors hover:border-[#CC4B37] hover:bg-white sm:w-[140px]"
              style={{ scrollSnapAlign: 'start' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#CCCCCC]" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-[10px] font-bold uppercase text-[#AAAAAA]" style={jost}>Ver todos</p>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── CATEGORÍAS GRID ───────────────────────────────────────────────────────
  if (block.tipo === 'categorias_grid') {
    const c = cfg as CategoriasGridConfig
    if (!c.items?.length) return null
    return (
      <div className="bg-[#F7F7F7] py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          {c.titulo_seccion && (
            <div className="mb-5 flex items-center gap-3">
              <div className="h-5 w-1 bg-[#CC4B37]"/>
              <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#111111]" style={jost}>
                {c.titulo_seccion}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {c.items.map((item, i) => (
              <button key={i} type="button"
                className="group relative overflow-hidden bg-[#111111] transition-transform hover:scale-[1.02] hover:shadow-lg"
                style={{ aspectRatio: '3/4' }}>
                {item.imagen_url
                  ? <img src={item.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-75"/>
                  : <div className="absolute inset-0 bg-gradient-to-br from-[#222222] to-[#111111]"/>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-[11px] font-extrabold uppercase leading-tight text-white" style={jost}>
                    {item.label}
                  </p>
                </div>
                <div className="absolute left-0 top-0 h-0.5 w-0 bg-[#CC4B37] transition-all duration-300 group-hover:w-full"/>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── BLOG DESTACADO ────────────────────────────────────────────────────────
  if (block.tipo === 'blog_destacado') {
    const c = cfg as BlogDestacadoConfig
    return (
      <div className="bg-[#F7F7F7] py-8">
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="relative overflow-hidden bg-[#111111]" style={{ minHeight: 200 }}>
            {c.imagen_url && (
              <img src={c.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35"/>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/20"/>
            <div className="absolute left-0 right-0 top-0 h-0.5 bg-[#CC4B37]"/>

            <div className="relative z-10 flex flex-col justify-center px-8 py-10 md:flex-row md:items-center md:gap-8 md:px-12">
              <div className="flex-1">
                <span className="mb-3 inline-flex items-center gap-2" style={jost}>
                  <div className="h-px w-5 bg-[#CC4B37]"/>
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#CC4B37]">Blog</span>
                </span>
                <h3 className="text-xl font-extrabold uppercase leading-tight text-white md:text-2xl" style={jost}>
                  {c.titulo}
                </h3>
                {c.extracto && (
                  <p className="mt-2 max-w-[480px] text-[12px] leading-relaxed text-white/60" style={lato}>
                    {c.extracto}
                  </p>
                )}
              </div>
              {c.cta_link && (
                <div className="mt-5 md:mt-0 md:shrink-0">
                  <Link href={c.cta_link}
                    className="inline-flex items-center gap-2 border border-white/30 px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition-all hover:bg-white hover:text-[#111111]"
                    style={jost}>
                    Leer artículo
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── TEXTO LIBRE ───────────────────────────────────────────────────────────
  if (block.tipo === 'texto_libre') {
    const c = cfg as TextoLibreConfig
    const bg = c.bg_color ?? '#111111'
    const color = c.text_color ?? '#FFFFFF'
    return (
      <div className="relative overflow-hidden" style={{ backgroundColor: bg }}>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}/>
        <div className="relative z-10 mx-auto max-w-[1200px] px-8 py-10 md:px-12 md:py-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              {c.titulo && (
                <h3 className="text-2xl font-extrabold uppercase md:text-3xl" style={{ ...jost, color }}>
                  {c.titulo}
                </h3>
              )}
              <p className="mt-1 max-w-[600px] text-[14px] leading-relaxed" style={{ ...lato, color, opacity: 0.75 }}>
                {c.cuerpo}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
