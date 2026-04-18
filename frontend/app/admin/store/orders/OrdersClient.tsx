'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  updateOrderStatus,
  updateOrderEnvio,
  confirmarTransferencia,
} from './order-actions'
import type { OrderStatus } from './order-actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  nueva: { label: 'Nueva', color: '#111111', bg: '#F4F4F4' },
  pago_confirmado: { label: 'Pago confirmado', color: '#FFFFFF', bg: '#1D4ED8' },
  en_preparacion: { label: 'En preparación', color: '#FFFFFF', bg: '#D97706' },
  enviado: { label: 'Enviado', color: '#FFFFFF', bg: '#059669' },
  entregado: { label: 'Entregado', color: '#FFFFFF', bg: '#111111' },
  cancelado: { label: 'Cancelado', color: '#FFFFFF', bg: '#CC4B37' },
}

const STATUS_FLOW: OrderStatus[] = [
  'nueva',
  'pago_confirmado',
  'en_preparacion',
  'enviado',
  'entregado',
  'cancelado',
]

function str(v: unknown): string {
  return v != null ? String(v) : ''
}
function num(v: unknown): number {
  const n = Number(v)
  return isFinite(n) ? n : 0
}
function bool(v: unknown): boolean {
  return Boolean(v)
}

type OrderRow = Record<string, unknown>
type ItemRow = Record<string, unknown>
type ProfileRow = Record<string, unknown>

type EnvioEditState = {
  costo_envio: string
  guia_numero: string
  guia_paqueteria: string
  notas_internas: string
}

type Props = {
  orders: OrderRow[]
  items: ItemRow[]
  profiles: ProfileRow[]
}

