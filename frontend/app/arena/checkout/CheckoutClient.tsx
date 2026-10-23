'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArenaApiError,
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaFichaPublica,
  type ArenaOpenDay,
} from '@/lib/arena-api'
import { renglones, reservasParaCheckout, type ArenaCartItem } from '@/lib/arena-cart'
import { useArenaCart } from '@/components/arena/ArenaCartProvider'
import { formatCentavos } from '@/components/arena/MoneyText'
import { conMayuscula, fechaMedia } from '@/components/arena/fechas'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

// Mismas clases que el checkout de la tienda (app/store/checkout). En móvil el
// campo va a 16px para que iOS no haga zoom al enfocarlo.
const inputClass =
  'w-full border border-solid border-[#E4E4E4] bg-[#FFFFFF] px-3 py-2.5 text-[16px] text-[#111111] outline-none placeholder-[#AAAAAA] focus:border-[#111111] sm:text-[13px]'

const labelClass = 'mb-1 block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]'

const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, '').slice(0, max)

/** "4242424242424242" → "4242 4242 4242 4242". */
const enGruposDe4 = (valor: string) => soloDigitos(valor, 19).replace(/(\d{4})(?=\d)/g, '$1 ')

type Revision = {
  /** Avisos por reserva: precio actualizado, concepto fuera o día cerrado. */
  avisos: string[]
  /** Reservas que ya no se pueden pagar (día cerrado o paquete inactivo). */
  invalidas: Set<number>
  /** Carrito ya con precios frescos. */
  cart: ArenaCartItem[]
  horasCancelacion: number
  listo: boolean
}

/**
 * Datos del jugador y pago del carrito completo. Al entrar vuelve a pedir la
 * ficha de cada campo: actualiza precios, quita conceptos inactivos y marca
 * los días que ya no abren antes de cobrar.
 */
