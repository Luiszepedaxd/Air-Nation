'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type {
  BannerProductoConfig,
  BlogDestacadoConfig,
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
  const [drawerMarcasOpen, setDrawerMarcasOpen] = useState(false)

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

      {/* ── HERO — usa el primer bloque hero activo si existe, si no muestra default ── */}
      {(() => {
        const hero = blocks.find(b => b.tipo === 'hero')
        const hc = hero?.config as HeroConfig | undefined
        return (
          <div className="relative overflow-hidden bg-[#0A0A0A]" style={{ minHeight: 360 }}>
            {hc?.imagen_url && (
              <img src={hc.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.55 }}/>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)' }}/>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)' }}/>
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, #CC4B37, transparent)' }}/>
            <div className="relative z-10 flex flex-col justify-center px-6 py-14 md:px-16 md:py-20" style={{ minHeight: 360 }}>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-px w-6" style={{ backgroundColor: '#CC4B37' }}/>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.3em]" style={{ ...jost, color: '#CC4B37' }}>AirNation Store</span>
              </div>
              <h2 className="max-w-[520px] text-[2.2rem] font-extrabold uppercase leading-[1.0] text-white md:text-[3.5rem]" style={jost}>
                {hc?.titulo || 'La tienda oficial de AirNation'}
              </h2>
              {hc?.subtitulo && (
                <p className="mt-3 max-w-[380px] text-[13px] leading-relaxed md:text-[15px]" style={{ ...lato, color: 'rgba(255,255,255,0.65)' }}>
                  {hc.subtitulo}
                </p>
              )}
              {hc?.cta_texto && hc?.cta_link && (
                <Link href={hc.cta_link}
                  className="mt-7 inline-flex w-fit items-center gap-2.5 px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:opacity-90"
                  style={{ ...jost, backgroundColor: '#CC4B37' }}>
                  {hc.cta_texto}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── FRANJA EDITORIAL — carrusel de destacados (automático) + banner configurable ── */}
      {(() => {
        const destacados = products.filter(p => p.destacado && p.stock > 0).slice(0, 8)
        const banner = blocks.find(b => b.tipo === 'banner_producto')
        const bc = banner?.config as BannerProductoConfig | undefined

        // Si no hay destacados ni banner, no mostrar la franja
        if (destacados.length === 0 && !bc) return null

        return (
          <div className="border-y border-[#EEEEEE] bg-white">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_380px]" style={{ minHeight: 280 }}>

              {/* CARRUSEL DESTACADOS — automático */}
              {destacados.length > 0 && (
                <div className="border-b border-[#EEEEEE] px-4 py-5 md:border-b-0 md:border-r md:px-6 md:py-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-0.5" style={{ backgroundColor: '#CC4B37' }}/>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0A0A0A]" style={jost}>Destacados</p>
                    </div>
                    <Link href="/store" className="text-[10px] font-bold uppercase tracking-wide hover:underline" style={{ ...jost, color: '#CC4B37' }}>
                      Ver todos →
                    </Link>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
                    {destacados.map(product => {
                      const foto = product.fotos_urls?.[0] ?? null
                      const brand = brands.find(b => b.id === product.brand_id)
                      return (
                        <Link key={product.id} href={`/store/${product.id}`}
                          className="group flex w-[130px] shrink-0 flex-col overflow-hidden border bg-white transition-all hover:shadow-md sm:w-[150px]"
                          style={{ scrollSnapAlign: 'start', borderColor: '#EEEEEE' }}>
                          <div className="relative w-full bg-[#F5F5F5]" style={{ aspectRatio: '1/1' }}>
                            {foto
                              ? <img src={foto} alt="" className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"/>
                              : <div className="flex h-full w-full items-center justify-center" style={{ color: '#DDDDDD' }}>
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                                  </svg>
                                </div>
                            }
                            {product.condicion === 'outlet' && (
                              <span className="absolute left-1.5 top-1.5 px-1 py-0.5 text-[7px] font-extrabold uppercase text-white" style={{ ...jost, backgroundColor: '#CC4B37' }}>OUTLET</span>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col p-2">
                            {brand && <p className="mb-0.5 text-[8px] font-bold uppercase" style={{ ...jost, color: '#CC4B37' }}>{brand.nombre}</p>}
                            <p className="line-clamp-2 flex-1 text-[10px] leading-snug text-[#333333]" style={lato}>{product.nombre}</p>
                            <p className="mt-1.5 text-[12px] font-extrabold text-[#0A0A0A]" style={jost}>${product.precio.toLocaleString('es-MX')}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* BANNER PRODUCTO — configurable desde admin */}
              {bc && (
                <div className="relative overflow-hidden bg-[#0A0A0A]" style={{ minHeight: 280 }}>
                  {bc.imagen_url && (
                    <img src={bc.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.45 }}/>
                  )}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%)' }}/>
                  <div className="absolute left-0 right-0 top-0 h-0.5" style={{ background: 'linear-gradient(to right, #CC4B37, rgba(204,75,55,0.3), transparent)' }}/>
                  <div className="relative z-10 flex h-full flex-col justify-end px-6 py-7" style={{ minHeight: 280 }}>
                    {bc.marca && (
                      <span className="mb-2 inline-block w-fit px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white" style={{ ...jost, backgroundColor: '#CC4B37' }}>
                        {bc.marca}
                      </span>
                    )}
                    <h3 className="text-[1.4rem] font-extrabold uppercase leading-tight text-white" style={jost}>{bc.titulo}</h3>
                    {bc.descripcion && (
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed" style={{ ...lato, color: 'rgba(255,255,255,0.55)' }}>{bc.descripcion}</p>
                    )}
                    {bc.cta_link && (
                      <Link href={bc.cta_link}
                        className="mt-4 inline-flex w-fit items-center gap-2 border px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:bg-white hover:text-[#0A0A0A]"
                        style={{ ...jost, borderColor: 'rgba(255,255,255,0.35)' }}>
                        Ver producto
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Si solo hay destacados sin banner, columna vacía no aparece */}
            </div>
          </div>
        )
      })()}

      {/* ── CATEGORÍAS — scroll horizontal compacto, automático desde store_categories ── */}
      {topCategories.length > 0 && (
        <div className="border-b border-[#EEEEEE] bg-white py-4">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-3.5 w-0.5" style={{ backgroundColor: '#CC4B37' }}/>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0A0A0A]" style={jost}>Categorías</p>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {topCategories.map(cat => {
                // Buscar imagen de esta categoría en el bloque de categorías si existe
                const catsBlock = blocks.find(b => b.tipo === 'categorias_grid')
                const catsConfig = catsBlock?.config as CategoriasGridConfig | undefined
                const catItem = catsConfig?.items?.find(item => item.categoria_id === cat.id)
                return (
                  <button key={cat.id} type="button"
                    onClick={() => setFiltroCategoriaId(filtroCategoriaId === cat.id ? '' : cat.id)}
                    className="group relative shrink-0 overflow-hidden transition-all hover:shadow-md"
                    style={{ width: 88, height: 110, backgroundColor: '#0A0A0A', outline: filtroCategoriaId === cat.id ? '2px solid #CC4B37' : 'none' }}>
                    {catItem?.imagen_url && (
                      <img src={catItem.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: filtroCategoriaId === cat.id ? 0.7 : 0.55 }}/>
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 60%)' }}/>
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-[9px] font-extrabold uppercase leading-tight text-white" style={jost}>{cat.nombre}</p>
                    </div>
                    <div className="absolute left-0 top-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: '#CC4B37', width: filtroCategoriaId === cat.id ? '100%' : '0%' }}/>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BANNER EDITORIAL 2 (segundo banner) — full width ── */}
      {(() => {
        const banners = blocks.filter(b => b.tipo === 'banner_producto')
        const bc2 = banners[1]?.config as BannerProductoConfig | undefined
        if (!bc2) return null
        return (
          <div className="relative overflow-hidden bg-[#0A0A0A]" style={{ minHeight: 240 }}>
            {bc2.imagen_url && (
              <img src={bc2.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.4 }}/>
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)' }}/>
            <div className="absolute left-0 right-0 top-0 h-0.5" style={{ backgroundColor: '#CC4B37' }}/>
            <div className="relative z-10 flex flex-col justify-center px-6 py-10 md:flex-row md:items-center md:justify-between md:px-16 md:py-12" style={{ minHeight: 240 }}>
              <div>
                {bc2.marca && (
                  <span className="mb-3 inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white" style={{ ...jost, backgroundColor: '#CC4B37' }}>{bc2.marca}</span>
                )}
                <h3 className="max-w-[480px] text-[1.7rem] font-extrabold uppercase leading-tight text-white md:text-[2.2rem]" style={jost}>{bc2.titulo}</h3>
                {bc2.descripcion && (
                  <p className="mt-2 max-w-[400px] line-clamp-2 text-[13px] leading-relaxed" style={{ ...lato, color: 'rgba(255,255,255,0.55)' }}>{bc2.descripcion}</p>
                )}
              </div>
              {bc2.cta_link && (
                <Link href={bc2.cta_link}
                  className="mt-5 inline-flex w-fit shrink-0 items-center gap-2 border px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:bg-white hover:text-[#0A0A0A] md:mt-0"
                  style={{ ...jost, borderColor: 'rgba(255,255,255,0.3)' }}>
                  Ver producto
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── BLOG DESTACADO ── */}
      {(() => {
        const blog = blocks.find(b => b.tipo === 'blog_destacado')
        const bc = blog?.config as BlogDestacadoConfig | undefined
        if (!bc) return null
        return (
          <div className="bg-[#F5F5F5] px-4 py-5 md:px-6">
            <div className="mx-auto max-w-[1200px]">
              <div className="relative overflow-hidden bg-[#0A0A0A]">
                {bc.imagen_url && (
                  <img src={bc.imagen_url} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: 0.3 }}/>
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.3) 100%)' }}/>
                <div className="absolute left-0 right-0 top-0 h-0.5" style={{ backgroundColor: '#CC4B37' }}/>
                <div className="relative z-10 flex flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-px w-4" style={{ backgroundColor: '#CC4B37' }}/>
                      <span className="text-[9px] font-extrabold uppercase tracking-[0.25em]" style={{ ...jost, color: '#CC4B37' }}>Blog</span>
                    </div>
                    <h3 className="max-w-[500px] text-[1.1rem] font-extrabold uppercase leading-snug text-white md:text-[1.35rem]" style={jost}>{bc.titulo}</h3>
                    {bc.extracto && (
                      <p className="mt-2 max-w-[440px] text-[12px] leading-relaxed" style={{ ...lato, color: 'rgba(255,255,255,0.55)' }}>{bc.extracto}</p>
                    )}
                  </div>
                  {bc.cta_link && (
                    <Link href={bc.cta_link}
                      className="inline-flex shrink-0 items-center gap-2 border px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:bg-white hover:text-[#0A0A0A]"
                      style={{ ...jost, borderColor: 'rgba(255,255,255,0.3)' }}>
                      Leer artículo
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── TEXTO LIBRE / PROMO ── */}
      {(() => {
        const texto = blocks.find(b => b.tipo === 'texto_libre')
        const tc = texto?.config as TextoLibreConfig | undefined
        if (!tc) return null
        const bg = tc.bg_color ?? '#0A0A0A'
        const color = tc.text_color ?? '#FFFFFF'
        return (
          <div className="relative overflow-hidden" style={{ backgroundColor: bg }}>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}/>
            <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-7 md:px-10 md:py-8">
              {tc.titulo && (
                <h3 className="text-[1.2rem] font-extrabold uppercase md:text-[1.5rem]" style={{ ...jost, color }}>{tc.titulo}</h3>
              )}
              <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed" style={{ ...lato, color, opacity: 0.72 }}>{tc.cuerpo}</p>
            </div>
          </div>
        )
      })()}

      {/* ── SEPARADOR PRODUCTOS ── */}
      <div className="border-t border-[#EEEEEE] bg-[#F5F5F5] px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2">
          <div className="h-4 w-0.5" style={{ backgroundColor: '#CC4B37' }}/>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#0A0A0A]" style={jost}>Todos los productos</p>
        </div>
      </div>

      {/* ── BODY: grid de productos ── */}
      <div className="mx-auto max-w-[1200px] px-4 py-4 md:px-6 md:py-6">
        <div className="w-full">
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

            <div className="mb-4 hidden items-center justify-between md:flex">
              <p className="text-[12px] text-[#999999]" style={lato}>
                {filtered.length} productos
              </p>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button type="button"
                    onClick={() => { setFiltroCondicion(''); setFiltroCategoriaId(''); setFiltroMarcaId(''); setFiltroSoloStock(false) }}
                    className="text-[11px] text-[#CC4B37] hover:underline"
                    style={lato}>
                    Limpiar filtros
                  </button>
                )}
                <button type="button"
                  onClick={() => setDrawerOpen(true)}
                  className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] transition-colors ${activeCount > 0 ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-white text-[#666666] hover:border-[#CCCCCC]'}`}
                  style={lato}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Filtrar
                  {activeCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white" style={jost}>
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} brands={brands} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DRAWER LATERAL IZQUIERDO ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[280px] overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-out ${
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

          {brands.length > 0 && (
            <div className="border-b border-[#EEEEEE]">
              <button type="button"
                onClick={() => setDrawerMarcasOpen(v => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-bold uppercase tracking-wide text-[#111111] hover:bg-[#F7F7F7]"
                style={jost}>
                Marca
                <span className={`flex h-6 w-6 items-center justify-center transition-transform ${drawerMarcasOpen ? 'rotate-180 bg-[#CC4B37]' : 'bg-[#EEEEEE]'}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 9l6 6 6-6" stroke={drawerMarcasOpen ? 'white' : '#666'} strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </button>
              {drawerMarcasOpen && (
                <div className="bg-[#F7F7F7]">
                  {brands.map(b => (
                    <button key={b.id} type="button"
                      onClick={() => setFiltroMarcaId(filtroMarcaId === b.id ? '' : b.id)}
                      className={`flex w-full items-center gap-2 px-8 py-2.5 text-left text-[12px] transition-colors ${filtroMarcaId === b.id ? 'font-bold text-[#CC4B37]' : 'text-[#555555] hover:text-[#111111]'}`}
                      style={lato}>
                      <span className="text-[#CCCCCC]">›</span>
                      {b.nombre}
                    </button>
                  ))}
                </div>
              )}
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