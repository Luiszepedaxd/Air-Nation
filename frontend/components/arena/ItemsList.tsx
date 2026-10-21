'use client'

import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, arenaSend, type ArenaItem } from '@/lib/arena-api'
import { ItemForm } from './ItemForm'
import { MoneyText } from './MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const TIPO_LABEL: Record<string, string> = {
  paquete: 'PAQUETE',
  derecho_campo: 'DERECHO DE CAMPO',
  renta: 'RENTA',
  extra: 'EXTRA',
}

const UNIDAD_LABEL: Record<string, string> = {
  por_persona: 'por persona',
  por_reserva: 'por reserva',
  por_unidad: 'por unidad',
}

export function ItemsList({ fieldId }: { fieldId: string }) {
  const [items, setItems] = useState<ArenaItem[] | null>(null)
  const [error, setError] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)

  useEffect(() => {
    let vivo = true
    arenaGet<{ items: ArenaItem[] }>(`/owner/fields/${fieldId}/items`)
      .then((r) => vivo && setItems(r.items))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [fieldId])

  const borrar = async (item: ArenaItem) => {
    setError('')
    try {
      const r = await arenaSend<{ eliminado?: boolean; desactivado?: boolean }>(
        'DELETE',
        `/owner/fields/${fieldId}/items/${item.id}`
      )
      setItems((prev) =>
        r.desactivado
          ? (prev ?? []).map((x) => (x.id === item.id ? { ...x, activo: false } : x))
          : (prev ?? []).filter((x) => x.id !== item.id)
      )
    } catch (err) {
      setError(arenaErrorMessage(err))
    }
  }

  const guardado = (item: ArenaItem) => {
    setItems((prev) => {
      const lista = prev ?? []
      const existe = lista.some((x) => x.id === item.id)
      const next = existe ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item]
      return next.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre))
    })
    setEditando(null)
    setCreando(false)
  }

  if (error && items === null) {
    return (
      <p className="py-8 text-[13px] text-[#CC4B37]" style={lato}>
        {error}
      </p>
    )
  }
  if (items === null) {
    return (
      <p className="py-8 text-[13px] text-[#666666]" style={lato}>
        Cargando catálogo…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4" style={lato}>
      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      {items.length === 0 ? (
        <p className="text-[13px] text-[#666666]">
          Aún no hay conceptos. Agrega al menos un paquete o un derecho de campo: sin un
          concepto base nadie puede reservar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="border border-solid border-[#EEEEEE] bg-[#FFFFFF]">
              {editando === item.id ? (
                <ItemForm
                  fieldId={fieldId}
                  item={item}
                  onSaved={guardado}
                  onCancel={() => setEditando(null)}
                />
              ) : (
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                  {item.fotos_urls[0] ? (
                    <img
                      src={item.fotos_urls[0]}
                      alt=""
                      className="h-20 w-20 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 bg-[#F4F4F4]" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span style={jost} className="text-[9px] tracking-[0.1em] text-[#666666]">
                        {TIPO_LABEL[item.tipo] ?? item.tipo}
                      </span>
                      {!item.activo ? (
                        <span
                          style={jost}
                          className="bg-[#F4F4F4] px-2 py-0.5 text-[9px] text-[#999999]"
                        >
                          OCULTO
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[15px] font-bold text-[#111111]">{item.nombre}</p>
                    <p className="text-[13px] text-[#CC4B37]">
                      <MoneyText centavos={item.precio_centavos} conMoneda={false} />{' '}
                      <span className="text-[#666666]">{UNIDAD_LABEL[item.unidad]}</span>
                    </p>
                    {item.descripcion ? (
                      <p className="mt-1 text-[13px] text-[#666666]">{item.descripcion}</p>
                    ) : null}
                    {item.incluye.length > 0 ? (
                      <ul className="mt-1 list-inside list-disc text-[12px] text-[#666666]">
                        {item.incluye.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditando(item.id)}
                      style={jost}
                      className="min-h-[36px] border border-solid border-[#111111] px-3 text-[10px] text-[#111111]"
                    >
                      EDITAR
                    </button>
                    <button
                      type="button"
                      onClick={() => void borrar(item)}
                      style={jost}
                      className="min-h-[36px] border border-solid border-[#CC4B37] px-3 text-[10px] text-[#CC4B37]"
                    >
                      QUITAR
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {creando ? (
        <ItemForm fieldId={fieldId} onSaved={guardado} onCancel={() => setCreando(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          style={jost}
          className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#111111] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] sm:w-auto"
        >
          + NUEVO CONCEPTO
        </button>
      )}
    </div>
  )
}
