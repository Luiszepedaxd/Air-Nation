'use client'

import { ARENA_DISCIPLINAS, ARENA_TERRENOS } from '@/lib/arena-api'
import {
  PRECIO_MAX_CENTAVOS,
  PRECIO_MIN_CENTAVOS,
  type ArenaFiltroKey,
  type ArenaFiltrosValor,
} from '@/lib/arena-marketplace'
import { useOverlay } from '@/components/arena/useOverlay'
import { formatCentavos } from '@/components/arena/MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-solid border-[#EEEEEE] py-4">
      <p className="mb-2 text-[14px] font-bold text-[#111111]">{titulo}</p>
      {children}
    </div>
  )
}

/**
 * Filtros del marketplace: barra lateral en escritorio y hoja inferior en
 * móvil. La disciplina y el terreno son de un solo valor porque así los
 * recibe `arena_marketplace`; elegir otro reemplaza al anterior.
 */
export function ArenaFiltros({
  filtros,
  activos,
  resultados,
  abierto,
  onChange,
  onClear,
  onClose,
}: {
  filtros: ArenaFiltrosValor
  activos: number
  resultados: number
  abierto: boolean
  onChange: (key: ArenaFiltroKey, valor: string) => void
  onClear: () => void
  onClose: () => void
}) {
  const panel = useOverlay<HTMLElement>(abierto, onClose)
  const precio = Number(filtros.precio_max) || PRECIO_MAX_CENTAVOS
  const sinLimite = precio >= PRECIO_MAX_CENTAVOS

  const fila = (
    key: ArenaFiltroKey,
    valor: string,
    label: string,
    nombre: string
  ) => {
    const puesto = (filtros[key] ?? '') === valor
    return (
      <label key={valor || 'todas'} className="flex min-h-[36px] cursor-pointer items-center gap-[10px] text-[15px]">
        <input
          type="radio"
          name={nombre}
          className="h-[18px] w-[18px] accent-[#CC4B37]"
          checked={puesto}
          onChange={() => onChange(key, valor)}
        />
        <span className="capitalize">{label}</span>
      </label>
    )
  }

  return (
    <>
      {abierto ? (
        <button
          type="button"
          aria-label="Cerrar filtros"
          onClick={onClose}
          className="fixed inset-0 z-[55] bg-[#111111]/50 lg:hidden"
        />
      ) : null}

      <aside
        ref={panel}
        aria-label="Filtros"
        style={lato}
        className={`z-[60] self-start bg-[#FFFFFF] lg:static lg:z-auto lg:block lg:max-h-none lg:translate-y-0 lg:overflow-visible lg:border-0 lg:p-0 ${
          abierto
            ? 'fixed inset-x-0 bottom-0 max-h-[86vh] translate-y-0 overflow-y-auto border-t border-solid border-[#EEEEEE] px-4 pt-4 visible'
            : 'fixed inset-x-0 bottom-0 max-h-[86vh] translate-y-full overflow-y-auto border-t border-solid border-[#EEEEEE] px-4 pt-4 invisible lg:visible'
        } transition-transform duration-200 motion-reduce:transition-none`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 style={jost} className="text-[18px] text-[#111111]">
            FILTROS
          </h2>
          <div className="flex items-center gap-1">
            {activos > 0 ? (
              <button
                type="button"
                onClick={onClear}
                className="min-h-[36px] px-2 text-[14px] font-bold text-[#666666] hover:text-[#111111]"
              >
                Quitar todos
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar filtros"
              className="grid h-9 w-9 place-items-center border border-solid border-[#EEEEEE] text-[#111111] lg:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        <Grupo titulo="Disciplina">
          <div className="flex flex-col">
            {fila('disciplina', '', 'Todas', 'f-disciplina')}
            {ARENA_DISCIPLINAS.map((d) => fila('disciplina', d, d, 'f-disciplina'))}
          </div>
        </Grupo>

        <Grupo titulo="Terreno">
          <div className="flex flex-col">
            {fila('terreno', '', 'Todos', 'f-terreno')}
            {ARENA_TERRENOS.map((t) => fila('terreno', t.id, t.label, 'f-terreno'))}
          </div>
        </Grupo>

        <Grupo titulo="Precio por persona">
          <input
            id="f-precio"
            type="range"
            className="w-full accent-[#CC4B37]"
            min={PRECIO_MIN_CENTAVOS}
            max={PRECIO_MAX_CENTAVOS}
            step={1000}
            value={precio}
            aria-describedby="f-precio-val"
            onChange={(e) =>
              onChange(
                'precio_max',
                Number(e.target.value) >= PRECIO_MAX_CENTAVOS ? '' : e.target.value
              )
            }
          />
          <div className="mt-1.5 flex justify-between text-[14px] text-[#666666]">
            <span>{formatCentavos(PRECIO_MIN_CENTAVOS, false)}</span>
            <b id="f-precio-val" className="text-[#111111]">
              {sinLimite ? 'Sin límite' : `Hasta ${formatCentavos(precio, false)}`}
            </b>
          </div>
        </Grupo>

        <Grupo titulo="Más filtros">
          <label className="flex min-h-[40px] cursor-pointer items-center justify-between gap-3 text-[15px]">
            <span>Rentan equipo</span>
            <input
              type="checkbox"
              className="h-[18px] w-[18px] accent-[#CC4B37]"
              checked={filtros.con_renta === 'true'}
              onChange={(e) => onChange('con_renta', e.target.checked ? 'true' : '')}
            />
          </label>
          <label className="flex min-h-[40px] cursor-pointer items-center justify-between gap-3 text-[15px]">
            <span>Calificación 4.5 o más</span>
            <input
              type="checkbox"
              className="h-[18px] w-[18px] accent-[#CC4B37]"
              checked={filtros.rating_min === '4.5'}
              onChange={(e) => onChange('rating_min', e.target.checked ? '4.5' : '')}
            />
          </label>
        </Grupo>

        <div className="sticky bottom-0 border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] py-3 pb-4 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            style={jost}
            className="min-h-[44px] w-full bg-[#111111] px-4 text-[13px] tracking-[0.04em] text-[#FFFFFF]"
          >
            VER {resultados} {resultados === 1 ? 'CAMPO' : 'CAMPOS'}
          </button>
        </div>
      </aside>
    </>
  )
}
