'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaFichaPublica,
  type ArenaItem,
  type ArenaOpenDay,
} from '@/lib/arena-api'
import { fechaCorta, fechaLarga, hoyMexico, sumaDias } from '@/components/arena/fechas'
import { MoneyText, formatCentavos } from '@/components/arena/MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[16px] text-[#111111] outline-none focus:border-[#CC4B37]'

const UNIDAD: Record<string, string> = {
  por_persona: 'por persona',
  por_reserva: 'por reserva',
  por_unidad: 'por unidad',
}

type Paso = 1 | 2 | 3

/** Cantidad con la que se cobra un concepto, con las mismas reglas que la BD. */
function cantidadDe(item: ArenaItem, elegida: number, jugadores: number): number {
  if (item.unidad === 'por_reserva') return 1
  if (item.unidad === 'por_persona') return item.es_base ? jugadores : Math.min(elegida, jugadores)
  return Math.max(elegida, 1)
}

export function ReservarClient({
  slug,
  ficha,
  contacto,
  itemPreseleccionado,
}: {
  slug: string
  ficha: ArenaFichaPublica
  contacto: { nombre: string; email: string; telefono: string } | null
  itemPreseleccionado: string | null
}) {
  const [paso, setPaso] = useState<Paso>(1)
  const [dias, setDias] = useState<ArenaOpenDay[] | null>(null)
  const [fecha, setFecha] = useState('')
  const [jugadores, setJugadores] = useState(4)
  const [baseId, setBaseId] = useState<string>('')
  const [extras, setExtras] = useState<Record<string, number>>({})
  const [nombre, setNombre] = useState(contacto?.nombre ?? '')
  const [email, setEmail] = useState(contacto?.email ?? '')
  const [telefono, setTelefono] = useState(contacto?.telefono ?? '')
  const [notas, setNotas] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const base = ficha.items.filter((i) => i.es_base)
  const opcionales = ficha.items.filter((i) => !i.es_base)

  useEffect(() => {
    const hoy = hoyMexico()
    const hasta = sumaDias(hoy, Math.min(ficha.arena.anticipacion_max_dias, 60))
    arenaGet<{ dias: ArenaOpenDay[] }>(
      `/fields/${ficha.field.id}/open-days?desde=${hoy}&hasta=${hasta}`
    )
      .then((r) => setDias(r.dias))
      .catch((err) => {
        setDias([])
        setError(arenaErrorMessage(err))
      })
  }, [ficha.field.id, ficha.arena.anticipacion_max_dias])

  useEffect(() => {
    if (itemPreseleccionado && base.some((b) => b.id === itemPreseleccionado)) {
      setBaseId(itemPreseleccionado)
    }
  }, [itemPreseleccionado, base])

  const itemBase = base.find((b) => b.id === baseId) ?? null

  const renglones = useMemo(() => {
    const lista: { item: ArenaItem; cantidad: number; subtotal: number }[] = []
    if (itemBase) {
      const c = cantidadDe(itemBase, jugadores, jugadores)
      lista.push({ item: itemBase, cantidad: c, subtotal: itemBase.precio_centavos * c })
    }
    for (const [id, elegida] of Object.entries(extras)) {
      const item = opcionales.find((i) => i.id === id)
      if (!item || elegida < 1) continue
      const c = cantidadDe(item, elegida, jugadores)
      lista.push({ item, cantidad: c, subtotal: item.precio_centavos * c })
    }
    return lista
  }, [itemBase, extras, opcionales, jugadores])

  const total = renglones.reduce((s, r) => s + r.subtotal, 0)

  const baseFueraDeRango =
    itemBase != null &&
    ((itemBase.min_jugadores != null && jugadores < itemBase.min_jugadores) ||
      (itemBase.max_jugadores != null && jugadores > itemBase.max_jugadores))

  const puedeSeguir =
    paso === 1
      ? Boolean(fecha) && jugadores >= 1
      : paso === 2
        ? Boolean(itemBase) && !baseFueraDeRango
        : Boolean(nombre.trim() && email.trim() && acepta)

  const reservar = async () => {
    setError('')
    if (!acepta) return setError('Tienes que aceptar la política de cancelación.')
    setEnviando(true)
    try {
      const r = await arenaSend<{
        codigo: string
        access_token: string
        pago: { checkout_url: string | null } | null
      }>('POST', '/bookings', {
        field_id: ficha.field.id,
        fecha,
        num_jugadores: jugadores,
        items: renglones.map(({ item, cantidad }) => ({
          item_id: item.id,
          ...(item.es_base || item.unidad === 'por_reserva' ? {} : { cantidad }),
        })),
        contacto_nombre: nombre.trim(),
        contacto_email: email.trim(),
        contacto_telefono: telefono.trim() || null,
        notas_jugador: notas.trim() || null,
        acepta_politica: true,
      })
      // El checkout manda a la pasarela; si no hay URL, a la propia reserva.
      window.location.href =
        r.pago?.checkout_url || `/reservas/${r.codigo}?t=${r.access_token}`
    } catch (err) {
      setError(arenaErrorMessage(err))
      setEnviando(false)
    }
  }

  const toggleExtra = (item: ArenaItem, on: boolean) =>
    setExtras((prev) => {
      const next = { ...prev }
      if (!on) delete next[item.id]
      else next[item.id] = item.unidad === 'por_unidad' ? 1 : jugadores
      return next
    })

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 pb-[180px] pt-6 md:px-6" style={lato}>
      <p className="text-[12px] text-[#666666]">
        <a href={`/campos/${slug}`} className="underline">
          {ficha.field.nombre}
        </a>
      </p>
      <h1 style={jost} className="mt-1 text-[24px] leading-tight text-[#111111] md:text-[30px]">
        RESERVAR
      </h1>

      <ol className="mt-5 flex gap-2 text-[10px]" style={jost}>
        {(['Día y jugadores', 'Paquete y extras', 'Datos y pago'] as const).map((label, i) => {
          const n = (i + 1) as Paso
          return (
            <li
              key={label}
              className={`flex-1 border-b-2 pb-2 ${
                paso === n ? 'border-[#CC4B37] text-[#111111]' : 'border-[#EEEEEE] text-[#999999]'
              }`}
            >
              {n}. {label}
            </li>
          )
        })}
      </ol>

      {/* ── Paso 1: día y jugadores ── */}
      {paso === 1 ? (
        <section className="mt-6 flex flex-col gap-4">
          <p className="text-[13px] text-[#666666]">
            Elige un día en que {ficha.field.nombre} abre. Solo aparecen los días
            disponibles.
          </p>
          {dias === null ? (
            <p className="text-[13px] text-[#666666]">Cargando días disponibles…</p>
          ) : dias.length === 0 ? (
            <p className="text-[13px] text-[#CC4B37]">
              No hay días disponibles por ahora. Intenta más tarde o escríbele al campo.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {dias.map((d) => (
                <button
                  key={d.fecha}
                  type="button"
                  onClick={() => setFecha(d.fecha)}
                  className={`min-h-[56px] border border-solid px-3 py-2 text-left ${
                    fecha === d.fecha
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                      : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#111111]'
                  }`}
                >
                  <span style={jost} className="block text-[11px]">
                    {fechaCorta(d.fecha)}
                  </span>
                  <span className="block text-[11px] opacity-80">
                    {d.apertura.slice(0, 5)}–{d.cierre.slice(0, 5)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            ¿Cuántos van a jugar?
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJugadores((n) => Math.max(1, n - 1))}
                aria-label="Un jugador menos"
                className="min-h-[44px] min-w-[44px] border border-solid border-[#EEEEEE] text-[18px] text-[#111111]"
              >
                −
              </button>
              <input
                className="min-h-[44px] w-[90px] border border-solid border-[#EEEEEE] text-center text-[18px] text-[#111111]"
                inputMode="numeric"
                value={String(jugadores)}
                onChange={(e) =>
                  setJugadores(Math.min(500, Math.max(1, Number(e.target.value) || 1)))
                }
              />
              <button
                type="button"
                onClick={() => setJugadores((n) => Math.min(500, n + 1))}
                aria-label="Un jugador más"
                className="min-h-[44px] min-w-[44px] border border-solid border-[#EEEEEE] text-[18px] text-[#111111]"
              >
                +
              </button>
            </div>
          </label>
        </section>
      ) : null}

      {/* ── Paso 2: paquete, rentas y extras ── */}
      {paso === 2 ? (
        <section className="mt-6 flex flex-col gap-5">
          <div>
            <p style={jost} className="text-[12px] text-[#111111]">
              Elige tu paquete o derecho de campo
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {base.map((i) => {
                const fuera =
                  (i.min_jugadores != null && jugadores < i.min_jugadores) ||
                  (i.max_jugadores != null && jugadores > i.max_jugadores)
                return (
                  <label
                    key={i.id}
                    className={`flex cursor-pointer items-start gap-3 border border-solid p-3 ${
                      baseId === i.id ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'
                    } ${fuera ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name="base"
                      className="mt-1"
                      disabled={fuera}
                      checked={baseId === i.id}
                      onChange={() => setBaseId(i.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-[#111111]">{i.nombre}</span>
                      <span className="block text-[13px] text-[#CC4B37]">
                        {formatCentavos(i.precio_centavos, false)}{' '}
                        <span className="text-[#666666]">{UNIDAD[i.unidad]}</span>
                      </span>
                      {i.descripcion ? (
                        <span className="mt-1 block text-[12px] text-[#666666]">
                          {i.descripcion}
                        </span>
                      ) : null}
                      {i.incluye.length > 0 ? (
                        <span className="mt-1 block text-[12px] text-[#666666]">
                          Incluye: {i.incluye.join(', ')}
                        </span>
                      ) : null}
                      {fuera ? (
                        <span className="mt-1 block text-[12px] text-[#CC4B37]">
                          {i.min_jugadores != null && jugadores < i.min_jugadores
                            ? `Necesitas al menos ${i.min_jugadores} jugadores.`
                            : `Admite hasta ${i.max_jugadores} jugadores.`}
                        </span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {opcionales.length > 0 ? (
            <div>
              <p style={jost} className="text-[12px] text-[#111111]">
                Rentas y extras (opcional)
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {opcionales.map((i) => (
                  <div
                    key={i.id}
                    className="flex items-start gap-3 border border-solid border-[#EEEEEE] p-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(extras[i.id])}
                      onChange={(e) => toggleExtra(i, e.target.checked)}
                      id={`extra-${i.id}`}
                    />
                    <label htmlFor={`extra-${i.id}`} className="min-w-0 flex-1 cursor-pointer">
                      <span className="block text-[15px] font-bold text-[#111111]">{i.nombre}</span>
                      <span className="block text-[13px] text-[#CC4B37]">
                        {formatCentavos(i.precio_centavos, false)}{' '}
                        <span className="text-[#666666]">{UNIDAD[i.unidad]}</span>
                      </span>
                      {i.descripcion ? (
                        <span className="mt-1 block text-[12px] text-[#666666]">
                          {i.descripcion}
                        </span>
                      ) : null}
                    </label>
                    {extras[i.id] ? (
                      <input
                        className="w-[64px] shrink-0 border border-solid border-[#EEEEEE] px-2 py-1 text-center text-[14px]"
                        inputMode="numeric"
                        value={String(extras[i.id])}
                        onChange={(e) =>
                          setExtras((prev) => ({
                            ...prev,
                            [i.id]: Math.max(1, Number(e.target.value) || 1),
                          }))
                        }
                        aria-label={`Cantidad de ${i.nombre}`}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── Paso 3: datos y pago ── */}
      {paso === 3 ? (
        <section className="mt-6 flex flex-col gap-4">
          {!contacto ? (
            <p className="text-[13px] text-[#666666]">
              Puedes reservar sin cuenta. Si ya tienes cuenta,{' '}
              <a
                href={`/login?redirect=${encodeURIComponent(`/campos/${slug}/reservar`)}`}
                className="text-[#CC4B37] underline"
              >
                inicia sesión
              </a>{' '}
              y tu reserva queda guardada en tu perfil.
            </p>
          ) : null}

          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Nombre de quien reserva
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Email (ahí llega tu QR)
            <input
              className={inputClass}
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            WhatsApp (opcional)
            <input
              className={inputClass}
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Algo que deba saber el campo (opcional)
            <textarea
              className={inputClass}
              rows={3}
              maxLength={500}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </label>

          <div className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-3 text-[12px] text-[#666666]">
            {ficha.arena.politica_cancelacion ||
              `Cancela hasta ${ficha.arena.cancelacion_horas_limite} h antes de la hora de apertura y te devolvemos el 100%. Después de ese plazo no hay reembolso.`}
          </div>

          <label className="flex items-start gap-2 text-[13px] text-[#111111]">
            <input
              type="checkbox"
              className="mt-1"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
            />
            Acepto la política de cancelación y reembolso del campo.
          </label>
        </section>
      ) : null}

      {error ? <p className="mt-4 text-[13px] text-[#CC4B37]">{error}</p> : null}

      {/* Resumen fijo abajo (375 px incluido). */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-6">
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2">
          <div className="flex items-start justify-between gap-3 text-[12px] text-[#666666]">
            <span className="min-w-0">
              {fecha ? fechaLarga(fecha) : 'Elige el día'} · {jugadores}{' '}
              {jugadores === 1 ? 'jugador' : 'jugadores'}
              {renglones.length > 0 ? (
                <span className="block truncate">
                  {renglones.map((r) => `${r.item.nombre} × ${r.cantidad}`).join(' · ')}
                </span>
              ) : null}
            </span>
            <span style={jost} className="shrink-0 text-[18px] text-[#CC4B37]">
              <MoneyText centavos={total} conMoneda={false} />
            </span>
          </div>
          <div className="flex gap-2">
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => setPaso((p) => (p - 1) as Paso)}
                style={jost}
                className="min-h-[48px] border border-solid border-[#EEEEEE] px-4 text-[11px] text-[#666666]"
              >
                ATRÁS
              </button>
            ) : null}
            {paso < 3 ? (
              <button
                type="button"
                disabled={!puedeSeguir}
                onClick={() => setPaso((p) => (p + 1) as Paso)}
                style={jost}
                className="min-h-[48px] flex-1 bg-[#111111] px-4 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-40"
              >
                CONTINUAR
              </button>
            ) : (
              <button
                type="button"
                disabled={!puedeSeguir || enviando || total <= 0}
                onClick={() => void reservar()}
                style={jost}
                className="min-h-[48px] flex-1 bg-[#CC4B37] px-4 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-40"
              >
                {enviando ? 'ABRIENDO EL PAGO…' : 'PAGAR Y CONFIRMAR'}
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#999999]">
            Tienes 15 minutos para completar el pago. El total ya incluye todo: AirNation no
            cobra nada extra.
          </p>
        </div>
      </div>
    </main>
  )
}
