'use client'

import { useEffect, useState } from 'react'

export function useVisualViewport() {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const update = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight
      setHeight(vh)
    }

    update()

    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    window.addEventListener('resize', update)

    return () => {
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return height
}
