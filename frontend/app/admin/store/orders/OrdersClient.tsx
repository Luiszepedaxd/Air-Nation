'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  updateOrderStatus,
  updateOrderEnvio,
  confirmarTransferencia,
} from './order-actions'
import type { OrderStatus } from './order-actions'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const }
const lato = { fontFamily: "'Lato', sans-serif" }

const STATUS_META: Record<OrderStatus, { label: string; labelAdmin: string; color: string; bg: string }> = {
  nueva:           { label: 'Pedido recibido',                     labelAdmin: 'Nueva orden',     color: '#111111', bg: '#F4F4F4' },
  pago_confirmado: { label: 'Pago confirmado',                     labelAdmin: 'Pago confirmado', color: '#FFFFFF', bg: '#1D4ED8' },
  en_preparacion:  { label: 'Preparando tu arsenal',               labelAdmin: 'En preparacion',  color: '#FFFFFF', bg: '#D97706' },
  enviado:         { label: 'Tu pedido salio del Cuartel General', labelAdmin: 'Enviado',         color: '#FFFFFF', bg: '#059669' },
  entregado:       { label: 'Mision cumplida',                     labelAdmin: 'Entregado',       color: '#FFFFFF', bg: '#111111' },
  cancelado:       { label: 'Pedido cancelado',                    labelAdmin: 'Cancelado',       color: '#FFFFFF', bg: '#CC4B37' },
}

// Flujo lineal de avance
const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  nueva:           { status: 'pago_confirmado', label: 'Confirmar pago' },
  pago_confirmado: { status: 'en_preparacion',  label: 'Iniciar preparacion' },
  en_preparacion:  { status: 'enviado',          label: 'Marcar como enviado' },
  enviado:         { status: 'entregado',         label: 'Confirmar entrega' },
}

// Órdenes activas vs cerradas
const CLOSED_STATUSES: OrderStatus[] = ['entregado', 'cancelado']

// Orden de prioridad — más atrasadas primero
const STATUS_PRIORITY: Record<string, number> = {
  nueva: 0,
  pago_confirmado: 1,
  en_preparacion: 2,
  enviado: 3,
  entregado: 4,
  cancelado: 5,
}

function str(v: unknown): string { return v != null ? String(v) : '' }
function num(v: unknown): number { const n = Number(v); return isFinite(n) ? n : 0 }
function bool(v: unknown): boolean { return Boolean(v) }

type OrderRow = Record<string, unknown>
type ItemRow = Record<string, unknown>
type ProfileRow = Record<string, unknown>
type EnvioEditState = { costo_envio: string; guia_numero: string; guia_paqueteria: string; notas_internas: string }
type Props = { orders: OrderRow[]; items: ItemRow[]; profiles: ProfileRow[] }

