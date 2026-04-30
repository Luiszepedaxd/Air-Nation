'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { StoreBrand, StoreCategory, StoreProduct } from './types'
import { useCart } from './CartContext'

// ─────────────────────────────────────────────────────────────
// CONTENIDO EDITORIAL — Defaults, sobrescribibles desde DB (admin)
// ─────────────────────────────────────────────────────────────
export type CatCarouselItem = {
  imagen_url: string
  nombre: string
  link: string
}

export type EditorialData = {
  header: {
    texto_descuento: string
    texto_medio: string
    texto_envio: string
    texto_derecha: string
  }
  hero: {
    imagen_url: string
    titulo: string
    subtitulo: string
    cta_texto: string
    cta_link: string
  }
  ticker: {
    item1: string
    item2: string
    item3: string
    item4: string
    item5: string
  }
  banner1: {
    imagen_url: string
    eyebrow: string
    titulo: string
    descripcion: string
    cta_texto: string
    cta_link: string
  }
  banner2: {
    imagen_url: string
    eyebrow: string
    titulo: string
    descripcion: string
    cta_texto: string
    cta_link: string
  }
  categorias_carousel: {
    items: CatCarouselItem[]
  }
  promoBanner: {
    imagen_url: string
    titulo: string
    descripcion: string
    cta_texto: string
    cta_link: string
  }
  footer: {
    item1_titulo: string
    item1_desc: string
    item2_titulo: string
    item2_desc: string
    item3_titulo: string
    item3_desc: string
    item4_titulo: string
    item4_desc: string
  }
  bloques_activos: {
    header: boolean
    hero: boolean
    ticker: boolean
    banner1: boolean
    banner2: boolean
    categorias_carousel: boolean
    promoBanner: boolean
    footer: boolean
  }
}

const DEFAULTS: EditorialData = {
  header: {
    texto_descuento: '4% DE DESCUENTO',
    texto_medio: 'AL PAGAR CON TRANSFERENCIA',
    texto_envio: 'TODO MÉXICO',
    texto_derecha: 'PEDIDO PROTEGIDO EN CADA COMPRA',
  },
  hero: {
    imagen_url: '',
    titulo: 'Equipo táctico. Sin pretextos.',
    subtitulo: 'Réplicas, accesorios y equipo de protección. Enviamos a todo México.',
    cta_texto: 'Ver catálogo',
    cta_link: '#productos',
  },
  ticker: {
    item1: 'Envíos a todo México',
    item2: '4% descuento con transferencia',
    item3: 'Stock real en productos',
    item4: 'Pedido protegido',
    item5: 'Nuevo inventario cada semana',
  },
  banner1: {
    imagen_url: '',
    eyebrow: 'Nuevo ingreso',
    titulo: 'Tokyo Marui MWS — GBBR de gas de alta gama',
    descripcion: 'Blowback realista, compatibilidad total con partes M4.',
    cta_texto: 'Ver producto',
    cta_link: '/store',
  },
  banner2: {
    imagen_url: '',
    eyebrow: 'Outlet',
    titulo: 'Hasta 30% en réplicas eléctricas seleccionadas',
    descripcion: 'Stock limitado. Última oportunidad.',
    cta_texto: 'Ver outlet',
    cta_link: '/store',
  },
  categorias_carousel: {
    items: [],
  },
  promoBanner: {
    imagen_url: '',
    titulo: 'BBs de alta precisión desde $149',
    descripcion: 'Bolsas de 2,000 y 5,000 unidades. Compatibles con hop-up estándar.',
    cta_texto: 'Ver productos',
    cta_link: '/store',
  },
  footer: {
    item1_titulo: 'Pedido protegido',
    item1_desc: 'Tu compra está asegurada en cada paso.',
    item2_titulo: 'Envío a todo México',
    item2_desc: 'Coordinamos desde Guadalajara.',
    item3_titulo: '4% con transferencia',
    item3_desc: 'Descuento automático al pagar con banco.',
    item4_titulo: 'Stock real',
    item4_desc: 'Solo publicamos lo que tenemos en almacén.',
  },
  bloques_activos: {
    header: true,
    hero: true,
    ticker: true,
    banner1: true,
    banner2: true,
    categorias_carousel: true,
    promoBanner: true,
    footer: true,
  },
}
// ─────────────────────────────────────────────────────────────

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

