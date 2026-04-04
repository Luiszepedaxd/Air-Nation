/** Normaliza valor de PostgREST/JSON (boolean, null, strings raras). */
export function isDestacadoTrue(v: unknown): boolean {
  if (v === true) return true
  if (v === false || v == null) return false
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    return s === 'true' || s === 't' || s === '1' || s === 'yes'
  }
  return false
}

export function DestacadoBadge() {
  return (
    <span
      className="absolute top-2 right-2 z-[1] bg-[#CC4B37] px-2 py-0.5 text-[10px] font-bold uppercase text-white"
      style={{ fontFamily: 'Jost, sans-serif' }}
    >
      DESTACADO
    </span>
  )
}
