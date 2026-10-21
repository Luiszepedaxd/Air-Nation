'use client'

import { useCallback, useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, type ArenaAgenda, type ArenaAgendaBooking } from '@/lib/arena-api'
import { BookingDrawer } from './BookingDrawer'
import { fechaLarga, hoyMexico, sumaDias } from './fechas'
import { MoneyText } from './MoneyText'
import { StatusBadge } from './StatusBadge'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/** Agenda de un día: esperados, llegados y la ficha de cada reserva. */
export function BookingsAgenda({ fieldId }: { fieldId: string }) {
  const [dia, setDia] = useState(() => hoyMexico())
  const [agenda, setAgenda] = useState<ArenaAgenda | null>(null)
  const [error, setError] = useState('')
  const [abierta, setAbierta] = useState<string | null>(null)

  const cargar = useCallback(
    (fecha: string) => {
      setError('')
      setAgenda(null)
      arenaGet<ArenaAgenda>(`/owner/fields/${fieldId}/bookings?desde=${fecha}&hasta=${fecha}`)
        .then(setAgenda)
        .catch((err) => setError(arenaErrorMessage(err)))
    },
    [fieldId]
  )

  useEffect(() => cargar(dia), [cargar, dia])

  const actualizar = (b: ArenaAgendaBooking) => {
    setAgenda((prev) =>
      prev ? { ...prev, reservas: prev.reservas.map((x) => (x.id === b.id ? b : x)) } : prev
    )
  }

  const seleccionada = agenda?.reservas.find((b) => b.id === abierta) ?? null

  return (
    <div className="flex flex-col gap-4" style={lato}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDia((d) => sumaDias(d, -1))}
          aria-label="Día anterior"
          style={jost}
          className="min-h-[44px] min-w-[44px] border border-solid border-[#EEEEEE] text-[13px] text-[#666666]"
        >
          ‹
        </button>
        <input
          type="date"
          value={dia}
          onChange={(e) => e.target.value && setDia(e.target.value)}
          className="min-h-[44px] border border-solid border-[#EEEEEE] px-3 text-[14px] text-[#111111]"
          aria-label="Día de la agenda"
        />
        <button
          type="button"
          onClick={() => setDia((d) => sumaDias(d, 1))}
          aria-label="Día siguiente"
          style={jost}
          className="min-h-[44px] min-w-[44px] border border-solid border-[#EEEEEE] text-[13px] text-[#666666]"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => setDia(hoyMexico())}
          style={jost}
          className="min-h-[44px] border border-solid border-[#111111] px-3 text-[10px] text-[#111111]"
        >
          HOY
        </button>
      </div>

      <p style={jost} className="text-[13px] text-[#111111]">
        {fechaLarga(dia)}
      </p>

      {agenda ? (
        <div className="flex gap-3">
          <div className="flex-1 border border-solid border-[#EEEEEE] p-3">
            <p className="text-[11px] text-[#666666]">Esperados</p>
            <p style={jost} className="text-[24px] text-[#111111]">
              {agenda.esperados}
            </p>
          </div>
          <div className="flex-1 border border-solid border-[#EEEEEE] p-3">
            <p className="text-[11px] text-[#666666]">Llegaron</p>
            <p style={jost} className="text-[24px] text-[#CC4B37]">
              {agenda.llegaron}
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      {!agenda && !error ? (
        <p className="text-[13px] text-[#666666]">Cargando agenda…</p>
      ) : agenda && agenda.reservas.length === 0 ? (
        <p className="py-6 text-[13px] text-[#666666]">No hay reservas para este día.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(agenda?.reservas ?? []).map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setAbierta(b.id)}
                className="flex w-full items-center justify-between gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-3 text-left"
              >
                <span className="min-w-0">
                  <StatusBadge status={b.status} />
                  <span className="mt-1 block text-[14px] font-bold text-[#111111]">
                    {b.contacto_nombre}
                  </span>
                  <span className="block text-[12px] text-[#666666]">
                    {b.codigo} · {b.num_jugadores}{' '}
                    {b.num_jugadores === 1 ? 'jugador' : 'jugadores'}
                    {b.jugadores_llegaron != null ? ` · llegaron ${b.jugadores_llegaron}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-right text-[13px] text-[#111111]">
                  <MoneyText centavos={b.total_centavos} conMoneda={false} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {seleccionada && agenda ? (
        <BookingDrawer
          fieldId={fieldId}
          booking={seleccionada}
          hoy={agenda.hoy}
          onChanged={actualizar}
          onClose={() => setAbierta(null)}
        />
      ) : null}
    </div>
  )
}
