'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const control =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

/** Precios en centavos, como los guarda la BD. */
const PRECIOS: { label: string; value: string }[] = [
  { label: 'Cualquier precio', value: '' },
  { label: 'Hasta $200', value: '20000' },
  { label: 'Hasta $350', value: '35000' },
  { label: 'Hasta $500', value: '50000' },
  { label: 'Hasta $800', value: '80000' },
]

const TIPOS: { label: string; value: string }[] = [
  { label: 'Todo', value: '' },
  { label: 'Paquetes', value: 'paquete' },
  { label: 'Derecho de campo', value: 'derecho_campo' },
  { label: 'Rentas', value: 'renta' },
  { label: 'Extras', value: 'extra' },
]

/** Filtros de la landing: viven en la URL, así el SSR devuelve ya filtrado. */
export function ArenaFiltros({
  estados,
  ciudades,
}: {
  estados: string[]
  ciudades: string[]
}) {
  const router = useRouter()
  const params = useSearchParams()

  const valor = (key: string) => params.get(key) ?? ''

  const cambiar = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    // Cambiar un filtro siempre regresa a la primera página.
    next.delete('offset')
    if (key === 'estado') next.delete('ciudad')
    router.push(next.toString() ? `/arena?${next}` : '/arena')
  }

  const hayFiltros = ['estado', 'ciudad', 'precio_max', 'tipo', 'dia', 'jugadores'].some((k) =>
    params.get(k)
  )

  return (
    <div className="flex flex-col gap-3" style={lato}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Estado
          <select className={control} value={valor('estado')} onChange={(e) => cambiar('estado', e.target.value)}>
            <option value="">Todo México</option>
            {estados.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Ciudad
          <select className={control} value={valor('ciudad')} onChange={(e) => cambiar('ciudad', e.target.value)}>
            <option value="">Cualquier ciudad</option>
            {ciudades.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Precio por persona
          <select
            className={control}
            value={valor('precio_max')}
            onChange={(e) => cambiar('precio_max', e.target.value)}
          >
            {PRECIOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Qué buscas
          <select className={control} value={valor('tipo')} onChange={(e) => cambiar('tipo', e.target.value)}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Día que quieres jugar
          <input
            className={control}
            type="date"
            value={valor('dia')}
            onChange={(e) => cambiar('dia', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Cuántos van
          <input
            className={control}
            type="number"
            min={1}
            max={500}
            inputMode="numeric"
            value={valor('jugadores')}
            onChange={(e) => cambiar('jugadores', e.target.value)}
          />
        </label>
      </div>
      {hayFiltros ? (
        <button
          type="button"
          onClick={() => router.push('/arena')}
          style={jost}
          className="self-start border border-solid border-[#EEEEEE] px-3 py-2 text-[10px] tracking-[0.12em] text-[#666666]"
        >
          LIMPIAR FILTROS
        </button>
      ) : null}
    </div>
  )
}