// ── Iconos inline (reemplazan los emojis del footer) ─────────
function IconShield() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5l8 3v6.2c0 4.6-3.3 8.6-8 9.8-4.7-1.2-8-5.2-8-9.8V5.5l8-3z"
        stroke="#CC4B37"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12l2.5 2.5 4.5-5"
        stroke="#CC4B37"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconTruck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 6h11v10H2zM13 9h5l3 3v4h-8z"
        stroke="#CC4B37"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="18" r="2" stroke="#CC4B37" strokeWidth="1.6" />
      <circle cx="17" cy="18" r="2" stroke="#CC4B37" strokeWidth="1.6" />
    </svg>
  )
}

function IconCard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" stroke="#CC4B37" strokeWidth="1.6" />
      <path d="M2.5 10h19" stroke="#CC4B37" strokeWidth="1.6" />
      <path d="M6 15h4" stroke="#CC4B37" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"
        stroke="#CC4B37"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 7.5L12 12l8.5-4.5M12 12v9"
        stroke="#CC4B37"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PrecioFormateado({ precio, className }: { precio: number; className?: string }) {
  const fixed = precio.toFixed(2)
  const [entero, centavos] = fixed.split('.')
  return (
    <span className={`inline-flex items-start leading-none ${className ?? ''}`}>
      <span>${Number(entero).toLocaleString('es-MX')}</span>
      <sup
        style={{
          fontSize: '0.42em',
          lineHeight: 1,
          marginTop: '0.15em',
          fontWeight: 700,
          letterSpacing: '0.01em',
        }}
      >
        {centavos}
      </sup>
    </span>
  )
}

