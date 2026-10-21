'use client'

import { useEffect, useState } from 'react'
import {
  ArenaApiError,
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaCheckinPreview,
} from '@/lib/arena-api'
import { fechaLarga, horaMexico } from '@/components/arena/fechas'
import { MoneyText } from '@/components/arena/MoneyText'
import { StatusBadge } from '@/components/arena/StatusBadge'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Registrado = { codigo: string; jugadores_llegaron: number; checkin_at: string }

function Pantalla({
  tono,
  titulo,
  children,
}: {
  tono: 'verde' | 'rojo' | 'neutro'
  titulo: string
  children?: React.ReactNode
}) {
  const fondo =
    tono === 'verde' ? 'bg-[#1B5E20]' : tono === 'rojo' ? 'bg-[#CC4B37]' : 'bg-[#111111]'
  return (
    <main className="mx-auto min-h-full w-full max-w-[520px]" style={lato}>
      <div className={`${fondo} px-4 py-8 text-[#FFFFFF]`}>
        <p style={jost} className="text-[24px] leading-tight">
          {titulo}
        </p>
      </div>
      <div className="px-4 py-6">{children}</div>
    </main>
  )
}

export function CheckinClient({ qrToken }: { qrToken: string }) {
  const [data, setData] = useState<ArenaCheckinPreview | null>(null)
  const [fallo, setFallo] = useState<{ mensaje: string; code?: string } | null>(null)
  const [llegaron, setLlegaron] = useState('')
  const [registrado, setRegistrado] = useState<Registrado | null>(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vivo = true
    arenaGet<ArenaCheckinPreview>(`/checkin/${qrToken}`)
      .then((r) => {
        if (!vivo) return
        setData(r)
        setLlegaron(String(r.reserva.jugadores_llegaron ?? r.reserva.num_jugadores))
      })
      .catch((err) => {
        if (!vivo) return
        setFallo({
          mensaje: arenaErrorMessage(err),
          code: err instanceof ArenaApiError ? err.code : undefined,
        })
      })
    return () => {
      vivo = false
    }
  }, [qrToken])

  const registrar = async () => {
    setError('')
    setEnviando(true)
    try {
      const r = await arenaSend<{ checkin: Registrado }>('POST', `/checkin/${qrToken}`, {
        jugadores_llegaron: Number(llegaron),
      })
      setRegistrado(r.checkin)
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  if (fallo) {
    return (
      <Pantalla
        tono="rojo"
        titulo={fallo.code === 'sin_permiso' ? 'Este QR es para el staff del campo' : 'QR no válido'}
      >
        <p className="text-[14px] text-[#111111]">{fallo.mensaje}</p>
      </Pantalla>
    )
  }

  if (!data) {
    return <Pantalla tono="neutro" titulo="Leyendo el QR…" />
  }

  const r = data.reserva

  if (registrado) {
    return (
      <Pantalla tono="verde" titulo="Llegada registrada">
        <p className="text-[15px] text-[#111111]">
          {r.contacto_nombre} · {registrado.jugadores_llegaron}{' '}
          {registrado.jugadores_llegaron === 1 ? 'jugador' : 'jugadores'}
        </p>
        <p className="mt-1 text-[13px] text-[#666666]">
          {registrado.codigo} · {horaMexico(registrado.checkin_at)}
        </p>
      </Pantalla>
    )
  }

  const yaLlego = r.status === 'completada'
  const noEsHoy = r.fecha !== data.hoy
  const noConfirmada = r.status !== 'confirmada' && !yaLlego
  const bloqueado = yaLlego || noEsHoy || noConfirmada

  const motivo = yaLlego
    ? `Este QR ya se usó${r.checkin_at ? ` el ${horaMexico(r.checkin_at)}` : ''}.`
    : noConfirmada
      ? `Esta reserva está ${r.status.replace('_', ' ')}: no se puede registrar la llegada.`
      : noEsHoy
        ? `Esta reserva es para el ${fechaLarga(r.fecha)}, no para hoy.`
        : ''

  return (
    <Pantalla
      tono={bloqueado ? 'rojo' : 'verde'}
      titulo={bloqueado ? 'No se puede registrar' : 'Reserva válida'}
    >
      {motivo ? <p className="mb-4 text-[14px] font-bold text-[#CC4B37]">{motivo}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={r.status} />
        <span style={jost} className="text-[16px] text-[#111111]">
          {r.codigo}
        </span>
      </div>
      <p className="mt-2 text-[18px] font-bold text-[#111111]">{r.contacto_nombre}</p>
      <p className="text-[13px] text-[#666666]">
        {fechaLarga(r.fecha)} · {r.num_jugadores}{' '}
        {r.num_jugadores === 1 ? 'jugador' : 'jugadores'} · pagado{' '}
        <MoneyText centavos={r.total_centavos} />
      </p>
      {r.contacto_telefono ? (
        <p className="mt-1 text-[13px]">
          <a href={`tel:${r.contacto_telefono}`} className="text-[#CC4B37] underline">
            {r.contacto_telefono}
          </a>
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-1 text-[13px] text-[#666666]">
        {r.items.map((i, n) => (
          <li key={n}>
            {i.nombre} × {i.cantidad}
          </li>
        ))}
      </ul>

      {r.notas_jugador ? (
        <p className="mt-3 border-l-2 border-[#EEEEEE] pl-3 text-[13px] text-[#666666]">
          {r.notas_jugador}
        </p>
      ) : null}

      {!bloqueado ? (
        <div className="mt-6">
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            ¿Cuántos llegaron?
            <input
              className="w-[120px] border border-solid border-[#EEEEEE] px-3 py-2 text-[16px] text-[#111111]"
              inputMode="numeric"
              value={llegaron}
              onChange={(e) => setLlegaron(e.target.value)}
            />
          </label>
          {error ? <p className="mt-3 text-[13px] text-[#CC4B37]">{error}</p> : null}
          <button
            type="button"
            onClick={() => void registrar()}
            disabled={enviando}
            style={jost}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center bg-[#1B5E20] px-5 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
          >
            {enviando ? 'REGISTRANDO…' : 'REGISTRAR LLEGADA'}
          </button>
        </div>
      ) : null}
    </Pantalla>
  )
}
