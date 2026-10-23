'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ARENA_TERRENOS,
  arenaGet,
  type ArenaDisciplina,
  type ArenaFichaPublica,
  type ArenaItem,
  type ArenaOpenDay,
} from '@/lib/arena-api'
import { aItemDeCarrito, renglones, totalSeleccion, type ArenaSeleccion } from '@/lib/arena-cart'
import { useArenaCart } from '@/components/arena/ArenaCartProvider'
import { useBarraFija } from '@/components/arena/useBarraFija'
import { formatCentavos } from '@/components/arena/MoneyText'
import {
  conMayuscula,
  duracionCorta,
  fechaMedia,
  horaCorta,
  hoyMexico,
  sumaDias,
} from '@/components/arena/fechas'
import { cfImageDeliveryUrl } from '@/lib/media-url'
import { FIELD_DAY_KEYS, FIELD_DAY_LABELS, weekScheduleFromJson } from '@/lib/field-schedule'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const UNIDAD: Record<string, string> = {
  por_persona: 'por persona',
  por_reserva: 'por grupo',
  por_unidad: 'c/u',
}

const TERRENO_LABEL = new Map(ARENA_TERRENOS.map((t) => [t.id, t.label]))
const DOW_CORTO = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const pad = (n: number) => String(n).padStart(2, '0')

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-[3px] shrink-0 text-[#CC4B37]">
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  )
}

function Mas() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  )
}

function Menos() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  )
}

