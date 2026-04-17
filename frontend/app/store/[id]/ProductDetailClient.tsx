'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { StoreBrand, StoreCategory, StoreProduct } from '@/app/store/types'

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
  const [cantidad, setCantidad] = useState(1)
  const [tab, setTab] = useState<'descripcion' | 'specs' | 'incluye'>('descripcion')

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
      <header className="sticky top-0 z-30 border-b border-[#EEEEEE] bg-white">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-3 px-4 md:px-6">
          <Link href="/store"
            className="flex items-center gap-1.5 text-[12px] text-[#666666] hover:text-[#111111] transition-colors"
            style={lato}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Volver a la tienda
          </Link>
          {category && (
            <>
              <span className="text-[#EEEEEE]">/</span>
              <span className="text-[12px] text-[#999999]" style={lato}>{category.nombre}</span>
            </>
          )}
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
                  className="w-full bg-[#CC4B37] py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                  style={jost}>
                  Agregar al carrito
                </button>

                <button type="button"
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
              <span className="border border-[#EEEEEE] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#666666]" style={jost}>
                svg icono tarjeta Tarjeta
              </span>
              <span className="border border-[#EEEEEE] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#666666]" style={jost}>
                svg decide icono de transferencia a lo mejor un $ y correo no lo se Transferencia
              </span>
              <span className="border border-[#EEEEEE] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#666666]" style={jost}>
                define icono de deposito, $ y flecha abajo, no lo se Depósito
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
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#444444]" style={lato}>
                {product.descripcion || 'Sin descripción disponible.'}
              </p>
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {related.map(rel => {
                const foto = rel.fotos_urls?.[0] ?? null
                return (
                  <Link key={rel.id} href={`/store/${rel.id}`}
                    className="flex flex-col overflow-hidden border border-[#E8E8E8] bg-white transition-all hover:border-[#CC4B37] hover:shadow-sm">
                    <div className="relative w-full bg-[#F4F4F4]" style={{ aspectRatio: '1/1' }}>
                      {foto
                        ? <img src={foto} alt="" className="h-full w-full object-contain p-2"/>
                        : <div className="flex h-full w-full items-center justify-center text-[#CCCCCC]">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                            </svg>
                          </div>
                      }
                    </div>
                    <div className="p-2">
                      <p className="line-clamp-2 text-[11px] leading-snug text-[#333333]" style={lato}>{rel.nombre}</p>
                      <p className="mt-1 text-[13px] font-extrabold text-[#111111]" style={jost}>${rel.precio.toLocaleString('es-MX')}</p>
                      {rel.stock === 0
                        ? <p className="text-[10px] text-[#CC4B37]" style={lato}>Agotado</p>
                        : <p className="text-[10px] text-[#22C55E]" style={lato}>✓ En stock</p>
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
