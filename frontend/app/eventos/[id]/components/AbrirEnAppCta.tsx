'use client'

import { useEffect, useState } from 'react'
import { isNativeApp } from '@/lib/platform'

/** CTA para WhatsApp/in-app browsers que no disparan Universal Links. */
export function AbrirEnAppCta({ eventId }: { eventId: string }) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    setShow(!isNativeApp())
  }, [])
  if (!show) return null
  return (
    <a
      href={`airnation://eventos/${eventId}`}
      className="mt-2 inline-flex text-[12px] font-bold uppercase tracking-wide text-[#CC4B37]"
      style={{ fontFamily: "'Jost', sans-serif" }}
    >
      Abrir en AirNation
    </a>
  )
}
