'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaAdminBooking,
  type ArenaAdminField,
  type ArenaPayoutAdmin,
  type ArenaPayoutPendiente,
} from '@/lib/arena-api'
import { fechaCorta, horaMexico } from '@/components/arena/fechas'
import { MoneyText } from '@/components/arena/MoneyText'
import { StatusBadge } from '@/components/arena/StatusBadge'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

type Tab = 'reservas' | 'liquidaciones'

function Reservas() {
  const [fields, setFields] = useState<ArenaAdminField[]>([])
  const [filtros, setFiltros] = useState({ field_id: '', status: '', desde: '', hasta: '' })
  const [reservas, setReservas] = useState<ArenaAdminBooking[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    arenaGet<{ fields: ArenaAdminField[] }>('/admin/fields')
      .then((r) => setFields(r.fields.filter((f) => f.arena)))
      .catch(() => {
        /* el filtro por campo es opcional */
      })
  }, [])

  const cargar = useCallback(() => {
    setError('')
    setReservas(null)
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(filtros)) if (v) qs.set(k, v)
    arenaGet<{ reservas: ArenaAdminBooking[] }>(`/admin/bookings?${qs.toString()}`)
      .then((r) => setReservas(r.reservas))
      .catch((err) => setError(arenaErrorMessage(err)))
  }, [filtros])

  useEffect(cargar, [cargar])

  const set = (k: keyof typeof filtros, v: string) => setFiltros((p) => ({ ...p, [k]: v }))

  const totales = (reservas ?? []).reduce(
    (acc, r) => {
      if (r.pago_status === 'pagado' || r.pago_status === 'reembolso_parcial') {
        acc.bruto += r.total_centavos
        acc.comision += r.comision_centavos
      }
      acc.reembolso += r.reembolso_centavos
      return acc
    },
    { bruto: 0, comision: 0, reembolso: 0 }
  )

  return (
    <div className="flex flex-col gap-4" style={lato}>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-[11px] text-[#666666]">
          Campo
          <select
            className={inputClass}
            value={filtros.field_id}
            onChange={(e) => set('field_id', e.target.value)}
          >
            <option value="">Todos</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-[#666666]">
          Estado
          <select
            className={inputClass}
            value={filtros.status}
            onChange={(e) => set('status', e.target.value)}
          >
            <option value="">Todos</option>
            <option value="confirmada">Confirmadas</option>
            <option value="completada">Completadas</option>
            <option value="no_show">No llegaron</option>
            <option value="cancelada">Canceladas</option>
            <option value="pendiente_pago">Por pagar</option>
            <option value="expirada">Vencidas</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-[#666666]">
          Desde
          <input
            type="date"
            className={inputClass}
            value={filtros.desde}
            onChange={(e) => set('desde', e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] text-[#666666]">
          Hasta
          <input
            type="date"
            className={inputClass}
            value={filtros.hasta}
            onChange={(e) => set('hasta', e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => setFiltros({ field_id: '', status: '', desde: '', hasta: '' })}
          style={jost}
          className="min-h-[42px] border border-solid border-[#EEEEEE] px-3 text-[10px] text-[#666666]"
        >
          LIMPIAR
        </button>
      </div>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      {reservas ? (
        <p className="text-[12px] text-[#666666]">
          {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'} · vendido{' '}
          <MoneyText centavos={totales.bruto} conMoneda={false} /> · comisión{' '}
          <MoneyText centavos={totales.comision} conMoneda={false} /> · reembolsado{' '}
          <MoneyText centavos={totales.reembolso} conMoneda={false} />
        </p>
      ) : null}

      {!reservas && !error ? (
        <p className="py-8 text-[13px] text-[#666666]">Cargando reservas…</p>
      ) : reservas && reservas.length === 0 ? (
        <p className="py-8 text-[13px] text-[#666666]">No hay reservas con esos filtros.</p>
      ) : (
        <div className="admin-cards w-full border border-solid border-[#EEEEEE] md:overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-[#111111]">
            <thead>
              <tr className="bg-[#F4F4F4]">
                {['CÓDIGO', 'CAMPO', 'DÍA', 'JUG.', 'ESTADO', 'PAGO', 'TOTAL', 'COMISIÓN', 'LIQUIDADA'].map(
                  (c) => (
                    <th
                      key={c}
                      className="border border-solid border-[#EEEEEE] px-3 py-2 text-[11px]"
                      style={jost}
                    >
                      {c}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {(reservas ?? []).map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}>
                  <td data-label="Código" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <span className="font-semibold">{r.codigo}</span>
                    <span className="block text-[11px] text-[#666666]">{r.contacto_nombre}</span>
                  </td>
                  <td data-label="Campo" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {r.campo ? (
                      <Link href={`/admin/arena/${r.field_id}`} className="underline">
                        {r.campo.nombre}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Día" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {fechaCorta(r.fecha)}
                  </td>
                  <td data-label="Jugadores" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {r.num_jugadores}
                  </td>
                  <td data-label="Estado" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td data-label="Pago" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <span className="text-[12px]">{r.pago_status}</span>
                    {r.pago ? (
                      <span className="block text-[10px] text-[#666666]">
                        {r.pago.provider} · {r.pago.provider_ref.slice(0, 14)}…
                      </span>
                    ) : null}
                  </td>
                  <td data-label="Total" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <MoneyText centavos={r.total_centavos} conMoneda={false} />
                  </td>
                  <td data-label="Comisión" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    <MoneyText centavos={r.comision_centavos} conMoneda={false} />
                  </td>
                  <td data-label="Liquidada" className="border border-solid border-[#EEEEEE] px-3 py-2">
                    {r.payout_id ? 'Sí' : 'No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Liquidaciones() {
  const [data, setData] = useState<{
    pendientes: ArenaPayoutPendiente[]
    liquidaciones: ArenaPayoutAdmin[]
  } | null>(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [folios, setFolios] = useState<Record<string, string>>({})

  const cargar = useCallback(() => {
    setError('')
    arenaGet<{ pendientes: ArenaPayoutPendiente[]; liquidaciones: ArenaPayoutAdmin[] }>(
      '/admin/payouts/pendientes'
    )
      .then(setData)
      .catch((err) => setError(arenaErrorMessage(err)))
  }, [])

  useEffect(cargar, [cargar])

  const crear = async (fieldId: string) => {
    setError('')
    setOcupado(fieldId)
    try {
      await arenaSend('POST', `/admin/fields/${fieldId}/payouts`, {})
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(null)
    }
  }

  const transferir = async (id: string) => {
    const referencia = (folios[id] || '').trim()
    if (!referencia) {
      setError('Escribe el folio de la transferencia.')
      return
    }
    setError('')
    setOcupado(id)
    try {
      await arenaSend('PATCH', `/admin/payouts/${id}`, { referencia })
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setOcupado(null)
    }
  }

  if (error && !data) {
    return (
      <p className="py-8 text-[13px] text-[#CC4B37]" style={lato}>
        {error}
      </p>
    )
  }
  if (!data) {
    return (
      <p className="py-8 text-[13px] text-[#666666]" style={lato}>
        Cargando liquidaciones…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8" style={lato}>
      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      <section>
        <p style={jost} className="mb-1 text-[12px] text-[#111111]">
          Por liquidar
        </p>
        <p className="mb-3 text-[12px] text-[#666666]">
          Solo entran reservas pagadas cuya fecha ya pasó y que no tienen liquidación previa.
        </p>
        {data.pendientes.length === 0 ? (
          <p className="text-[13px] text-[#666666]">Ningún campo tiene saldo por liquidar.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.pendientes.map((p) => (
              <li
                key={p.field_id}
                className="flex flex-col gap-2 border border-solid border-[#EEEEEE] p-4 md:flex-row md:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-[#111111]">
                    {p.campo?.nombre ?? p.field_id}
                  </p>
                  <p className="text-[12px] text-[#666666]">
                    {p.reservas} {p.reservas === 1 ? 'reserva' : 'reservas'} ·{' '}
                    {fechaCorta(p.desde)} — {fechaCorta(p.hasta)} · vendido{' '}
                    <MoneyText centavos={p.bruto_centavos} conMoneda={false} /> · comisión{' '}
                    <MoneyText centavos={p.comision_centavos} conMoneda={false} />
                  </p>
                  <p className="text-[12px] text-[#666666]">
                    {p.banco?.clabe
                      ? `${p.banco.banco ?? 'Banco'} · CLABE ${p.banco.clabe} · ${p.banco.titular_cuenta ?? ''}`
                      : 'Al campo le faltan sus datos bancarios'}
                  </p>
                  <p style={jost} className="mt-1 text-[18px] text-[#CC4B37]">
                    <MoneyText centavos={p.neto_centavos} />
                  </p>
                </div>
                <button
                  type="button"
                  disabled={ocupado === p.field_id}
                  onClick={() => void crear(p.field_id)}
                  style={jost}
                  className="min-h-[44px] shrink-0 bg-[#111111] px-4 text-[11px] text-[#FFFFFF] disabled:opacity-50"
                >
                  CREAR LIQUIDACIÓN
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p style={jost} className="mb-3 text-[12px] text-[#111111]">
          Liquidaciones
        </p>
        {data.liquidaciones.length === 0 ? (
          <p className="text-[13px] text-[#666666]">Todavía no hay liquidaciones.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.liquidaciones.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 border border-solid border-[#EEEEEE] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-[#111111]">
                    {p.campo?.nombre ?? p.field_id}
                  </span>
                  <span
                    style={jost}
                    className={`px-2 py-1 text-[9px] ${
                      p.status === 'transferido'
                        ? 'bg-[#1B5E20] text-[#FFFFFF]'
                        : 'bg-[#FFF3CD] text-[#856404]'
                    }`}
                  >
                    {p.status === 'transferido' ? 'TRANSFERIDA' : 'PENDIENTE'}
                  </span>
                </div>
                <p className="text-[12px] text-[#666666]">
                  {fechaCorta(p.periodo_desde)} — {fechaCorta(p.periodo_hasta)} ·{' '}
                  {p.reservas_count} {p.reservas_count === 1 ? 'reserva' : 'reservas'} · vendido{' '}
                  <MoneyText centavos={p.bruto_centavos} conMoneda={false} /> · comisión{' '}
                  <MoneyText centavos={p.comision_centavos} conMoneda={false} />
                  {p.reembolsos_centavos > 0 ? (
                    <>
                      {' '}
                      · reembolsos <MoneyText centavos={p.reembolsos_centavos} conMoneda={false} />
                    </>
                  ) : null}
                </p>
                <p className="text-[14px] text-[#111111]">
                  Neto a transferir{' '}
                  <MoneyText centavos={p.neto_centavos} className="font-bold text-[#CC4B37]" />
                </p>
                {p.banco?.clabe ? (
                  <p className="text-[12px] text-[#666666]">
                    {p.banco.banco ?? 'Banco'} · CLABE {p.banco.clabe} ·{' '}
                    {p.banco.titular_cuenta ?? ''}
                  </p>
                ) : null}
                {p.status === 'transferido' ? (
                  <p className="text-[12px] text-[#666666]">
                    Folio {p.referencia} · {horaMexico(p.transferido_at)}
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className={inputClass}
                      placeholder="Folio SPEI"
                      value={folios[p.id] ?? ''}
                      onChange={(e) => setFolios((f) => ({ ...f, [p.id]: e.target.value }))}
                      aria-label="Folio de la transferencia"
                    />
                    <button
                      type="button"
                      disabled={ocupado === p.id}
                      onClick={() => void transferir(p.id)}
                      style={jost}
                      className="min-h-[44px] bg-[#1B5E20] px-4 text-[11px] text-[#FFFFFF] disabled:opacity-50"
                    >
                      MARCAR TRANSFERIDA
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export function AdminArenaReservasClient() {
  const [tab, setTab] = useState<Tab>('reservas')

  return (
    <div className="mt-4" style={lato}>
      <h1 style={jost} className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl">
        ARENA · RESERVAS
      </h1>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
        {(
          [
            { id: 'reservas' as Tab, label: 'RESERVAS Y PAGOS' },
            { id: 'liquidaciones' as Tab, label: 'LIQUIDACIONES' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={jost}
            className={`px-3 py-2 text-[11px] tracking-[0.12em] ${
              tab === t.id
                ? 'bg-[#111111] text-[#FFFFFF]'
                : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">{tab === 'reservas' ? <Reservas /> : <Liquidaciones />}</div>
    </div>
  )
}
