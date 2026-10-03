import type { CapsulaItem, CapsulasConfig } from '../../lib/types'

export const PROGRESO_VACIO = { v: 1 as const, c: [] as string[], p: {} as Record<string, number> }
export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC4B37]'

export function acento(color: string | undefined): string {
  return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#CC4B37'
}

export function enlaceSeguro(link: string): boolean {
  return /^https?:\/\//i.test(link) || (link.startsWith('/') && !link.startsWith('//'))
}

export function formatearDuracion(segundos: number): string {
  const total = Math.max(0, Math.round(segundos))
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}

export function capsulasVisibles(config: CapsulasConfig): CapsulaItem[] {
  return (config.capsulas ?? []).filter((c) => {
    if (!c || c.activo === false) return false
    const id = typeof c.id === 'string' ? c.id.trim() : ''
    const url = typeof c.video_url === 'string' ? c.video_url.trim() : ''
    return Boolean(id) && /^https?:\/\//i.test(url)
  })
}

export function prefiereQuieto(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function scrollA(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: prefiereQuieto() ? 'auto' : 'smooth', block: 'start' })
}

export function sincronizarUrl(id: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('capsula', id)
  window.history.replaceState(null, '', `${url.pathname}${url.search}`)
}

export function emitir(nombre: string, capsula: CapsulaItem) {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  gtag('event', nombre, { capsula_id: capsula.id, capsula_numero: capsula.numero })
}

export function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}
