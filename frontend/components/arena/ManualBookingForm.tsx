'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaItem,
  type ArenaOpenDay,
} from '@/lib/arena-api'
import { fechaCorta, hoyMexico, horaMexico, sumaDias } from './fechas'
import { MoneyText } from './MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

type Resultado = {
  codigo: string
  total_centavos: number
  expires_at: string | null
  link_pago: string | null
  link_reserva: string
}

/**
 * Reserva que llegó por WhatsApp: el campo la captura y el sistema devuelve un
 * link de pago que vence en 2 h, para copiarlo al chat.
 */
export function ManualBookingForm({
  fieldId,
  onCreada,
}: {
  fieldId: string
  onCreada?: () => void
}) {
  const [items, setItems] = useState<ArenaItem[]>([])
  const [dias, setDias] = useState<ArenaOpenDay[]>([])
  const [fecha, setFecha] = useState('')
  const [jugadores, setJugadores] = useState('4')
  const [elegidos, setElegidos] = useState<Record<string, number>>({})
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const hoy = hoyMexico()
    arenaGet<{ items: ArenaItem[] }>(`/owner/fields/${fieldId}/items`)
      .then((r) => setItems(r.items.filter((i) => i.activo)))
      .catch((err) => setError(arenaErrorMessage(err)))
    arenaGet<{ dias: ArenaOpenDay[] }>(
      `/fields/${fieldId}/open-days?desde=${hoy}&hasta=${sumaDias(hoy, 60)}`
    )
      .then((r) => setDias(r.dias))
      .catch(() => {
        /* el calendario es una ayuda: el dueño puede escribir la fecha */
      })
  }, [fieldId])

  const num = Number(jugadores) || 0
  const base = items.filter((i) => i.es_base)
  const extras = items.filter((i) => !i.es_base)

  const total = useMemo(
    () =>
      Object.entries(elegidos).reduce((suma, [id, cantidad]) => {
        const item = items.find((i) => i.id === id)
        if (!item || cantidad < 1) return suma
        const c = item.unidad === 'por_reserva' ? 1 : item.unidad === 'por_persona' && item.es_base ? num : cantidad
        return suma + item.precio_centavos * c
      }, 0),
    [elegidos, items, num]
  )

  const crear = async () => {
    setError('')
    const seleccion = Object.entries(elegidos)
      .filter(([, c]) => c >= 1)
      .map(([item_id, cantidad]) => ({ item_id, cantidad }))
    if (!fecha) return setError('Elige el día.')
    if (!seleccion.some((s) => base.some((b) => b.id === s.item_id))) {
      return setError('Elige un paquete o un derecho de campo.')
    }
    if (!nombre.trim() || !email.trim()) return setError('Falta el nombre o el email del jugador.')

    setGuardando(true)
    try {
      const r = await arenaSend<Resultado>('POST', `/owner/fields/${fieldId}/bookings`, {
        fecha,
        num_jugadores: num,
        items: seleccion,
        contacto_nombre: nombre.trim(),
        contacto_email: email.trim(),
        contacto_telefono: telefono.trim() || null,
        notas_jugador: notas.trim() || null,
      })
      setResultado(r)
      onCreada?.()
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  const mensajeWhatsApp = resultado
    ? `Tu lugar está apartado en ${resultado.codigo}. Paga aquí para confirmarlo: ${resultado.link_pago || resultado.link_reserva}`
    : ''

  if (resultado) {
    return (
      <div className="flex flex-col gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4" style={lato}>
        <p style={jost} className="text-[13px] text-[#1B5E20]">
          Reserva {resultado.codigo} creada
        </p>
        <p className="text-[13px] text-[#666666]">
          Total <MoneyText centavos={resultado.total_centavos} />. Ya le mandamos el link por
          correo
          {resultado.expires_at ? ` y vence el ${horaMexico(resultado.expires_at)}` : ''}.
        </p>
        <textarea
          readOnly
          rows={3}
          value={mensajeWhatsApp}
          className={inputClass}
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(mensajeWhatsApp)
              setCopiado(true)
            }}
            style={jost}
            className="min-h-[44px] bg-[#111111] px-4 text-[11px] text-[#FFFFFF]"
          >
            {copiado ? 'COPIADO' : 'COPIAR PARA WHATSAPP'}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`}
            target="_blank"
            rel="noreferrer"
            style={jost}
            className="inline-flex min-h-[44px] items-center justify-center bg-[#CC4B37] px-4 text-[11px] text-[#FFFFFF]"
          >
            ABRIR WHATSAPP
          </a>
          <button
            type="button"
            onClick={() => {
              setResultado(null)
              setElegidos({})
              setNombre('')
              setEmail('')
              setTelefono('')
              setNotas('')
              setCopiado(false)
            }}
            style={jost}
            className="min-h-[44px] border border-solid border-[#EEEEEE] px-4 text-[11px] text-[#666666]"
          >
            OTRA RESERVA
          </button>
        </div>
      </div>
    )
  }

  const toggle = (item: ArenaItem, on: boolean) =>
    setElegidos((prev) => {
      const next = { ...prev }
      if (!on) delete next[item.id]
      else next[item.id] = item.unidad === 'por_unidad' ? 1 : num || 1
      return next
    })

  return (
    <div className="flex flex-col gap-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4" style={lato}>
      <p style={jost} className="text-[13px] text-[#111111]">
        Reserva manual
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Día
          {dias.length > 0 ? (
            <select className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)}>
              <option value="">Elige el día</option>
              {dias.map((d) => (
                <option key={d.fecha} value={d.fecha}>
                  {fechaCorta(d.fecha)} · {d.apertura.slice(0, 5)}–{d.cierre.slice(0, 5)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="date"
              className={inputClass}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          )}
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Jugadores
          <input
            className={inputClass}
            inputMode="numeric"
            value={jugadores}
            onChange={(e) => setJugadores(e.target.value)}
          />
        </label>
      </div>

      <div>
        <p className="mb-2 text-[12px] text-[#666666]">Concepto base</p>
        <div className="flex flex-col gap-1">
          {base.map((i) => (
            <label key={i.id} className="flex items-center gap-2 text-[13px] text-[#111111]">
              <input
                type="radio"
                name="base-manual"
                checked={Boolean(elegidos[i.id])}
                onChange={() =>
                  setElegidos((prev) => {
                    const next: Record<string, number> = {}
                    for (const [id, c] of Object.entries(prev)) {
                      if (!base.some((b) => b.id === id)) next[id] = c
                    }
                    next[i.id] = i.unidad === 'por_reserva' ? 1 : num || 1
                    return next
                  })
                }
              />
              {i.nombre} — <MoneyText centavos={i.precio_centavos} conMoneda={false} />
            </label>
          ))}
          {base.length === 0 ? (
            <p className="text-[13px] text-[#CC4B37]">
              Carga primero un paquete o un derecho de campo en Catálogo.
            </p>
          ) : null}
        </div>
      </div>

      {extras.length > 0 ? (
        <div>
          <p className="mb-2 text-[12px] text-[#666666]">Rentas y extras</p>
          <div className="flex flex-col gap-1">
            {extras.map((i) => (
              <label key={i.id} className="flex items-center gap-2 text-[13px] text-[#111111]">
                <input
                  type="checkbox"
                  checked={Boolean(elegidos[i.id])}
                  onChange={(e) => toggle(i, e.target.checked)}
                />
                {i.nombre} — <MoneyText centavos={i.precio_centavos} conMoneda={false} />
                {elegidos[i.id] ? (
                  <input
                    className="ml-1 w-[60px] border border-solid border-[#EEEEEE] px-2 py-1 text-center text-[13px]"
                    inputMode="numeric"
                    value={String(elegidos[i.id])}
                    onChange={(e) =>
                      setElegidos((prev) => ({ ...prev, [i.id]: Number(e.target.value) || 1 }))
                    }
                    aria-label={`Cantidad de ${i.nombre}`}
                  />
                ) : null}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Nombre del jugador
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Email (ahí le llega el link)
          <input
            className={inputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          WhatsApp
          <input
            className={inputClass}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Notas
          <input className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>
      </div>

      <p className="text-[14px] text-[#111111]">
        Total del servidor al confirmar: aproximado{' '}
        <MoneyText centavos={total} className="font-bold text-[#CC4B37]" />
      </p>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      <button
        type="button"
        onClick={() => void crear()}
        disabled={guardando}
        style={jost}
        className="inline-flex min-h-[44px] items-center justify-center bg-[#CC4B37] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
      >
        {guardando ? 'CREANDO…' : 'CREAR Y GENERAR LINK DE PAGO'}
      </button>
    </div>
  )
}
