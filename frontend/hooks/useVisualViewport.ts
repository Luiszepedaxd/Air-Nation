'use client'

import { useEffect, useState } from 'react'

export function useVisualViewport() {
  const [style, setStyle] = useState<{ top: string; height: string }>({
    top: '0px',
    height: '100dvh',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => {
      const vv = window.visualViewport
      if (!vv) return
      setStyle({
        top: `${vv.offsetTop}px`,
        height: `${vv.height}px`,
      })
    }

    update()

    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)

    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  return style
}
