'use client'

import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, arenaSend, type ArenaCheckoutConfirmacion } from '@/lib/arena-api'
import { formatCentavos } from '@/components/arena/MoneyText'
import { conMayuscula, fechaMedia } from '@/components/arena/fechas'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/**
 * Checkout del proveedor `mock` para un pago de carrito: aprobar o rechazar.
 * Dispara el mismo flujo que el webhook real y vuelve a la confirmación.
 */
export function PagoSimuladoCarritoClient({
  paymentId,
  token,
}: {
  paymentId: string
  token: string
}) {
  const [datos, setDatos] = useState<ArenaCheckoutConfirmacion | null>(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const volver = `/arena/confirmacion?p=${encodeURIComponent(paymentId)}&t=${encodeURIComponent(token)}`

  useEffect(() => {
    if (!paymentId || !token) {
      setError('Este link no trae el pago.')
      return
    }
    let vivo = true
    arenaGet<ArenaCheckoutConfirmacion>(
      `/checkout/${encodeURIComponent(paymentId)}?t=${encodeURIComponent(token)}`
    )
      .then((r) => vivo && setDatos(r))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [paymentId, token])

  const completar = async (resultado: 'ok' | 'fail') => {
    setError('')
    setOcupado(true)
    try {
      await arenaSend('POST', `/payments/mock/${paymentId}/complete?result=${resultado}`)
      window.location.href = volver
    } catch (err) {
      setError(arenaErrorMessage(err))
      setOcupado(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[460px] px-4 py-10" style={lato}>
      <p style={jost} className="inline-block bg-[#FFF3CD] px-2 py-1 text-[10px] tracking-[0.12em] text-[#856404]">
        PAGO DE PRUEBA
      </p>
      <h1 style={jost} className="mt-3 text-[22px] text-[#111111]">
        {datos ? `${datos.reservas.length} ${datos.reservas.length === 1 ? 'RESERVA' : 'RESERVAS'}` : 'TU CARRITO'}
      </h1>
      <p className="mt-1 text-[13px] text-[#666666]">
        Esta pantalla simula la pasarela. No se cobra nada real.
      </p>

      {error ? <p className="mt-4 text-[13px] text-[#CC4B37]">{error}</p> : null}

      {datos ? (
        <div className="mt-6 border border-solid border-[#EEEEEE]">
          {datos.reservas.map((r) => (
            <div key={r.codigo} className="border-b border-solid border-[#EEEEEE] p-4 last:border-b-0">
              <p className="text-[14px] text-[#111111]">
                {r.campo?.nombre} · {conMayuscula(fechaMedia(r.fecha))}
              </p>
              <p className="text-[13px] text-[#666666]">
                {r.num_jugadores} {r.num_jugadores === 1 ? 'jugador' : 'jugadores'} ·{' '}
                {formatCentavos(r.total_centavos, false)}
              </p>
            </div>
          ))}
          <div className="flex items-baseline justify-between p-4">
            <b>Total</b>
            <span style={jost} className="text-[24px] text-[#CC4B37]">
              {formatCentavos(datos.total_centavos, false)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          disabled={ocupado || !datos}
          onClick={() => void completar('ok')}
          style={jost}
          className="min-h-[48px] bg-[#CC4B37] px-4 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-40"
        >
          {ocupado ? 'PROCESANDO…' : 'APROBAR PAGO'}
        </button>
        <button
          type="button"
          disabled={ocupado || !datos}
          onClick={() => void completar('fail')}
          style={jost}
          className="min-h-[48px] border border-solid border-[#EEEEEE] px-4 text-[12px] tracking-[0.12em] text-[#666666] disabled:opacity-40"
        >
          RECHAZAR PAGO
        </button>
      </div>
    </main>
  )
}
