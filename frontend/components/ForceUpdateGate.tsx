'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { compareVersions, APP_STORE_URL, PLAY_STORE_URL } from '@/lib/version-check'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function ForceUpdateGate() {
  const [mustUpdate, setMustUpdate] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const { isNativeApp, getNativePlatform } = await import('@/lib/platform')

      // Solo aplica a app nativa
      if (!isNativeApp()) return

      const platform = getNativePlatform() // 'ios' | 'android' | 'web'
      if (platform !== 'ios' && platform !== 'android') return

      // Leer versión instalada
      const { App } = await import('@capacitor/app')
      const info = await App.getInfo()
      const installedVersion = info.version // ej. "1.0.7"

      // Leer versión mínima de config
      const { data, error } = await supabase
        .from('app_version_config')
        .select('min_version_ios, min_version_android')
        .eq('id', 'singleton')
        .single()

      if (error || !data || cancelled) return

      const minVersion =
        platform === 'ios' ? data.min_version_ios : data.min_version_android

      // Comparar
      if (compareVersions(installedVersion, minVersion) < 0) {
        if (!cancelled) {
          setStoreUrl(platform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL)
          setMustUpdate(true)
        }
      }
    })()

    return () => { cancelled = true }
  }, [])

  if (!mustUpdate) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#111111] px-8"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex max-w-[360px] flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CC4B37]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>

        <h1 style={jost} className="mb-4 text-[24px] leading-tight text-white">
          Actualización disponible
        </h1>

        <p className="mb-8 text-[15px] leading-relaxed text-white/80" style={lato}>
          Hay una nueva versión de AirNation con mejoras importantes. Actualiza para seguir
          usando la app.
        </p>

        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={jost}
          className="flex w-full items-center justify-center bg-[#CC4B37] py-4 text-[13px] text-white"
        >
          Actualizar ahora
        </a>
      </div>
    </div>
  )
}
