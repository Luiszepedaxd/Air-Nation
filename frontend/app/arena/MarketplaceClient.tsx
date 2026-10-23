'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ARENA_DISCIPLINAS,
  ARENA_TERRENOS,
  arenaGet,
  type ArenaCampoCard,
  type ArenaLandingMedia,
  type ArenaMarketplace,
} from '@/lib/arena-api'
import {
  filtrosActivos,
  filtrosAQuery,
  urlDeFiltros,
  type ArenaFiltroKey,
  type ArenaFiltrosValor,
} from '@/lib/arena-marketplace'
import { formatCentavos } from '@/components/arena/MoneyText'
import {
  conMayuscula,
  diaNumero,
  dowCorto,
  fechaMedia,
  hoyMexico,
  mesCorto,
  sumaDias,
} from '@/components/arena/fechas'
import { cfImageDeliveryUrl } from '@/lib/media-url'
import { ArenaFiltros } from './ArenaFiltros'

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

/** Degradado por terreno para los campos que todavía no suben foto. */
const FONDO: Record<string, string> = {
  bosque: 'linear-gradient(160deg,#2c3a26 0%,#1b2418 60%,#121a10 100%)',
  cqb: 'linear-gradient(160deg,#4a4d51 0%,#2c2e31 60%,#1c1d1f 100%)',
  urbano: 'linear-gradient(160deg,#3b414a 0%,#23272d 60%,#16181c 100%)',
  mixto: 'linear-gradient(160deg,#4b4433 0%,#2d281d 60%,#1c1912 100%)',
  desierto: 'linear-gradient(160deg,#7a5c40 0%,#4a3826 60%,#2c2117 100%)',
}

function Estrella() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      <path
        d="M10 2.5l2.35 4.76 5.26.77-3.8 3.7.9 5.24L10 14.9l-4.71 2.48.9-5.24-3.8-3.7 5.26-.77L10 2.5z"
        fill="#CC4B37"
      />
    </svg>
  )
}

function Pin() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

