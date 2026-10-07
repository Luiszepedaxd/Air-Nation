'use client'

import { useState } from 'react'
import { setJoulieEnabled } from './actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function JoulieAdminClient({
  initialEnabled,
  ready,
}: {
  initialEnabled: boolean
  ready: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const flip = async () => {
    setSaving(true)
    setError('')
    const next = !enabled
    const result = await setJoulieEnabled(next)
    setSaving(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setEnabled(result.enabled)
  }

  return (
    <div
      className={`border-2 p-5 ${
        enabled ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.05)]' : 'border-[#EEEEEE] bg-[#FAFAFA]'
      }`}
    >
      <p className="text-[10px] tracking-[0.18em] text-[#999999]" style={jost}>
        {enabled ? 'Joulie activa' : 'Joulie apagada'}
      </p>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#666666]" style={lato}>
        Si la apagas, desaparece de la app y deja de responder. El cambio se guarda al momento, sin volver a desplegar.
      </p>
      {!ready ? (
        <p className="mt-3 text-[13px] text-[#CC4B37]" style={lato}>
          Falta crear la tabla. Ejecuta supabase/sql/joulie_config.sql en el editor SQL de Supabase. Mientras tanto sigue activa.
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void flip()}
        disabled={saving || !ready}
        className="mt-4 bg-[#111111] px-6 py-3 text-[12px] text-white disabled:opacity-50"
        style={jost}
      >
        {saving ? 'Guardando...' : enabled ? 'Apagar Joulie' : 'Activar Joulie'}
      </button>
      {error ? (
        <p className="mt-3 text-[13px] text-[#CC4B37]" style={lato}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
