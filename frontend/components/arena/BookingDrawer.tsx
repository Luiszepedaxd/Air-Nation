'use client'

import Link from 'next/link'
import { useState } from 'react'
import { arenaErrorMessage, arenaSend, type ArenaAgendaBooking } from '@/lib/arena-api'
import { fechaLarga, horaMexico } from './fechas'
import { MoneyText } from './MoneyText'
import { StatusBadge } from './StatusBadge'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Ficha de una reserva con las dos acciones del dueño: cancelar y no-show. */
export function BookingDrawer({
  fieldId,
  booking,
  hoy,
  onChanged,
  onClose,
}: {
  fieldId: string
  booking: ArenaAgendaBooking
  hoy: string
  onChanged: (b: ArenaAgendaBooking) => void
  onClose: () => void
}) {
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState<'cancelar' | 'no_show' | null>(null)
  const [motivo, setMotivo] = useState('')
  const [aviso, setAviso] = useState('')

  const puedeCancelar = ['confirmada', 'pendiente_pago'].includes(booking.status)
  const puedeNoShow = booking.status === 'confirmada' && booking.fecha <= hoy

  const accionar = async (accion: 'cancelar' | 'no_show') => {
    setError('')
    setOcupado(true)
    try {
      const r = await arenaSend<{
        reserva: { status: string } | null
        reembolso_centavos?: number
        reembolso_manual?: boolean
      }>('PATCH', `/owner/fields/${fieldId}/bookings/${booking.id}/status`, {
        accion,
        ...(accion === 'cancelar' && motivo.trim() ? { motivo: motivo.trim() } : {}),
      })
      onChanged({
        ...booking,
        status: (r.reserva?.status as ArenaAgendaBooking['status']) ?? booking.status,
      })
      setConfirmando(null)
      if (accion === 'cancelar') {
        setAviso(
          r.reembolso_manual
            ? 'Reserva cancelada. El reembolso lo tiene que hacer AirNation a mano porque ya estaba liquidada.'
            : 'Reserva cancelada y reembolsada al 100%.'
        )
      }
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" style={lato}>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-[#111111]/50"
      />
      <div className="relative z-10 max-h-[90dvh] w-full max-w-[520px] overflow-y-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <StatusBadge status={booking.status} />
            <p style={jost} className="mt-2 text-[20px] text-[#111111]">
              {booking.codigo}
            </p>
            <p className="text-[13px] text-[#666666]">{fechaLarga(booking.fecha)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="h-9 w-9 shrink-0 border border-solid border-[#EEEEEE] text-[16px] leading-none text-[#666666]"
          >
            ×
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
          <dt className="text-[#666666]">Jugadores</dt>
          <dd className="text-[#111111]">
            {booking.num_jugadores}
            {booking.jugadores_llegaron != null ? ` · llegaron ${booking.jugadores_llegaron}` : ''}
          </dd>
          <dt className="text-[#666666]">Contacto</dt>
          <dd className="text-[#111111]">{booking.contacto_nombre}</dd>
          <dt className="text-[#666666]">Email</dt>
          <dd className="break-all text-[#111111]">{booking.contacto_email}</dd>
          {booking.contacto_telefono ? (
            <>
              <dt className="text-[#666666]">Teléfono</dt>
              <dd className="text-[#111111]">
                <a href={`tel:${booking.contacto_telefono}`} className="text-[#CC4B37] underline">
                  {booking.contacto_telefono}
                </a>
              </dd>
            </>
          ) : null}
          <dt className="text-[#666666]">Origen</dt>
          <dd className="text-[#111111]">{booking.origen}</dd>
          {booking.checkin_at ? (
            <>
              <dt className="text-[#666666]">Llegada</dt>
              <dd className="text-[#111111]">{horaMexico(booking.checkin_at)}</dd>
            </>
          ) : null}
          {booking.cancelada_por ? (
            <>
              <dt className="text-[#666666]">Canceló</dt>
              <dd className="text-[#111111]">
                {booking.cancelada_por}
                {booking.motivo_cancelacion ? ` — ${booking.motivo_cancelacion}` : ''}
              </dd>
            </>
          ) : null}
        </dl>

        {booking.notas_jugador ? (
          <p className="mt-3 border-l-2 border-[#EEEEEE] pl-3 text-[13px] text-[#666666]">
            {booking.notas_jugador}
          </p>
        ) : null}

        <table className="mt-4 w-full border-collapse text-[13px]">
          <tbody>
            {booking.items.map((i, n) => (
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
              <td className="py-2 font-bold text-[#111111]">Total pagado</td>
              <td className="py-2 text-right font-bold text-[#CC4B37]">
                <MoneyText centavos={booking.total_centavos} />
              </td>
            </tr>
            <tr>
              <td className="py-1 text-[#666666]">Te toca</td>
              <td className="py-1 text-right text-[#111111]">
                <MoneyText centavos={booking.monto_campo_centavos - booking.reembolso_centavos} />
              </td>
            </tr>
            {booking.reembolso_centavos > 0 ? (
              <tr>
                <td className="py-1 text-[#666666]">Reembolsado</td>
                <td className="py-1 text-right text-[#CC4B37]">
                  −<MoneyText centavos={booking.reembolso_centavos} conMoneda={false} />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        {aviso ? <p className="mt-3 text-[13px] text-[#1B5E20]">{aviso}</p> : null}
        {error ? <p className="mt-3 text-[13px] text-[#CC4B37]">{error}</p> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {booking.qr_token ? (
            <Link
              href={`/checkin/${booking.qr_token}`}
              style={jost}
              className="inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-4 text-[11px] tracking-[0.12em] text-[#FFFFFF]"
            >
              REGISTRAR LLEGADA
            </Link>
          ) : null}

          {confirmando === 'cancelar' ? (
            <div className="w-full">
              <p className="text-[13px] text-[#111111]">
                Al cancelar le devolvemos el 100% al jugador. ¿Seguro?
              </p>
              <input
                className="mt-2 w-full border border-solid border-[#EEEEEE] px-3 py-2 text-[13px]"
                placeholder="Motivo (opcional)"
                maxLength={300}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void accionar('cancelar')}
                  style={jost}
                  className="min-h-[44px] bg-[#CC4B37] px-4 text-[11px] text-[#FFFFFF] disabled:opacity-50"
                >
                  SÍ, CANCELAR
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(null)}
                  style={jost}
                  className="min-h-[44px] border border-solid border-[#EEEEEE] px-4 text-[11px] text-[#666666]"
                >
                  NO
                </button>
              </div>
            </div>
          ) : confirmando === 'no_show' ? (
            <div className="w-full">
              <p className="text-[13px] text-[#111111]">
                Marcar como no llegó. No hay reembolso. ¿Seguro?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void accionar('no_show')}
                  style={jost}
                  className="min-h-[44px] bg-[#CC4B37] px-4 text-[11px] text-[#FFFFFF] disabled:opacity-50"
                >
                  SÍ, NO LLEGÓ
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmando(null)}
                  style={jost}
                  className="min-h-[44px] border border-solid border-[#EEEEEE] px-4 text-[11px] text-[#666666]"
                >
                  NO
                </button>
              </div>
            </div>
          ) : (
            <>
              {puedeCancelar ? (
                <button
                  type="button"
                  onClick={() => setConfirmando('cancelar')}
                  style={jost}
                  className="min-h-[44px] border border-solid border-[#CC4B37] px-4 text-[11px] text-[#CC4B37]"
                >
                  CANCELAR Y REEMBOLSAR
                </button>
              ) : null}
              {puedeNoShow ? (
                <button
                  type="button"
                  onClick={() => setConfirmando('no_show')}
                  style={jost}
                  className="min-h-[44px] border border-solid border-[#EEEEEE] px-4 text-[11px] text-[#666666]"
                >
                  NO LLEGÓ
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