/** Curvas de nivel del hero: textura decorativa, no una foto. */
function Topo() {
  const paths: string[] = []
  let seed = 7 * 9301 + 49297
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const cx = 1200 * (0.3 + rnd() * 0.4)
  const cy = 420 * (0.35 + rnd() * 0.3)
  for (let k = 1; k <= 12; k += 1) {
    const r = k * (1200 / (12 * 1.3))
    let d = ''
    for (let a = 0; a <= 24; a += 1) {
      const t = (a / 24) * Math.PI * 2
      const wob = 1 + 0.16 * Math.sin(t * 3 + k) + 0.08 * Math.cos(t * 5 - k)
      const x = cx + Math.cos(t) * r * wob * 1.25
      const y = cy + Math.sin(t) * r * wob * 0.85
      d += `${a ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    }
    paths.push(`${d}Z`)
  }
  return (
    <svg
      viewBox="0 0 1200 420"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-[0.16]"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeOpacity={0.5 - i * 0.03} strokeWidth="1" />
      ))}
    </svg>
  )
}

function rating(valor: number | string | null): number {
  const n = typeof valor === 'string' ? Number.parseFloat(valor) : valor
  return Number.isFinite(n as number) ? (n as number) : 0
}

/** Tarjeta del marketplace: lo distintivo es la tira de próximos días. */
function CampoCardArena({
  campo,
  fecha,
  reservasHabilitadas,
}: {
  campo: ArenaCampoCard
  fecha: string
  reservasHabilitadas: boolean
}) {
  const dias = campo.proximos_dias ?? []
  const foto = campo.foto_portada_url
    ? cfImageDeliveryUrl(campo.foto_portada_url, { width: 600, quality: 75, fit: 'cover' })
    : ''

  return (
    <Link
      href={`/arena/${campo.slug}${fecha ? `?fecha=${fecha}` : ''}`}
      aria-label={`${campo.nombre}, ${campo.ciudad ?? ''}. Ver y reservar`}
      className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF] no-underline hover:border-[#CCCCCC]"
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: FONDO[campo.terrenos?.[0] ?? 'mixto'] ?? FONDO.mixto }}
      >
        {foto ? (
          <img src={foto} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute left-[10px] top-[10px] flex flex-wrap gap-1">
          {(campo.disciplinas ?? []).map((d) => (
            <span
              key={d}
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }}
              className="bg-[#111111]/80 px-2 py-[3px] text-[12px] capitalize text-[#FFFFFF]"
            >
              {d}
            </span>
          ))}
        </div>
        {campo.destacado ? (
          <span className="absolute right-[10px] top-[10px] bg-[#CC4B37] px-2 py-[3px] text-[12px] font-bold text-[#FFFFFF]">
            Destacado
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-[10px] p-[14px] pb-4" style={lato}>
        <div className="flex items-start justify-between gap-[10px]">
          <h3 style={jost} className="text-[18px] leading-tight text-[#111111]">
            {campo.nombre}
          </h3>
          {campo.resenas_count > 0 ? (
            <span className="flex items-center gap-1 whitespace-nowrap text-[14px] font-bold text-[#111111]">
              <Estrella />
              {rating(campo.promedio_rating).toFixed(1)}{' '}
              <small className="font-normal text-[#666666]">({campo.resenas_count})</small>
            </span>
          ) : null}
        </div>

        <span className="flex items-center gap-1.5 text-[14px] text-[#666666]">
          <Pin />
          {campo.ciudad}
          {campo.estado ? `, ${campo.estado}` : ''}
        </span>

        <div className="flex flex-wrap gap-1.5">
          {(campo.terrenos ?? []).map((t) => (
            <span key={t} className="border border-solid border-[#EEEEEE] px-2 py-[2px] text-[12px] text-[#666666]">
              {TERRENO_LABEL.get(t) ?? t}
            </span>
          ))}
          {campo.edad_minima != null ? (
            <span className="border border-solid border-[#EEEEEE] px-2 py-[2px] text-[12px] text-[#666666]">
              Desde {campo.edad_minima} años
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-6 gap-1" aria-label="Próximos días con reserva">
          {Array.from({ length: 6 }, (_, i) => dias[i]).map((d, i) =>
            d ? (
              <span
                key={d}
                className={`border border-solid px-0 py-1 text-center text-[11px] leading-tight ${
                  fecha === d
                    ? 'border-[#CC4B37] bg-[#CC4B37] text-[#FFFFFF]'
                    : 'border-[#EEEEEE] text-[#666666]'
                }`}
              >
                {dowCorto(d)}
                <b
                  className={`block text-[15px] ${fecha === d ? 'text-[#FFFFFF]' : 'text-[#111111]'}`}
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  {diaNumero(d)}
                </b>
              </span>
            ) : (
              <span key={`v-${i}`} aria-hidden="true" className="border border-dashed border-[#EEEEEE] px-0 py-1 text-[11px] leading-tight">
                &nbsp;<b className="block text-[15px]">&nbsp;</b>
              </span>
            )
          )}
        </div>
        <p className="-mt-1 text-[12px] text-[#999999]">
          {dias.length
            ? 'Próximos días con reserva'
            : 'Sin días disponibles en las próximas 3 semanas'}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-solid border-[#EEEEEE] pt-3">
          <span className="text-[12px] text-[#666666]">
            Desde
            <span style={jost} className="block text-[22px] leading-tight text-[#111111]">
              {formatCentavos(campo.desde_centavos, false)}
            </span>
            <span className="text-[13px] text-[#666666]">{UNIDAD[campo.desde_unidad]}</span>
          </span>
          <span
            style={jost}
            className={`inline-flex min-h-[40px] items-center px-[14px] text-[13px] tracking-[0.04em] ${
              reservasHabilitadas ? 'bg-[#CC4B37] text-[#FFFFFF]' : 'border border-solid border-[#EEEEEE] text-[#666666]'
            }`}
          >
            {reservasHabilitadas ? 'RESERVAR' : 'PRÓXIMAMENTE'}
          </span>
        </div>
      </div>
    </Link>
  )
}

const JUGADORES = [1, 2, 4, 6, 8, 10, 12, 15, 20, 30]

/**
 * Landing del marketplace. Los filtros viven en la URL (se pueden compartir) y
 * después del SSR el catálogo se vuelve a pedir a `GET /arena/marketplace`.
 */
export function MarketplaceClient({
  inicial,
  filtrosIniciales,
  hero,
  banners,
}: {
  inicial: ArenaMarketplace
  filtrosIniciales: ArenaFiltrosValor
  hero: ArenaLandingMedia | null
  banners: ArenaLandingMedia[]
}) {
  const [filtros, setFiltros] = useState<ArenaFiltrosValor>(filtrosIniciales)
  const [data, setData] = useState<ArenaMarketplace>(inicial)
  const [cargando, setCargando] = useState(false)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const primerRender = useRef(true)

  const qs = filtrosAQuery(filtros)

  // El SSR ya trajo la primera página; de ahí en adelante pide el cliente.
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
    let vivo = true
    setCargando(true)
    arenaGet<ArenaMarketplace>(`/marketplace${qs ? `?${qs}` : ''}`)
      .then((r) => vivo && setData(r))
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [qs])

  /** Los filtros se mirroran en la URL sin recargar la página. */
  const aplicar = (siguiente: ArenaFiltrosValor) => {
    setFiltros(siguiente)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', urlDeFiltros(siguiente))
    }
  }

  const cambiar = (key: ArenaFiltroKey, valor: string) => {
    const siguiente = { ...filtros }
    if (valor) siguiente[key] = valor
    else delete siguiente[key]
    aplicar(siguiente)
  }

  const limpiar = () => aplicar(filtros.orden ? { orden: filtros.orden } : {})

  const hoy = data.hoy || inicial.hoy || hoyMexico()
  const dias = Array.from({ length: 14 }, (_, i) => sumaDias(hoy, i))
  const fecha = filtros.fecha ?? ''
  const activos = filtrosActivos(filtros)
  const estados = data.filtros?.estados?.length ? data.filtros.estados : inicial.filtros.estados

  const chips: { key: ArenaFiltroKey; label: string }[] = activos.map((k) => {
    const v = filtros[k] as string
    const label =
      k === 'fecha'
        ? conMayuscula(fechaMedia(v))
        : k === 'jugadores'
          ? `${v} jugadores`
          : k === 'precio_max'
            ? `Hasta ${formatCentavos(Number(v), false)}`
            : k === 'con_renta'
              ? 'Rentan equipo'
              : k === 'rating_min'
                ? '4.5 o más'
                : k === 'terreno'
                  ? TERRENO_LABEL.get(v as never) ?? v
                  : conMayuscula(v)
    return { key: k, label }
  })

  return (
    <div className="min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      {/* ── ArenaHero ── */}
      <section className="relative overflow-hidden bg-[#111111] text-[#FFFFFF]">
        {hero?.url ? (
          <img
            src={cfImageDeliveryUrl(hero.url, { width: 1600, quality: 70, fit: 'cover' })}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        ) : null}
        <Topo />
        <div className="relative mx-auto max-w-[1200px] px-4 pb-7 pt-10 md:px-6">
          <h1 style={jost} className="max-w-[14ch] text-[30px] leading-[1.1] md:text-[44px] lg:text-[52px]">
            {hero?.titulo || 'Reserva tu próximo partido'}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[16px] text-[#BDBDBD]" style={lato}>
            {hero?.subtitulo ||
              'Campos de airsoft, gotcha y gelsoft con reserva en línea. Eliges día, pagas y te llega tu QR de entrada.'}
          </p>

          <form
            role="search"
            aria-label="Buscar campos"
            onSubmit={(e) => {
              e.preventDefault()
              document.getElementById('resultados')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="mt-6 grid grid-cols-1 gap-px border border-solid border-[#2a2a2a] bg-[#2a2a2a] md:grid-cols-[1.3fr_1fr_1fr_auto]"
            style={lato}
          >
            <div className="flex min-h-[60px] flex-col justify-center bg-[#FFFFFF] px-[14px] py-2 text-[#111111]">
              <label htmlFor="s-estado" className="text-[12px] font-bold text-[#666666]">
                Dónde
              </label>
              <select
                id="s-estado"
                className="w-full bg-transparent py-0.5 text-[15px] font-bold outline-offset-4"
                value={filtros.estado ?? ''}
                onChange={(e) => cambiar('estado', e.target.value)}
              >
                <option value="">Todo México</option>
                {estados.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-h-[60px] flex-col justify-center bg-[#FFFFFF] px-[14px] py-2 text-[#111111]">
              <label htmlFor="s-jug" className="text-[12px] font-bold text-[#666666]">
                Jugadores
              </label>
              <select
                id="s-jug"
                className="w-full bg-transparent py-0.5 text-[15px] font-bold outline-offset-4"
                value={filtros.jugadores ?? ''}
                onChange={(e) => cambiar('jugadores', e.target.value)}
              >
                <option value="">Cualquier grupo</option>
                {JUGADORES.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} {n === 1 ? 'jugador' : 'jugadores'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-h-[60px] flex-col justify-center bg-[#FFFFFF] px-[14px] py-2 text-[#111111]">
              <label htmlFor="s-disc" className="text-[12px] font-bold text-[#666666]">
                Disciplina
              </label>
              <select
                id="s-disc"
                className="w-full bg-transparent py-0.5 text-[15px] font-bold capitalize outline-offset-4"
                value={filtros.disciplina ?? ''}
                onChange={(e) => cambiar('disciplina', e.target.value)}
              >
                <option value="">Todas</option>
                {ARENA_DISCIPLINAS.map((d) => (
                  <option key={d} value={d} className="capitalize">
                    {conMayuscula(d)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              style={jost}
              className="min-h-[56px] bg-[#CC4B37] px-7 text-[14px] tracking-[0.04em] text-[#FFFFFF] hover:bg-[#A93A28] md:min-h-[60px]"
            >
              Buscar campos
            </button>
          </form>

          <p id="tira-fechas" className="mb-2.5 mt-[22px] text-[14px] text-[#BDBDBD]" style={lato}>
            ¿Qué día quieres jugar?
          </p>
          <div role="group" aria-labelledby="tira-fechas" className="flex gap-1.5 overflow-x-auto pb-1.5">
            <button
              type="button"
              aria-pressed={!fecha}
              onClick={() => cambiar('fecha', '')}
              style={jost}
              className={`min-h-[64px] shrink-0 border border-solid px-[14px] text-[14px] ${
                !fecha ? 'border-[#CC4B37] bg-[#CC4B37]' : 'border-[#3a3a3a] hover:border-[#FFFFFF]'
              }`}
            >
              Cualquier día
            </button>
            {dias.map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={fecha === d}
                onClick={() => cambiar('fecha', fecha === d ? '' : d)}
                className={`flex min-h-[64px] w-[60px] shrink-0 flex-col items-center justify-center border border-solid py-1.5 ${
                  fecha === d ? 'border-[#CC4B37] bg-[#CC4B37]' : 'border-[#3a3a3a] hover:border-[#FFFFFF]'
                }`}
              >
                <span className={`text-[12px] capitalize ${fecha === d ? 'text-[#FFFFFF]' : 'text-[#BDBDBD]'}`}>
                  {i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : dowCorto(d)}
                </span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 800 }} className="text-[22px] leading-[1.1]">
                  {diaNumero(d)}
                </span>
                <span className={`text-[11px] ${fecha === d ? 'text-[#FFFFFF]' : 'text-[#8a8a8a]'}`}>
                  {mesCorto(d)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Resultados ── */}
      <section id="resultados" className="scroll-mt-[60px] py-7 pb-14">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-7 px-4 md:px-6 lg:grid-cols-[260px_1fr]">
          <ArenaFiltros
            filtros={filtros}
            activos={activos.length}
            resultados={data.total}
            abierto={hojaAbierta}
            onChange={cambiar}
            onClear={limpiar}
            onClose={() => setHojaAbierta(false)}
          />

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3" style={lato}>
              <h2 style={jost} className="mr-auto text-[20px] text-[#111111]">
                {data.total} {data.total === 1 ? 'CAMPO' : 'CAMPOS'}{' '}
                {filtros.estado ? `EN ${filtros.estado}` : 'EN MÉXICO'}
                <small className="mt-1 block text-[14px] font-normal normal-case tracking-normal text-[#666666]" style={lato}>
                  Con reserva y pago en línea
                  {fecha ? ` · abren el ${fechaMedia(fecha)}` : ''}
                </small>
              </h2>
              <button
                type="button"
                onClick={() => setHojaAbierta(true)}
                style={jost}
                className="inline-flex min-h-[44px] items-center gap-2 border border-solid border-[#111111] px-4 text-[13px] tracking-[0.04em] lg:hidden"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" />
                </svg>
                {activos.length ? `FILTROS (${activos.length})` : 'FILTROS'}
              </button>
              <label className="flex items-center gap-2 text-[14px] text-[#666666]">
                <span>Ordenar</span>
                <select
                  aria-label="Ordenar resultados"
                  className="h-10 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2.5 font-bold text-[#111111]"
                  value={filtros.orden ?? 'recomendados'}
                  onChange={(e) => cambiar('orden', e.target.value === 'recomendados' ? '' : e.target.value)}
                >
                  <option value="recomendados">Recomendados</option>
                  <option value="precio_asc">Precio más bajo</option>
                  <option value="precio_desc">Precio más alto</option>
                  <option value="rating">Mejor calificados</option>
                </select>
              </label>
            </div>

            {chips.length > 0 ? (
              <div className="mb-[18px] flex flex-wrap gap-2" style={lato}>
                {chips.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex h-8 items-center gap-1.5 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-2.5 text-[13px] font-bold"
                  >
                    {c.label}
                    <button
                      type="button"
                      onClick={() => cambiar(c.key, '')}
                      aria-label={`Quitar filtro ${c.label}`}
                      className="grid place-items-center text-[#666666] hover:text-[#111111]"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            ) : null}

            {banners.length > 0 ? (
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {banners.map((m) => {
                  const contenido = (
                    <article className="flex gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF]">
                      <img src={m.url} alt="" className="h-24 w-32 shrink-0 object-cover" />
                      <div className="min-w-0 py-3 pr-3" style={lato}>
                        {m.titulo ? (
                          <p style={jost} className="text-[13px] text-[#111111]">
                            {m.titulo}
                          </p>
                        ) : null}
                        {m.subtitulo ? <p className="mt-1 text-[12px] text-[#666666]">{m.subtitulo}</p> : null}
                        {m.cta_label ? (
                          <p style={jost} className="mt-2 text-[11px] text-[#CC4B37]">
                            {m.cta_label} →
                          </p>
                        ) : null}
                      </div>
                    </article>
                  )
                  return m.cta_href ? (
                    <Link key={m.id} href={m.cta_href}>
                      {contenido}
                    </Link>
                  ) : (
                    <div key={m.id}>{contenido}</div>
                  )
                })}
              </div>
            ) : null}

            <div
              className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 ${cargando ? 'opacity-60' : ''}`}
              aria-busy={cargando}
            >
              {data.campos.length > 0 ? (
                data.campos.map((c) => (
                  <CampoCardArena
                    key={c.field_id}
                    campo={c}
                    fecha={fecha}
                    reservasHabilitadas={data.reservas_habilitadas}
                  />
                ))
              ) : (
                <div
                  className="col-span-full border border-dashed border-[#CCCCCC] px-5 py-10 text-center"
                  style={lato}
                >
                  <h3 style={jost} className="text-[20px] text-[#111111]">
                    NINGÚN CAMPO COINCIDE
                  </h3>
                  <p className="mx-auto mb-[18px] mt-2 max-w-[42ch] text-[#666666]">
                    {fecha
                      ? 'Ningún campo con estos filtros abre ese día. Prueba otra fecha o quita algún filtro.'
                      : 'Quita algún filtro para ver más campos.'}
                  </p>
                  <button
                    type="button"
                    onClick={limpiar}
                    style={jost}
                    className="inline-flex min-h-[44px] items-center border border-solid border-[#111111] px-[18px] text-[14px] tracking-[0.04em]"
                  >
                    Quitar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── ComoFunciona ── */}
      <section className="border-y border-solid border-[#EEEEEE] bg-[#F4F4F4] py-10" style={lato}>
        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <h2 style={jost} className="mb-5 text-[24px] text-[#111111]">
            CÓMO FUNCIONA
          </h2>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              ['Elige campo y día', 'Ves los días en que abre cada campo y lo que cuesta antes de entrar.'],
              [
                'Paga en línea',
                'Puedes juntar varios campos o días en un solo carrito y pagar una vez. La reserva se confirma al instante.',
              ],
              ['Muestra tu QR', 'Te llega por correo. El campo lo escanea en la entrada y listo.'],
            ].map(([titulo, texto], i) => (
              <li key={titulo} className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-[18px]">
                <span
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 900 }}
                  className="mb-2.5 block text-[34px] leading-none text-[#CC4B37]"
                >
                  {i + 1}
                </span>
                <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700 }} className="mb-1.5 text-[17px]">
                  {titulo}
                </h3>
                <p className="text-[15px] text-[#666666]">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
