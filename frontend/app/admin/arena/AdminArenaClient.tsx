'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaAdminField,
  type ArenaPlan,
  type ArenaSettings,
} from '@/lib/arena-api'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const COMISION_SUGERIDA: Record<ArenaPlan, number> = { free: 8, premium: 3, pro: 1.5 }

type Filtro = 'activos' | 'sin_arena' | 'todos'

function EstadoBadge({ settings }: { settings: ArenaSettings | null }) {
  if (!settings) {
    return (
      <span style={jost} className="bg-[#F4F4F4] px-2 py-1 text-[9px] text-[#999999]">
        SIN ARENA
      </span>
    )
  }
  return (
    <span
      style={jost}
      className={`px-2 py-1 text-[9px] ${
        settings.activo ? 'bg-[#1B5E20] text-[#FFFFFF]' : 'bg-[#EEEEEE] text-[#666666]'
      }`}
    >
      {settings.activo ? 'ACTIVO' : 'PAUSADO'}
    </span>
  )
}

export function AdminArenaClient() {
  const [fields, setFields] = useState<ArenaAdminField[] | null>(null)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('activos')
  const [ocupado, setOcupado] = useState<string | null>(null)

  const cargar = useCallback(() => {
    arenaGet<{ fields: ArenaAdminField[] }>('/admin/fields')
      .then((r) => setFields(r.fields))
      .catch((err) => setError(arenaErrorMessage(err)))
  }, [])

  useEffect(cargar, [cargar])

  const activar = async (f: ArenaAdminField, plan: ArenaPlan) => {
    setError('')
    setOcupado(f.id)
    try {
      const r = await arenaSend<{ settings: ArenaSettings }>(
        'PUT',
        `/admin/fields/${f.id}/activate`,
        { plan, comision_pct: COMISION_SUGERIDA[plan], activo: true }
      )
      setFields((prev) => (prev ?? []).map((x) => (x.id === f.id ? { ...x, arena: r.settings } : x)))
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(null)
    }
  }

  const pausar = async (f: ArenaAdminField) => {
    setError('')
    setOcupado(f.id)
    try {
      const r = await arenaSend<{ settings: ArenaSettings }>('PATCH', `/admin/fields/${f.id}/pause`)
      setFields((prev) => (prev ?? []).map((x) => (x.id === f.id ? { ...x, arena: r.settings } : x)))
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(null)
    }
  }

  const reactivar = async (f: ArenaAdminField) => {
    setError('')
    setOcupado(f.id)
    try {
      const r = await arenaSend<{ settings: ArenaSettings }>(
        'PUT',
        `/admin/fields/${f.id}/activate`,
        { activo: true }
      )
      setFields((prev) => (prev ?? []).map((x) => (x.id === f.id ? { ...x, arena: r.settings } : x)))
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(null)
    }
  }

  const visibles = (fields ?? []).filter((f) => {
    if (filtro === 'activos') return Boolean(f.arena)
    if (filtro === 'sin_arena') return !f.arena
    return true
  })

  const activos = (fields ?? []).filter((f) => f.arena?.activo).length

  return (
    <div className="p-6" style={lato}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 style={jost} className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl">
          ARENA
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/campos/nuevo"
            style={jost}
            className="inline-flex min-h-[44px] items-center justify-center border border-solid border-[#111111] px-4 text-[10px] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
          >
            + NUEVO CAMPO
          </Link>
          <Link
            href="/admin/arena/reservas"
            style={jost}
            className="inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-4 text-[10px] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
          >
            RESERVAS Y LIQUIDACIONES
          </Link>
        </div>
      </div>

      <p className="mb-4 text-[13px] text-[#666666]">
        {activos} {activos === 1 ? 'campo acepta' : 'campos aceptan'} reservas en línea.
        Un campo pausado conserva sus reservas ya pagadas.
      </p>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
        {(
          [
            { id: 'activos' as Filtro, label: 'CON ARENA' },
            { id: 'sin_arena' as Filtro, label: 'SIN ARENA' },
            { id: 'todos' as Filtro, label: 'TODOS' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFiltro(t.id)}
            style={jost}
            className={`px-3 py-2 text-[11px] tracking-[0.12em] ${
              filtro === t.id
                ? 'bg-[#111111] text-[#FFFFFF]'
                : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-[13px] text-[#CC4B37]">{error}</p> : null}

      {fields === null ? (
        <p className="py-12 text-center text-[#666666]">Cargando campos…</p>
      ) : visibles.length === 0 ? (
        <p className="py-12 text-center text-[#666666]">No hay campos en esta categoría</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibles.map((f) => (
            <li
              key={f.id}
              className="flex flex-col gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4 md:flex-row md:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <EstadoBadge settings={f.arena} />
                  {f.es_prueba ? (
                    <span style={jost} className="bg-[#CC4B37] px-2 py-1 text-[9px] text-[#FFFFFF]">
                      PRUEBA
                    </span>
                  ) : null}
                  {f.arena ? (
                    <span style={jost} className="text-[9px] tracking-[0.1em] text-[#666666]">
                      {f.arena.plan.toUpperCase()} · {Number(f.arena.comision_pct)}%
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[15px] font-bold text-[#111111]">{f.nombre}</p>
                <p className="text-[12px] text-[#666666]">
                  {f.ciudad ?? 'Sin ciudad'} · {f.status}
                  {f.reservas_proximas > 0
                    ? ` · ${f.reservas_proximas} ${f.reservas_proximas === 1 ? 'reserva próxima' : 'reservas próximas'}`
                    : ''}
                </p>
                <p className="mt-1 text-[12px] text-[#666666]">
                  {f.miembros.filter((m) => m.status === 'activo').length === 0
                    ? 'Sin dueño ligado'
                    : f.miembros
                        .filter((m) => m.status === 'activo')
                        .map((m) => m.alias || m.nombre || m.email || m.user_id)
                        .join(', ')}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Link
                  href={`/admin/arena/${f.id}`}
                  style={jost}
                  className="inline-flex min-h-[36px] items-center justify-center border border-solid border-[#111111] px-3 text-[10px] text-[#111111]"
                >
                  ADMINISTRAR
                </Link>
                {!f.arena ? (
                  (['free', 'premium', 'pro'] as ArenaPlan[]).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      disabled={ocupado === f.id}
                      onClick={() => void activar(f, plan)}
                      style={jost}
                      className="inline-flex min-h-[36px] items-center justify-center bg-[#CC4B37] px-3 text-[10px] text-[#FFFFFF] disabled:opacity-50"
                    >
                      ACTIVAR {plan.toUpperCase()}
                    </button>
                  ))
                ) : f.arena.activo ? (
                  <button
                    type="button"
                    disabled={ocupado === f.id}
                    onClick={() => void pausar(f)}
                    style={jost}
                    className="inline-flex min-h-[36px] items-center justify-center border border-solid border-[#CC4B37] px-3 text-[10px] text-[#CC4B37] disabled:opacity-50"
                  >
                    PAUSAR
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado === f.id}
                    onClick={() => void reactivar(f)}
                    style={jost}
                    className="inline-flex min-h-[36px] items-center justify-center bg-[#1B5E20] px-3 text-[10px] text-[#FFFFFF] disabled:opacity-50"
                  >
                    REACTIVAR
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