export function CheckoutClient({ contacto }: { contacto: { nombre: string; email: string } | null }) {
  const { cart, listo, quitar } = useArenaCart()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [acepta, setAcepta] = useState(false)
  // Tarjeta de prueba: vive solo en esta pantalla. Nunca se manda al backend
  // ni se guarda — el cobro es simulado.
  const [tarjeta, setTarjeta] = useState({ numero: '', mes: '', anio: '', cvc: '', nombre: '' })
  const [error, setError] = useState('')
  const [reservaMala, setReservaMala] = useState<number | null>(null)
  const [pagando, setPagando] = useState(false)
  const [rev, setRev] = useState<Revision>({
    avisos: [],
    invalidas: new Set(),
    cart: [],
    horasCancelacion: 24,
    listo: false,
  })

  // ── Revalidación: precios, conceptos y días siguen vivos ──
  useEffect(() => {
    if (!listo || cart.length === 0) return
    let vivo = true
    const revisar = async () => {
      const avisos: string[] = []
      const invalidas = new Set<number>()
      const frescas: ArenaCartItem[] = []
      let horas = 24

      const fichas = new Map<string, ArenaFichaPublica | null>()
      for (const c of cart) {
        if (!fichas.has(c.slug)) {
          fichas.set(
            c.slug,
            await arenaGet<ArenaFichaPublica>(`/fields/${encodeURIComponent(c.slug)}`).catch(() => null)
          )
        }
      }

      for (let i = 0; i < cart.length; i += 1) {
        const c = cart[i]
        const ficha = fichas.get(c.slug) ?? null
        if (!ficha) {
          invalidas.add(i)
          avisos.push(`${c.nombre} ya no acepta reservas en línea. Quita esa reserva para continuar.`)
          frescas.push(c)
          continue
        }
        horas = Math.min(horas, ficha.arena.cancelacion_horas_limite)

        const lineas = renglones(c, ficha.items)
        const base = ficha.items.find((x) => x.id === c.base_id)
        if (!base) {
          invalidas.add(i)
          avisos.push(`El paquete que elegiste en ${c.nombre} ya no está disponible. Edita esa reserva.`)
        }
        const perdidos = Object.keys(c.extras).filter((id) => !ficha.items.some((x) => x.id === id))
        if (perdidos.length > 0) {
          avisos.push(`${c.nombre}: quitamos ${perdidos.length === 1 ? 'un extra' : 'unos extras'} que el campo ya no ofrece.`)
        }

        const total = lineas.reduce((s, l) => s + l.subtotal_centavos, 0)
        if (base && total !== c.total_centavos) {
          avisos.push(
            `${c.nombre}: el precio cambió a ${formatCentavos(total, false)}. Es el que se va a cobrar.`
          )
        }

        const abierto = await arenaGet<{ dias: ArenaOpenDay[] }>(
          `/fields/${ficha.field.id}/open-days?desde=${c.fecha}&hasta=${c.fecha}`
        )
          .then((r) => r.dias.length > 0)
          .catch(() => true)
        if (!abierto) {
          invalidas.add(i)
          avisos.push(`${c.nombre} ya no abre el ${fechaMedia(c.fecha)}. Elige otro día o quita la reserva.`)
        }

        frescas.push({
          ...c,
          lineas: lineas.map(({ item, cantidad, subtotal_centavos }) => ({
            item_id: item.id,
            nombre: item.nombre,
            cantidad,
            subtotal_centavos,
          })),
          total_centavos: total,
        })
      }

      if (vivo) setRev({ avisos, invalidas, cart: frescas, horasCancelacion: horas, listo: true })
    }
    void revisar()
    return () => {
      vivo = false
    }
  }, [listo, cart])

  const reservas = rev.listo ? rev.cart : cart
  const total = reservas.reduce((s, c) => s + c.total_centavos, 0)

  const pagar = async () => {
    setError('')
    setReservaMala(null)
    if (!nombre.trim()) return setError('Escribe el nombre de quien reserva.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Revisa el correo: ahí te llegan los QR.')
    // Cualquier número sirve (el cobro es simulado): solo revisamos que los
    // campos estén completos y con la forma de una tarjeta.
    if (soloDigitos(tarjeta.numero, 19).length < 13) {
      return setError('Escribe los 16 dígitos de la tarjeta.')
    }
    if (!/^(0[1-9]|1[0-2])$/.test(tarjeta.mes)) return setError('El mes va de 01 a 12.')
    if (tarjeta.anio.length !== 2) return setError('Escribe el año con dos dígitos (AA).')
    if (tarjeta.cvc.length < 3) return setError('El CVC trae 3 dígitos (4 en American Express).')
    if (!tarjeta.nombre.trim()) return setError('Escribe el nombre que viene en la tarjeta.')
    if (!acepta) return setError('Para pagar necesitas aceptar la política de cancelación y los términos.')
    if (rev.invalidas.size > 0) {
      return setError('Hay reservas que ya no se pueden pagar. Edítalas o quítalas para continuar.')
    }

    setPagando(true)
    try {
      const r = await arenaSend<{
        payment_id: string
        access_token: string
        checkout_url: string | null
      }>('POST', '/checkout', {
        reservas: reservasParaCheckout(reservas),
        contacto: { nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim() || null },
        acepta_politica: true,
      })
      // Modo prueba: el pago se aprueba en el mismo flujo del webhook (confirma
      // las reservas y manda el correo con los QR). Si falla, la confirmación
      // ya sabe mostrar el pago pendiente.
      await arenaSend(
        'POST',
        `/payments/mock/${r.payment_id}/complete?result=ok&t=${encodeURIComponent(r.access_token)}`
      ).catch(() => {})
      // El carrito se vacía en la confirmación, cuando el pago ya está hecho.
      window.location.href = `/arena/confirmacion?p=${r.payment_id}&t=${r.access_token}`
    } catch (err) {
      setReservaMala(err instanceof ArenaApiError ? err.reservaIndex ?? null : null)
      setError(arenaErrorMessage(err))
      setPagando(false)
    }
  }

  if (listo && cart.length === 0) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-10 md:px-6" style={lato}>
        <h1 style={jost} className="text-[26px] text-[#111111] md:text-[32px]">
          NO HAY NADA QUE PAGAR
        </h1>
        <p className="mt-2 text-[#666666]">Tu carrito está vacío.</p>
        <Link
          href="/arena"
          style={jost}
          className="mt-5 inline-flex min-h-[44px] items-center border border-solid border-[#111111] px-4 text-[14px] tracking-[0.04em] text-[#111111] no-underline"
        >
          Ver campos
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 md:px-6" style={lato}>
      {pagando ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[90] grid place-items-center bg-[#FFFFFF]/90 text-center"
        >
          <div>
            <div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-[3px] border-[#EEEEEE] border-t-[#CC4B37] motion-reduce:animate-none" />
            <b>Procesando tu pago</b>
            <p className="mt-1 text-[#666666]">No cierres esta ventana.</p>
          </div>
        </div>
      ) : null}

      <div className="pb-2 pt-6">
        <h1 style={jost} className="text-[26px] leading-tight text-[#111111] md:text-[36px]">
          DATOS Y PAGO
        </h1>
        <p className="mt-2 text-[#666666]">
          {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'} en un solo pago.
        </p>
      </div>

      {rev.avisos.length > 0 ? (
        <ul className="mt-2 grid gap-1 border border-solid border-[#CC4B37] bg-[#FBEDEA] p-3 text-[14px] text-[#A93A28]">
          {rev.avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid grid-cols-1 gap-7 py-4 pb-16 lg:grid-cols-[1fr_400px] lg:items-start">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void pagar()
          }}
        >
          <section className="border border-solid border-[#EEEEEE] p-[18px]">
            <h2 style={jost} className="mb-1 text-[18px] text-[#111111]">
              TUS DATOS
            </h2>
            <p className="mb-3.5 text-[14px] text-[#666666]">
              Aquí te mandamos los QR de entrada y el recibo.
            </p>
            {!contacto ? (
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#F4F4F4] px-3 py-2.5 text-[14px]">
                <span>¿Tienes cuenta de AirNation? Tus reservas quedan en tu perfil.</span>
                <Link href="/login?next=/arena/checkout" className="font-bold underline">
                  Iniciar sesión
                </Link>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="c-nombre" className={labelClass}>
                  Nombre de quien reserva
                </label>
                <input
                  id="c-nombre"
                  className={inputClass}
                  autoComplete="name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="c-email" className={labelClass}>
                  Correo
                </label>
                <input
                  id="c-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="c-tel" className={labelClass}>
                  Celular
                </label>
                <input
                  id="c-tel"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10 dígitos"
                  className={inputClass}
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="mt-4 border border-solid border-[#EEEEEE] p-[18px]">
            <h2 style={jost} className="mb-1 text-[18px] text-[#111111]">
              PAGO
            </h2>
            <p className="mb-3.5 text-[14px] text-[#666666]">
              Tienes 15 minutos para completar el pago una vez que continúes.
            </p>
            <p
              style={jost}
              className="mb-3.5 inline-block bg-[#FFF3CD] px-2 py-1 text-[10px] tracking-[0.12em] text-[#856404]"
            >
              Modo prueba: no se cobra
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="c-tarjeta" className={labelClass}>
                  Número de tarjeta
                </label>
                <input
                  id="c-tarjeta"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  className={inputClass}
                  value={tarjeta.numero}
                  onChange={(e) => setTarjeta({ ...tarjeta, numero: enGruposDe4(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3 sm:col-span-2">
                <div>
                  <label htmlFor="c-mes" className={labelClass}>
                    Mes (MM)
                  </label>
                  <input
                    id="c-mes"
                    inputMode="numeric"
                    autoComplete="cc-exp-month"
                    placeholder="MM"
                    maxLength={2}
                    className={inputClass}
                    value={tarjeta.mes}
                    onChange={(e) => setTarjeta({ ...tarjeta, mes: soloDigitos(e.target.value, 2) })}
                  />
                </div>
                <div>
                  <label htmlFor="c-anio" className={labelClass}>
                    Año (AA)
                  </label>
                  <input
                    id="c-anio"
                    inputMode="numeric"
                    autoComplete="cc-exp-year"
                    placeholder="AA"
                    maxLength={2}
                    className={inputClass}
                    value={tarjeta.anio}
                    onChange={(e) => setTarjeta({ ...tarjeta, anio: soloDigitos(e.target.value, 2) })}
                  />
                </div>
                <div>
                  <label htmlFor="c-cvc" className={labelClass}>
                    CVC
                  </label>
                  <input
                    id="c-cvc"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    maxLength={4}
                    className={inputClass}
                    value={tarjeta.cvc}
                    onChange={(e) => setTarjeta({ ...tarjeta, cvc: soloDigitos(e.target.value, 4) })}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="c-titular" className={labelClass}>
                  Nombre en la tarjeta
                </label>
                <input
                  id="c-titular"
                  autoComplete="cc-name"
                  placeholder="Como aparece en la tarjeta"
                  className={inputClass}
                  value={tarjeta.nombre}
                  onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value })}
                />
              </div>
            </div>
            <p className="mt-2 text-[12px] text-[#999999]">
              Cualquier tarjeta sirve. Los datos no salen de esta pantalla: no se mandan ni se guardan.
            </p>
            <label className="mt-3.5 flex items-start gap-2.5 text-[14px]">
              <input
                type="checkbox"
                className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#CC4B37]"
                checked={acepta}
                onChange={(e) => setAcepta(e.target.checked)}
              />
              <span>
                Acepto la política de cancelación de cada campo (reembolso del 100% si cancelo con al
                menos {rev.horasCancelacion} h de anticipación a la apertura), los{' '}
                <Link href="/terminos" className="font-bold underline">
                  Términos
                </Link>{' '}
                y el{' '}
                <Link href="/privacidad" className="font-bold underline">
                  Aviso de Privacidad
                </Link>
                .
              </span>
            </label>
            {error ? (
              <div role="alert" className="mt-3 border border-solid border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
                <p className="text-[12px] text-[#CC4B37]">{error}</p>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={pagando}
              style={jost}
              className="mt-3 min-h-[44px] w-full bg-[#CC4B37] py-4 text-[13px] tracking-[0.04em] text-[#FFFFFF] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pagando ? 'Procesando pago…' : `Pagar ${formatCentavos(total, false)} →`}
            </button>
            <p className="mt-2 text-center text-[10px] text-[#999999]">
              Pago de prueba: no se hace ningún cargo real a tu tarjeta.
            </p>
          </section>
        </form>

        <aside className="border border-solid border-[#EEEEEE] p-[18px]" aria-labelledby="resumen-titulo">
          <h2 id="resumen-titulo" style={jost} className="mb-3.5 text-[18px] text-[#111111]">
            RESUMEN
          </h2>
          {reservas.map((c, i) => (
            <div
              key={`${c.field_id}-${c.fecha}`}
              className={`border-b border-solid border-[#EEEEEE] py-3 first:pt-0 ${
                rev.invalidas.has(i) || reservaMala === i ? 'bg-[#FBEDEA] px-2' : ''
              }`}
            >
              <div className="flex justify-between gap-2.5 font-bold">
                <span>{c.nombre}</span>
                <span>{formatCentavos(c.total_centavos, false)}</span>
              </div>
              <div className="text-[13px] text-[#666666]">
                {conMayuscula(fechaMedia(c.fecha))} · {c.num_jugadores}{' '}
                {c.num_jugadores === 1 ? 'jugador' : 'jugadores'}
              </div>
              <div className="text-[13px] text-[#666666]">
                {c.lineas.map((l) => `${l.nombre} × ${l.cantidad}`).join(', ')}
              </div>
              {reservaMala === i ? (
                <p className="mt-1 text-[13px] font-bold text-[#CC4B37]">
                  Esta reserva es la que falló.
                </p>
              ) : null}
              <div className="flex gap-2">
                <Link
                  href={`/arena/${c.slug}?editar=${i}`}
                  className="min-h-[28px] text-[13px] font-bold text-[#666666] underline"
                >
                  Editar
                </Link>
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  className="min-h-[28px] text-[13px] font-bold text-[#666666] underline"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
          <div className="mt-2.5 flex items-baseline justify-between pt-2.5">
            <b style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}>Total</b>
            <span style={jost} className="text-[26px] text-[#111111]">
              {formatCentavos(total, false)}
            </span>
          </div>
          <p className="mt-2 text-[13px] text-[#666666]">
            El precio incluye todos los cargos. Sin comisiones extra.
          </p>
        </aside>
      </div>
    </main>
  )
}
