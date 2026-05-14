'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateBoothConfig } from './actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

export function BoothAdminClient({
  initialActive,
  initialEventName,
  countCurrent,
  eventosHistorial,
}: {
  initialActive: boolean
  initialEventName: string
  countCurrent: number
  eventosHistorial: { event_name: string; total: number }[]
}) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [eventName, setEventName] = useState(initialEventName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function handleSave() {
    setError(null)
    if (active && !eventName.trim()) {
      setError('Si activas el modo booth necesitas un nombre de evento.')
      return
    }
    setSaving(true)
    const res = await updateBoothConfig({
      active,
      event_name: active ? eventName.trim() : null,
    })
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setSavedAt(Date.now())
    router.refresh()
  }

  const boothUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register/booth`
      : 'https://www.airnation.online/register/booth'

  return (
    <div style={lato}>
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jost}
      >
        MODO BOOTH
      </h1>

      <p className="mb-6 max-w-[640px] text-[14px] leading-relaxed text-[#666666]">
        Activa este modo SOLO cuando tengas booth físico en un evento. Los usuarios que se registren desde{' '}
        <strong>/register/booth</strong> se crean con email pre-confirmado y entran directo al onboarding sin
        necesidad de abrir su correo. Apaga el toggle apenas termine el evento.
      </p>

      <div
        className={`border-2 p-6 md:p-8 ${active ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.05)]' : 'border-[#EEEEEE] bg-[#FAFAFA]'}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.18em] text-[#999999]" style={jost}>
              ESTADO ACTUAL
            </p>
            <p
              className={`mt-1 text-[28px] ${active ? 'text-[#CC4B37]' : 'text-[#666666]'}`}
              style={jost}
            >
              {active ? '● ACTIVO' : '○ INACTIVO'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className="relative h-9 w-16 transition-colors"
            style={{
              background: active ? '#CC4B37' : '#CCCCCC',
              borderRadius: 100,
            }}
            aria-pressed={active}
          >
            <span
              className="absolute top-1 block h-7 w-7 bg-white shadow transition-transform"
              style={{
                borderRadius: '50%',
                transform: active ? 'translateX(33px)' : 'translateX(4px)',
              }}
            />
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          <label
            className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888]"
            style={jost}
          >
            Nombre del evento (ej. BM2_2026)
          </label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder="BM2_2026"
            maxLength={50}
            disabled={!active}
            className="w-full border border-[#E4E4E4] bg-white px-3 py-2.5 text-[13px] text-[#111111] outline-none focus:border-[#111111] disabled:bg-[#F4F4F4] disabled:text-[#999999]"
          />
          <p className="text-[11px] text-[#999999]">
            Se guarda en cada usuario nuevo en la columna <code>registered_at_event</code>. Solo letras, números y
            guiones bajos.
          </p>
        </div>

        {error && (
          <div className="mt-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
            <p className="text-[12px] text-[#CC4B37]">{error}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#111111] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white transition-colors hover:bg-[#CC4B37] disabled:opacity-50"
            style={jost}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {savedAt && (
            <span className="text-[11px] text-[#22C55E]" style={jost}>
              ● Guardado
            </span>
          )}
        </div>
      </div>

      {active && eventName.trim() && (
        <div className="mt-6 border border-[#111111] bg-white p-6">
          <p className="text-[10px] tracking-[0.18em] text-[#999999]" style={jost}>
            URL DE REGISTRO BOOTH (ABRIR EN TABLETS)
          </p>
          <p className="mt-2 select-all break-all text-[18px] text-[#CC4B37]" style={jost}>
            {boothUrl}
          </p>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(boothUrl)
              }
            }}
            className="mt-3 border border-[#111111] bg-white px-3 py-2 text-[10px] tracking-[0.12em] text-[#111111] hover:bg-[#111111] hover:text-white"
            style={jost}
          >
            Copiar URL
          </button>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-[32px] text-[#111111]" style={jost}>
              {countCurrent}
            </span>
            <span className="text-[12px] text-[#666666]" style={lato}>
              {countCurrent === 1 ? 'registro' : 'registros'} en este evento
            </span>
          </div>
        </div>
      )}

      {eventosHistorial.length > 0 && (
        <section className="mt-10 border-t border-[#EEEEEE] pt-8">
          <h2 className="mb-4 text-[11px] tracking-[0.18em] text-[#666666]" style={jost}>
            HISTORIAL DE EVENTOS
          </h2>
          <div className="flex flex-col gap-2">
            {eventosHistorial.map((e) => (
              <div
                key={e.event_name}
                className="flex items-center justify-between border border-[#EEEEEE] bg-[#FAFAFA] px-4 py-3"
              >
                <span className="text-[13px] text-[#111111]" style={jost}>
                  {e.event_name}
                </span>
                <span className="text-[13px] text-[#666666]" style={lato}>
                  {e.total} {e.total === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
