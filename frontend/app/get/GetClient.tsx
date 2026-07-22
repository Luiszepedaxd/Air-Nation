'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isNativeApp, isAndroidWeb, isIOSWeb } from '@/lib/platform'

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.atomikapps.airnation'
const APP_STORE_URL = 'https://apps.apple.com/mx/app/airnation/id6790069177'
const WEB_URL = 'https://www.airnation.online'

const jostBold = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export default function GetClient() {
  const router = useRouter()

  useEffect(() => {
    if (isNativeApp()) {
      router.replace('/dashboard')
      return
    }
    if (isAndroidWeb()) {
      window.location.replace(PLAY_STORE_URL)
      return
    }
    if (isIOSWeb()) {
      window.location.replace(APP_STORE_URL)
      return
    }
    window.location.replace(WEB_URL)
  }, [router])

  return (
    <main className="flex min-h-[100dvh] min-w-[320px] flex-col items-center justify-center bg-[#FFFFFF]">
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center bg-[#CC4B37]">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          <span
            style={jostBold}
            className="text-[1.25rem] tracking-[0.18em] text-[#111111]"
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p style={{ ...lato, fontSize: 13, color: '#999999' }}>Redirigiendo...</p>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="animate-spin"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#EEEEEE"
              strokeWidth="2"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="#CC4B37"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </main>
  )
}
