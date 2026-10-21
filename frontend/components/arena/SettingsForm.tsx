'use client'

import { useState } from 'react'
import { arenaErrorMessage, arenaSend, type ArenaSettings } from '@/lib/arena-api'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

/**
 * Configuración que maneja el dueño. El plan y la comisión no están aquí a
 * propósito: solo AirNation los cambia desde /admin/arena.
 */
export function SettingsForm({
  fieldId,
  settings,
  onSaved,
}: {
  fieldId: string
  settings: ArenaSettings
  onSaved?: (s: ArenaSettings) => void
}) {
  const [v, setV] = useState({
    anticipacion_min_horas: String(settings.anticipacion_min_horas),
    anticipacion_max_dias: String(settings.anticipacion_max_dias),
    cancelacion_horas_limite: String(settings.cancelacion_horas_limite),
    politica_cancelacion: settings.politica_cancelacion ?? '',
    email_avisos: settings.email_avisos ?? '',
    telefono_avisos: settings.telefono_avisos ?? '',
    banco: settings.banco ?? '',
    clabe: settings.clabe ?? '',
    titular_cuenta: settings.titular_cuenta ?? '',
  })
  const [estado, setEstado] = useState<'' | 'guardando' | 'ok'>('')
  const [error, setError] = useState('')

  const set = (k: keyof typeof v, value: string) => setV((prev) => ({ ...prev, [k]: value }))

  const guardar = async () => {
    setError('')
    setEstado('guardando')
    try {
      const r = await arenaSend<{ settings: ArenaSettings }>(
        'PATCH',
        `/owner/fields/${fieldId}/settings`,
        {
          anticipacion_min_horas: Number(v.anticipacion_min_horas),
          anticipacion_max_dias: Number(v.anticipacion_max_dias),
          cancelacion_horas_limite: Number(v.cancelacion_horas_limite),
          politica_cancelacion: v.politica_cancelacion.trim() || null,
          email_avisos: v.email_avisos.trim() || null,
          telefono_avisos: v.telefono_avisos.trim() || null,
          banco: v.banco.trim() || null,
          clabe: v.clabe.replace(/\s/g, '') || null,
          titular_cuenta: v.titular_cuenta.trim() || null,
        }
      )
      setEstado('ok')
      onSaved?.(r.settings)
    } catch (err) {
      setEstado('')
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-5" style={lato}>
      <section className="flex flex-col gap-3">
        <p style={jost} className="text-[12px] text-[#111111]">
          Política de cancelación
        </p>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Horas antes de la apertura para cancelar con reembolso del 100%
          <input
            className={inputClass}
            inputMode="numeric"
            value={v.cancelacion_horas_limite}
            onChange={(e) => set('cancelacion_horas_limite', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Texto que lee el jugador antes de pagar
          <textarea
            className={inputClass}
            rows={4}
            maxLength={2000}
            value={v.politica_cancelacion}
            onChange={(e) => set('politica_cancelacion', e.target.value)}
            placeholder="Cancela hasta 24 h antes de la hora de apertura y te devolvemos el 100%. Después de ese plazo no hay reembolso."
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <p style={jost} className="text-[12px] text-[#111111]">
          Anticipación
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Mínima (horas antes de abrir)
            <input
              className={inputClass}
              inputMode="numeric"
              value={v.anticipacion_min_horas}
              onChange={(e) => set('anticipacion_min_horas', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Máxima (días por delante)
            <input
              className={inputClass}
              inputMode="numeric"
              value={v.anticipacion_max_dias}
              onChange={(e) => set('anticipacion_max_dias', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p style={jost} className="text-[12px] text-[#111111]">
          Avisos
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Email para avisos de reservas
            <input
              className={inputClass}
              type="email"
              value={v.email_avisos}
              onChange={(e) => set('email_avisos', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Teléfono
            <input
              className={inputClass}
              value={v.telefono_avisos}
              onChange={(e) => set('telefono_avisos', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p style={jost} className="text-[12px] text-[#111111]">
          Datos para tu liquidación
        </p>
        <p className="text-[12px] text-[#999999]">
          AirNation te transfiere cada semana lo que te corresponde. Estos datos no se
          muestran a nadie más.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Banco
            <input
              className={inputClass}
              value={v.banco}
              onChange={(e) => set('banco', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            CLABE (18 dígitos)
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={22}
              value={v.clabe}
              onChange={(e) => set('clabe', e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Titular de la cuenta
          <input
            className={inputClass}
            value={v.titular_cuenta}
            onChange={(e) => set('titular_cuenta', e.target.value)}
          />
        </label>
      </section>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
      {estado === 'ok' ? <p className="text-[13px] text-[#1B5E20]">Configuración guardada.</p> : null}

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={estado === 'guardando'}
        style={jost}
        className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#CC4B37] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50 sm:w-auto"
      >
        {estado === 'guardando' ? 'GUARDANDO…' : 'GUARDAR CONFIGURACIÓN'}
      </button>
    </div>
  )
}
