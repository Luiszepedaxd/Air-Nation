'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, arenaSend, type ArenaReserva } from '@/lib/arena-api'
import { fechaLarga, horaMexico } from '@/components/arena/fechas'
import { MoneyText } from '@/components/arena/MoneyText'
import { StatusBadge } from '@/components/arena/StatusBadge'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

export function ReservaClient({ codigo }: { codigo: string }) {
  const token = useSearchParams().get('t') ?? ''
  const [reserva, setReserva] = useState<ArenaReserva | null>(null)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const qs = token ? `?t=${encodeURIComponent(token)}` : ''

  const cargar = useCallback(() => {
    arenaGet<{ reserva: ArenaReserva }>(`/bookings/${encodeURIComponent(codigo)}${qs}`)
      .then((r) => setReserva(r.reserva))
      .catch((err) => setError(arenaErrorMessage(err)))
  }, [codigo, qs])

  useEffect(cargar, [cargar])

  const cancelar = async () => {
    setError('')
    setOcupado(true)
    try {
      const r = await arenaSend<{ reembolso_centavos: number }>(
        'POST',
        `/bookings/${encodeURIComponent(codigo)}/cancel`,
        { t: token }
      )
      setAviso(
        r.reembolso_centavos > 0
          ? `Reserva cancelada. Te devolvemos ${(r.reembolso_centavos / 100).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}; tarda unos días según tu banco.`
          : 'Reserva cancelada.'
      )
      setConfirmando(false)
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(false)
    }
  }

  const reintentar = async () => {
    setError('')
    setOcupado(true)
    try {
      const r = await arenaSend<{ pago: { checkout_url: string | null } }>(
        'POST',
        `/bookings/${encodeURIComponent(codigo)}/pay`,
        { t: token }
      )
      if (r.pago?.checkout_url) window.location.href = r.pago.checkout_url
      else setError('No pudimos abrir el pago. Intenta de nuevo.')
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(false)
    }
  }

  if (error && !reserva) {
    return (
      <main className="mx-auto w-full max-w-[520px] px-4 py-10" style={lato}>
        <h1 style={jost} className="text-[20px] text-[#111111]">
          NO ENCONTRAMOS TU RESERVA
        </h1>
        <p className="mt-2 text-[14px] text-[#666666]">
          {error} Revisa que estés usando el link completo que te llegó por correo.
        </p>
      </main>
    )
  }

  if (!reserva) {
    return (
      <main className="mx-auto w-full max-w-[520px] px-4 py-10" style={lato}>
        <p className="text-[14px] text-[#666666]">Cargando tu reserva…</p>
      </main>
    )
  }

  const qrPngHref = `${API_URL}/arena/bookings/${encodeURIComponent(reserva.codigo)}/qr.png${qs}`

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-6 md:px-6" style={lato}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={reserva.status} />
        <h1 style={jost} className="text-[26px] leading-none text-[#111111]">
          {reserva.codigo}
        </h1>
      </div>
      <p className="mt-2 text-[15px] text-[#111111]">
        {reserva.campo?.nombre ?? 'Campo'} · {fechaLarga(reserva.fecha)}
      </p>
      <p className="text-[13px] text-[#666666]">
        {reserva.num_jugadores} {reserva.num_jugadores === 1 ? 'jugador' : 'jugadores'}
        {reserva.campo?.ciudad ? ` · ${reserva.campo.ciudad}` : ''}
      </p>

      {aviso ? <p className="mt-4 text-[13px] text-[#1B5E20]">{aviso}</p> : null}
      {error ? <p className="mt-4 text-[13px] text-[#CC4B37]">{error}</p> : null}

      {reserva.qr_url ? (
        <section className="mt-6 flex flex-col items-center border border-solid border-[#EEEEEE] p-5">
          <p style={jost} className="text-[11px] tracking-[0.12em] text-[#666666]">
            MUESTRA ESTE QR EN LA ENTRADA
          </p>
          <div className="mt-3 bg-[#FFFFFF] p-2">
            <QRCodeCanvas value={reserva.qr_url} size={240} level="M" includeMargin />
          </div>
          <a
            href={qrPngHref}
            download={`${reserva.codigo}.png`}
            style={jost}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center border border-solid border-[#111111] px-4 text-[11px] text-[#111111]"
          >
            DESCARGAR QR
          </a>
        </section>
      ) : reserva.status === 'pendiente_pago' ? (
        <section className="mt-6 border border-solid border-[#EEEEEE] bg-[#FFF3CD] p-4">
          <p style={jost} className="text-[12px] text-[#856404]">
            FALTA EL PAGO
          </p>
          <p className="mt-1 text-[13px] text-[#856404]">
            Tu lugar se libera
            {reserva.expires_at ? ` el ${horaMexico(reserva.expires_at)}` : ' pronto'} si no
            completas el pago.
          </p>
          <button
            type="button"
            onClick={() => void reintentar()}
            disabled={ocupado}
            style={jost}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center bg-[#CC4B37] px-5 text-[11px] text-[#FFFFFF] disabled:opacity-50"
          >
            PAGAR AHORA
          </button>
        </section>
      ) : null}

      <section className="mt-6">
        <p style={jost} className="text-[12px] text-[#111111]">
          Recibo
        </p>
        <table className="mt-2 w-full border-collapse text-[13px]">
          <tbody>
            {reserva.items.map((i, n) => (
              <tr key={n}>
                <td className="py-1 text-[#666666]">
                  {i.nombre} × {i.cantidad}
                </td>
                <td className="py-1 text-right text-[#111111]">
                  <MoneyText centavos={i.subtotal_centavos} conMoneda={false} />
                </td>
              </tr>
            ))}
            <tr className="border-t border-solid border-[#EEEEEE]">
              <td className="py-2 font-bold text-[#111111]">Total</td>
              <td className="py-2 text-right font-bold text-[#CC4B37]">
                <MoneyText centavos={reserva.total_centavos} />
              </td>
            </tr>
            {reserva.reembolso_centavos > 0 ? (
              <tr>
                <td className="py-1 text-[#666666]">Reembolsado</td>
                <td className="py-1 text-right text-[#111111]">
                  <MoneyText centavos={reserva.reembolso_centavos} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {reserva.campo?.direccion || reserva.campo?.maps_url ? (
        <section className="mt-6">
          <p style={jost} className="text-[12px] text-[#111111]">
            Cómo llegar
          </p>
          {reserva.campo.direccion ? (
            <p className="mt-1 text-[13px] text-[#666666]">{reserva.campo.direccion}</p>
          ) : null}
          {reserva.campo.maps_url ? (
            <a
              href={reserva.campo.maps_url}
              target="_blank"
              rel="noreferrer"
              style={jost}
              className="mt-2 inline-flex min-h-[44px] items-center justify-center border border-solid border-[#111111] px-4 text-[11px] text-[#111111]"
            >
              ABRIR EN MAPS
            </a>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6 border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-3 text-[12px] text-[#666666]">
        {reserva.politica_cancelacion ||
          `Cancela hasta ${reserva.cancelacion_horas_limite} h antes de la hora de apertura y te devolvemos el 100%.`}
        {reserva.cancelable ? (
          <span className="mt-1 block">
            Puedes cancelar con reembolso hasta el {horaMexico(reserva.limite_cancelacion)}.
          </span>
        ) : null}
      </section>

      {reserva.cancelable ? (
        <section className="mt-5">
          {confirmando ? (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] text-[#111111]">
                Se te devuelve <MoneyText centavos={reserva.total_centavos} />. ¿Cancelamos?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void cancelar()}
                  disabled={ocupado}
                  style={jost}
                  className="min-h-[44px] bg-[#CC4B37] px-4 text-[11px] text-[#FFFFFF] disabled:opacity-50"
                >
                  SÍ, CANCELAR
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  style={jost}
                  className="min-h-[44px] border border-solid border-[#EEEEEE] px-4 text-[11px] text-[#666666]"
                >
                  NO
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              style={jost}
              className="min-h-[44px] border border-solid border-[#CC4B37] px-4 text-[11px] text-[#CC4B37]"
            >
              CANCELAR MI RESERVA
            </button>
          )}
        </section>
      ) : null}

      {reserva.cancelada_at ? (
        <p className="mt-5 text-[13px] text-[#666666]">
          Cancelada el {horaMexico(reserva.cancelada_at)}
          {reserva.cancelada_por ? ` por el ${reserva.cancelada_por}` : ''}
          {reserva.motivo_cancelacion ? ` — ${reserva.motivo_cancelacion}` : ''}.
        </p>
      ) : null}
    </main>
  )
}
