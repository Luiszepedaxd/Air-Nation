'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaFichaPublica,
  type ArenaItem,
  type ArenaOpenDay,
} from '@/lib/arena-api'
import {
  agregarItem,
  clearCart,
  itemsParaReserva,
  loadCart,
  quitarItem,
  renglonesCart,
  saveCart,
  totalCart,
  type ArenaCart,
} from '@/lib/arena-cart'
import { supabase } from '@/lib/supabase'
import { fechaCorta, fechaLarga, hoyMexico, sumaDias } from '@/components/arena/fechas'
import { MoneyText, formatCentavos } from '@/components/arena/MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[16px] text-[#111111] outline-none focus:border-[#CC4B37]'

const UNIDAD: Record<string, string> = {
  por_persona: 'por persona',
  por_reserva: 'por reserva',
  por_unidad: 'por unidad',
}

/**
 * Carrito y checkout: un campo y un día, una sola reserva. Los totales que se
 * ven aquí son estimados con los precios que publica el backend; el cobro lo
 * recalcula `arena_create_booking`.
 */
export default function CarritoPage() {
  const [cart, setCart] = useState<ArenaCart | null | undefined>(undefined)
  const [ficha, setFicha] = useState<ArenaFichaPublica | null>(null)
  const [dias, setDias] = useState<ArenaOpenDay[] | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    setCart(loadCart())
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail((e) => e || data.user!.email!)
    })
  }, [])

  const slug = cart?.slug
  useEffect(() => {
    if (!slug) return
    arenaGet<ArenaFichaPublica>(`/fields/${encodeURIComponent(slug)}`)
      .then(setFicha)
      .catch((err) => setError(arenaErrorMessage(err)))
  }, [slug])

  const fieldId = ficha?.field.id
  const maxDias = ficha?.arena.anticipacion_max_dias
  useEffect(() => {
    if (!fieldId || !maxDias) return
    const hoy = hoyMexico()
    arenaGet<{ dias: ArenaOpenDay[] }>(
      `/fields/${fieldId}/open-days?desde=${hoy}&hasta=${sumaDias(hoy, Math.min(maxDias, 60))}`
    )
      .then((r) => setDias(r.dias))
      .catch(() => setDias([]))
  }, [fieldId, maxDias])

  /** Toda edición del carrito se persiste: recargar la página no lo pierde. */
  const actualizar = (next: ArenaCart) => {
    setCart(next)
    saveCart(next)
  }

  const items = ficha?.items ?? []
  const renglones = useMemo(
    () => (cart ? renglonesCart(cart, items) : []),
    [cart, items]
  )
  const total = cart ? totalCart(cart, items) : 0
  const itemBase = renglones.find((r) => r.item.es_base)?.item ?? null
  const disponibles = items.filter(
    (i) => !renglones.some((r) => r.item.id === i.id) && (!i.es_base || !itemBase)
  )

  const baseFueraDeRango =
    itemBase != null &&
    cart != null &&
    ((itemBase.min_jugadores != null && cart.num_jugadores < itemBase.min_jugadores) ||
      (itemBase.max_jugadores != null && cart.num_jugadores > itemBase.max_jugadores))

  const puedePagar =
    Boolean(cart?.fecha && itemBase && nombre.trim() && email.trim() && acepta) &&
    !baseFueraDeRango &&
    total > 0

  const pagar = async () => {
    if (!cart || !ficha) return
    setError('')
    setEnviando(true)
    try {
      const r = await arenaSend<{
        codigo: string
        access_token: string
        pago: { checkout_url: string | null } | null
      }>('POST', '/bookings', {
        field_id: cart.field_id,
        fecha: cart.fecha,
        num_jugadores: cart.num_jugadores,
        items: itemsParaReserva(cart, items),
        contacto_nombre: nombre.trim(),
        contacto_email: email.trim(),
        contacto_telefono: telefono.trim() || null,
        acepta_politica: true,
      })
      clearCart()
      window.location.href =
        r.pago?.checkout_url || `/reservas/${r.codigo}?t=${r.access_token}`
    } catch (err) {
      setError(arenaErrorMessage(err))
      setEnviando(false)
    }
  }

  if (cart === undefined) {
    return (
      <main className="mx-auto w-full max-w-[720px] px-4 py-10 md:px-6" style={lato}>
        <p className="text-[13px] text-[#666666]">Cargando tu carrito…</p>
      </main>
    )
  }

  if (!cart) {
    return (
      <main className="mx-auto w-full max-w-[720px] px-4 py-10 md:px-6" style={lato}>
        <h1 style={jost} className="text-[24px] text-[#111111]">
          TU CARRITO ESTÁ VACÍO
        </h1>
        <p className="mt-2 text-[13px] text-[#666666]">
          Elige un campo en ARENA y agrega un paquete.
        </p>
        <Link
          href="/arena"
          style={jost}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center bg-[#111111] px-5 text-[12px] tracking-[0.12em] text-[#FFFFFF]"
        >
          VER CAMPOS
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-[200px] pt-6 md:px-6" style={lato}>
      <p className="text-[12px] text-[#666666]">
        <Link href={`/campos/${cart.slug}`} className="underline">
          {cart.nombre}
        </Link>
      </p>
      <h1 style={jost} className="mt-1 text-[24px] leading-tight text-[#111111] md:text-[30px]">
        TU CARRITO
      </h1>

      {/* ── Día ── */}
      <section className="mt-6">
        <p style={jost} className="text-[12px] text-[#111111]">
          1. Día
        </p>
        {dias === null ? (
          <p className="mt-2 text-[13px] text-[#666666]">Cargando días disponibles…</p>
        ) : dias.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#CC4B37]">
            No hay días disponibles por ahora. Intenta más tarde o escríbele al campo.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dias.map((d) => (
              <button
                key={d.fecha}
                type="button"
                onClick={() => actualizar({ ...cart, fecha: d.fecha })}
                className={`min-h-[56px] border border-solid px-3 py-2 text-left ${
                  cart.fecha === d.fecha
                    ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                    : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#111111]'
                }`}
              >
                <span style={jost} className="block text-[11px]">
                  {fechaCorta(d.fecha)}
                </span>
                <span className="block text-[11px] opacity-80">
                  {d.apertura.slice(0, 5)}–{d.cierre.slice(0, 5)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Jugadores ── */}
      <section className="mt-6">
        <p style={jost} className="text-[12px] text-[#111111]">
          2. Jugadores
        </p>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            aria-label="Un jugador menos"
            onClick={() =>
              actualizar({ ...cart, num_jugadores: Math.max(1, cart.num_jugadores - 1) })
            }
            className="min-h-[44px] min-w-[44px] border border-solid border-[#EEEEEE] text-[18px] text-[#111111]"
          >
            −
          </button>
          <input
            className="min-h-[44px] w-[90px] border border-solid border-[#EEEEEE] text-center text-[18px] text-[#111111]"
            inputMode="numeric"
            value={String(cart.num_jugadores)}
            onChange={(e) =>
              actualizar({
                ...cart,
                num_jugadores: Math.min(500, Math.max(1, Number(e.target.value) || 1)),
              })
            }
          />
          <button
            type="button"
            aria-label="Un jugador más"
            onClick={() =>
              actualizar({ ...cart, num_jugadores: Math.min(500, cart.num_jugadores + 1) })
            }
            className="min-h-[44px] min-w-[44px] border border-solid border-[#EEEEEE] text-[18px] text-[#111111]"
          >
            +
          </button>
        </div>
        {baseFueraDeRango && itemBase ? (
          <p className="mt-2 text-[12px] text-[#CC4B37]">
            {itemBase.min_jugadores != null && cart.num_jugadores < itemBase.min_jugadores
              ? `${itemBase.nombre} necesita al menos ${itemBase.min_jugadores} jugadores.`
              : `${itemBase.nombre} admite hasta ${itemBase.max_jugadores} jugadores.`}
          </p>
        ) : null}
      </section>

      {/* ── Conceptos ── */}
      <section className="mt-6">
        <p style={jost} className="text-[12px] text-[#111111]">
          3. Lo que vas a pagar
        </p>
        {renglones.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#666666]">
            Tu carrito no tiene conceptos de este campo.{' '}
            <Link href={`/campos/${cart.slug}`} className="text-[#CC4B37] underline">
              Elige un paquete
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
            {renglones.map(({ item, cantidad, subtotal_centavos }) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#111111]">{item.nombre}</span>
                  <span className="block text-[12px] text-[#666666]">
                    {formatCentavos(item.precio_centavos, false)} {UNIDAD[item.unidad]} ×{' '}
                    {cantidad}
                  </span>
                </span>
                {!item.es_base && item.unidad !== 'por_reserva' ? (
                  <input
                    className="w-[64px] shrink-0 border border-solid border-[#EEEEEE] px-2 py-1 text-center text-[14px]"
                    inputMode="numeric"
                    aria-label={`Cantidad de ${item.nombre}`}
                    value={String(cart.extras[item.id] ?? cantidad)}
                    onChange={(e) =>
                      actualizar(
                        agregarItem(cart, item, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                  />
                ) : null}
                <span style={jost} className="shrink-0 text-[14px] text-[#111111]">
                  <MoneyText centavos={subtotal_centavos} conMoneda={false} />
                </span>
                <button
                  type="button"
                  onClick={() => actualizar(quitarItem(cart, item.id))}
                  style={jost}
                  className="shrink-0 border border-solid border-[#CC4B37] px-2 py-1 text-[10px] text-[#CC4B37]"
                >
                  QUITAR
                </button>
              </li>
            ))}
          </ul>
        )}

        {disponibles.length > 0 ? (
          <div className="mt-3">
            <p className="text-[12px] text-[#666666]">Agregar al carrito</p>
            <ul className="mt-2 flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
              {disponibles.map((i: ArenaItem) => (
                <li key={i.id} className="flex items-center gap-3 px-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] text-[#111111]">{i.nombre}</span>
                    <span className="block text-[12px] text-[#CC4B37]">
                      {formatCentavos(i.precio_centavos, false)}{' '}
                      <span className="text-[#666666]">{UNIDAD[i.unidad]}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      actualizar(
                        agregarItem(cart, i, i.unidad === 'por_unidad' ? 1 : cart.num_jugadores)
                      )
                    }
                    style={jost}
                    className="min-h-[36px] shrink-0 bg-[#111111] px-3 text-[10px] text-[#FFFFFF]"
                  >
                    + AGREGAR
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {/* ── Datos ── */}
      <section className="mt-6 flex flex-col gap-4">
        <p style={jost} className="text-[12px] text-[#111111]">
          4. Tus datos
        </p>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Nombre de quien reserva
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Email (ahí llega tu QR)
          <input
            className={inputClass}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          WhatsApp (opcional)
          <input
            className={inputClass}
            inputMode="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </label>
        <div className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-3 text-[12px] text-[#666666]">
          {ficha?.arena.politica_cancelacion ||
            `Cancela hasta ${ficha?.arena.cancelacion_horas_limite ?? 24} h antes de la hora de apertura y te devolvemos el 100%.`}
        </div>
        <label className="flex items-start gap-2 text-[13px] text-[#111111]">
          <input
            type="checkbox"
            className="mt-1"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
          />
          Acepto la política de cancelación y reembolso del campo.
        </label>
      </section>

      {error ? <p className="mt-4 text-[13px] text-[#CC4B37]">{error}</p> : null}

      {/* Resumen fijo abajo (375 px incluido). */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2">
          <div className="flex items-start justify-between gap-3 text-[12px] text-[#666666]">
            <span className="min-w-0">
              {cart.fecha ? fechaLarga(cart.fecha) : 'Elige el día'} · {cart.num_jugadores}{' '}
              {cart.num_jugadores === 1 ? 'jugador' : 'jugadores'}
            </span>
            <span style={jost} className="shrink-0 text-[18px] text-[#CC4B37]">
              <MoneyText centavos={total} conMoneda={false} />
            </span>
          </div>
          <button
            type="button"
            disabled={!puedePagar || enviando}
            onClick={() => void pagar()}
            style={jost}
            className="min-h-[48px] bg-[#CC4B37] px-4 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-40"
          >
            {enviando ? 'ABRIENDO EL PAGO…' : 'PAGAR Y CONFIRMAR'}
          </button>
          <p className="text-[11px] text-[#999999]">
            Tienes 15 minutos para completar el pago. El total ya incluye todo: AirNation no
            cobra nada extra.
          </p>
        </div>
      </div>
    </main>
  )
}