function ProductCard({ product, brands }: { product: StoreProduct; brands: StoreBrand[] }) {
  const foto = product.fotos_urls?.[0] ?? null
  const brand = brands.find((b) => b.id === product.brand_id)
  const { addItem } = useCart()

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      product_id: product.id,
      nombre: product.nombre,
      foto_url: foto,
      precio: product.precio,
      peso_kg: product.peso_kg ?? null,
      largo_cm: product.largo_cm ?? null,
      ancho_cm: product.ancho_cm ?? null,
      alto_cm: product.alto_cm ?? null,
    })
  }

  return (
    <Link
      href={`/store/${product.id}`}
      className="group flex flex-col overflow-hidden border border-[#E8E8E8] bg-white transition-all hover:border-[#CC4B37] hover:shadow-md"
    >
      <div className="relative w-full bg-[#F4F4F4]" style={{ aspectRatio: '1/1' }}>
        {foto ? (
          <img
            src={foto}
            alt=""
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          />
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
            className="absolute left-1.5 top-1.5 bg-[#CC4B37] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white"
            style={jost}
          >
            OUTLET
          </span>
        )}
        {product.destacado && (
          <span
            className="absolute right-1.5 top-1.5 flex items-center gap-0.5 bg-[#111111] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white"
            style={jost}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.6L6 22l1.5-7.2L2 10l7.1-1.1z" />
            </svg>
            TOP
          </span>
        )}
        {product.stock > 0 && (
          <button
            type="button"
            onClick={handleAdd}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-[#CC4B37] py-2 text-[9px] font-extrabold uppercase tracking-wide text-white opacity-0 transition-all duration-200 group-hover:opacity-100"
            style={jost}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            Agregar
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2.5">
        {brand && (
          <p
            className="mb-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#CC4B37]"
            style={jost}
          >
            {brand.nombre}
          </p>
        )}
        <p className="line-clamp-2 flex-1 text-[11px] leading-snug text-[#333333]" style={lato}>
          {product.nombre}
        </p>
        <div className="mt-2 flex items-end justify-between gap-1">
          <p className="text-[15px] font-extrabold leading-none text-[#111111]" style={jost}>
            <PrecioFormateado precio={product.precio} />
          </p>
          {product.stock === 0 ? (
            <p className="text-[9px] text-[#CC4B37]" style={lato}>
              Agotado
            </p>
          ) : (
            <p className="flex items-center gap-0.5 text-[9px] text-[#22C55E]" style={lato}>
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M1.5 5l2.5 2.5 4.5-4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Stock
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
  editorial,
}: {
  products: StoreProduct[]
  categories: StoreCategory[]
  brands: StoreBrand[]
  editorial?: Partial<EditorialData>
}) {
  const BA = {
    header: (editorial?.bloques_activos?.header as boolean | undefined) ?? true,
    hero: (editorial?.bloques_activos?.hero as boolean | undefined) ?? true,
    ticker: (editorial?.bloques_activos?.ticker as boolean | undefined) ?? true,
    banner1: (editorial?.bloques_activos?.banner1 as boolean | undefined) ?? true,
    banner2: (editorial?.bloques_activos?.banner2 as boolean | undefined) ?? true,
    categorias_carousel:
      (editorial?.bloques_activos?.categorias_carousel as boolean | undefined) ?? true,
    promoBanner: (editorial?.bloques_activos?.promoBanner as boolean | undefined) ?? true,
    footer: (editorial?.bloques_activos?.footer as boolean | undefined) ?? true,
  }

  const EDITORIAL: EditorialData = {
    header: { ...DEFAULTS.header, ...(editorial?.header ?? {}) },
    hero: { ...DEFAULTS.hero, ...(editorial?.hero ?? {}) },
    ticker: { ...DEFAULTS.ticker, ...(editorial?.ticker ?? {}) },
    banner1: { ...DEFAULTS.banner1, ...(editorial?.banner1 ?? {}) },
    banner2: { ...DEFAULTS.banner2, ...(editorial?.banner2 ?? {}) },
    categorias_carousel: {
      items: editorial?.categorias_carousel?.items ?? DEFAULTS.categorias_carousel.items,
    },
    promoBanner: { ...DEFAULTS.promoBanner, ...(editorial?.promoBanner ?? {}) },
    footer: { ...DEFAULTS.footer, ...(editorial?.footer ?? {}) },
    bloques_activos: {
      ...DEFAULTS.bloques_activos,
      ...(editorial?.bloques_activos ?? {}),
    },
  }

  const [busqueda, setBusqueda] = useState('')
  const [filtroCondicion, setFiltroCondicion] = useState<'' | 'nuevo' | 'outlet'>('')
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('')
  const [filtroMarcaId, setFiltroMarcaId] = useState('')
  const [filtroSoloStock, setFiltroSoloStock] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileBusquedaOpen, setMobileBusquedaOpen] = useState(false)
  const [drawerCatExpandida, setDrawerCatExpandida] = useState<string | null>(null)
  const [drawerMarcasOpen, setDrawerMarcasOpen] = useState(false)

  const { count: cartCount, openDrawer } = useCart()

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
  const destacados = products.filter((p) => p.destacado && p.stock > 0).slice(0, 10)

  const trustItems: { icon: ReactNode; titulo: string; desc: string }[] = [
    {
      icon: <IconShield />,
      titulo: EDITORIAL.footer.item1_titulo,
      desc: EDITORIAL.footer.item1_desc,
    },
    {
      icon: <IconTruck />,
      titulo: EDITORIAL.footer.item2_titulo,
      desc: EDITORIAL.footer.item2_desc,
    },
    {
      icon: <IconCard />,
      titulo: EDITORIAL.footer.item3_titulo,
      desc: EDITORIAL.footer.item3_desc,
    },
    {
      icon: <IconBox />,
      titulo: EDITORIAL.footer.item4_titulo,
      desc: EDITORIAL.footer.item4_desc,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Promo bar */}
        {BA.header && (
          <div className="bg-[#111111] px-4 py-2">
            <p
              className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white"
              style={jost}
            >
              <span className="text-[#CC4B37]">{EDITORIAL.header.texto_descuento}</span>{' '}
              {EDITORIAL.header.texto_medio}
              <span className="mx-3 text-white/30">·</span>
              ENVIAMOS A <span className="text-[#CC4B37]">{EDITORIAL.header.texto_envio}</span>
              <span className="mx-3 hidden text-white/30 sm:inline">·</span>
              <span className="hidden sm:inline">{EDITORIAL.header.texto_derecha}</span>
            </p>
          </div>
        )}

        {/* Header principal */}
        <div className="border-b border-[#EEEEEE]">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="flex h-14 items-center gap-3 md:h-16">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] md:hidden"
                aria-label="Filtros"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="#444444"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {activeCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white"
                    style={jost}
                  >
                    {activeCount}
                  </span>
                )}
              </button>

              <Link href="/store" className="flex shrink-0 items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
                  </svg>
                </span>
                <span
                  className="text-[1rem] font-black uppercase tracking-[0.18em] text-[#111111]"
                  style={jost}
                >
                  AIR<span className="text-[#CC4B37]">NATION</span>
                </span>
                <span
                  className="hidden bg-[#CC4B37] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white sm:inline"
                  style={jost}
                >
                  STORE
                </span>
              </Link>

              {/* Buscador desktop */}
              <div className="hidden flex-1 md:block">
                <div className="flex items-center gap-2 border border-[#EEEEEE] bg-[#F7F7F7] px-3 py-2.5 transition-colors hover:border-[#CCCCCC]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="shrink-0 text-[#AAAAAA]"
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
                    placeholder="Buscar productos, marcas, categorías..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder-[#AAAAAA] outline-none"
                    style={lato}
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      className="text-xs text-[#AAAAAA] hover:text-[#111111]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Íconos derecha */}
              <div className="ml-auto flex items-center gap-1 md:ml-0">
                <button
                  type="button"
                  onClick={() => setMobileBusquedaOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center text-[#444444] transition-colors hover:text-[#CC4B37] md:hidden"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M21 21l-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <Link
                  href="/store/pedidos"
                  className="hidden items-center gap-1.5 border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#666666] transition-colors hover:border-[#111111] hover:text-[#111111] md:flex"
                  style={jost}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mis pedidos
                </Link>
                <button
                  type="button"
                  onClick={openDrawer}
                  className="relative flex h-9 w-9 items-center justify-center text-[#444444] transition-colors hover:text-[#CC4B37]"
                >
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
                  {cartCount > 0 && (
                    <span
                      className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white"
                      style={jost}
                    >
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Buscador mobile */}
            {mobileBusquedaOpen && (
              <div className="pb-3 md:hidden">
                <div className="flex items-center gap-2 border border-[#EEEEEE] bg-[#F7F7F7] px-3 py-2">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="shrink-0 text-[#AAAAAA]"
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
                    placeholder="Buscar productos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder-[#AAAAAA] outline-none"
                    style={lato}
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      className="text-xs text-[#AAAAAA] hover:text-[#111111]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navbar categorías desktop */}
        <div className="hidden border-b border-[#EEEEEE] md:block">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="flex items-center overflow-x-auto">
              <button
                type="button"
                onClick={() => setFiltroCategoriaId('')}
                className={`shrink-0 border-b-2 px-4 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors ${!filtroCategoriaId ? 'border-[#CC4B37] text-[#CC4B37]' : 'border-transparent text-[#555555] hover:text-[#111111]'}`}
                style={jost}
              >
                Todo
              </button>
              {topCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFiltroCategoriaId(filtroCategoriaId === cat.id ? '' : cat.id)}
                  className={`shrink-0 border-b-2 px-4 py-3 text-[11px] font-bold uppercase tracking-wide transition-colors ${filtroCategoriaId === cat.id ? 'border-[#CC4B37] text-[#CC4B37]' : 'border-transparent text-[#555555] hover:text-[#111111]'}`}
                  style={jost}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          HERO — Imagen full-width + claim
      ══════════════════════════════════════ */}
      {BA.hero && (
      <section id="hero" className="relative overflow-hidden bg-[#0A0A0A]" style={{ minHeight: 480 }}>
        {EDITORIAL.hero.imagen_url ? (
          <img
            src={EDITORIAL.hero.imagen_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0.5 }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(45deg, #111 0px, #111 10px, #161616 10px, #161616 20px)',
            }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.2) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }}
        />
        <div
          className="relative z-10 mx-auto max-w-[1200px] px-8 py-16 md:px-16 md:py-24"
          style={{
            minHeight: 480,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px w-8 bg-[#CC4B37]" />
            <span
              className="text-[9px] font-extrabold uppercase tracking-[0.35em] text-[#CC4B37]"
              style={jost}
            >
              AirNation Store
            </span>
          </div>
          <h1
            className="max-w-[600px] font-extrabold uppercase leading-[0.95] text-white"
            style={{ ...jost, fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
          >
            {EDITORIAL.hero.titulo}
          </h1>
          <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-white/60" style={lato}>
            {EDITORIAL.hero.subtitulo}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={EDITORIAL.hero.cta_link}
              className="inline-flex items-center gap-2.5 bg-[#CC4B37] px-7 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
              style={jost}
            >
              {EDITORIAL.hero.cta_texto}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14M12 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <Link
              href="/store"
              className="inline-flex items-center gap-2 border border-white/25 px-7 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-white/80 transition-all hover:border-white/60 hover:text-white"
              style={jost}
            >
              Novedades
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════════════════════════
          TICKER TAPE — Franja animada
      ══════════════════════════════════════ */}
      {BA.ticker && (
      <div className="overflow-hidden bg-[#CC4B37] py-2.5">
        <div
          className="flex animate-[ticker_45s_linear_infinite] whitespace-nowrap"
          style={{ width: 'max-content' }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="mx-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
              style={jost}
            >
              {EDITORIAL.ticker.item1} &nbsp;·&nbsp; {EDITORIAL.ticker.item2} &nbsp;·&nbsp;{' '}
              {EDITORIAL.ticker.item3} &nbsp;·&nbsp; {EDITORIAL.ticker.item4} &nbsp;·&nbsp;{' '}
              {EDITORIAL.ticker.item5} &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>
      )}
      <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      `}</style>

      {/* ══════════════════════════════════════
          DESTACADOS — Carrusel horizontal
      ══════════════════════════════════════ */}
      {destacados.length > 0 && (
        <section className="border-b border-[#EEEEEE] bg-white py-8">
          <div className="mx-auto max-w-[1200px] px-4 md:px-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-1 bg-[#CC4B37]" />
                <h2
                  className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#111111]"
                  style={jost}
                >
                  Destacados
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFiltroCondicion('')
                  setFiltroCategoriaId('')
                  setFiltroMarcaId('')
                  setFiltroSoloStock(false)
                }}
                className="text-[10px] font-bold uppercase tracking-wide text-[#CC4B37] hover:underline"
                style={jost}
              >
                Ver todos →
              </button>
            </div>
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
            >
              {destacados.map((product) => {
                const foto = product.fotos_urls?.[0] ?? null
                const brand = brands.find((b) => b.id === product.brand_id)
                return (
                  <Link
                    key={product.id}
                    href={`/store/${product.id}`}
                    className="group relative flex w-[160px] shrink-0 flex-col overflow-hidden border border-[#EEEEEE] bg-white transition-all hover:border-[#CC4B37] hover:shadow-lg sm:w-[185px]"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    <div className="relative bg-[#F5F5F5]" style={{ aspectRatio: '1/1' }}>
                      {foto ? (
                        <img
                          src={foto}
                          alt=""
                          className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#DDDDDD]">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path
                              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                      {product.condicion === 'outlet' && (
                        <span
                          className="absolute left-2 top-2 bg-[#CC4B37] px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-white"
                          style={jost}
                        >
                          OUTLET
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      {brand && (
                        <p
                          className="mb-0.5 text-[8px] font-extrabold uppercase tracking-wider text-[#CC4B37]"
                          style={jost}
                        >
                          {brand.nombre}
                        </p>
                      )}
                      <p
                        className="line-clamp-2 flex-1 text-[10px] leading-snug text-[#333333]"
                        style={lato}
                      >
                        {product.nombre}
                      </p>
                      <p className="mt-1.5 text-[13px] font-extrabold text-[#111111]" style={jost}>
                        <PrecioFormateado precio={product.precio} />
                      </p>
                    </div>
                    <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#CC4B37] transition-all duration-300 group-hover:w-full" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          BANNERS DOBLES — 2 columnas editoriales
      ══════════════════════════════════════ */}
      {(BA.banner1 || BA.banner2) && (
        <section
          className={`grid grid-cols-1 ${BA.banner1 && BA.banner2 ? 'md:grid-cols-2' : ''}`}
        >
          {BA.banner1 && (
            <div
              className="relative overflow-hidden bg-[#0A0A0A]"
              style={{ minHeight: BA.banner1 && !BA.banner2 ? 400 : 300 }}
            >
              {EDITORIAL.banner1.imagen_url ? (
                <img
                  src={EDITORIAL.banner1.imagen_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: 0.45 }}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)' }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                }}
              />
              <div
                className="relative z-10 flex h-full flex-col justify-end p-7 md:p-10"
                style={{ minHeight: BA.banner1 && !BA.banner2 ? 400 : 300 }}
              >
                <span
                  className="mb-2 inline-block w-fit bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white"
                  style={jost}
                >
                  {EDITORIAL.banner1.eyebrow}
                </span>
                <h3
                  className={`font-extrabold uppercase leading-tight text-white ${BA.banner1 && !BA.banner2 ? 'max-w-[600px] text-[1.8rem] md:text-[2.4rem]' : 'max-w-[320px] text-[1.35rem]'}`}
                  style={jost}
                >
                  {EDITORIAL.banner1.titulo}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/50" style={lato}>
                  {EDITORIAL.banner1.descripcion}
                </p>
                <Link
                  href={EDITORIAL.banner1.cta_link}
                  className="mt-5 inline-flex w-fit items-center gap-2 border border-white/30 px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:bg-white hover:text-[#0A0A0A]"
                  style={jost}
                >
                  {EDITORIAL.banner1.cta_texto}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          )}

          {BA.banner2 && (
            <div
              className="relative overflow-hidden"
              style={{
                minHeight: BA.banner2 && !BA.banner1 ? 400 : 300,
                backgroundColor: '#CC4B37',
              }}
            >
              {EDITORIAL.banner2.imagen_url ? (
                <img
                  src={EDITORIAL.banner2.imagen_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ opacity: 0.25 }}
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 8px)',
                  }}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)',
                }}
              />
              <div
                className="relative z-10 flex h-full flex-col justify-end p-7 md:p-10"
                style={{ minHeight: BA.banner2 && !BA.banner1 ? 400 : 300 }}
              >
                <span
                  className="mb-2 inline-block w-fit bg-[#111111] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-white"
                  style={jost}
                >
                  {EDITORIAL.banner2.eyebrow}
                </span>
                <h3
                  className={`font-extrabold uppercase leading-tight text-white ${BA.banner2 && !BA.banner1 ? 'max-w-[600px] text-[1.8rem] md:text-[2.4rem]' : 'max-w-[320px] text-[1.35rem]'}`}
                  style={jost}
                >
                  {EDITORIAL.banner2.titulo}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/70" style={lato}>
                  {EDITORIAL.banner2.descripcion}
                </p>
                <Link
                  href={EDITORIAL.banner2.cta_link}
                  className="mt-5 inline-flex w-fit items-center gap-2 bg-white px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#CC4B37] transition-all hover:bg-[#111111] hover:text-white"
                  style={jost}
                >
                  {EDITORIAL.banner2.cta_texto}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════
          CATEGORÍAS — Carrusel con loop infinito
      ══════════════════════════════════════ */}
      {BA.categorias_carousel &&
        (() => {
        const carouselItems: {
          imagen_url: string
          nombre: string
          link: string
          id?: string
        }[] =
          EDITORIAL.categorias_carousel.items.length > 0
            ? EDITORIAL.categorias_carousel.items
            : topCategories.map((cat) => ({
                id: cat.id,
                imagen_url: '',
                nombre: cat.nombre,
                link: '',
              }))

        if (carouselItems.length === 0) return null

        return (
          <section className="bg-[#111111] py-10">
            <div className="mx-auto max-w-[1200px] px-4 md:px-6">
              <div className="mb-6 flex items-center gap-2.5">
                <div className="h-5 w-1 bg-[#CC4B37]" />
                <h2
                  className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-white"
                  style={jost}
                >
                  Categorías
                </h2>
              </div>
              {/* Carrusel con degradados laterales */}
              <div className="relative">
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#111111] to-transparent" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#111111] to-transparent" />
                <div
                  className="flex gap-3 overflow-x-auto px-4 pb-2 md:px-0"
                  style={{
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {carouselItems.map((cat, idx) => {
                    const isDbCat = !!cat.id
                    const isSelected = isDbCat && filtroCategoriaId === cat.id
                    return (
                      <div
                        key={idx}
                        className="shrink-0"
                        style={{
                          scrollSnapAlign: 'start',
                          width: 'clamp(140px, 42vw, 260px)',
                          height: 'clamp(100px, 28vw, 175px)',
                        }}
                      >
                        {isDbCat ? (
                          <button
                            type="button"
                            onClick={() =>
                              setFiltroCategoriaId(isSelected ? '' : (cat.id as string))
                            }
                            className="group relative h-full w-full overflow-hidden text-left transition-all hover:scale-[1.03]"
                            style={{
                              backgroundColor: isSelected ? '#CC4B37' : '#1A1A1A',
                              outline: isSelected ? '2px solid #CC4B37' : 'none',
                              outlineOffset: 2,
                            }}
                          >
                            {cat.imagen_url && (
                              <img
                                src={cat.imagen_url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                style={{ opacity: isSelected ? 0.6 : 0.45 }}
                              />
                            )}
                            {!cat.imagen_url && (
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                  backgroundImage:
                                    'radial-gradient(circle, #CC4B37 1px, transparent 1px)',
                                  backgroundSize: '14px 14px',
                                }}
                              />
                            )}
                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                              <p
                                className="text-center text-[10px] font-extrabold uppercase leading-tight text-white"
                                style={jost}
                              >
                                {cat.nombre}
                              </p>
                            </div>
                            <div
                              className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${isSelected ? 'w-full bg-white' : 'w-0 bg-[#CC4B37] group-hover:w-full'}`}
                            />
                          </button>
                        ) : (
                          <a
                            href={cat.link || '/store'}
                            className="group relative flex h-full w-full overflow-hidden transition-all hover:scale-[1.03]"
                            style={{ backgroundColor: '#1A1A1A' }}
                          >
                            {cat.imagen_url && (
                              <img
                                src={cat.imagen_url}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                style={{ opacity: 0.45 }}
                              />
                            )}
                            {!cat.imagen_url && (
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                  backgroundImage:
                                    'radial-gradient(circle, #CC4B37 1px, transparent 1px)',
                                  backgroundSize: '14px 14px',
                                }}
                              />
                            )}
                            <div
                              className="absolute inset-0"
                              style={{
                                background:
                                  'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)',
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                              <p
                                className="text-center text-[10px] font-extrabold uppercase leading-tight text-white"
                                style={jost}
                              >
                                {cat.nombre}
                              </p>
                            </div>
                            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#CC4B37] transition-all duration-300 group-hover:w-full" />
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )
      })()}

      {/* ══════════════════════════════════════
          PROMO BANNER — Full width oscuro
      ══════════════════════════════════════ */}
      {BA.promoBanner && (
      <section className="relative overflow-hidden border-y border-[#EEEEEE] bg-[#F5F5F5]">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
          <div className="relative overflow-hidden bg-[#0A0A0A]">
            {EDITORIAL.promoBanner.imagen_url && (
              <img
                src={EDITORIAL.promoBanner.imagen_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ opacity: 0.3 }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(105deg, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 55%, rgba(0,0,0,0.3) 100%)',
              }}
            />
            <div className="relative z-10 flex flex-col gap-4 px-7 py-9 md:flex-row md:items-center md:justify-between md:px-12 md:py-10">
              <div>
                <h3
                  className="max-w-[480px] text-[1.5rem] font-extrabold uppercase leading-tight text-white md:text-[2rem]"
                  style={jost}
                >
                  {EDITORIAL.promoBanner.titulo}
                </h3>
                <p className="mt-2 max-w-[380px] text-[13px] leading-relaxed text-white/50" style={lato}>
                  {EDITORIAL.promoBanner.descripcion}
                </p>
              </div>
              <Link
                href={EDITORIAL.promoBanner.cta_link}
                className="inline-flex shrink-0 items-center gap-2 border border-white/30 px-7 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-all hover:bg-white hover:text-[#0A0A0A]"
                style={jost}
              >
                {EDITORIAL.promoBanner.cta_texto}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ══════════════════════════════════════
          HEADER SECCIÓN PRODUCTOS
      ══════════════════════════════════════ */}
      <div id="productos" className="border-b border-[#EEEEEE] bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-1 bg-[#CC4B37]" />
            <h2
              className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-[#111111]"
              style={jost}
            >
              Todos los productos
            </h2>
            <span className="ml-1 text-[11px] text-[#AAAAAA]" style={lato}>
              ({filtered.length})
            </span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFiltroCondicion('')
                  setFiltroCategoriaId('')
                  setFiltroMarcaId('')
                  setFiltroSoloStock(false)
                }}
                className="text-[11px] text-[#CC4B37] hover:underline"
                style={lato}
              >
                Limpiar filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className={`flex items-center gap-1.5 border px-3 py-2 text-[11px] transition-colors ${activeCount > 0 ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]' : 'border-[#EEEEEE] bg-white text-[#666666] hover:border-[#CCCCCC]'}`}
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
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white"
                  style={jost}
                >
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          GRID DE PRODUCTOS
      ══════════════════════════════════════ */}
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <div className="mb-4 flex items-center justify-between md:hidden">
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

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center bg-[#F4F4F4]">
              <svg
                width="32"
                height="32"
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
            </div>
            <p className="text-[14px] font-extrabold uppercase text-[#666666]" style={jost}>
              Sin productos
            </p>
            <p className="mt-2 max-w-[240px] text-[13px] text-[#999999]" style={lato}>
              {products.length === 0
                ? 'Aún no hay productos en la tienda'
                : 'Sin resultados con estos filtros'}
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
                className="mt-4 bg-[#CC4B37] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white"
                style={jost}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} brands={brands} />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          FOOTER STORE — Confianza + info
      ══════════════════════════════════════ */}
      {BA.footer && (
      <footer className="border-t border-[#EEEEEE] bg-[#111111] px-4 py-10 md:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {trustItems.map(({ icon, titulo, desc }) => (
              <div key={titulo} className="flex flex-col gap-2">
                <span className="flex h-9 w-9 items-center justify-center border border-white/10 bg-white/5">
                  {icon}
                </span>
                <p
                  className="text-[11px] font-extrabold uppercase tracking-wide text-white"
                  style={jost}
                >
                  {titulo}
                </p>
                <p className="text-[11px] leading-relaxed text-white/40" style={lato}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center bg-[#CC4B37]">
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
                </svg>
              </span>
              <span
                className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white"
                style={jost}
              >
                AIR<span className="text-[#CC4B37]">NATION</span> STORE
              </span>
            </div>
            <p className="text-[10px] text-white/30" style={lato}>
              © {new Date().getFullYear()} AirNation · Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
      )}

      {/* ══════════════════════════════════════
          DRAWER DE FILTROS
      ══════════════════════════════════════ */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-[290px] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-0.5 bg-[#CC4B37]" />
            <span
              className="text-[12px] font-extrabold uppercase tracking-[0.15em] text-[#111111]"
              style={jost}
            >
              Filtros
            </span>
            {activeCount > 0 && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white"
                style={jost}
              >
                {activeCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#111111]"
            style={lato}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
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

        <div className="py-2">
          {/* Categorías */}
          <div className="border-b border-[#EEEEEE] pb-2">
            <button
              type="button"
              onClick={() => {
                setFiltroCategoriaId('')
                setDrawerCatExpandida(null)
              }}
              className={`flex w-full items-center px-4 py-3 text-[12px] font-bold uppercase tracking-wide transition-colors ${!filtroCategoriaId ? 'text-[#CC4B37]' : 'text-[#111111] hover:bg-[#F7F7F7]'}`}
              style={jost}
            >
              Todos los productos
            </button>
            {topCategories.map((cat) => {
              const subs = categories.filter((c) => c.parent_id === cat.id)
              const isExpanded = drawerCatExpandida === cat.id
              const isSelected =
                filtroCategoriaId === cat.id ||
                categories.some((c) => c.parent_id === cat.id && c.id === filtroCategoriaId)
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
                    className={`flex w-full items-center justify-between px-4 py-3 text-[12px] font-bold uppercase tracking-wide transition-colors ${isSelected ? 'text-[#CC4B37]' : 'text-[#111111] hover:bg-[#F7F7F7]'}`}
                    style={jost}
                  >
                    {cat.nombre}
                    {subs.length > 0 && (
                      <span
                        className={`flex h-5 w-5 items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-[#CC4B37]' : 'bg-[#EEEEEE]'}`}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
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
                  {isExpanded && subs.length > 0 && (
                    <div className="bg-[#F7F7F7]">
                      {subs.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() =>
                            setFiltroCategoriaId(filtroCategoriaId === sub.id ? cat.id : sub.id)
                          }
                          className={`flex w-full items-center gap-2 px-8 py-2.5 text-left text-[11px] transition-colors ${filtroCategoriaId === sub.id ? 'font-bold text-[#CC4B37]' : 'text-[#555555] hover:text-[#111111]'}`}
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
            <div className="border-b border-[#EEEEEE]">
              <button
                type="button"
                onClick={() => setDrawerMarcasOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-[12px] font-bold uppercase tracking-wide text-[#111111] hover:bg-[#F7F7F7]"
                style={jost}
              >
                Marca
                <span
                  className={`flex h-5 w-5 items-center justify-center transition-transform ${drawerMarcasOpen ? 'rotate-180 bg-[#CC4B37]' : 'bg-[#EEEEEE]'}`}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 9l6 6 6-6"
                      stroke={drawerMarcasOpen ? 'white' : '#666'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
              {drawerMarcasOpen && (
                <div className="bg-[#F7F7F7]">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setFiltroMarcaId(filtroMarcaId === b.id ? '' : b.id)}
                      className={`flex w-full items-center gap-2 px-8 py-2.5 text-left text-[11px] transition-colors ${filtroMarcaId === b.id ? 'font-bold text-[#CC4B37]' : 'text-[#555555] hover:text-[#111111]'}`}
                      style={lato}
                    >
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
              className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#AAAAAA]"
              style={jost}
            >
              Condición
            </p>
            {(['', 'nuevo', 'outlet'] as const).map((val) => (
              <button
                key={val || 'all'}
                type="button"
                onClick={() => setFiltroCondicion(val)}
                className={`w-full py-2 text-left text-[12px] transition-colors ${filtroCondicion === val ? 'font-bold text-[#CC4B37]' : 'text-[#444444] hover:text-[#111111]'}`}
                style={lato}
              >
                {val === '' ? 'Todos' : val === 'nuevo' ? 'Nuevo' : 'Outlet'}
              </button>
            ))}
          </div>

          {/* Solo en stock */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => setFiltroSoloStock((v) => !v)}
              className={`flex w-full items-center gap-2.5 py-2 text-[12px] transition-colors ${filtroSoloStock ? 'font-bold text-[#CC4B37]' : 'text-[#444444]'}`}
              style={lato}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center border ${filtroSoloStock ? 'border-[#CC4B37] bg-[#CC4B37]' : 'border-[#CCCCCC]'}`}
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

          <div className="border-t border-[#EEEEEE] px-4 py-3">
            <Link
              href="/store/pedidos"
              onClick={() => setDrawerOpen(false)}
              className="flex w-full items-center justify-center gap-2 border border-[#EEEEEE] py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#666666]"
              style={jost}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Mis pedidos
            </Link>
          </div>

          {/* Limpiar */}
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
