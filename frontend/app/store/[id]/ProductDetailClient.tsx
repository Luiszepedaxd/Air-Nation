'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { StoreBrand, StoreCategory, StoreProduct } from '@/app/store/types'
import { useCart } from '@/app/store/CartContext'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Props = {
  product: StoreProduct & {
    descripcion: string | null
    specs: Record<string, unknown>
    que_incluye: string | null
    dias_manejo: number
    deporte: string
  }
  brand: StoreBrand | null
  category: StoreCategory | null
  related: StoreProduct[]
}

export function ProductDetailClient({ product, brand, category, related }: Props) {
  const [fotoIdx, setFotoIdx] = useState(0)
  const [descExpanded, setDescExpanded] = useState(false)
  const [cantidad, setCantidad] = useState(1)
  const [tab, setTab] = useState<'descripcion' | 'specs' | 'incluye'>('descripcion')

  const { addItem, count: cartCount, openDrawer } = useCart()

  const fotos = product.fotos_urls.length > 0 ? product.fotos_urls : []
  const fotoActual = fotos[fotoIdx] ?? null
  const agotado = product.stock === 0

  const entregaMin = new Date()
  entregaMin.setDate(entregaMin.getDate() + product.dias_manejo)
  const entregaMax = new Date()
  entregaMax.setDate(entregaMax.getDate() + product.dias_manejo + 5)
  const fmt = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

  const precioTransferencia = product.precio * 0.96

  const hasSpecs = Object.keys(product.specs ?? {}).length > 0

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Barra promo */}
        <div className="bg-[#111111] px-4 py-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white" style={jost}>
            <span className="text-[#CC4B37]">4% DE DESCUENTO</span> AL PAGAR CON TRANSFERENCIA
            <span className="mx-3 text-white/30">·</span>
            ENVIAMOS A <span className="text-[#CC4B37]">TODO MÉXICO</span>
          </p>
        </div>
        {/* Header principal */}
        <div className="border-b border-[#EEEEEE]">
          <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-6">
            {/* Back */}
            <Link href="/store"
              className="flex items-center gap-1.5 text-[12px] text-[#666666] hover:text-[#111111] transition-colors shrink-0"
              style={lato}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Volver a la tienda</span>
            </Link>
            {/* Breadcrumb */}
            {category && (
              <span className="hidden items-center gap-1.5 text-[12px] text-[#999999] sm:flex" style={lato}>
                <span className="text-[#EEEEEE]">/</span>
                {category.nombre}
              </span>
            )}
            {/* Logo centrado en mobile */}
            <div className="flex flex-1 justify-center md:justify-start">
              <Link href="/store" className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center bg-[#CC4B37]">
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
                  </svg>
                </span>
                <span className="text-[0.9rem] font-black uppercase tracking-[0.18em] text-[#111111]" style={jost}>
                  AIR<span className="text-[#CC4B37]">NATION</span>
                </span>
              </Link>
            </div>
            {/* Carrito */}
            <button type="button" onClick={openDrawer}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center text-[#444444] hover:text-[#CC4B37] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white" style={jost}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">

          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden bg-white border border-[#EEEEEE]" style={{ aspectRatio: '1/1' }}>
              {fotoActual ? (
                <img src={fotoActual} alt={product.nombre} className="h-full w-full object-contain p-4"/>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#CCCCCC]">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
              {product.condicion === 'outlet' && (
                <span className="absolute left-3 top-3 bg-[#CC4B37] px-2 py-1 text-[10px] font-extrabold uppercase text-white" style={jost}>OUTLET</span>
              )}
            </div>
            {fotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {fotos.map((f, i) => (
                  <button key={i} type="button" onClick={() => setFotoIdx(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden border-2 bg-white transition-colors ${fotoIdx === i ? 'border-[#CC4B37]' : 'border-[#EEEEEE] hover:border-[#CCCCCC]'}`}>
                    <img src={f} alt="" className="h-full w-full object-contain p-1"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {brand && (
              <p className="text-[11px] font-bold uppercase text-[#CC4B37]" style={jost}>
                {brand.nombre}
              </p>
            )}

            <h1 className="text-2xl font-extrabold uppercase leading-tight text-[#111111] md:text-3xl" style={jost}>
              {product.nombre}
            </h1>

            <div className="flex flex-col gap-1">
              <p className="text-3xl font-extrabold text-[#111111]" style={jost}>
                ${product.precio.toLocaleString('es-MX')}
              </p>
              <p className="text-[12px] text-[#666666]" style={lato}>
                Con transferencia:{' '}
                <span className="font-bold text-[#22C55E]">
                  ${precioTransferencia.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
                <span className="ml-1 text-[#22C55E]">(4% OFF)</span>
              </p>
            </div>

            <div>
              {agotado ? (
                <span className="inline-block bg-[#F4F4F4] px-3 py-1.5 text-[12px] font-bold uppercase text-[#CC4B37]" style={jost}>
                  Agotado
                </span>
              ) : product.stock_visible ? (
                <span className="text-[13px] font-bold text-[#22C55E]" style={lato}>
                  ✓ {product.stock} en stock
                </span>
              ) : (
                <span className="text-[13px] font-bold text-[#22C55E]" style={lato}>
                  ✓ 10+ en stock
                </span>
              )}
            </div>

            {!agotado && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <p className="text-[12px] text-[#666666]" style={lato}>Cantidad:</p>
                  <div className="flex items-center border border-[#EEEEEE]">
                    <button type="button"
                      onClick={() => setCantidad(c => Math.max(1, c - 1))}
                      className="flex h-9 w-9 items-center justify-center text-[#666666] hover:bg-[#F4F4F4] transition-colors">
                      −
                    </button>
                    <span className="flex h-9 w-10 items-center justify-center border-x border-[#EEEEEE] text-[13px] font-bold text-[#111111]" style={lato}>
                      {cantidad}
                    </span>
                    <button type="button"
                      onClick={() => setCantidad(c => product.stock_visible ? Math.min(product.stock, c + 1) : c + 1)}
                      className="flex h-9 w-9 items-center justify-center text-[#666666] hover:bg-[#F4F4F4] transition-colors">
                      +
                    </button>
                  </div>
                </div>

                <button type="button"
                  onClick={() => addItem({
                    product_id: product.id,
                    nombre: product.nombre,
                    foto_url: product.fotos_urls?.[0] ?? null,
                    precio: product.precio,
                  }, cantidad)}
                  className="w-full bg-[#CC4B37] py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                  style={jost}>
                  Agregar al carrito
                </button>

                <button type="button"
                  onClick={() => {
                    addItem({
                      product_id: product.id,
                      nombre: product.nombre,
                      foto_url: product.fotos_urls?.[0] ?? null,
                      precio: product.precio,
                    }, cantidad)
                    window.location.href = '/store/checkout'
                  }}
                  className="w-full border border-[#111111] py-3.5 text-[13px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:bg-[#111111] hover:text-white"
                  style={jost}>
                  Comprar ahora
                </button>
              </div>
            )}

            <div className="border border-[#EEEEEE] bg-white p-3">
              <div className="flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-[#22C55E]" aria-hidden>
                  <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div>
                  <p className="text-[12px] font-bold text-[#111111]" style={lato}>
                    Entrega estimada: {fmt(entregaMin)} – {fmt(entregaMax)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#666666]" style={lato}>
                    Envío a todo México · Pedido protegido
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 border border-[#EEEEEE] bg-white px-2.5 py-1.5" style={jost}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#666666" strokeWidth="1.6"/>
                  <path d="M2 10h20" stroke="#666666" strokeWidth="1.6"/>
                </svg>
                <span className="text-[10px] font-bold uppercase text-[#666666]">Tarjeta</span>
              </span>
              <span className="flex items-center gap-1.5 border border-[#EEEEEE] bg-white px-2.5 py-1.5" style={jost}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#666666" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M9 22V12h6v10" stroke="#666666" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] font-bold uppercase text-[#666666]">Transferencia</span>
              </span>
              <span className="flex items-center gap-1.5 border border-[#EEEEEE] bg-white px-2.5 py-1.5" style={jost}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2L2 7h20L12 2z" stroke="#666666" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M6 10v8M10 10v8M14 10v8M18 10v8" stroke="#666666" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M2 19h20" stroke="#666666" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <span className="text-[10px] font-bold uppercase text-[#666666]">Depósito OXXO/banco</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 border border-[#EEEEEE] bg-white">
          <div className="flex border-b border-[#EEEEEE]">
            {([
              ['descripcion', 'Descripción'],
              ...(hasSpecs ? [['specs', 'Especificaciones']] : []),
              ...(product.que_incluye ? [['incluye', 'Qué incluye']] : []),
            ] as [string, string][]).map(([id, label]) => (
              <button key={id} type="button"
                onClick={() => setTab(id as typeof tab)}
                className={`px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${tab === id ? 'border-b-2 border-[#CC4B37] text-[#CC4B37]' : 'text-[#666666] hover:text-[#111111]'}`}
                style={jost}>
                {label}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === 'descripcion' && (
              <div>
                <p className={`whitespace-pre-wrap text-[13px] leading-relaxed text-[#444444] ${!descExpanded ? 'line-clamp-4' : ''}`} style={lato}>
                  {product.descripcion || 'Sin descripción disponible.'}
                </p>
                {product.descripcion && product.descripcion.length > 200 && (
                  <button type="button"
                    onClick={() => setDescExpanded(v => !v)}
                    className="mt-2 text-[12px] font-bold text-[#CC4B37] hover:underline"
                    style={jost}>
                    {descExpanded ? 'Ver menos ↑' : 'Ver más ↓'}
                  </button>
                )}
              </div>
            )}
            {tab === 'specs' && hasSpecs && (
              <table className="w-full border-collapse text-[12px]">
                <tbody>
                  {Object.entries(product.specs).map(([key, val]) => (
                    <tr key={key} className="border-b border-[#F4F4F4]">
                      <td className="py-2 pr-4 font-bold uppercase text-[#666666] w-[40%]" style={jost}>{key}</td>
                      <td className="py-2 text-[#333333]" style={lato}>{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'incluye' && product.que_incluye && (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#444444]" style={lato}>
                {product.que_incluye}
              </p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-8">
            <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#999999]" style={jost}>
              También te puede interesar
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
              {related.map(rel => {
                const foto = rel.fotos_urls?.[0] ?? null
                return (
                  <Link key={rel.id} href={`/store/${rel.id}`}
                    className="flex w-[140px] shrink-0 flex-col overflow-hidden border border-[#E8E8E8] bg-white transition-all hover:border-[#CC4B37] sm:w-[160px]"
                    style={{ scrollSnapAlign: 'start' }}>
                    <div className="relative w-full bg-[#F4F4F4]" style={{ aspectRatio: '1/1' }}>
                      {foto
                        ? <img src={foto} alt="" className="h-full w-full object-contain p-2"/>
                        : <div className="flex h-full w-full items-center justify-center text-[#CCCCCC]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                            </svg>
                          </div>
                      }
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-[10px] leading-snug text-[#333333]" style={lato}>{rel.nombre}</p>
                      <p className="mt-1 text-[12px] font-extrabold text-[#111111]" style={jost}>${rel.precio.toLocaleString('es-MX')}</p>
                      {rel.stock === 0
                        ? <p className="text-[9px] text-[#CC4B37]" style={lato}>Agotado</p>
                        : <p className="text-[9px] text-[#22C55E]" style={lato}>✓ En stock</p>
                      }
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
