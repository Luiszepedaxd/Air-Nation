import { useEffect, type RefObject } from 'react'

/** Pausa el video cuando sale del viewport; opcionalmente reanuda al volver (muted autoplay). */
export function usePausaVideoFueraDeVista(
  ref: RefObject<HTMLVideoElement | null>,
  opts?: { reanudarAlVolver?: boolean }
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reanudar = Boolean(opts?.reanudarAlVolver)
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          el.pause()
          return
        }
        if (reanudar && el.paused && !el.ended) {
          el.play().catch(() => {})
        }
      },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [opts?.reanudarAlVolver, ref])
}
