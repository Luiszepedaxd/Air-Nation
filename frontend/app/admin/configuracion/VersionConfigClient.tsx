'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function VersionConfigClient() {
  const [iosVersion, setIosVersion] = useState('')
  const [androidVersion, setAndroidVersion] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { data, error } = await supabase
        .from('app_version_config')
        .select('min_version_ios, min_version_android')
        .eq('id', 'singleton')
        .single()
      if (!cancelled) {
        if (error) {
          setError('No se pudo cargar la configuración')
        } else if (data) {
          setIosVersion(data.min_version_ios)
          setAndroidVersion(data.min_version_android)
        }
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    const { error } = await supabase
      .from('app_version_config')
      .update({
        min_version_ios: iosVersion.trim(),
        min_version_android: androidVersion.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'singleton')
    setSaving(false)
    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  if (loading) {
    return <div className="p-8 text-[#666666]" style={lato}>Cargando...</div>
  }

  return (
    <div className="max-w-2xl p-8">
      <h1 style={jost} className="mb-2 text-[28px] text-[#111111]">
        CONFIGURACIÓN DE VERSIONES
      </h1>
      <p className="mb-8 text-[14px] leading-relaxed text-[#666666]" style={lato}>
        Define la versión mínima requerida. Los usuarios con una versión menor verán una
        pantalla obligándolos a actualizar desde la tienda.
      </p>

      <div className="space-y-6">
        <div>
          <label style={jost} className="mb-2 block text-[11px] text-[#999999]">
            Versión mínima iOS
          </label>
          <input
            type="text"
            value={iosVersion}
            onChange={(e) => setIosVersion(e.target.value)}
            placeholder="1.0.8"
            className="w-full max-w-[240px] border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
            style={lato}
          />
        </div>

        <div>
          <label style={jost} className="mb-2 block text-[11px] text-[#999999]">
            Versión mínima Android
          </label>
          <input
            type="text"
            value={androidVersion}
            onChange={(e) => setAndroidVersion(e.target.value)}
            placeholder="1.0.8"
            className="w-full max-w-[240px] border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
            style={lato}
          />
        </div>

        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            style={jost}
            className="bg-[#111111] px-6 py-3 text-[12px] text-white disabled:opacity-50"
          >
            {saving ? 'GUARDANDO...' : 'GUARDAR'}
          </button>
          {saved && (
            <span className="text-[13px] font-semibold text-[#2E7D32]" style={lato}>
              ✓ Guardado
            </span>
          )}
          {error && (
            <span className="text-[13px] text-[#CC4B37]" style={lato}>{error}</span>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-[#EEEEEE] pt-6">
        <p className="text-[13px] leading-relaxed text-[#999999]" style={lato}>
          Usa el formato exacto de la versión publicada en la tienda (ejemplo: 1.0.8).
          El bloqueo aplica solo a usuarios de la app nativa; la web no se ve afectada.
        </p>
      </div>
    </div>
  )
}
