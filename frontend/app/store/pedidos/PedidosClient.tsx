'use client'

import Link from 'next/link'
import { useState } from 'react'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  nueva:           { label: 'Recibido',         color: '#666666', bg: '#F4F4F4',  icon: '📋' },
  pago_confirmado: { label: 'Pago confirmado',   color: '#1D4ED8', bg: '#EFF6FF',  icon: '✅' },
  en_preparacion:  { label: 'En preparación',    color: '#D97706', bg: '#FFFBEB',  icon: '📦' },
  enviado:         { label: 'En camino',          color: '#059669', bg: '#F0FDF4',  icon: '🚚' },
  entregado:       { label: 'Entregado',          color: '#111111', bg: '#F4F4F4',  icon: '🎉' },
  cancelado:       { label: 'Cancelado',          color: '#CC4B37', bg: '#FFF5F4',  icon: '✕' },
}

function str(v: unknown): string { return v != null ? String(v) : '' }
function num(v: unknown): number { const n = Number(v); return isFinite(n) ? n : 0 }

type Props = {
  orders: Record<string, unknown>[]
  items: Record<string, unknown>[]
}

export function PedidosClient({ orders, items }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    orders.length === 1 ? str(orders[0].id) : null
  )

  if (orders.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F7F7]">
        <Header />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center bg-[#F4F4F4]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#CCCCCC]" aria-hidden>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[14px] font-extrabold uppercase text-[#666666]" style={jost}>
            Aún no tienes pedidos
          </p>
          <p className="mt-1 text-[13px] text-[#999999]" style={lato}>
            Cuando hagas tu primera compra aparecerá aquí.
          </p>
          <Link href="/store"
            className="mt-5 bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white"
            style={jost}>
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Header />
      <div className="mx-auto max-w-[720px] px-4 py-6 md:py-8">
        <div className="flex flex-col gap-3">
          {orders.map(order => {
            const id = str(order.id)
            const isExpanded = expandedId === id
            const status = str(order.status_interno) || 'nueva'
            const meta = STATUS_META[status] ?? STATUS_META.nueva
            const orderItems = items.filter(i => str(i.order_id) === id)
            const total = num(order.total)
            const metodo = str(order.metodo_pago)
            const guia_numero = str(order.guia_numero)
            const guia_paqueteria = str(order.guia_paqueteria)
            const transferencia_confirmada = Boolean(order.transferencia_confirmada)
            const fecha = order.created_at
              ? new Date(str(order.created_at)).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })
              : '—'

            const primeraFoto = orderItems[0]
              ? str(orderItems[0].foto_url)
              : null

            return (
              <div key={id} className={`border bg-white transition-colors ${isExpanded ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'}`}>
                <button type="button"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-[#FAFAFA] transition-colors">
                  <div className="h-12 w-12 shrink-0 border border-[#EEEEEE] bg-[#F4F4F4]">
                    {primeraFoto
                      ? <img src={primeraFoto} alt="" className="h-full w-full object-contain p-1"/>
                      : <div className="flex h-full w-full items-center justify-center text-[#DDDDDD]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                          </svg>
                        </div>
                    }
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-extrabold text-[#CC4B37]" style={jost}>
                        #{str(order.order_number)}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase"
                        style={{ ...jost, backgroundColor: meta.bg, color: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#999999]" style={lato}>
                      {fecha} · {orderItems.length} {orderItems.length === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[14px] font-extrabold text-[#111111]" style={jost}>
                      ${total.toLocaleString('es-MX')}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      className={`text-[#999999] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#EEEEEE] px-4 py-5">

                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        {['nueva', 'pago_confirmado', 'en_preparacion', 'enviado', 'entregado'].map((s, i) => {
                          const m = STATUS_META[s]
                          const steps = ['nueva', 'pago_confirmado', 'en_preparacion', 'enviado', 'entregado']
                          const currentIdx = steps.indexOf(status)
                          const isDone = i <= currentIdx && status !== 'cancelado'
                          const isCurrent = s === status && status !== 'cancelado'
                          return (
                            <div key={s} className="flex flex-1 flex-col items-center gap-1">
                              {i > 0 && (
                                <div className="absolute" style={{ display: 'none' }} />
                              )}
                              <div className={`flex h-8 w-8 items-center justify-center text-[14px] transition-all ${isCurrent ? 'scale-110' : ''} ${isDone ? 'opacity-100' : 'opacity-30'}`}>
                                {m.icon}
                              </div>
                              <p className={`text-center text-[8px] font-extrabold uppercase leading-tight ${isDone ? 'text-[#111111]' : 'text-[#CCCCCC]'}`}
                                style={jost}>
                                {m.label}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      {status !== 'cancelado' && (() => {
                        const steps = ['nueva', 'pago_confirmado', 'en_preparacion', 'enviado', 'entregado']
                        const idx = steps.indexOf(status)
                        const pct = Math.max(0, (idx / (steps.length - 1)) * 100)
                        return (
                          <div className="relative mt-2 h-1 w-full bg-[#EEEEEE]">
                            <div className="absolute left-0 top-0 h-full bg-[#CC4B37] transition-all"
                              style={{ width: `${pct}%` }} />
                          </div>
                        )
                      })()}
                      {status === 'cancelado' && (
                        <div className="mt-2 flex items-center justify-center gap-2 bg-[#FFF5F4] py-2">
                          <span className="text-[11px] font-bold text-[#CC4B37]" style={jost}>Pedido cancelado</span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]" style={jost}>
                        Productos
                      </p>
                      <ul className="flex flex-col gap-2">
                        {orderItems.map((item, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 border border-[#EEEEEE] bg-[#F4F4F4]">
                              {str(item.foto_url)
                                ? <img src={str(item.foto_url)} alt="" className="h-full w-full object-contain p-0.5"/>
                                : <div className="h-full w-full bg-[#EEEEEE]" />
                              }
                            </div>
                            <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
                              <p className="truncate text-[12px] text-[#333333]" style={lato}>{str(item.nombre)}</p>
                              <p className="shrink-0 text-[12px] font-bold text-[#111111]" style={jost}>
                                x{num(item.cantidad)} — ${(num(item.precio_unit) * num(item.cantidad)).toLocaleString('es-MX')}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4 border border-[#EEEEEE] p-3">
                      <div className="flex flex-col gap-1.5 text-[12px]">
                        <div className="flex justify-between">
                          <span className="text-[#666666]" style={lato}>Subtotal</span>
                          <span style={jost}>${num(order.subtotal).toLocaleString('es-MX')}</span>
                        </div>
                        {num(order.descuento_monto) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[#22C55E]" style={lato}>Descuento</span>
                            <span className="text-[#22C55E]" style={jost}>−${num(order.descuento_monto).toLocaleString('es-MX')}</span>
                          </div>
                        )}
                        {order.costo_envio != null && num(order.costo_envio) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[#666666]" style={lato}>Envío</span>
                            <span style={jost}>${num(order.costo_envio).toLocaleString('es-MX')}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[#EEEEEE] pt-1.5">
                          <span className="font-extrabold text-[#111111]" style={jost}>Total</span>
                          <span className="font-extrabold text-[#111111]" style={jost}>${total.toLocaleString('es-MX')}</span>
                        </div>
                      </div>
                    </div>

                    {metodo === 'transferencia' && !transferencia_confirmada && status === 'nueva' && (
                      <div className="mb-4 border border-[#D97706] bg-[#FFFBEB] p-3">
                        <p className="text-[11px] font-bold text-[#D97706]" style={jost}>
                          ⏳ Transferencia pendiente de confirmación
                        </p>
                        <p className="mt-1 text-[11px] text-[#666666]" style={lato}>
                          Una vez que realices el pago y lo confirmemos, tu pedido avanzará automáticamente.
                        </p>
                      </div>
                    )}

                    {guia_numero && (
                      <div className="mb-4 border border-[#059669] bg-[#F0FDF4] p-3">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#059669]" style={jost}>
                          🚚 Tu pedido va en camino
                        </p>
                        <p className="mt-1 text-[12px] text-[#333333]" style={lato}>
                          {guia_paqueteria && <strong>{guia_paqueteria}: </strong>}
                          {guia_numero}
                        </p>
                      </div>
                    )}

                    {(() => {
                      const dir = (order.direccion_envio ?? {}) as Record<string, string>
                      return (
                        <div className="text-[11px] text-[#999999]" style={lato}>
                          <span className="font-bold text-[#666666]">Entrega en: </span>
                          {dir.calle} {dir.numero}{dir.colonia ? `, ${dir.colonia}` : ''}, {dir.ciudad}, {dir.estado}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <header className="border-b border-[#EEEEEE] bg-white px-4 py-4">
      <div className="mx-auto flex max-w-[720px] items-center gap-3">
        <Link href="/store"
          className="flex items-center gap-1.5 text-[#666666] hover:text-[#111111] transition-colors shrink-0"
          style={lato}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <Link href="/store" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
            </svg>
          </span>
          <span className="text-[1rem] font-black uppercase tracking-[0.18em] text-[#111111]" style={jost}>
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </Link>
        <h1 className="text-[13px] font-extrabold uppercase tracking-wide text-[#111111]" style={jost}>
          · Mis pedidos
        </h1>
      </div>
    </header>
  )
}
