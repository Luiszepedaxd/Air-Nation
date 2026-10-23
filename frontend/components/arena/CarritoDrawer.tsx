'use client'

import Link from 'next/link'
import { useArenaCart } from '@/components/arena/ArenaCartProvider'
import { useOverlay } from '@/components/arena/useOverlay'
import { formatCentavos } from '@/components/arena/MoneyText'
import { conMayuscula, fechaMedia } from '@/components/arena/fechas'
import { cfImageDeliveryUrl } from '@/lib/media-url'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Carrito en todas las rutas /arena/*: una reserva por campo y día. */
export function CarritoDrawer() {
  const { cart, total, abierto, cerrar, quitar, aviso, limpiarAviso } = useArenaCart()
  const panel = useOverlay<HTMLElement>(abierto, cerrar)

  return (
    <>
      {abierto ? (
        <button
          type="button"
          aria-label="Cerrar carrito"
          onClick={cerrar}
          className="fixed inset-0 z-[55] bg-[#111111]/50"
        />
      ) : null}

      <aside
        ref={panel}
        role="dialog"
        aria-modal={abierto}
        aria-labelledby="carrito-titulo"
        style={lato}
        className={`fixed bottom-0 right-0 top-0 z-[70] flex w-[min(440px,100%)] flex-col border-l border-solid border-[#EEEEEE] bg-[#FFFFFF] transition-transform duration-200 motion-reduce:transition-none ${
          abierto ? 'translate-x-0 visible' : 'invisible translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-solid border-[#EEEEEE] p-4">
          <h2 id="carrito-titulo" style={jost} className="text-[20px] text-[#111111]">
            TU CARRITO
          </h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar carrito"
            className="grid h-9 w-9 place-items-center border border-solid border-[#EEEEEE] text-[#111111]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="grid flex-1 content-start gap-3 overflow-y-auto p-4">
          {aviso ? (
            <p className="flex items-center gap-2 bg-[#EAF5EE] p-2.5 text-[14px] font-bold text-[#2F7D4F]" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" />
              </svg>
              <span>{aviso}</span>
              <button
                type="button"
                onClick={limpiarAviso}
                aria-label="Ocultar aviso"
                className="ml-auto text-[#2F7D4F]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" />
                </svg>
              </button>
            </p>
          ) : null}

          {cart.length === 0 ? (
            <div className="px-3 py-10 text-center text-[#666666]">
              <h3 style={jost} className="mb-1.5 text-[18px] text-[#111111]">
                TU CARRITO ESTÁ VACÍO
              </h3>
              <p className="mb-4">Elige un campo y un día para empezar.</p>
              <Link
                href="/arena"
                onClick={cerrar}
                style={jost}
                className="inline-flex min-h-[44px] items-center border border-solid border-[#111111] px-4 text-[14px] tracking-[0.04em] text-[#111111] no-underline"
              >
                Ver campos
              </Link>
            </div>
          ) : (
            cart.map((c, i) => (
              <article key={`${c.field_id}-${c.fecha}`} className="border border-solid border-[#EEEEEE]">
                <div className="flex gap-3 p-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
                    {c.foto_portada_url ? (
                      <img
                        src={cfImageDeliveryUrl(c.foto_portada_url, { width: 160, quality: 70, fit: 'cover' })}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <h3 style={jost} className="m-0 text-[15px] text-[#111111]">
                      {c.nombre}
                    </h3>
                    <div className="mt-0.5 text-[14px]">{conMayuscula(fechaMedia(c.fecha))}</div>
                    <div className="text-[13px] text-[#666666]">
                      {c.num_jugadores} {c.num_jugadores === 1 ? 'jugador' : 'jugadores'}
                      {c.ciudad ? ` · ${c.ciudad}` : ''}
                    </div>
                  </div>
                </div>
                <div className="grid gap-0.5 px-3 pb-2.5 text-[13px] text-[#666666]">
                  {c.lineas.map((l) => (
                    <div key={l.item_id} className="flex justify-between gap-2.5">
                      <span>
                        {l.nombre} × {l.cantidad}
                      </span>
                      <span>{formatCentavos(l.subtotal_centavos, false)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-solid border-[#EEEEEE] py-1.5 pl-3 pr-1.5">
                  <span style={jost} className="text-[17px] text-[#111111]">
                    {formatCentavos(c.total_centavos, false)}
                  </span>
                  <span>
                    <Link
                      href={`/arena/${c.slug}?editar=${i}`}
                      onClick={cerrar}
                      className="inline-flex min-h-[36px] items-center px-2 text-[14px] font-bold text-[#666666] no-underline hover:text-[#111111]"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => quitar(i)}
                      className="min-h-[36px] px-2 text-[14px] font-bold text-[#666666] hover:text-[#111111]"
                    >
                      Quitar
                    </button>
                  </span>
                </div>
              </article>
            ))
          )}
        </div>

        {cart.length > 0 ? (
          <div className="grid gap-2.5 border-t border-solid border-[#EEEEEE] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-baseline justify-between">
              <b style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}>
                Total ({cart.length} {cart.length === 1 ? 'reserva' : 'reservas'})
              </b>
              <span style={jost} className="text-[22px] text-[#111111]">
                {formatCentavos(total, false)}
              </span>
            </div>
            <Link
              href="/arena/checkout"
              onClick={cerrar}
              style={jost}
              className="flex min-h-[44px] items-center justify-center bg-[#CC4B37] px-4 text-[14px] tracking-[0.04em] text-[#FFFFFF] no-underline"
            >
              Continuar al pago
            </Link>
            <p className="m-0 text-center text-[13px] text-[#666666]">
              Un solo pago para todas tus reservas.
            </p>
          </div>
        ) : null}
      </aside>
    </>
  )
}
