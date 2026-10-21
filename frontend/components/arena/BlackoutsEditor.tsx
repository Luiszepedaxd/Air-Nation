'use client'

import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, arenaSend, type ArenaBlackout } from '@/lib/arena-api'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

export function formatFechaLarga(fecha: string): string {
  // `fecha` es un día de calendario, sin hora: se arma en UTC para que no se
  // corra un día al formatearlo.
  const [y, m, d] = fecha.split('-').map(Number)
  if (!y || !m || !d) return fecha
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

/** Días cerrados extra (lluvia, evento privado), aparte del horario semanal. */
export function BlackoutsEditor({ fieldId }: { fieldId: string }) {
  const [lista, setLista] = useState<ArenaBlackout[] | null>(null)
  const [fecha, setFecha] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vivo = true
    arenaGet<{ blackouts: ArenaBlackout[] }>(`/owner/fields/${fieldId}/blackouts`)
      .then((r) => vivo && setLista(r.blackouts))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [fieldId])

  const agregar = async () => {
    setError('')
    if (!fecha) return setError('Elige la fecha que vas a cerrar.')
    setGuardando(true)
    try {
      const r = await arenaSend<{ blackout: ArenaBlackout }>(
        'POST',
        `/owner/fields/${fieldId}/blackouts`,
        { fecha, motivo: motivo.trim() || null }
      )
      setLista((prev) =>
        [...(prev ?? []).filter((b) => b.fecha !== r.blackout.fecha), r.blackout].sort((a, b) =>
          a.fecha.localeCompare(b.fecha)
        )
      )
      setFecha('')
      setMotivo('')
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async (id: string) => {
    setError('')
    try {
      await arenaSend('DELETE', `/owner/fields/${fieldId}/blackouts/${id}`)
      setLista((prev) => (prev ?? []).filter((b) => b.id !== id))
    } catch (err) {
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-4" style={lato}>
      <p className="text-[13px] text-[#666666]">
        Marca los días en que no vas a abrir aunque tu horario diga que sí. Nadie podrá
        reservar esas fechas.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Fecha
          <input
            type="date"
            className={inputClass}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>
        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-[12px] text-[#666666]">
          Motivo (opcional)
          <input
            type="text"
            className={inputClass}
            maxLength={200}
            placeholder="Lluvia, evento privado…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => void agregar()}
          disabled={guardando}
          style={jost}
          className="inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
        >
          CERRAR DÍA
        </button>
      </div>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      {lista === null ? (
        <p className="text-[13px] text-[#666666]">Cargando días cerrados…</p>
      ) : lista.length === 0 ? (
        <p className="text-[13px] text-[#666666]">No tienes días cerrados por delante.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
          {lista.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="text-[13px] text-[#111111]">
                {formatFechaLarga(b.fecha)}
                {b.motivo ? <span className="text-[#666666]"> — {b.motivo}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => void quitar(b.id)}
                style={jost}
                className="min-h-[36px] border border-solid border-[#CC4B37] px-3 text-[10px] text-[#CC4B37]"
              >
                REABRIR
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
