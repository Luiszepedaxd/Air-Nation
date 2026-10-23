'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, arenaSend, type ArenaReserva } from '@/lib/arena-api'
import { fechaLarga } from '@/components/arena/fechas'
import { MoneyText } from '@/components/arena/MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Checkout del proveedor `mock`: aprobar o rechazar el pago de prueba. */
export function PagoSimuladoClient({ codigo }: { codigo: string }) {
  const token = useSearchParams().get('t') ?? ''
  const [reserva, setReserva] = useState<ArenaReserva | null>(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const qs = token ? `?t=${encodeURIComponent(token)}` : ''
  const volver = `/reservas/${encodeURIComponent(codigo)}${qs}`

  useEffect(() => {
    let vivo = true
    arenaGet<{ reserva: ArenaReserva }>(`/bookings/${encodeURIComponent(codigo)}${qs}`)
      .then((r) => vivo && setReserva(r.reserva))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [codigo, qs])

  const completar = async (resultado: 'ok' | 'fail') => {
    if (!reserva?.pago_pendiente) {
      setError('Esta reserva no tiene un pago pendiente.')
      return
    }
    setError('')
    setOcupado(true)
    try {
      // El token del link es lo que autoriza la aprobación de prueba.
      await arenaSend(
        'POST',
        `/payments/mock/${reserva.pago_pendiente.id}/complete?result=${resultado}&t=${encodeURIComponent(token)}`
      )
      window.location.href = volver
    } catch (err) {
      setError(arenaErrorMessage(err))
      setOcupado(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[460px] px-4 py-10" style={lato}>
      <p
        style={jost}
        className="inline-block bg-[#FFF3CD] px-2 py-1 text-[10px] tracking-[0.12em] text-[#856404]"
      >
        PAGO DE PRUEBA
      </p>
      <h1 style={jost} className="mt-3 text-[22px] text-[#111111]">
        {codigo}
      </h1>
      <p className="mt-1 text-[13px] text-[#666666]">
        Esta pantalla simula la pasarela. No se cobra nada real.
      </p>

      {error ? <p className="mt-4 text-[13px] text-[#CC4B37]">{error}</p> : null}

      {reserva ? (
        <div className="mt-6 border border-solid border-[#EEEEEE] p-4">
          <p className="text-[14px] text-[#111111]">
            {reserva.campo?.nombre} · {fechaLarga(reserva.fecha)}
          </p>
          <p className="text-[13px] text-[#666666]">
            {reserva.num_jugadores} {reserva.num_jugadores === 1 ? 'jugador' : 'jugadores'}
          </p>
          <p style={jost} className="mt-3 text-[24px] text-[#CC4B37]">
            <MoneyText centavos={reserva.total_centavos} />
          </p>
          {!reserva.pago_pendiente ? (
            <p className="mt-3 text-[13px] text-[#666666]">
              Esta reserva ya no tiene un pago pendiente.{' '}
              <a href={volver} className="text-[#CC4B37] underline">
                Ver mi reserva
              </a>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-[13px] text-[#666666]">Cargando…</p>
      )}

      {reserva?.pago_pendiente ? (
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void completar('ok')}
            disabled={ocupado}
            style={jost}
            className="min-h-[48px] bg-[#1B5E20] px-5 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
          >
            APROBAR EL PAGO
          </button>
          <button
            type="button"
            onClick={() => void completar('fail')}
            disabled={ocupado}
            style={jost}
            className="min-h-[48px] border border-solid border-[#CC4B37] px-5 text-[12px] tracking-[0.12em] text-[#CC4B37] disabled:opacity-50"
          >
            RECHAZAR EL PAGO
          </button>
        </div>
      ) : null}
    </main>
  )
}