/** Fotos del campo: portada + galería, con Cloudflare si aplica. */
function Galeria({ ficha }: { ficha: ArenaFichaPublica }) {
  const fuentes = [
    ficha.field.foto_portada_url,
    ...(ficha.arena.fotos_landing ?? []),
    ...(ficha.field.galeria_urls ?? []),
  ].filter((u): u is string => Boolean(u))
  const unicas = Array.from(new Set(fuentes))
  if (unicas.length === 0) return null

  const url = (u: string, w: number) => cfImageDeliveryUrl(u, { width: w, quality: 78, fit: 'cover' })

  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[180px_180px]">
      <div className="relative aspect-video overflow-hidden bg-[#F4F4F4] md:row-span-2 md:aspect-auto">
        <img src={url(unicas[0], 1200)} alt={`Foto de ${ficha.field.nombre}`} className="h-full w-full object-cover" />
      </div>
      {unicas.slice(1, 5).map((u) => (
        <div key={u} className="relative hidden overflow-hidden bg-[#F4F4F4] md:block">
          <img src={url(u, 600)} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ))}
      {unicas.length > 1 ? (
        <span className="absolute hidden" aria-hidden="true">
          {unicas.length}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Detalle del campo con la reserva en la misma página: panel lateral en
 * escritorio y sección con barra fija abajo en móvil.
 */
export function DetalleClient({
  ficha,
  fechaInicial,
  editarIndice,
}: {
  ficha: ArenaFichaPublica
  fechaInicial: string
  editarIndice: number | null
}) {
  const router = useRouter()
  const { cart, listo, agregar, abrir } = useArenaCart()
  const bottom = useBarraFija()

  const campo = ficha.field
  const items = ficha.items
  const base = useMemo(() => items.filter((i) => i.es_base), [items])
  const extras = useMemo(() => items.filter((i) => i.tipo === 'renta' || i.tipo === 'extra'), [items])

  /** Pestañas solo si hay paquetes de más de una disciplina. */
  const disciplinas = useMemo(
    () => (ficha.arena.disciplinas ?? []).filter((d) => base.some((i) => i.disciplina === d)),
    [ficha.arena.disciplinas, base]
  )

  const editando = editarIndice != null && cart[editarIndice]?.field_id === campo.id ? editarIndice : null
  const enEdicion = editando != null ? cart[editando] : null

  const [disciplina, setDisciplina] = useState<ArenaDisciplina | ''>('')
  const [fecha, setFecha] = useState('')
  const [jugadores, setJugadores] = useState(4)
  const [baseId, setBaseId] = useState('')
  const [extrasSel, setExtrasSel] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [mes, setMes] = useState(() => {
    const hoy = hoyMexico()
    return { y: Number(hoy.slice(0, 4)), m: Number(hoy.slice(5, 7)) }
  })
  const [diasPorMes, setDiasPorMes] = useState<Record<string, string[]>>({})
  const precargado = useRef(false)

  // Al editar desde el carrito o el checkout, el panel abre con lo que ya eligió.
  useEffect(() => {
    if (!listo || precargado.current) return
    precargado.current = true
    if (enEdicion) {
      setFecha(enEdicion.fecha)
      setJugadores(enEdicion.num_jugadores)
      setBaseId(enEdicion.base_id)
      setExtrasSel({ ...enEdicion.extras })
      setMes({ y: Number(enEdicion.fecha.slice(0, 4)), m: Number(enEdicion.fecha.slice(5, 7)) })
      const d = items.find((i) => i.id === enEdicion.base_id)?.disciplina
      if (d) setDisciplina(d)
    }
  }, [listo, enEdicion, items])

  const mesKey = `${mes.y}-${pad(mes.m)}`
  const hoy = hoyMexico()
  const ultimoDia = sumaDias(hoy, ficha.arena.anticipacion_max_dias)

  // Días abiertos del mes visible (se piden una vez por mes).
  useEffect(() => {
    if (diasPorMes[mesKey]) return
    const primero = `${mesKey}-01`
    const diasEnMes = new Date(Date.UTC(mes.y, mes.m, 0)).getUTCDate()
    const desde = primero < hoy ? hoy : primero
    const hasta = `${mesKey}-${pad(diasEnMes)}`
    if (hasta < hoy || desde > ultimoDia) {
      setDiasPorMes((p) => ({ ...p, [mesKey]: [] }))
      return
    }
    let vivo = true
    arenaGet<{ dias: ArenaOpenDay[] }>(
      `/fields/${campo.id}/open-days?desde=${desde}&hasta=${hasta > ultimoDia ? ultimoDia : hasta}`
    )
      .then((r) => vivo && setDiasPorMes((p) => ({ ...p, [mesKey]: r.dias.map((d) => d.fecha) })))
      .catch(() => vivo && setDiasPorMes((p) => ({ ...p, [mesKey]: [] })))
    return () => {
      vivo = false
    }
  }, [mesKey, mes.y, mes.m, campo.id, hoy, ultimoDia, diasPorMes])

  const abiertos = useMemo(() => new Set(diasPorMes[mesKey] ?? []), [diasPorMes, mesKey])

  // `?fecha=` solo se respeta si ese día está abierto.
  useEffect(() => {
    if (!fechaInicial || fecha || enEdicion) return
    if (abiertos.has(fechaInicial)) {
      setFecha(fechaInicial)
    }
  }, [fechaInicial, fecha, enEdicion, abiertos])

  const horario = useMemo(() => weekScheduleFromJson(campo.horarios_json), [campo.horarios_json])
  /** El campo abre ese día de la semana según su horario (aunque esté cerrado). */
  const programado = (f: string) => {
    const dow = new Date(`${f}T00:00:00Z`).getUTCDay()
    const key = FIELD_DAY_KEYS[(dow + 6) % 7]
    return horario[key].abierto
  }

  const paquetes = useMemo(
    () => (disciplinas.length > 1 && disciplina ? base.filter((i) => i.disciplina === disciplina || !i.disciplina) : base),
    [base, disciplina, disciplinas.length]
  )

  useEffect(() => {
    if (disciplinas.length > 1 && !disciplina) setDisciplina(disciplinas[0])
  }, [disciplinas, disciplina])

  const seleccion: ArenaSeleccion = { fecha, num_jugadores: jugadores, base_id: baseId, extras: extrasSel }
  const lineas = renglones(seleccion, items)
  const total = totalSeleccion(seleccion, items)
  const desde = useMemo(
    () => [...base].sort((a, b) => a.precio_centavos - b.precio_centavos)[0] ?? null,
    [base]
  )

  const cabe = (i: ArenaItem) =>
    (i.min_jugadores == null || jugadores >= i.min_jugadores) &&
    (i.max_jugadores == null || jugadores <= i.max_jugadores)

  const topeExtra = (i: ArenaItem) =>
    i.unidad === 'por_persona' ? jugadores : i.unidad === 'por_reserva' ? 1 : i.max_por_reserva ?? 20

  const cambiarJugadores = (delta: number) => {
    const n = Math.min(60, Math.max(1, jugadores + delta))
    setJugadores(n)
    // Un paquete que ya no admite al grupo se deselecciona, como en la maqueta.
    const elegido = items.find((i) => i.id === baseId)
    if (
      elegido &&
      ((elegido.min_jugadores != null && n < elegido.min_jugadores) ||
        (elegido.max_jugadores != null && n > elegido.max_jugadores))
    ) {
      setBaseId('')
    }
    setExtrasSel((prev) => {
      const next = { ...prev }
      for (const i of items) {
        if (i.unidad === 'por_persona' && next[i.id] > n) next[i.id] = n
      }
      return next
    })
  }

  const guardar = (destino: 'carrito' | 'checkout') => {
    if (!fecha) return setError('Elige un día para reservar.')
    if (!baseId) return setError('Elige un paquete o el derecho de campo.')
    setError('')
    const resultado = agregar(
      aItemDeCarrito(
        {
          field_id: campo.id,
          slug: campo.slug,
          nombre: campo.nombre,
          ciudad: campo.ciudad,
          foto_portada_url: campo.foto_portada_url,
        },
        seleccion,
        items
      ),
      editando != null ? { reemplazarIndice: editando } : {}
    )
    if (resultado === 'lleno') {
      return setError('Tu carrito ya tiene 10 reservas. Paga o quita alguna para agregar otra.')
    }
    if (destino === 'checkout' || editando != null) {
      router.push('/arena/checkout')
      return
    }
    abrir()
  }

  const diasEnMes = new Date(Date.UTC(mes.y, mes.m, 0)).getUTCDate()
  const offset = (new Date(Date.UTC(mes.y, mes.m - 1, 1)).getUTCDay() + 6) % 7
  const puedeAtras = `${mesKey}-01` > hoy.slice(0, 8) + '01'
  const puedeAdelante = `${mesKey}-01` < ultimoDia.slice(0, 8) + '01'
  const moverMes = (delta: number) => {
    const total = mes.m - 1 + delta
    setMes({ y: mes.y + Math.floor(total / 12), m: ((total % 12) + 12) % 12 + 1 })
  }

  const panel = (
    <aside id="reservar" className="border border-solid border-[#111111] bg-[#FFFFFF] lg:sticky lg:top-[76px]">
      <div className="flex items-baseline justify-between gap-3 bg-[#111111] p-4 text-[#FFFFFF]">
        <div>
          <h2 style={jost} className="text-[18px]">
            {editando != null ? 'EDITAR RESERVA' : 'RESERVAR'}
          </h2>
          <small className="text-[13px] text-[#BDBDBD]">Confirmación inmediata al pagar</small>
        </div>
        {desde ? (
          <div className="text-right">
            <small className="text-[13px] text-[#BDBDBD]">Desde</small>
            <div style={jost} className="text-[24px]">
              {formatCentavos(desde.precio_centavos, false)}
            </div>
            <small className="text-[13px] text-[#BDBDBD]">{UNIDAD[desde.unidad]}</small>
          </div>
        ) : null}
      </div>

      <div className="grid gap-[18px] p-4" style={lato}>
        {/* ── Día ── */}
        <div>
          <p className="mb-2 flex justify-between gap-2 text-[14px] font-bold">
            Día
            <span className="font-normal text-[#666666]">
              {fecha ? conMayuscula(fechaMedia(fecha)) : 'Elige un día marcado'}
            </span>
          </p>
          <div className="mb-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => moverMes(-1)}
              disabled={!puedeAtras}
              aria-label="Mes anterior"
              className="grid h-9 w-9 place-items-center border border-solid border-[#EEEEEE] disabled:opacity-35"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            </button>
            <b style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}>
              {conMayuscula(
                new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
                  new Date(Date.UTC(mes.y, mes.m - 1, 1))
                )
              )}
            </b>
            <button
              type="button"
              onClick={() => moverMes(1)}
              disabled={!puedeAdelante}
              aria-label="Mes siguiente"
              className="grid h-9 w-9 place-items-center border border-solid border-[#EEEEEE] disabled:opacity-35"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-[3px]">
            {DOW_CORTO.map((d, i) => (
              <span key={i} className="py-0.5 text-center text-[11px] text-[#999999]" aria-hidden="true">
                {d}
              </span>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <span key={`v${i}`} />
            ))}
            {Array.from({ length: diasEnMes }, (_, i) => {
              const f = `${mesKey}-${pad(i + 1)}`
              const libre = abiertos.has(f)
              // Abre ese día de la semana pero no se puede reservar: cerrado.
              const cerrado = !libre && programado(f) && f >= hoy && f <= ultimoDia
              return (
                <button
                  key={f}
                  type="button"
                  disabled={!libre}
                  aria-pressed={fecha === f}
                  aria-label={`${fechaMedia(f)}${libre ? '' : cerrado ? ', cerrado' : ', sin reserva'}`}
                  onClick={() => {
                    setFecha(f)
                    setError('')
                  }}
                  className={`aspect-square border border-solid p-0 text-[14px] font-bold ${
                    fecha === f
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                      : libre
                        ? 'border-[#EEEEEE] text-[#111111] hover:border-[#111111]'
                        : 'cursor-default border-transparent text-[#999999]'
                  } ${cerrado ? 'line-through' : ''}`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-[12px] text-[#666666]">
            Solo se pueden elegir los días en que abre el campo.
          </p>
        </div>

        {/* ── Jugadores ── */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <b className="text-[14px]">Jugadores</b>
            <br />
            <small className="text-[13px] text-[#666666]">Cuántos van a jugar</small>
          </div>
          <div className="inline-flex items-center border border-solid border-[#EEEEEE]" role="group" aria-label="Jugadores">
            <button
              type="button"
              onClick={() => cambiarJugadores(-1)}
              disabled={jugadores <= 1}
              aria-label="Quitar jugador"
              className="grid h-10 w-10 place-items-center disabled:opacity-30"
            >
              <Menos />
            </button>
            <output aria-live="polite" style={jost} className="min-w-10 text-center text-[17px]">
              {jugadores}
            </output>
            <button
              type="button"
              onClick={() => cambiarJugadores(1)}
              disabled={jugadores >= 60}
              aria-label="Agregar jugador"
              className="grid h-10 w-10 place-items-center disabled:opacity-30"
            >
              <Mas />
            </button>
          </div>
        </div>

        {/* ── Paquete ── */}
        <div>
          <p className="mb-2 text-[14px] font-bold">Paquete</p>
          <div className="grid gap-1.5" role="radiogroup" aria-label="Paquete">
            {paquetes.map((p) => {
              const ok = cabe(p)
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-start gap-2.5 border border-solid px-3 py-2.5 ${
                    baseId === p.id ? 'border-[#CC4B37]' : 'border-[#EEEEEE]'
                  } ${ok ? '' : 'opacity-45'}`}
                >
                  <input
                    type="radio"
                    name="paquete"
                    className="mt-[3px] h-4 w-4 accent-[#CC4B37]"
                    checked={baseId === p.id}
                    disabled={!ok}
                    onChange={() => {
                      setBaseId(p.id)
                      setError('')
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{p.nombre}</span>
                    <span className="text-[13px] text-[#666666]">
                      {duracionCorta(p.duracion_min)}
                      {p.duracion_min && p.min_jugadores ? ' · ' : ''}
                      {p.min_jugadores ? `${p.min_jugadores} a ${p.max_jugadores ?? 60} jugadores` : ''}
                    </span>
                  </span>
                  <span className="whitespace-nowrap text-right">
                    <span style={jost} className="text-[15px]">
                      {formatCentavos(p.precio_centavos, false)}
                    </span>
                    <br />
                    <small className="text-[11px] text-[#666666]">{UNIDAD[p.unidad]}</small>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* ── Rentas y extras ── */}
        {extras.length > 0 ? (
          <div>
            <p className="mb-2 flex justify-between gap-2 text-[14px] font-bold">
              Rentas y extras <span className="font-normal text-[#666666]">Opcional</span>
            </p>
            <div className="grid gap-2">
              {extras.map((x) => {
                const q = extrasSel[x.id] ?? 0
                const tope = topeExtra(x)
                return (
                  <div key={x.id} className="flex items-center gap-2.5 text-[14px]">
                    <span className="flex-1">
                      {x.nombre}
                      <small className="block text-[12px] text-[#666666]">
                        {formatCentavos(x.precio_centavos, false)} {UNIDAD[x.unidad]}
                      </small>
                    </span>
                    <div className="inline-flex items-center border border-solid border-[#EEEEEE]" role="group" aria-label={x.nombre}>
                      <button
                        type="button"
                        aria-label={`Quitar ${x.nombre}`}
                        disabled={q <= 0}
                        onClick={() => setExtrasSel((p) => ({ ...p, [x.id]: Math.max(0, q - 1) }))}
                        className="grid h-8 w-8 place-items-center disabled:opacity-30"
                      >
                        <Menos />
                      </button>
                      <output className="min-w-[30px] text-center text-[15px]" style={jost}>
                        {q}
                      </output>
                      <button
                        type="button"
                        aria-label={`Agregar ${x.nombre}`}
                        disabled={q >= tope}
                        onClick={() => setExtrasSel((p) => ({ ...p, [x.id]: Math.min(tope, q + 1) }))}
                        className="grid h-8 w-8 place-items-center disabled:opacity-30"
                      >
                        <Mas />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {/* ── Resumen ── */}
        {lineas.length > 0 ? (
          <div className="grid gap-1.5 border-t border-solid border-[#EEEEEE] pt-3 text-[14px]" aria-live="polite">
            {lineas.map((l) => (
              <div key={l.item.id} className="flex justify-between gap-3">
                <span className="text-[#666666]">
                  {l.item.nombre} × {l.cantidad}
                </span>
                <span>{formatCentavos(l.subtotal_centavos, false)}</span>
              </div>
            ))}
            <div className="mt-1.5 flex items-baseline justify-between border-t border-solid border-[#EEEEEE] pt-2.5">
              <b style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}>Total</b>
              <span style={jost} className="text-[26px]">
                {formatCentavos(total, false)}
              </span>
            </div>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="m-0 text-[14px] font-bold text-[#CC4B37]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-2">
          {editando != null ? (
            <>
              <button
                type="button"
                onClick={() => guardar('checkout')}
                style={jost}
                className="min-h-[44px] w-full bg-[#CC4B37] px-4 text-[14px] tracking-[0.04em] text-[#FFFFFF]"
              >
                Guardar cambios
              </button>
              <Link
                href="/arena/checkout"
                className="min-h-[36px] text-center text-[14px] font-bold text-[#666666] hover:text-[#111111]"
              >
                Descartar cambios
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => guardar('checkout')}
                style={jost}
                className="min-h-[44px] w-full bg-[#CC4B37] px-4 text-[14px] tracking-[0.04em] text-[#FFFFFF] hover:bg-[#A93A28]"
              >
                Reservar y pagar
              </button>
              <button
                type="button"
                onClick={() => guardar('carrito')}
                style={jost}
                className="min-h-[44px] w-full border border-solid border-[#111111] px-4 text-[14px] tracking-[0.04em] text-[#111111] hover:bg-[#F4F4F4]"
              >
                Agregar al carrito
              </button>
            </>
          )}
        </div>

        <p className="m-0 flex items-start gap-2 text-[13px] text-[#666666]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-0.5 shrink-0">
            <path d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6l7-3z" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.5 12l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <span>
            Pagas en línea con AirNation. Cancela gratis hasta {ficha.arena.cancelacion_horas_limite} h
            antes de la apertura.
          </span>
        </p>
      </div>
    </aside>
  )

  return (
    <div className="min-w-[375px] bg-[#FFFFFF] text-[#111111]" style={lato}>
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 pb-3 pt-4 text-[13px] text-[#666666]">
          <Link href="/arena" className="text-[#666666] no-underline hover:text-[#111111] hover:underline">
            Reservar campo
          </Link>
          <span aria-hidden="true">/</span>
          {campo.estado ? (
            <>
              <Link
                href={`/arena?estado=${encodeURIComponent(campo.estado)}`}
                className="text-[#666666] no-underline hover:text-[#111111] hover:underline"
              >
                {campo.estado}
              </Link>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          <span aria-current="page">{campo.nombre}</span>
        </nav>

        <Galeria ficha={ficha} />

        <div className="grid grid-cols-1 gap-8 pb-16 pt-6 lg:grid-cols-[1fr_380px] lg:items-start">
          <div>
            <div>
              <h1 style={jost} className="text-[28px] leading-[1.1] md:text-[36px] lg:text-[40px]">
                {campo.nombre}
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-[#666666]">
                {ficha.resenas.length > 0 ? (
                  <span className="flex items-center gap-1 font-bold text-[#111111]">
                    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
                        fill="#CC4B37"
                      />
                    </svg>
                    {Number(campo.promedio_rating || 0).toFixed(1)}{' '}
                    <small className="font-normal text-[#666666]">({ficha.resenas.length} reseñas)</small>
                  </span>
                ) : null}
                <span>
                  {campo.ciudad}
                  {campo.estado ? `, ${campo.estado}` : ''}
                </span>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {(ficha.arena.disciplinas ?? []).map((d) => (
                  <span key={d} className="border border-solid border-[#CC4B37] px-2.5 py-1 text-[13px] capitalize text-[#CC4B37]">
                    {d}
                  </span>
                ))}
                {(ficha.arena.terrenos ?? []).map((t) => (
                  <span key={t} className="border border-solid border-[#EEEEEE] px-2.5 py-1 text-[13px]">
                    {TERRENO_LABEL.get(t) ?? t}
                  </span>
                ))}
                {ficha.arena.edad_minima != null ? (
                  <span className="border border-solid border-[#EEEEEE] px-2.5 py-1 text-[13px]">
                    Desde {ficha.arena.edad_minima} años
                  </span>
                ) : null}
                <span className="border border-solid border-[#EEEEEE] px-2.5 py-1 text-[13px]">
                  Confirmación inmediata
                </span>
              </div>
              {campo.descripcion ? (
                <p className="mt-4 max-w-[64ch] text-[17px]">{campo.descripcion}</p>
              ) : null}
            </div>

            {/* ── Paquetes ── */}
            <section className="mt-7 border-t border-solid border-[#EEEEEE] pt-6" aria-labelledby="h-paq">
              <h2 id="h-paq" style={jost} className="mb-3.5 text-[20px]">
                PAQUETES
              </h2>
              {disciplinas.length > 1 ? (
                <div role="tablist" className="mb-4 flex border-b border-solid border-[#EEEEEE]">
                  {disciplinas.map((d) => (
                    <button
                      key={d}
                      type="button"
                      role="tab"
                      aria-selected={disciplina === d}
                      onClick={() => {
                        setDisciplina(d)
                        setBaseId('')
                      }}
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}
                      className={`-mb-px border-b-2 px-3.5 py-2.5 text-[14px] capitalize ${
                        disciplina === d ? 'border-[#CC4B37] text-[#111111]' : 'border-transparent text-[#666666]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              ) : null}
              {/* En lg entra el panel de 380 px y la columna de contenido se
                  queda corta para dos paquetes: vuelven a una sola hasta xl. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {paquetes.map((p) => (
                  <article
                    key={p.id}
                    className={`flex flex-col gap-2 border border-solid p-4 ${
                      baseId === p.id ? 'border-[#CC4B37] shadow-[inset_0_0_0_1px_#CC4B37]' : 'border-[#EEEEEE]'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 style={jost} className="text-[17px]">
                        {p.nombre}
                      </h3>
                      <span style={jost} className="whitespace-nowrap text-[20px]">
                        {formatCentavos(p.precio_centavos, false)}{' '}
                        <small className="text-[12px] font-normal text-[#666666]" style={lato}>
                          {UNIDAD[p.unidad]}
                        </small>
                      </span>
                    </div>
                    <span className="text-[13px] text-[#666666]">
                      {p.duracion_min ? `${duracionCorta(p.duracion_min)} de juego` : 'Día completo'}
                      {p.min_jugadores ? ` · grupos de ${p.min_jugadores} a ${p.max_jugadores ?? 60}` : ''}
                    </span>
                    {p.descripcion ? <p className="m-0 text-[14px] text-[#666666]">{p.descripcion}</p> : null}
                    {p.incluye.length > 0 ? (
                      <ul className="m-0 grid list-none gap-1 p-0 text-[14px]">
                        {p.incluye.map((x, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check />
                            <span>{x}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setBaseId(p.id)
                        setError('')
                        document
                          .getElementById('reservar')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      disabled={!cabe(p)}
                      style={jost}
                      className={`mt-1 inline-flex min-h-[36px] items-center self-start px-4 text-[12px] tracking-[0.04em] disabled:opacity-45 ${
                        baseId === p.id
                          ? 'bg-[#111111] text-[#FFFFFF]'
                          : 'border border-solid border-[#111111] text-[#111111]'
                      }`}
                    >
                      {baseId === p.id ? 'Elegido' : 'Elegir este paquete'}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            {/* ── Rentas y extras ── */}
            {extras.length > 0 ? (
              <section className="mt-7 border-t border-solid border-[#EEEEEE] pt-6" aria-labelledby="h-ext">
                <h2 id="h-ext" style={jost} className="mb-3.5 text-[20px]">
                  RENTAS Y EXTRAS
                </h2>
                <div className="grid border border-solid border-[#EEEEEE]">
                  {extras.map((x, i) => (
                    <div
                      key={x.id}
                      className={`flex items-center gap-3 px-3.5 py-3 ${i ? 'border-t border-solid border-[#EEEEEE]' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{x.nombre}</div>
                        {x.descripcion ? <div className="text-[13px] text-[#666666]">{x.descripcion}</div> : null}
                      </div>
                      <span style={jost} className="ml-auto whitespace-nowrap text-[16px]">
                        {formatCentavos(x.precio_centavos, false)}{' '}
                        <small className="text-[12px] font-normal text-[#666666]" style={lato}>
                          {UNIDAD[x.unidad]}
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2.5 text-[13px] text-[#666666]">Los agregas en el panel de reserva.</p>
              </section>
            ) : null}

            {/* ── Horario ── */}
            <section className="mt-7 border-t border-solid border-[#EEEEEE] pt-6" aria-labelledby="h-hor">
              <h2 id="h-hor" style={jost} className="mb-3.5 text-[20px]">
                HORARIO
              </h2>
              <table className="w-full max-w-[420px] border-collapse text-[15px]">
                <tbody>
                  {FIELD_DAY_KEYS.map((k) => (
                    <tr key={k} className="border-b border-solid border-[#EEEEEE]">
                      <td className="py-2">{FIELD_DAY_LABELS[k]}</td>
                      <td className={`py-2 text-right ${horario[k].abierto ? 'font-bold' : 'text-[#999999]'}`}>
                        {horario[k].abierto
                          ? `${horaCorta(horario[k].apertura)} a ${horaCorta(horario[k].cierre)}`
                          : 'Cerrado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ── Cómo llegar ── */}
            {campo.direccion || campo.maps_url ? (
              <section className="mt-7 border-t border-solid border-[#EEEEEE] pt-6" aria-labelledby="h-ubi">
                <h2 id="h-ubi" style={jost} className="mb-3.5 text-[20px]">
                  CÓMO LLEGAR
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
                  <span>{campo.direccion}</span>
                  {campo.maps_url ? (
                    <a
                      href={campo.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#111111] underline"
                    >
                      Abrir en Google Maps
                    </a>
                  ) : null}
                </div>
              </section>
            ) : null}

            {/* ── Cancelación ── */}
            <section className="mt-7 border-t border-solid border-[#EEEEEE] pt-6" aria-labelledby="h-pol">
              <h2 id="h-pol" style={jost} className="mb-3.5 text-[20px]">
                CANCELACIÓN Y REEMBOLSO
              </h2>
              <div className="grid gap-2.5 text-[15px]">
                <p className="m-0">
                  {ficha.arena.politica_cancelacion ||
                    `Cancela hasta ${ficha.arena.cancelacion_horas_limite} horas antes de la apertura y te devolvemos el 100%.`}
                  <small className="block text-[14px] text-[#666666]">
                    Después de ese plazo la reserva ya no se reembolsa.
                  </small>
                </p>
                <p className="m-0">
                  Si el campo cancela, te devolvemos el 100% siempre.
                  <small className="block text-[14px] text-[#666666]">Te avisamos por correo y por la app.</small>
                </p>
                <p className="m-0">
                  Tu reserva trae un QR de entrada.
                  <small className="block text-[14px] text-[#666666]">
                    Una persona del grupo lo muestra y el campo registra cuántos llegaron.
                  </small>
                </p>
              </div>
            </section>

            {/* ── Reseñas ── */}
            <section className="mt-7 border-t border-solid border-[#EEEEEE] pt-6" aria-labelledby="h-res">
              <h2 id="h-res" style={jost} className="mb-3.5 text-[20px]">
                RESEÑAS
              </h2>
              {ficha.resenas.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ficha.resenas.map((r, i) => (
                    <article key={i} className="border border-solid border-[#EEEEEE] p-3.5">
                      <div className="mb-1.5 flex items-center gap-2.5">
                        <span style={jost} className="grid h-8 w-8 place-items-center bg-[#111111] text-[#FFFFFF]">
                          {r.alias.slice(0, 1)}
                        </span>
                        <div>
                          <b>{r.alias}</b>
                          <br />
                          <small className="text-[#666666]">
                            {'★'.repeat(r.rating)} ·{' '}
                            {new Intl.DateTimeFormat('es-MX', {
                              month: 'short',
                              year: 'numeric',
                              timeZone: 'UTC',
                            }).format(new Date(r.fecha))}
                          </small>
                        </div>
                      </div>
                      {r.comentario ? <p className="m-0 text-[15px]">{r.comentario}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-[#666666]">
                  Todavía no hay reseñas. Las publican los jugadores después de jugar.
                </p>
              )}
            </section>

            <p className="mt-7 text-[13px] text-[#666666]">
              <Link href={`/campos/${campo.slug}`} className="underline">
                Ver la ficha de {campo.nombre} en el directorio
              </Link>
            </p>
          </div>

          {/* En móvil el panel va después del contenido, con la barra fija abajo. */}
          <div className="pb-24 lg:pb-0">{panel}</div>
        </div>
      </div>

      {/* Barra fija en móvil: arriba del BottomNav cuando hay sesión. */}
      <div
        className="fixed inset-x-0 z-30 flex items-center justify-between gap-3 border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2.5 lg:hidden"
        style={{ bottom }}
      >
        <span className="text-[12px] text-[#666666]">
          {baseId ? 'Total' : 'Desde'}
          <span style={jost} className="block text-[20px] text-[#111111]">
            {formatCentavos(baseId ? total : desde?.precio_centavos ?? 0, false)}
          </span>
          <span className="text-[12px]">
            {baseId ? `${jugadores} ${jugadores === 1 ? 'jugador' : 'jugadores'}` : UNIDAD[desde?.unidad ?? 'por_persona']}
          </span>
        </span>
        <button
          type="button"
          onClick={() =>
            document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          style={jost}
          className="min-h-[44px] bg-[#CC4B37] px-4 text-[13px] tracking-[0.04em] text-[#FFFFFF]"
        >
          {baseId && fecha ? 'Revisar y reservar' : 'Elegir día y paquete'}
        </button>
      </div>
    </div>
  )
}
