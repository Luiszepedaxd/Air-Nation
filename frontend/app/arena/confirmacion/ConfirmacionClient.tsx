'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { arenaErrorMessage, arenaGet, type ArenaCheckoutConfirmacion } from '@/lib/arena-api'
import { useArenaCart } from '@/components/arena/ArenaCartProvider'
import { formatCentavos } from '@/components/arena/MoneyText'
import { conMayuscula, fechaMedia, horaCorta } from '@/components/arena/fechas'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Mientras el webhook confirma el pago se consulta cada 3 s, máximo 60 s. */
const ESPERA_MS = 3000
const MAX_INTENTOS = 20

export function ConfirmacionClient({ paymentId, token }: { paymentId: string; token: string }) {
  const { vaciar } = useArenaCart()
  const [datos, setDatos] = useState<ArenaCheckoutConfirmacion | null>(null)
  const [error, setError] = useState('')
  const [agotado, setAgotado] = useState(false)
  const vaciado = useRef(false)

  useEffect(() => {
    if (!paymentId || !token) {
      setError('Este link no trae el pago. Abre el que te llegó por correo.')
      return
    }
    let vivo = true
    let intentos = 0
    let timer: ReturnType<typeof setTimeout>

    const consultar = () => {
      arenaGet<ArenaCheckoutConfirmacion>(
        `/checkout/${encodeURIComponent(paymentId)}?t=${encodeURIComponent(token)}`
      )
        .then((r) => {
          if (!vivo) return
          setDatos(r)
          if (r.status === 'pagado') {
            // Reservas ya creadas y pagadas: el carrito ya no sirve.
            if (!vaciado.current) {
              vaciado.current = true
              vaciar()
            }
            return
          }
          intentos += 1
          if (intentos >= MAX_INTENTOS) {
            setAgotado(true)
            return
          }
          timer = setTimeout(consultar, ESPERA_MS)
        })
        .catch((err) => vivo && setError(arenaErrorMessage(err)))
    }
    consultar()

    return () => {
      vivo = false
      clearTimeout(timer)
    }
  }, [paymentId, token, vaciar])

  if (error) {
    return (
      <main className="mx-auto max-w-[720px] px-4 py-10 md:px-6" style={lato}>
        <h1 style={jost} className="text-[26px] text-[#111111]">
          NO ENCONTRAMOS ESE PAGO
        </h1>
        <p className="mt-2 text-[#666666]">{error}</p>
        <Link
          href="/arena"
          style={jost}
          className="mt-5 inline-flex min-h-[44px] items-center border border-solid border-[#111111] px-4 text-[14px] text-[#111111] no-underline"
        >
          Ver campos
        </Link>
      </main>
    )
  }

  if (!datos) {
    return (
      <main className="mx-auto max-w-[720px] px-4 py-10 md:px-6" style={lato}>
        <p className="text-[#666666]">Cargando tus reservas…</p>
      </main>
    )
  }

  if (datos.status !== 'pagado') {
    return (
      <main className="mx-auto max-w-[720px] px-4 py-10 md:px-6" style={lato}>
        <h1 style={jost} className="text-[26px] text-[#111111] md:text-[32px]">
          ESTAMOS CONFIRMANDO TU PAGO
        </h1>
        <p className="mt-2 text-[#666666]" role="status" aria-live="polite">
          {agotado
            ? 'Tu banco todavía no nos confirma el cobro. En cuanto se confirme te llega el correo con tus QR; puedes volver a abrir este link más tarde.'
            : 'No cierres esta ventana: en unos segundos aparecen tus reservas con su QR.'}
        </p>
        {!agotado ? (
          <div className="mt-5 h-9 w-9 animate-spin rounded-full border-[3px] border-[#EEEEEE] border-t-[#CC4B37] motion-reduce:animate-none" />
        ) : null}
        <p className="mt-6 text-[14px] text-[#666666]">
          Pagaste {formatCentavos(datos.total_centavos, false)} por {datos.reservas.length}{' '}
          {datos.reservas.length === 1 ? 'reserva' : 'reservas'}.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 md:px-6" style={lato}>
      <div className="flex items-start gap-3.5 pb-2 pt-8">
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-[#2F7D4F] text-[#FFFFFF]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.8" />
          </svg>
        </span>
        <div>
          <h1 style={jost} className="text-[26px] leading-tight text-[#111111] md:text-[36px]">
            {datos.reservas.length === 1 ? 'TU RESERVA ESTÁ CONFIRMADA' : 'TUS RESERVAS ESTÁN CONFIRMADAS'}
          </h1>
          <p className="mt-1.5 text-[#666666]">
            Enviamos {datos.reservas.length === 1 ? 'el QR' : `los ${datos.reservas.length} QR`} y el
            recibo a <b className="text-[#111111]">{datos.contacto_email}</b>. Pagaste{' '}
            {formatCentavos(datos.total_centavos, false)}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 py-5 md:grid-cols-2">
        {datos.reservas.map((r) => (
          <article key={r.codigo} className="grid grid-cols-1 border border-solid border-[#111111] min-[480px]:grid-cols-[170px_1fr]">
            <div className="flex flex-col items-center justify-center gap-2 border-b border-dashed border-[#CCCCCC] bg-[#FFFFFF] p-4 min-[480px]:border-b-0 min-[480px]:border-r">
              {r.qr_url ? (
                <QRCodeSVG value={r.qr_url} size={138} level="M" />
              ) : (
                <p className="text-center text-[13px] text-[#666666]">
                  {r.status === 'cancelada' ? 'Reserva cancelada' : 'QR en camino'}
                </p>
              )}
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800 }} className="tracking-[0.08em]">
                {r.codigo}
              </span>
            </div>
            <div className="grid content-start gap-1.5 p-4">
              <h3 style={jost} className="m-0 text-[18px] text-[#111111]">
                {r.campo?.nombre}
              </h3>
              <div className="font-bold">{conMayuscula(fechaMedia(r.fecha))}</div>
              <div className="text-[14px] text-[#666666]">
                {r.campo?.apertura ? `Abre ${horaCorta(r.campo.apertura)} · ` : ''}
                {r.num_jugadores} {r.num_jugadores === 1 ? 'jugador' : 'jugadores'}
              </div>
              <div className="text-[14px] text-[#666666]">
                {r.items.map((i) => `${i.nombre} × ${i.cantidad}`).join(', ')}
              </div>
              {r.campo?.direccion ? (
                <div className="text-[14px] text-[#666666]">{r.campo.direccion}</div>
              ) : null}
              <div className="mt-1.5 flex flex-wrap gap-2">
                <Link
                  href={`/reservas/${r.codigo}?t=${r.access_token}`}
                  style={jost}
                  className="inline-flex min-h-[36px] items-center bg-[#111111] px-3 text-[12px] tracking-[0.04em] text-[#FFFFFF] no-underline"
                >
                  Ver reserva
                </Link>
                {r.campo?.maps_url ? (
                  <a
                    href={r.campo.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={jost}
                    className="inline-flex min-h-[36px] items-center border border-solid border-[#111111] px-3 text-[12px] tracking-[0.04em] text-[#111111] no-underline"
                  >
                    Cómo llegar
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mb-8 max-w-[64ch] border-l-[3px] border-solid border-[#CC4B37] py-1 pl-3.5">
        Una persona del grupo muestra el QR en la entrada, desde el celular o impreso. El campo lo
        escanea una sola vez y registra cuántos llegaron. Puedes cancelar con reembolso completo
        hasta el plazo de cada campo.
      </p>
      <Link
        href="/arena"
        style={jost}
        className="mb-12 inline-flex min-h-[44px] items-center border border-solid border-[#111111] px-4 text-[14px] tracking-[0.04em] text-[#111111] no-underline"
      >
        Seguir explorando campos
      </Link>
    </main>
  )
}