export function OrdersClient({ orders, items }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedEnvioId, setExpandedEnvioId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterMetodo, setFilterMetodo] = useState<'transferencia' | 'tarjeta' | ''>('')
  const [activeTab, setActiveTab] = useState<'activas' | 'cerradas'>('activas')
  const [envioEdit, setEnvioEdit] = useState<Record<string, EnvioEditState>>({})
  const [localStatus, setLocalStatus] = useState<Record<string, OrderStatus>>({})

  function getEnvioEdit(id: string, order: OrderRow): EnvioEditState {
    if (envioEdit[id]) return envioEdit[id]
    return {
      costo_envio: order.costo_envio != null ? String(order.costo_envio) : '',
      guia_numero: order.guia_numero != null ? String(order.guia_numero) : '',
      guia_paqueteria: order.guia_paqueteria != null ? String(order.guia_paqueteria) : '',
      notas_internas: order.notas_internas != null ? String(order.notas_internas) : '',
    }
  }

  function setEnvioField(id: string, order: OrderRow, key: keyof EnvioEditState, value: string) {
    setEnvioEdit(prev => ({ ...prev, [id]: { ...getEnvioEdit(id, order), [key]: value } }))
  }

  const sorted = [...orders].sort((a, b) => {
    const pa = STATUS_PRIORITY[str(a.status_interno)] ?? 99
    const pb = STATUS_PRIORITY[str(b.status_interno)] ?? 99
    if (pa !== pb) return pa - pb
    return new Date(str(a.created_at)).getTime() - new Date(str(b.created_at)).getTime()
  })

  const activeOrders = sorted.filter(o => {
    const s = (localStatus[str(o.id)] ?? str(o.status_interno)) as OrderStatus
    return !CLOSED_STATUSES.includes(s)
  })

  const closedOrders = sorted.filter(o => {
    const s = (localStatus[str(o.id)] ?? str(o.status_interno)) as OrderStatus
    return CLOSED_STATUSES.includes(s)
  })

  const displayOrders = (activeTab === 'activas' ? activeOrders : closedOrders)
    .filter(o => !filterMetodo || str(o.metodo_pago) === filterMetodo)

  async function handleNextStatus(id: string, next: OrderStatus) {
    setLoadingId(id); setError(null)
    const res = await updateOrderStatus(id, next)
    setLoadingId(null)
    if ('error' in res) { setError(res.error); return }
    setLocalStatus(prev => ({ ...prev, [id]: next }))
    router.refresh()
  }

  async function handleCancelar(id: string) {
    if (!confirm('¿Cancelar este pedido? Esta acción enviará un email al comprador.')) return
    setLoadingId(id); setError(null)
    const res = await updateOrderStatus(id, 'cancelado')
    setLoadingId(null)
    if ('error' in res) { setError(res.error); return }
    setLocalStatus(prev => ({ ...prev, [id]: 'cancelado' }))
    router.refresh()
  }

  async function handleConfirmarTransferencia(id: string) {
    setLoadingId(id); setError(null)
    const res = await confirmarTransferencia(id)
    setLoadingId(null)
    if ('error' in res) { setError(res.error); return }
    setLocalStatus(prev => ({ ...prev, [id]: 'pago_confirmado' }))
    router.refresh()
  }

  async function handleGuardarEnvio(id: string, order: OrderRow) {
    setLoadingId(id); setError(null)
    const edit = getEnvioEdit(id, order)
    const res = await updateOrderEnvio(id, {
      costo_envio: edit.costo_envio ? Number(edit.costo_envio) : undefined,
      guia_numero: edit.guia_numero || undefined,
      guia_paqueteria: edit.guia_paqueteria || undefined,
      notas_internas: edit.notas_internas || undefined,
    })
    setLoadingId(null)
    if ('error' in res) { setError(res.error); return }
    setExpandedEnvioId(null)
    router.refresh()
  }

  const inputCls = 'w-full border border-[#E4E4E4] bg-white px-2.5 py-2 text-[12px] text-[#111111] outline-none focus:border-[#111111]'

  return (
    <div className="flex flex-col gap-4" style={lato}>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEEEE] pb-4">
        <div>
          <h1 className="text-[16px] tracking-[0.12em] text-[#111111]" style={jost}>Ordenes</h1>
          <p className="mt-0.5 text-[12px] text-[#999999]">
            {activeOrders.length} activas · {closedOrders.length} cerradas
          </p>
        </div>
        <select
          className="border border-[#EEEEEE] bg-white px-3 py-2 text-[11px] text-[#111111] outline-none"
          style={jost}
          value={filterMetodo}
          onChange={e => setFilterMetodo(e.target.value as 'transferencia' | 'tarjeta' | '')}>
          <option value="">Todos los metodos</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
      </div>

      <div className="flex gap-0 border-b border-[#EEEEEE]">
        {([
          { id: 'activas', label: `Activas (${activeOrders.length})` },
          { id: 'cerradas', label: `Cerradas (${closedOrders.length})` },
        ] as const).map(t => (
          <button key={t.id} type="button"
            onClick={() => { setActiveTab(t.id); setExpandedId(null) }}
            className={`px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide transition-colors border-b-2 ${
              activeTab === t.id
                ? 'border-[#CC4B37] text-[#CC4B37]'
                : 'border-transparent text-[#999999] hover:text-[#111111]'
            }`}
            style={jost}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]">{error}</p>
        </div>
      )}

      {displayOrders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[13px] font-extrabold uppercase text-[#666666]" style={jost}>
            {activeTab === 'activas' ? 'Sin ordenes activas' : 'Sin ordenes cerradas'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayOrders.map(order => {
            const id = str(order.id)
            const isExpanded = expandedId === id
            const isEnvioExpanded = expandedEnvioId === id
            const isLoading = loadingId === id
            const status = (localStatus[id] ?? str(order.status_interno)) as OrderStatus
            const meta = STATUS_META[status] ?? STATUS_META.nueva
            const metodo = str(order.metodo_pago)
            const total = num(order.total)
            const transferencia_confirmada = bool(order.transferencia_confirmada)
            const dir = (order.direccion_envio ?? {}) as Record<string, string>
            const nombreComprador = dir.nombre || str(order.guest_nombre) || str(order.guest_email) || '—'
            const orderItems = items.filter(i => str(i.order_id) === id)
            const edit = getEnvioEdit(id, order)
            const nextStep = NEXT_STATUS[status]

            const fecha = order.created_at
              ? new Date(str(order.created_at)).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : '—'

            return (
              <div key={id} className={`border transition-colors ${isExpanded ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'} bg-white`}>

                <button type="button"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]">
                  <span className="shrink-0 text-[12px] font-extrabold text-[#CC4B37]" style={jost}>
                    #{str(order.order_number)}
                  </span>
                  <span className="shrink-0 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
                    style={{ ...jost, backgroundColor: meta.bg, color: meta.color }}>
                    {meta.labelAdmin}
                  </span>
                  <span className="flex-1 truncate text-[12px] text-[#333333]" style={lato}>
                    {nombreComprador}
                  </span>
                  <span className={`shrink-0 text-[10px] font-bold uppercase ${metodo === 'transferencia' ? 'text-[#1D4ED8]' : 'text-[#059669]'}`} style={jost}>
                    {metodo === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                  </span>
                  <span className="shrink-0 text-[13px] font-extrabold text-[#111111]" style={jost}>
                    ${total.toLocaleString('es-MX')}
                  </span>
                  <span className="hidden shrink-0 text-[10px] text-[#AAAAAA] md:block" style={lato}>
                    {fecha}
                  </span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    className={`shrink-0 text-[#999999] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#EEEEEE] bg-[#FAFAFA] p-5">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]" style={jost}>Comprador</p>
                          <div className="flex flex-col gap-1 text-[12px]" style={lato}>
                            <span className="font-bold text-[#111111]">{nombreComprador}</span>
                            {dir.email && <span className="text-[#666666]">{dir.email}</span>}
                            {dir.telefono && <span className="text-[#666666]">{dir.telefono}</span>}
                            <span className="text-[#666666]">
                              {dir.calle} {dir.numero}{dir.colonia ? `, ${dir.colonia}` : ''}<br/>
                              {dir.ciudad}, {dir.estado} CP {dir.cp}
                            </span>
                            {dir.referencias && <span className="text-[#999999]">Ref: {dir.referencias}</span>}
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]" style={jost}>Productos</p>
                          <ul className="flex flex-col gap-2">
                            {orderItems.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <div className="h-8 w-8 shrink-0 border border-[#EEEEEE] bg-[#F4F4F4]">
                                  {str(item.foto_url)
                                    ? <img src={str(item.foto_url)} alt="" className="h-full w-full object-contain p-0.5"/>
                                    : <div className="h-full w-full bg-[#EEEEEE]"/>
                                  }
                                </div>
                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                  <span className="truncate text-[11px] text-[#333333]">{str(item.nombre)}</span>
                                  <span className="shrink-0 text-[11px] font-bold text-[#111111]" style={jost}>
                                    x{num(item.cantidad)} — ${(num(item.precio_unit) * num(item.cantidad)).toLocaleString('es-MX')}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border border-[#EEEEEE] bg-white p-3">
                          <div className="flex flex-col gap-1.5 text-[12px]">
                            <div className="flex justify-between">
                              <span className="text-[#666666]" style={lato}>Subtotal</span>
                              <span style={jost}>${num(order.subtotal).toLocaleString('es-MX')}</span>
                            </div>
                            {num(order.descuento_monto) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[#22C55E]" style={lato}>Descuento ({num(order.descuento_pct)}%)</span>
                                <span className="text-[#22C55E]" style={jost}>−${num(order.descuento_monto).toLocaleString('es-MX')}</span>
                              </div>
                            )}
                            {order.costo_envio != null && num(order.costo_envio) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[#666666]" style={lato}>Envio</span>
                                <span style={jost}>${num(order.costo_envio).toLocaleString('es-MX')}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-[#EEEEEE] pt-1.5">
                              <span className="font-extrabold text-[#111111]" style={jost}>Total</span>
                              <span className="font-extrabold text-[#111111]" style={jost}>${num(order.total).toLocaleString('es-MX')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">

                        <div className="flex items-center gap-2 px-3 py-2.5"
                          style={{ backgroundColor: meta.bg }}>
                          <span className="text-[11px] font-extrabold uppercase tracking-wide"
                            style={{ ...jost, color: meta.color }}>
                            {meta.labelAdmin}
                          </span>
                        </div>

                        {metodo === 'transferencia' && !transferencia_confirmada && status === 'nueva' && (
                          <div className="border border-[#1D4ED8] bg-[#EFF6FF] p-3">
                            <p className="mb-2 text-[11px] font-bold text-[#1D4ED8]" style={jost}>
                              Transferencia pendiente
                            </p>
                            <button type="button"
                              onClick={() => handleConfirmarTransferencia(id)}
                              disabled={isLoading}
                              className="w-full bg-[#1D4ED8] py-2.5 text-[10px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
                              style={jost}>
                              {isLoading ? 'Confirmando...' : 'Confirmar pago recibido'}
                            </button>
                          </div>
                        )}
                        {metodo === 'transferencia' && transferencia_confirmada && (
                          <div className="flex items-center gap-2 border border-[#22C55E] bg-[#F0FDF4] px-3 py-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#22C55E]">
                              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="text-[11px] font-bold text-[#22C55E]" style={jost}>Transferencia confirmada</span>
                          </div>
                        )}

                        {(str(order.guia_numero) || str(order.guia_paqueteria)) && (
                          <div className="border border-[#EEEEEE] bg-white p-3">
                            <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]" style={jost}>Guia de envio</p>
                            <p className="text-[12px] font-bold text-[#111111]" style={lato}>
                              {str(order.guia_paqueteria) && <span className="text-[#666666]">{str(order.guia_paqueteria)}: </span>}
                              {str(order.guia_numero)}
                            </p>
                          </div>
                        )}

                        {str(order.notas_internas) && (
                          <div className="border border-[#EEEEEE] bg-[#FFFBEB] p-3">
                            <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]" style={jost}>Notas internas</p>
                            <p className="text-[11px] text-[#666666]" style={lato}>{str(order.notas_internas)}</p>
                          </div>
                        )}

                        {nextStep && (
                          <button type="button"
                            onClick={() => handleNextStatus(id, nextStep.status)}
                            disabled={isLoading || (metodo === 'transferencia' && !transferencia_confirmada && status === 'nueva')}
                            className="w-full bg-[#CC4B37] py-3 text-[11px] font-extrabold uppercase tracking-wide text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                            style={jost}>
                            {isLoading ? 'Procesando...' : nextStep.label}
                          </button>
                        )}

                        {status !== 'cancelado' && (
                          <div className="border border-[#EEEEEE] bg-white">
                            <button type="button"
                              onClick={() => setExpandedEnvioId(isEnvioExpanded ? null : id)}
                              className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-[#FAFAFA] transition-colors">
                              <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#999999]" style={jost}>
                                Datos de envio
                              </span>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                                className={`text-[#999999] transition-transform ${isEnvioExpanded ? 'rotate-180' : ''}`}>
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                            {isEnvioExpanded && (
                              <div className="border-t border-[#EEEEEE] p-3">
                                <div className="flex flex-col gap-2">
                                  <div>
                                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]" style={jost}>Costo de envio</p>
                                    <input type="number" min={0} className={inputCls}
                                      suppressHydrationWarning
                                      value={edit.costo_envio}
                                      onChange={e => setEnvioField(id, order, 'costo_envio', e.target.value)}
                                      placeholder="0.00"/>
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]" style={jost}>Paqueteria</p>
                                    <input type="text" className={inputCls}
                                      suppressHydrationWarning
                                      value={edit.guia_paqueteria}
                                      onChange={e => setEnvioField(id, order, 'guia_paqueteria', e.target.value)}
                                      placeholder="Estafeta, DHL, FedEx..."/>
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]" style={jost}>Numero de guia</p>
                                    <input type="text" className={inputCls}
                                      suppressHydrationWarning
                                      value={edit.guia_numero}
                                      onChange={e => setEnvioField(id, order, 'guia_numero', e.target.value)}
                                      placeholder="Numero de rastreo"/>
                                  </div>
                                  <div>
                                    <p className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]" style={jost}>Notas internas</p>
                                    <textarea rows={2} className={inputCls}
                                      suppressHydrationWarning
                                      value={edit.notas_internas}
                                      onChange={e => setEnvioField(id, order, 'notas_internas', e.target.value)}
                                      placeholder="Solo visibles para admin"/>
                                  </div>
                                  <button type="button"
                                    onClick={() => handleGuardarEnvio(id, order)}
                                    disabled={isLoading}
                                    className="w-full bg-[#111111] py-2 text-[10px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#CC4B37] disabled:opacity-50"
                                    style={jost}>
                                    {isLoading ? 'Guardando...' : 'Guardar'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {status !== 'cancelado' && status !== 'entregado' && (
                          <button type="button"
                            onClick={() => handleCancelar(id)}
                            disabled={isLoading}
                            className="w-full border border-[#CC4B37] py-2 text-[10px] font-extrabold uppercase tracking-wide text-[#CC4B37] hover:bg-[#CC4B37] hover:text-white transition-colors disabled:opacity-50"
                            style={jost}>
                            Cancelar pedido
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
