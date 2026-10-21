'use client'

import Link from 'next/link'
import { QRCodeCanvas } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, type ArenaBookingStatus } from '@/lib/arena-api'
import { fechaLarga } from '@/components/arena/fechas'
import { MoneyText } from '@/components/arena/MoneyText'
import { StatusBadge } from '@/components/arena/StatusBadge'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type MiReserva = {
  codigo: string
  fecha: string
  num_jugadores: number
  status: ArenaBookingStatus
  total_centavos: number
  reembolso_centavos: number
  access_token: string
  qr_token?: string
  qr_url?: string
  campo: { id: string; nombre: string; slug: string; ciudad: string | null } | null
}

function Tarjeta({ r, conQr }: { r: MiReserva; conQr: boolean }) {
  const href = `/reservas/${r.codigo}?t=${r.access_token}`
  const qrUrl = r.qr_url ?? null

  return (
    <li className="flex flex-col gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 sm:flex-row sm:items-center">
      {conQr && qrUrl ? (
        <Link href={href} className="shrink-0 bg-[#FFFFFF]" aria-label={`Ver reserva ${r.codigo}`}>
          <QRCodeCanvas value={qrUrl} size={88} level="M" includeMargin />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <StatusBadge status={r.status} />
        <p className="mt-1 text-[15px] font-bold text-[#111111]">
          {r.campo?.nombre ?? 'Campo'}
        </p>
        <p className="text-[13px] text-[#666666]">
          {fechaLarga(r.fecha)} · {r.num_jugadores}{' '}
          {r.num_jugadores === 1 ? 'jugador' : 'jugadores'}
        </p>
        <p className="text-[13px] text-[#111111]">
          {r.codigo} · <MoneyText centavos={r.total_centavos} conMoneda={false} />
          {r.reembolso_centavos > 0 ? (
            <span className="text-[#CC4B37]">
              {' '}
              · reembolsado <MoneyText centavos={r.reembolso_centavos} conMoneda={false} />
            </span>
          ) : null}
        </p>
      </div>
      <Link
        href={href}
        style={jost}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center border border-solid border-[#111111] px-4 text-[10px] text-[#111111]"
      >
        VER RESERVA
      </Link>
    </li>
  )
}

/** Mis reservas de ARENA: próximas con QR y pasadas. */
export function ReservasTab() {
  const [data, setData] = useState<{ proximas: MiReserva[]; pasadas: MiReserva[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    arenaGet<{ proximas: MiReserva[]; pasadas: MiReserva[] }>('/me/bookings')
      .then((r) => vivo && setData(r))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [])

  if (error) {
    return (
      <p className="py-8 text-[13px] text-[#CC4B37]" style={lato}>
        {error}
      </p>
    )
  }
  if (!data) {
    return (
      <p className="py-8 text-[13px] text-[#666666]" style={lato}>
        Cargando tus reservas…
      </p>
    )
  }
  if (data.proximas.length === 0 && data.pasadas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-12 text-center" style={lato}>
        <p className="text-[13px] text-[#666666]">Todavía no tienes reservas</p>
        <Link
          href="/campos"
          style={jost}
          className="inline-flex min-h-[44px] min-w-[200px] items-center justify-center bg-[#CC4B37] px-6 text-[11px] text-[#FFFFFF]"
        >
          VER CAMPOS
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-10" style={lato}>
      {data.proximas.length > 0 ? (
        <section>
          <p style={jost} className="mb-3 text-[12px] text-[#111111]">
            Próximas
          </p>
          <ul className="flex flex-col gap-3">
            {data.proximas.map((r) => (
              <Tarjeta key={r.codigo} r={r} conQr />
            ))}
          </ul>
        </section>
      ) : null}

      {data.pasadas.length > 0 ? (
        <section>
          <p style={jost} className="mb-3 text-[12px] text-[#111111]">
            Pasadas
          </p>
          <ul className="flex flex-col gap-3">
            {data.pasadas.map((r) => (
              <Tarjeta key={r.codigo} r={r} conQr={false} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
