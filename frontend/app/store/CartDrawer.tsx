'use client'

import Link from 'next/link'
import { useCart } from './CartContext'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export function CartDrawer() {
  const { items, count, total, removeItem, updateCantidad, drawerOpen, closeDrawer } = useCart()

  const precioTransferencia = total * 0.96

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeDrawer}
          aria-hidden
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[#EEEEEE] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-0.5 bg-[#CC4B37]" />
            <span
              className="text-[13px] font-extrabold uppercase tracking-[0.15em] text-[#111111]"
              style={jost}
            >
              Carrito
            </span>
            {count > 0 && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white"
                style={jost}
              >
                {count}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#111111]"
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

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
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
                className="mt-4 text-[13px] font-extrabold uppercase text-[#666666]"
                style={jost}
              >
                Tu carrito está vacío
              </p>
              <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
                Agrega productos para continuar
              </p>
              <button
                type="button"
                onClick={closeDrawer}
                className="mt-5 bg-[#CC4B37] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white"
                style={jost}
              >
                Ver productos
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#EEEEEE]">
              {items.map((item) => (
                <li key={item.product_id} className="flex gap-3 px-5 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden border border-[#EEEEEE] bg-[#F4F4F4]">
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#CCCCCC]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p
                      className="line-clamp-2 text-[12px] leading-snug text-[#111111]"
                      style={lato}
                    >
                      {item.nombre}
                    </p>
                    <p className="text-[14px] font-extrabold text-[#111111]" style={jost}>
                      ${(item.precio * item.cantidad).toLocaleString('es-MX')}
                    </p>
                    <p className="text-[10px] text-[#999999]" style={lato}>
                      ${item.precio.toLocaleString('es-MX')} c/u
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center border border-[#EEEEEE]">
                        <button
                          type="button"
                          onClick={() => updateCantidad(item.product_id, item.cantidad - 1)}
                          className="flex h-7 w-7 items-center justify-center text-sm text-[#666666] transition-colors hover:bg-[#F4F4F4]"
                        >
                          −
                        </button>
                        <span
                          className="flex h-7 w-8 items-center justify-center border-x border-[#EEEEEE] text-[12px] font-bold text-[#111111]"
                          style={lato}
                        >
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCantidad(item.product_id, item.cantidad + 1)}
                          className="flex h-7 w-7 items-center justify-center text-sm text-[#666666] transition-colors hover:bg-[#F4F4F4]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product_id)}
                        className="text-[10px] text-[#CC4B37] hover:underline"
                        style={jost}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#EEEEEE] px-5 py-5">
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#666666]" style={lato}>
                  Subtotal
                </span>
                <span className="text-[13px] font-bold text-[#111111]" style={jost}>
                  ${total.toLocaleString('es-MX')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#22C55E]" style={lato}>
                  Con transferencia (4% off)
                </span>
                <span className="text-[13px] font-bold text-[#22C55E]" style={jost}>
                  ${precioTransferencia.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-[#EEEEEE] pt-2">
                <span className="text-[12px] text-[#999999]" style={lato}>
                  Envío
                </span>
                <span className="text-[11px] text-[#999999]" style={lato}>
                  Se cotiza al confirmar
                </span>
              </div>
            </div>

            <Link
              href="/store/checkout"
              onClick={closeDrawer}
              className="flex w-full items-center justify-center gap-2 bg-[#CC4B37] py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style={jost}
            >
              Proceder al checkout
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

            <p className="mt-3 text-center text-[11px] text-[#999999]" style={lato}>
              ¿Tienes cuenta?{' '}
              <Link href="/login" className="font-bold text-[#CC4B37] hover:underline">
                Inicia sesión
              </Link>{' '}
              para rastrear tu pedido
            </p>
          </div>
        )}
      </div>
    </>
  )
}