export function OrdersClient({ orders, items, profiles }: Props) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterMetodo, setFilterMetodo] = useState<
    'transferencia' | 'tarjeta' | ''
  >('')

  const [envioEdit, setEnvioEdit] = useState<Record<string, EnvioEditState>>({})

  function getEnvioEdit(id: string, order: OrderRow): EnvioEditState {
    return (
      envioEdit[id] ?? {
        costo_envio: str(order.costo_envio),
        guia_numero: str(order.guia_numero),
        guia_paqueteria: str(order.guia_paqueteria),
        notas_internas: str(order.notas_internas),
      }
    )
  }

  function setEnvioField(
    id: string,
    order: OrderRow,
    key: keyof EnvioEditState,
    value: string
  ) {
    setEnvioEdit((prev) => ({
      ...prev,
      [id]: { ...getEnvioEdit(id, order), [key]: value },
    }))
  }

  const filtered = orders.filter((o) => {
    if (filterStatus && str(o.status_interno) !== filterStatus) return false
    if (filterMetodo && str(o.metodo_pago) !== filterMetodo) return false
    return true
  })

  async function handleStatus(id: string, status: OrderStatus) {
    setLoadingId(id)
    setError(null)
    const res = await updateOrderStatus(id, status)
    setLoadingId(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  async function handleConfirmarTransferencia(id: string) {
    setLoadingId(id)
    setError(null)
    const res = await confirmarTransferencia(id)
    setLoadingId(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  async function handleGuardarEnvio(id: string, order: OrderRow) {
    setLoadingId(id)
    setError(null)
    const edit = getEnvioEdit(id, order)
    const res = await updateOrderEnvio(id, {
      costo_envio: edit.costo_envio ? Number(edit.costo_envio) : undefined,
      guia_numero: edit.guia_numero || undefined,
      guia_paqueteria: edit.guia_paqueteria || undefined,
      notas_internas: edit.notas_internas || undefined,
    })
    setLoadingId(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-2.5 py-2 text-[12px] text-[#111111] outline-none focus:border-[#111111]'

  return (
    <div className="flex flex-col gap-4" style={lato}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEEEE] pb-4">
        <div>
          <h1 className="text-[16px] tracking-[0.12em] text-[#111111]" style={jost}>
            Órdenes
          </h1>
          <p className="mt-0.5 text-[12px] text-[#999999]">
            {orders.length} pedidos en total · {filtered.length} mostrando
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border border-[#EEEEEE] bg-white px-3 py-2 text-[11px] text-[#111111] outline-none"
            style={jost}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | '')}
          >
            <option value="">Todos los estados</option>
            {STATUS_FLOW.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select
            className="border border-[#EEEEEE] bg-white px-3 py-2 text-[11px] text-[#111111] outline-none"
            style={jost}
            value={filterMetodo}
            onChange={(e) =>
              setFilterMetodo(e.target.value as 'transferencia' | 'tarjeta' | '')
            }
          >
            <option value="">Todos los métodos</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]">{error}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p
            className="text-[13px] font-extrabold uppercase text-[#666666]"
            style={jost}
          >
            Sin órdenes
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((order) => {
            const id = str(order.id)
            const isExpanded = expandedId === id
            const isLoading = loadingId === id
            const statusRaw = str(order.status_interno) as OrderStatus
            const meta = STATUS_META[statusRaw] ?? STATUS_META.nueva
            const metodo = str(order.metodo_pago)
            const total = num(order.total)
            const transferencia_confirmada = bool(order.transferencia_confirmada)

            const dir = (order.direccion_envio ?? {}) as Record<string, string>
            const nombreComprador =
              dir.nombre || str(order.guest_nombre) || str(order.guest_email) || '—'

            const orderItems = items.filter(
              (i) => str(i.order_id) === id
            )

            const fecha = order.created_at
              ? new Date(str(order.created_at)).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'

            const edit = getEnvioEdit(id, order)

            return (
              <div
                key={id}
                className={`border transition-colors ${
                  isExpanded ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'
                } bg-white`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : id)}
                  className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#FAFAFA]"
                >
                  <span
                    className="shrink-0 text-[12px] font-extrabold text-[#CC4B37]"
                    style={jost}
                  >
                    #{str(order.order_number)}
                  </span>
                  <span
                    className="shrink-0 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide"
                    style={{ ...jost, backgroundColor: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="flex-1 truncate text-[12px] text-[#333333]"
                    style={lato}
                  >
                    {nombreComprador || '—'}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase ${
                      metodo === 'transferencia'
                        ? 'text-[#1D4ED8]'
                        : 'text-[#059669]'
                    }`}
                    style={jost}
                  >
                    {metodo === 'transferencia' ? 'Transferencia' : 'Tarjeta'}
                  </span>
                  <span
                    className="shrink-0 text-[13px] font-extrabold text-[#111111]"
                    style={jost}
                  >
                    ${total.toLocaleString('es-MX')}
                  </span>
                  <span
                    className="hidden shrink-0 text-[10px] text-[#AAAAAA] md:block"
                    style={lato}
                  >
                    {fecha}
                  </span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`shrink-0 text-[#999999] transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#EEEEEE] bg-[#FAFAFA] p-5">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="flex flex-col gap-4">
                        <div>
                          <p
                            className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                            style={jost}
                          >
                            Comprador
                          </p>
                          <div
                            className="flex flex-col gap-1 text-[12px]"
                            style={lato}
                          >
                            <span className="font-bold text-[#111111]">
                              {nombreComprador || '—'}
                            </span>
                            {str(order.guest_email) && (
                              <span className="text-[#666666]">
                                {str(order.guest_email)}
                              </span>
                            )}
                            <span className="text-[#666666]">
                              {dir.calle} {dir.numero}, {dir.colonia}
                              <br />
                              {dir.ciudad}, {dir.estado} CP {dir.cp}
                            </span>
                            {dir.referencias && (
                              <span className="text-[#999999]">
                                Ref: {dir.referencias}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p
                            className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                            style={jost}
                          >
                            Productos
                          </p>
                          <ul className="flex flex-col gap-2">
                            {orderItems.map((item, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <div className="h-8 w-8 shrink-0 border border-[#EEEEEE] bg-[#F4F4F4]">
                                  {str(item.foto_url) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={str(item.foto_url)}
                                      alt=""
                                      className="h-full w-full object-contain p-0.5"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-[#EEEEEE]" />
                                  )}
                                </div>
                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                  <span className="truncate text-[11px] text-[#333333]">
                                    {str(item.nombre)}
                                  </span>
                                  <span
                                    className="shrink-0 text-[11px] font-bold text-[#111111]"
                                    style={jost}
                                  >
                                    x{num(item.cantidad)} — $
                                    {(
                                      num(item.precio_unit) * num(item.cantidad)
                                    ).toLocaleString('es-MX')}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="border border-[#EEEEEE] bg-white p-3">
                          <div className="flex flex-col gap-1.5 text-[12px]">
                            <div className="flex justify-between">
                              <span className="text-[#666666]" style={lato}>
                                Subtotal
                              </span>
                              <span style={jost}>
                                ${num(order.subtotal).toLocaleString('es-MX')}
                              </span>
                            </div>
                            {num(order.descuento_monto) > 0 && (
                              <div className="flex justify-between">
                                <span className="text-[#22C55E]" style={lato}>
                                  Descuento ({num(order.descuento_pct)}%)
                                </span>
                                <span className="text-[#22C55E]" style={jost}>
                                  −$
                                  {num(order.descuento_monto).toLocaleString('es-MX')}
                                </span>
                              </div>
                            )}
                            {order.costo_envio != null && (
                              <div className="flex justify-between">
                                <span className="text-[#666666]" style={lato}>
                                  Envío
                                </span>
                                <span style={jost}>
                                  $
                                  {num(order.costo_envio).toLocaleString('es-MX')}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-[#EEEEEE] pt-1.5">
                              <span
                                className="font-extrabold text-[#111111]"
                                style={jost}
                              >
                                Total
                              </span>
                              <span
                                className="font-extrabold text-[#111111]"
                                style={jost}
                              >
                                ${num(order.total).toLocaleString('es-MX')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p
                            className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                            style={jost}
                          >
                            Estado del pedido
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {STATUS_FLOW.map((s) => {
                              const m = STATUS_META[s]
                              const isActive = statusRaw === s
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => handleStatus(id, s)}
                                  disabled={isActive || isLoading}
                                  className="px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide transition-opacity hover:opacity-80 disabled:opacity-50"
                                  style={{
                                    ...jost,
                                    backgroundColor: isActive ? m.bg : '#EEEEEE',
                                    color: isActive ? m.color : '#666666',
                                    outline: isActive
                                      ? `2px solid ${m.bg}`
                                      : 'none',
                                    outlineOffset: 1,
                                  }}
                                >
                                  {m.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {metodo === 'transferencia' &&
                          !transferencia_confirmada && (
                            <div className="border border-[#1D4ED8] bg-[#EFF6FF] p-3">
                              <p
                                className="mb-2 text-[11px] font-bold text-[#1D4ED8]"
                                style={jost}
                              >
                                Transferencia pendiente de confirmar
                              </p>
                              <button
                                type="button"
                                onClick={() => handleConfirmarTransferencia(id)}
                                disabled={isLoading}
                                className="w-full bg-[#1D4ED8] py-2 text-[10px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
                                style={jost}
                              >
                                {isLoading
                                  ? 'Confirmando...'
                                  : '✓ Confirmar pago recibido'}
                              </button>
                            </div>
                          )}
                        {metodo === 'transferencia' &&
                          transferencia_confirmada && (
                            <div className="flex items-center gap-2 border border-[#22C55E] bg-[#F0FDF4] px-3 py-2">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="text-[#22C55E]"
                              >
                                <path
                                  d="M5 12l5 5L20 7"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span
                                className="text-[11px] font-bold text-[#22C55E]"
                                style={jost}
                              >
                                Transferencia confirmada
                              </span>
                            </div>
                          )}

                        <div>
                          <p
                            className="mb-2 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                            style={jost}
                          >
                            Datos de envío
                          </p>
                          <div className="flex flex-col gap-2">
                            <div>
                              <p
                                className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]"
                                style={jost}
                              >
                                Costo de envío
                              </p>
                              <input
                                type="number"
                                min={0}
                                className={inputCls}
                                value={edit.costo_envio}
                                onChange={(e) =>
                                  setEnvioField(
                                    id,
                                    order,
                                    'costo_envio',
                                    e.target.value
                                  )
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <p
                                className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]"
                                style={jost}
                              >
                                Paquetería
                              </p>
                              <input
                                type="text"
                                className={inputCls}
                                value={edit.guia_paqueteria}
                                onChange={(e) =>
                                  setEnvioField(
                                    id,
                                    order,
                                    'guia_paqueteria',
                                    e.target.value
                                  )
                                }
                                placeholder="Estafeta, DHL, FedEx..."
                              />
                            </div>
                            <div>
                              <p
                                className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]"
                                style={jost}
                              >
                                Número de guía
                              </p>
                              <input
                                type="text"
                                className={inputCls}
                                value={edit.guia_numero}
                                onChange={(e) =>
                                  setEnvioField(
                                    id,
                                    order,
                                    'guia_numero',
                                    e.target.value
                                  )
                                }
                                placeholder="Número de rastreo"
                              />
                            </div>
                            <div>
                              <p
                                className="mb-1 text-[9px] font-extrabold uppercase tracking-wide text-[#AAAAAA]"
                                style={jost}
                              >
                                Notas internas
                              </p>
                              <textarea
                                rows={2}
                                className={inputCls}
                                value={edit.notas_internas}
                                onChange={(e) =>
                                  setEnvioField(
                                    id,
                                    order,
                                    'notas_internas',
                                    e.target.value
                                  )
                                }
                                placeholder="Solo visibles para admin"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGuardarEnvio(id, order)}
                              disabled={isLoading}
                              className="w-full bg-[#111111] py-2 text-[10px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#CC4B37] disabled:opacity-50"
                              style={jost}
                            >
                              {isLoading
                                ? 'Guardando...'
                                : 'Guardar datos de envío'}
                            </button>
                          </div>
                        </div>
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
