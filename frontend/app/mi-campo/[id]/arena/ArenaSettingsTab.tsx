'use client'

import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, type ArenaSettings } from '@/lib/arena-api'
import { SettingsForm } from '@/components/arena/SettingsForm'

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function ArenaSettingsTab({ fieldId }: { fieldId: string }) {
  const [settings, setSettings] = useState<ArenaSettings | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    arenaGet<{ settings: ArenaSettings }>(`/owner/fields/${fieldId}/settings`)
      .then((r) => vivo && setSettings(r.settings))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [fieldId])

  if (error) {
    return (
      <p className="py-6 text-[13px] text-[#CC4B37]" style={lato}>
        {error}
      </p>
    )
  }
  if (!settings) {
    return (
      <p className="py-6 text-[13px] text-[#666666]" style={lato}>
        Cargando configuración…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-[#666666]" style={lato}>
        Plan {settings.plan} · AirNation retiene {Number(settings.comision_pct)}% de cada
        reserva. El jugador no paga nada extra.
      </p>
      <SettingsForm fieldId={fieldId} settings={settings} onSaved={setSettings} />
    </div>
  )
}
