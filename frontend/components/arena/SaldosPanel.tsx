'use client'

import { useEffect, useState } from 'react'
import { arenaErrorMessage, arenaGet, type ArenaSaldos } from '@/lib/arena-api'
import { fechaCorta, horaMexico } from './fechas'
import { MoneyText } from './MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function Celda({ label, centavos, acento }: { label: string; centavos: number; acento?: boolean }) {
  return (
    <div className="border border-solid border-[#EEEEEE] p-3">
      <p className="text-[11px] text-[#666666]">{label}</p>
      <p style={jost} className={`text-[18px] ${acento ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
        <MoneyText centavos={centavos} conMoneda={false} />
      </p>
    </div>
  )
}

/** Vendido, comisión, reembolsado, por liquidar y liquidado, con el detalle. */
export function SaldosPanel({ fieldId }: { fieldId: string }) {
  const [data, setData] = useState<ArenaSaldos | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    arenaGet<ArenaSaldos>(`/owner/fields/${fieldId}/saldos`)
      .then((r) => vivo && setData(r))
      .catch((err) => vivo && setError(arenaErrorMessage(err)))
    return () => {
      vivo = false
    }
  }, [fieldId])

  if (error) {
    return (
      <p className="py-6 text-[13px] text-[#CC4B37]" style={lato}>
        {error}
      </p>
    )
  }
  if (!data) {
    return (
      <p className="py-6 text-[13px] text-[#666666]" style={lato}>
        Cargando saldos…
      </p>
    )
  }

  const s = data.saldos

  return (
    <div className="flex flex-col gap-5" style={lato}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Celda label="Vendido" centavos={s.vendido_centavos} />
        <Celda label="Comisión AirNation" centavos={s.comision_centavos} />
        <Celda label="Reembolsado" centavos={s.reembolsado_centavos} />
        <Celda label="Por liquidar" centavos={s.por_liquidar_centavos} acento />
        <Celda label="Liquidado" centavos={s.liquidado_centavos} />
      </div>

      <p className="text-[12px] text-[#666666]">
        Se liquida cada lunes por transferencia, solo las reservas cuya fecha ya pasó
        {s.reservas_por_liquidar > 0
          ? ` (${s.reservas_por_liquidar} ${s.reservas_por_liquidar === 1 ? 'reserva' : 'reservas'} lista${s.reservas_por_liquidar === 1 ? '' : 's'})`
          : ''}
        .
      </p>

      <div>
        <p style={jost} className="mb-2 text-[12px] text-[#111111]">
          Mis liquidaciones
        </p>
        {data.liquidaciones.length === 0 ? (
          <p className="text-[13px] text-[#666666]">Todavía no tienes liquidaciones.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
            {data.liquidaciones.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] text-[#111111]">
                    {fechaCorta(p.periodo_desde)} — {fechaCorta(p.periodo_hasta)}
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
                  Neto <MoneyText centavos={p.neto_centavos} className="font-bold text-[#CC4B37]" />
                  {p.referencia ? (
                    <span className="text-[12px] text-[#666666]"> · folio {p.referencia}</span>
                  ) : null}
                  {p.transferido_at ? (
                    <span className="text-[12px] text-[#666666]">
                      {' '}
                      · {horaMexico(p.transferido_at)}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
