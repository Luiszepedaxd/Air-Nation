'use client'

import { useState } from 'react'
import {
  arenaErrorMessage,
  arenaSend,
  type ArenaItem,
  type ArenaItemTipo,
  type ArenaUnidad,
} from '@/lib/arena-api'
import { PhotoUploader } from './PhotoUploader'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const TIPOS: { id: ArenaItemTipo; label: string; ayuda: string }[] = [
  { id: 'paquete', label: 'Paquete', ayuda: 'Concepto base: entrada + lo que incluyas.' },
  { id: 'derecho_campo', label: 'Derecho de campo', ayuda: 'Concepto base: solo el acceso al campo.' },
  { id: 'renta', label: 'Renta', ayuda: 'Equipo que se renta aparte (marcadora, careta…).' },
  { id: 'extra', label: 'Extra', ayuda: 'BBs, gas, comida, lo que se agregue.' },
]

const UNIDADES: { id: ArenaUnidad; label: string }[] = [
  { id: 'por_persona', label: 'Por persona' },
  { id: 'por_reserva', label: 'Por reserva' },
  { id: 'por_unidad', label: 'Por unidad' },
]

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

type Estado = {
  tipo: ArenaItemTipo
  nombre: string
  descripcion: string
  incluye: string
  precio_pesos: string
  unidad: ArenaUnidad
  min_jugadores: string
  max_jugadores: string
  max_por_reserva: string
  fotos_urls: string[]
  activo: boolean
  orden: string
}

function desdeItem(item: ArenaItem | null): Estado {
  return {
    tipo: item?.tipo ?? 'paquete',
    nombre: item?.nombre ?? '',
    descripcion: item?.descripcion ?? '',
    incluye: (item?.incluye ?? []).join('\n'),
    precio_pesos: item ? String(item.precio_centavos / 100) : '',
    unidad: item?.unidad ?? 'por_persona',
    min_jugadores: item?.min_jugadores != null ? String(item.min_jugadores) : '',
    max_jugadores: item?.max_jugadores != null ? String(item.max_jugadores) : '',
    max_por_reserva: item?.max_por_reserva != null ? String(item.max_por_reserva) : '',
    fotos_urls: item?.fotos_urls ?? [],
    activo: item?.activo ?? true,
    orden: String(item?.orden ?? 0),
  }
}

/** Pesos escritos por el dueño → centavos. Devuelve null si no es un monto. */
function aCentavos(pesos: string): number | null {
  const n = Number(String(pesos).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

export function ItemForm({
  fieldId,
  item,
  onSaved,
  onCancel,
}: {
  fieldId: string
  item?: ArenaItem | null
  onSaved: (item: ArenaItem) => void
  onCancel?: () => void
}) {
  const [v, setV] = useState<Estado>(() => desdeItem(item ?? null))
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const set = <K extends keyof Estado>(k: K, value: Estado[K]) =>
    setV((prev) => ({ ...prev, [k]: value }))

  const esBase = v.tipo === 'paquete' || v.tipo === 'derecho_campo'

  const guardar = async () => {
    setError('')
    const centavos = aCentavos(v.precio_pesos)
    if (!v.nombre.trim()) return setError('Ponle nombre al concepto.')
    if (centavos === null) return setError('El precio no es válido.')

    const num = (s: string) => (s.trim() === '' ? null : Number(s))
    const body = {
      tipo: v.tipo,
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      incluye: v.incluye
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      precio_centavos: centavos,
      unidad: v.unidad,
      min_jugadores: esBase ? num(v.min_jugadores) : null,
      max_jugadores: esBase ? num(v.max_jugadores) : null,
      max_por_reserva: v.unidad === 'por_unidad' ? num(v.max_por_reserva) : null,
      fotos_urls: v.fotos_urls,
      activo: v.activo,
      orden: Number(v.orden) || 0,
    }

    setGuardando(true)
    try {
      const res = item
        ? await arenaSend<{ item: ArenaItem }>(
            'PATCH',
            `/owner/fields/${fieldId}/items/${item.id}`,
            body
          )
        : await arenaSend<{ item: ArenaItem }>('POST', `/owner/fields/${fieldId}/items`, body)
      onSaved(res.item)
      if (!item) setV(desdeItem(null))
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4" style={lato}>
      <p style={jost} className="text-[13px] text-[#111111]">
        {item ? 'Editar concepto' : 'Nuevo concepto'}
      </p>

      <div className="flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => set('tipo', t.id)}
            style={jost}
            className={`px-3 py-2 text-[10px] tracking-[0.1em] ${
              v.tipo === t.id
                ? 'bg-[#111111] text-[#FFFFFF]'
                : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-[11px] text-[#999999]">
        {TIPOS.find((t) => t.id === v.tipo)?.ayuda}
      </p>

      <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
        Nombre
        <input
          className={inputClass}
          maxLength={80}
          value={v.nombre}
          onChange={(e) => set('nombre', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
        Descripción
        <textarea
          className={inputClass}
          rows={3}
          maxLength={1000}
          value={v.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
        Qué incluye (una línea por punto)
        <textarea
          className={inputClass}
          rows={4}
          value={v.incluye}
          onChange={(e) => set('incluye', e.target.value)}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Precio en pesos
          <input
            className={inputClass}
            inputMode="decimal"
            value={v.precio_pesos}
            onChange={(e) => set('precio_pesos', e.target.value)}
            placeholder="350"
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Se cobra
          <select
            className={inputClass}
            value={v.unidad}
            onChange={(e) => set('unidad', e.target.value as ArenaUnidad)}
          >
            {UNIDADES.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {esBase ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Mínimo de jugadores
            <input
              className={inputClass}
              inputMode="numeric"
              value={v.min_jugadores}
              onChange={(e) => set('min_jugadores', e.target.value)}
              placeholder="sin mínimo"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Máximo de jugadores
            <input
              className={inputClass}
              inputMode="numeric"
              value={v.max_jugadores}
              onChange={(e) => set('max_jugadores', e.target.value)}
              placeholder="sin máximo"
            />
          </label>
        </div>
      ) : null}

      {v.unidad === 'por_unidad' ? (
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Máximo por reserva
          <input
            className={inputClass}
            inputMode="numeric"
            value={v.max_por_reserva}
            onChange={(e) => set('max_por_reserva', e.target.value)}
            placeholder="sin límite"
          />
        </label>
      ) : null}

      <div>
        <p className="mb-2 text-[12px] text-[#666666]">Fotos</p>
        <PhotoUploader
          fieldId={fieldId}
          urls={v.fotos_urls}
          onChange={(urls) => set('fotos_urls', urls)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[12px] text-[#666666]">
          <input
            type="checkbox"
            checked={v.activo}
            onChange={(e) => set('activo', e.target.checked)}
          />
          Visible para los jugadores
        </label>
        <label className="flex items-center gap-2 text-[12px] text-[#666666]">
          Orden
          <input
            className="w-[70px] border border-solid border-[#EEEEEE] px-2 py-1 text-center text-[13px]"
            inputMode="numeric"
            value={v.orden}
            onChange={(e) => set('orden', e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          style={jost}
          className="inline-flex min-h-[44px] items-center justify-center bg-[#CC4B37] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
        >
          {guardando ? 'GUARDANDO…' : item ? 'GUARDAR CAMBIOS' : 'AGREGAR CONCEPTO'}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            style={jost}
            className="inline-flex min-h-[44px] items-center justify-center border border-solid border-[#EEEEEE] px-5 text-[11px] tracking-[0.12em] text-[#666666]"
          >
            CANCELAR
          </button>
        ) : null}
      </div>
    </div>
  )
}
