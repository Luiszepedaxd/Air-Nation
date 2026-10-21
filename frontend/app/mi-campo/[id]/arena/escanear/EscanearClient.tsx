'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { arenaErrorMessage, arenaGet, type ArenaAgenda } from '@/lib/arena-api'
import { QrScanner } from '@/components/arena/QrScanner'
import { hoyMexico } from '@/components/arena/fechas'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** El QR codifica .../checkin/<qr_token>; también aceptamos el token pelón. */
function tokenDeTexto(texto: string): string | null {
  const limpio = texto.trim()
  const enUrl = limpio.match(/\/checkin\/([0-9a-f]{64})/i)
  if (enUrl) return enUrl[1]
  return /^[0-9a-f]{64}$/i.test(limpio) ? limpio : null
}

export function EscanearClient({ fieldId, nombre }: { fieldId: string; nombre: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)

  const leido = useCallback(
    (texto: string) => {
      const token = tokenDeTexto(texto)
      if (!token) {
        setError('Ese QR no es de una reserva de ARENA.')
        return
      }
      router.push(`/checkin/${token}`)
    },
    [router]
  )

  /** Respaldo por código: se busca en la agenda de hoy del propio campo. */
  const porCodigo = async () => {
    setError('')
    const buscado = codigo.trim().toUpperCase()
    if (!/^AR-[0-9A-Z]{6}$/.test(buscado)) {
      setError('El código se ve así: AR-7K2M9Q.')
      return
    }
    setBuscando(true)
    try {
      const hoy = hoyMexico()
      const agenda = await arenaGet<ArenaAgenda>(
        `/owner/fields/${fieldId}/bookings?desde=${hoy}&hasta=${hoy}`
      )
      const hit = agenda.reservas.find((b) => b.codigo === buscado)
      if (!hit) {
        setError('No encontramos ese código en las reservas de hoy.')
        return
      }
      if (!hit.qr_token) {
        setError(`Esa reserva está ${hit.status.replace('_', ' ')}: no se puede registrar la llegada.`)
        return
      }
      router.push(`/checkin/${hit.qr_token}`)
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setBuscando(false)
    }
  }

  return (
    <main className="mx-auto min-h-full w-full max-w-[520px] px-4 pt-6" style={lato}>
      <Link
        href={`/mi-campo/${fieldId}/arena`}
        style={jost}
        className="text-[11px] tracking-[0.12em] text-[#666666] underline"
      >
        ← ARENA
      </Link>
      <h1 style={jost} className="mt-2 text-[22px] text-[#111111]">
        ESCANEAR QR
      </h1>
      <p className="mt-1 text-[13px] text-[#666666]">
        Apunta al QR del jugador. {nombre}
      </p>

      <div className="mt-4">
        <QrScanner onLeido={leido} />
      </div>

      <div className="mt-6 border-t border-solid border-[#EEEEEE] pt-5">
        <p style={jost} className="text-[12px] text-[#111111]">
          O teclea el código
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void porCodigo()
            }}
            placeholder="AR-7K2M9Q"
            maxLength={9}
            className="min-h-[44px] flex-1 border border-solid border-[#EEEEEE] px-3 text-[16px] uppercase tracking-[0.1em] text-[#111111]"
            aria-label="Código de la reserva"
          />
          <button
            type="button"
            onClick={() => void porCodigo()}
            disabled={buscando}
            style={jost}
            className="min-h-[44px] bg-[#111111] px-4 text-[11px] text-[#FFFFFF] disabled:opacity-50"
          >
            BUSCAR
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-[13px] text-[#CC4B37]">{error}</p> : null}
    </main>
  )
}
