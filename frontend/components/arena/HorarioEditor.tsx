'use client'

import { useState } from 'react'
import { arenaErrorMessage, arenaSend } from '@/lib/arena-api'
import {
  FIELD_DAY_KEYS,
  FIELD_DAY_LABELS,
  weekScheduleFromJson,
  weekScheduleToJson,
  type WeekScheduleState,
} from '@/lib/field-schedule'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

/**
 * El horario semanal de la ficha del campo. ARENA no tiene un horario aparte:
 * los días en que el campo abre son los que se pueden reservar.
 */
export function HorarioEditor({
  fieldId,
  horariosJson,
}: {
  fieldId: string
  horariosJson: unknown
}) {
  const [week, setWeek] = useState<WeekScheduleState>(() => weekScheduleFromJson(horariosJson))
  const [estado, setEstado] = useState<'' | 'guardando' | 'ok'>('')
  const [error, setError] = useState('')

  const guardar = async () => {
    setError('')
    setEstado('guardando')
    try {
      await arenaSend('PATCH', `/owner/fields/${fieldId}/horario`, {
        horarios_json: weekScheduleToJson(week),
      })
      setEstado('ok')
    } catch (err) {
      setEstado('')
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-4" style={lato}>
      <p className="text-[13px] text-[#666666]">
        Los jugadores solo pueden reservar los días en que el campo abre. Este es el mismo
        horario que se muestra en la ficha pública.
      </p>

      <div className="flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
        {FIELD_DAY_KEYS.map((key) => {
          const day = week[key]
          return (
            <div key={key} className="flex flex-wrap items-center gap-3 px-3 py-3">
              <label className="flex min-w-[150px] items-center gap-2 text-[13px] text-[#111111]">
                <input
                  type="checkbox"
                  checked={day.abierto}
                  onChange={(e) =>
                    setWeek((prev) => ({
                      ...prev,
                      [key]: { ...prev[key], abierto: e.target.checked },
                    }))
                  }
                />
                <span style={jost} className="text-[11px]">
                  {FIELD_DAY_LABELS[key]}
                </span>
              </label>
              {day.abierto ? (
                <div className="flex items-center gap-2 text-[13px] text-[#666666]">
                  <input
                    type="time"
                    value={day.apertura}
                    onChange={(e) =>
                      setWeek((prev) => ({
                        ...prev,
                        [key]: { ...prev[key], apertura: e.target.value },
                      }))
                    }
                    className="border border-solid border-[#EEEEEE] px-2 py-1.5 text-[13px]"
                    aria-label={`Apertura ${FIELD_DAY_LABELS[key]}`}
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={day.cierre}
                    onChange={(e) =>
                      setWeek((prev) => ({
                        ...prev,
                        [key]: { ...prev[key], cierre: e.target.value },
                      }))
                    }
                    className="border border-solid border-[#EEEEEE] px-2 py-1.5 text-[13px]"
                    aria-label={`Cierre ${FIELD_DAY_LABELS[key]}`}
                  />
                </div>
              ) : (
                <span className="text-[12px] text-[#999999]">Cerrado</span>
              )}
            </div>
          )
        })}
      </div>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
      {estado === 'ok' ? <p className="text-[13px] text-[#1B5E20]">Horario guardado.</p> : null}

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={estado === 'guardando'}
        style={jost}
        className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#CC4B37] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50 sm:w-auto"
      >
        {estado === 'guardando' ? 'GUARDANDO…' : 'GUARDAR HORARIO'}
      </button>
    </div>
  )
}
