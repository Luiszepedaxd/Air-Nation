import type { SupabaseClient } from '@supabase/supabase-js'
import { LUGAR_BANDO, STATS_LABELS } from './ranking-contenido'

export type RankingTemporada = {
  id: string
  slug: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  gratuita: boolean
  precio_por_jugador: number
  precio_estandar: number
  max_resultados: number
  max_recreativos: number
}

export type RankingFila = {
  posicion: number
  temporada_id: string
  jugador_id: string
  user_id: string | null
  nombre_publico: string
  ciudad: string | null
  puntos: number
  eventos_contados: number
  eventos_jugados: number
  primeros_lugares: number
  ultimo_evento: string | null
}

export type RankingEventoResumen = {
  id: string
  slug: string
  nombre: string
  fecha: string
  ciudad: string
  organizador_nombre: string
  disciplina: string
  nivel: number
  modalidad: string
  total_jugadores: number
  bolsa: number
  es_fundador: boolean
  metodo_captura: 'airnation' | 'externo'
}

export type RankingBonoDeclarado = {
  id: string
  nombre: string
  descripcion: string | null
  porcentaje: number
}

export type RankingResultadoBono = {
  nombre: string
  porcentaje: number
  veces: number
}

export type RankingResultadoEvento = {
  id: string
  jugador_id: string
  user_id: string | null
  nombre_publico: string
  ciudad: string | null
  equipo_nombre: string | null
  posicion: number | null
  resultado_faccion: string | null
  participacion: boolean
  puntos_posicion: number
  puntos_bono: number
  puntos_total: number
  stats_organizador: Record<string, unknown>
  bonos: RankingResultadoBono[]
}

export type RankingEventoDetalle = RankingEventoResumen & {
  criterio_posicion: string
  notas: string | null
  bonos: RankingBonoDeclarado[]
  resultados: RankingResultadoEvento[]
}

export type RankingHistorialJugador = {
  jugador_id: string
  nombre_publico: string
  temporada_nombre: string | null
  posicion_actual: number | null
  puntos_actuales: number
  resultados: {
    evento_slug: string
    evento_nombre: string
    fecha: string
    nivel: number
    total_jugadores: number
    bolsa: number
    posicion: number | null
    resultado_faccion: string | null
    participacion: boolean
    puntos_posicion: number
    puntos_bono: number
    puntos_total: number
    bonos: RankingResultadoBono[]
  }[]
}

export const NIVELES_RANKING = [
  {
    nivel: 1,
    nombre: 'Dominguera',
    descripcion: 'Partidas abiertas y recreativas de un día.',
    puntos: 25,
  },
  {
    nivel: 2,
    nombre: 'Torneo',
    descripcion: 'Torneos de un día con lugares definidos.',
    puntos: 100,
  },
  {
    nivel: 3,
    nombre: 'Milsim o evento grande',
    descripcion: 'Milsim de 2 a 3 días o torneos regionales.',
    puntos: 150,
  },
  {
    nivel: 4,
    nombre: 'Circuito nacional',
    descripcion: 'Fechas de un circuito o liga nacional.',
    puntos: 200,
  },
  {
    nivel: 5,
    nombre: 'Final nacional',
    descripcion: 'La final de un circuito o un campeonato nacional.',
    puntos: 300,
  },
] as const

export const FACTORES_TAMANO = [
  {
    rango: '6 – 15',
    min: 6,
    max: 15,
    factor: 0.5,
    etiqueta: 'Evento chico',
    porcentaje: 50,
  },
  {
    rango: '16 – 39',
    min: 16,
    max: 39,
    factor: 0.75,
    etiqueta: 'Evento mediano',
    porcentaje: 75,
  },
  {
    rango: '40 – 99',
    min: 40,
    max: 99,
    factor: 1,
    etiqueta: 'Evento normal',
    porcentaje: 100,
  },
  {
    rango: '100 – 199',
    min: 100,
    max: 199,
    factor: 1.25,
    etiqueta: 'Evento grande',
    porcentaje: 125,
  },
  {
    rango: '200 o más',
    min: 200,
    max: Infinity,
    factor: 1.5,
    etiqueta: 'Evento masivo',
    porcentaje: 150,
  },
] as const

export const PORCENTAJES_POSICION = [
  { posicion: '1º', porcentaje: 100 }, { posicion: '2º', porcentaje: 80 },
  { posicion: '3º', porcentaje: 65 }, { posicion: '4º', porcentaje: 55 },
  { posicion: '5º', porcentaje: 50 }, { posicion: '6º', porcentaje: 45 },
  { posicion: '7º – 8º', porcentaje: 40 }, { posicion: '9º – 16º', porcentaje: 30 },
  { posicion: '17º – 32º', porcentaje: 20 }, { posicion: '33º en adelante', porcentaje: 10 },
] as const

export const PORCENTAJES_FACCION = [
  { resultado: 'Facción ganadora', porcentaje: 30 },
  { resultado: 'Segunda facción', porcentaje: 15 },
  { resultado: 'Tercera facción en adelante', porcentaje: 10 },
] as const

export const DISCIPLINA_LABELS: Record<string, string> = {
  speedsoft: 'Speedsoft',
  tactical_arena: 'Tactical Arena',
  combinada: 'Speedsoft + Tactical Arena',
  milsim: 'Milsim',
  dominguera: 'Dominguera',
  cqb: 'CQB',
  torneo: 'Torneo',
  otro: 'Otro',
}

export const MODALIDAD_LABELS: Record<string, string> = {
  individual: 'Individual',
  equipos: 'Por equipos',
  facciones: 'Por bandos',
}

export const PRECIO_TARIFA_AIRNATION = 9
export const PRECIO_TARIFA_ESTANDAR = 29
export const DIAS_PAGO_TARIFA_AIRNATION = 7
export const FECHA_FIN_GRATIS_TEXTO = '28 de febrero de 2027'
export const TOPE_BONO_PORCENTAJE = 30

export function factorPorJugadores(n: number): number {
  if (n < 6) return 0
  const match = FACTORES_TAMANO.find((r) => n >= r.min && n <= r.max)
  return match?.factor ?? 0
}

export function tamanoInfo(n: number): (typeof FACTORES_TAMANO)[number] | null {
  if (n < 6) return null
  return FACTORES_TAMANO.find((r) => n >= r.min && n <= r.max) ?? null
}

export function nivelInfo(nivel: number) {
  return NIVELES_RANKING.find((n) => n.nivel === nivel) ?? NIVELES_RANKING[0]
}

export function lugarTexto(
  posicion: number | null,
  resultadoFaccion: string | null
): string {
  if (resultadoFaccion) {
    const key = resultadoFaccion.toLowerCase().replace(/\s+/g, '_')
    if (LUGAR_BANDO[key]) return LUGAR_BANDO[key]
    if (key === 'ganador' || key === 'primera' || key === 'ganadora') {
      return LUGAR_BANDO.ganadora
    }
    if (
      key === 'tercera' ||
      key === 'tercera_mas' ||
      key === 'tercera_en_adelante' ||
      key === 'tercera_o_mas' ||
      key === 'resto'
    ) {
      return LUGAR_BANDO.tercera_o_mas
    }
    if (key === 'segunda') return LUGAR_BANDO.segunda
    const s = key.replace(/_/g, ' ')
    if (!s) return '—'
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  if (posicion != null) return `${posicion}º lugar`
  return '—'
}

export function puntosDeBono(bolsa: number, porcentaje: number): number {
  return Math.round((bolsa * porcentaje) / 100)
}

export function hrefJugador(userId: string | null): string | null {
  return userId ? `/u/${userId}` : null
}

export function formatFechaRanking(fecha: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha)
  const date = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(fecha)
  if (Number.isNaN(date.getTime())) return fecha
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function humanizarStat(key: string): string {
  if (STATS_LABELS[key]) return STATS_LABELS[key]
  const s = key.replace(/_/g, ' ')
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') return null
  return o as Record<string, unknown>
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function bool(v: unknown): boolean {
  return v === true || v === 'true'
}

function mapTemporada(row: Record<string, unknown>): RankingTemporada {
  return {
    id: str(row.id),
    slug: str(row.slug),
    nombre: str(row.nombre),
    fecha_inicio: str(row.fecha_inicio),
    fecha_fin: str(row.fecha_fin),
    gratuita: bool(row.gratuita),
    precio_por_jugador: num(row.precio_por_jugador),
    precio_estandar: num(row.precio_estandar, PRECIO_TARIFA_ESTANDAR),
    max_resultados: num(row.max_resultados),
    max_recreativos: num(row.max_recreativos),
  }
}

function mapFila(row: Record<string, unknown>): RankingFila {
  return {
    posicion: num(row.posicion),
    temporada_id: str(row.temporada_id),
    jugador_id: str(row.jugador_id),
    user_id: strOrNull(row.user_id),
    nombre_publico: str(row.nombre_publico),
    ciudad: strOrNull(row.ciudad),
    puntos: num(row.puntos),
    eventos_contados: num(row.eventos_contados),
    eventos_jugados: num(row.eventos_jugados),
    primeros_lugares: num(row.primeros_lugares),
    ultimo_evento: strOrNull(row.ultimo_evento),
  }
}

function mapEventoResumen(row: Record<string, unknown>): RankingEventoResumen {
  return {
    id: str(row.id),
    slug: str(row.slug),
    nombre: str(row.nombre),
    fecha: str(row.fecha),
    ciudad: str(row.ciudad),
    organizador_nombre: str(row.organizador_nombre),
    disciplina: str(row.disciplina),
    nivel: num(row.nivel),
    modalidad: str(row.modalidad),
    total_jugadores: num(row.total_jugadores),
    bolsa: num(row.bolsa),
    es_fundador: bool(row.es_fundador),
    metodo_captura: row.metodo_captura === 'airnation' ? 'airnation' : 'externo',
  }
}

const RANKING_EVENTO_RESUMEN_SELECT =
  'id, slug, nombre, fecha, ciudad, organizador_nombre, disciplina, nivel, modalidad, total_jugadores, bolsa, es_fundador, metodo_captura'

const RANKING_EVENTO_DETALLE_SELECT =
  `${RANKING_EVENTO_RESUMEN_SELECT}, criterio_posicion, notas`

function mapBonosResultado(raw: unknown): RankingResultadoBono[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      const row = asRecord(item)
      if (!row) return null
      const bono = asRecord(row.ranking_evento_bonos)
      const nombre = str(bono?.nombre)
      if (!nombre) return null
      return {
        nombre,
        porcentaje: num(bono?.porcentaje),
        veces: num(row.veces),
      }
    })
    .filter((b): b is RankingResultadoBono => b != null)
}

function mapStats(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Record<string, unknown>
}

function mapResultado(row: Record<string, unknown>): RankingResultadoEvento {
  const jugador = asRecord(row.ranking_jugadores)
  return {
    id: str(row.id),
    jugador_id: str(row.jugador_id || jugador?.id),
    user_id: strOrNull(row.user_id ?? jugador?.user_id),
    nombre_publico: str(row.nombre_publico ?? jugador?.nombre_publico),
    ciudad: strOrNull(row.ciudad ?? jugador?.ciudad),
    equipo_nombre: strOrNull(row.equipo_nombre),
    posicion: numOrNull(row.posicion),
    resultado_faccion: strOrNull(row.resultado_faccion),
    participacion:
      row.participacion === 'parcial'
        ? false
        : row.participacion == null
          ? true
          : bool(row.participacion),
    puntos_posicion: num(row.puntos_posicion),
    puntos_bono: num(row.puntos_bono),
    puntos_total: num(row.puntos_total),
    stats_organizador: mapStats(row.stats_organizador),
    bonos: mapBonosResultado(row.ranking_resultado_bonos),
  }
}

export async function fetchTemporadaActiva(
  sb: SupabaseClient
): Promise<RankingTemporada | null> {
  const { data, error } = await sb
    .from('ranking_temporadas')
    .select('*')
    .eq('activa', true)
    .maybeSingle()

  if (error) {
    console.error('[ranking] fetchTemporadaActiva:', error.message)
    return null
  }
  if (!data) return null
  return mapTemporada(data as Record<string, unknown>)
}

export async function fetchTablaRanking(
  sb: SupabaseClient,
  temporadaId: string,
  limit?: number
): Promise<RankingFila[]> {
  let q = sb
    .from('ranking_tabla')
    .select('*')
    .eq('temporada_id', temporadaId)
    .order('posicion', { ascending: true })

  if (limit != null) q = q.limit(limit)

  const { data, error } = await q

  if (error) {
    console.error('[ranking] fetchTablaRanking:', error.message)
    return []
  }

  return (data ?? []).map((row) => mapFila(row as Record<string, unknown>))
}

export async function fetchEventosTemporada(
  sb: SupabaseClient,
  temporadaId: string
): Promise<RankingEventoResumen[]> {
  const { data, error } = await sb
    .from('ranking_eventos')
    .select(RANKING_EVENTO_RESUMEN_SELECT)
    .eq('temporada_id', temporadaId)
    .eq('estado', 'publicado')
    .order('fecha', { ascending: false })

  if (error) {
    console.error('[ranking] fetchEventosTemporada:', error.message)
    return []
  }

  return (data ?? []).map((row) => mapEventoResumen(row as Record<string, unknown>))
}

export async function fetchEventoRanking(
  sb: SupabaseClient,
  slug: string
): Promise<RankingEventoDetalle | null> {
  const { data: evento, error } = await sb
    .from('ranking_eventos')
    .select(RANKING_EVENTO_DETALLE_SELECT)
    .eq('slug', slug)
    .eq('estado', 'publicado')
    .maybeSingle()

  if (error) {
    console.error('[ranking] fetchEventoRanking:', error.message)
    return null
  }
  if (!evento) return null

  const row = evento as Record<string, unknown>
  const eventoId = str(row.id)

  const { data: bonosData, error: bonosErr } = await sb
    .from('ranking_evento_bonos')
    .select('id, nombre, descripcion, porcentaje')
    .eq('evento_id', eventoId)

  if (bonosErr) {
    console.error('[ranking] fetchEventoRanking bonos:', bonosErr.message)
  }

  const { data: resData, error: resErr } = await sb
    .from('ranking_resultados')
    .select(
      `
      id,
      jugador_id,
      equipo_nombre,
      posicion,
      resultado_faccion,
      participacion,
      puntos_posicion,
      puntos_bono,
      puntos_total,
      stats_organizador,
      ranking_jugadores ( id, user_id, nombre_publico, ciudad ),
      ranking_resultado_bonos ( veces, ranking_evento_bonos ( nombre, porcentaje ) )
    `
    )
    .eq('evento_id', eventoId)
    .order('puntos_total', { ascending: false })
    .order('posicion', { ascending: true })

  if (resErr) {
    console.error('[ranking] fetchEventoRanking resultados:', resErr.message)
  }

  const resultados = (resData ?? [])
    .map((r) => mapResultado(r as Record<string, unknown>))
    .sort((a, b) => {
      if (b.puntos_total !== a.puntos_total) return b.puntos_total - a.puntos_total
      return (a.posicion ?? Number.POSITIVE_INFINITY) - (b.posicion ?? Number.POSITIVE_INFINITY)
    })

  const bonos: RankingBonoDeclarado[] = (bonosData ?? []).map((b) => {
    const br = b as Record<string, unknown>
    return {
      id: str(br.id),
      nombre: str(br.nombre),
      descripcion: strOrNull(br.descripcion),
      porcentaje: num(br.porcentaje),
    }
  })

  return {
    ...mapEventoResumen(row),
    criterio_posicion: str(row.criterio_posicion),
    notas: strOrNull(row.notas),
    bonos,
    resultados,
  }
}

export async function fetchHistorialJugador(
  sb: SupabaseClient,
  userId: string
): Promise<RankingHistorialJugador | null> {
  const { data: jugador, error } = await sb
    .from('ranking_jugadores')
    .select('id, user_id, nombre_publico')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[ranking] fetchHistorialJugador:', error.message)
    return null
  }
  if (!jugador) return null

  const jugadorRow = jugador as Record<string, unknown>
  const jugadorId = str(jugadorRow.id)

  const { data: resData, error: resErr } = await sb
    .from('ranking_resultados')
    .select(
      `
      posicion,
      resultado_faccion,
      participacion,
      puntos_posicion,
      puntos_bono,
      puntos_total,
      ranking_eventos ( slug, nombre, fecha, nivel, total_jugadores, bolsa, estado ),
      ranking_resultado_bonos ( veces, ranking_evento_bonos ( nombre, porcentaje ) )
    `
    )
    .eq('jugador_id', jugadorId)

  if (resErr) {
    console.error('[ranking] fetchHistorialJugador resultados:', resErr.message)
  }

  const resultados = (resData ?? [])
    .map((raw) => {
      const row = raw as Record<string, unknown>
      const evento = asRecord(row.ranking_eventos)
      if (!evento || str(evento.estado) !== 'publicado') return null
      return {
        evento_slug: str(evento.slug),
        evento_nombre: str(evento.nombre),
        fecha: str(evento.fecha),
        nivel: num(evento.nivel),
        total_jugadores: num(evento.total_jugadores),
        bolsa: num(evento.bolsa),
        posicion: numOrNull(row.posicion),
        resultado_faccion: strOrNull(row.resultado_faccion),
        participacion:
          row.participacion === 'parcial'
            ? false
            : row.participacion == null
              ? true
              : bool(row.participacion),
        puntos_posicion: num(row.puntos_posicion),
        puntos_bono: num(row.puntos_bono),
        puntos_total: num(row.puntos_total),
        bonos: mapBonosResultado(row.ranking_resultado_bonos),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r != null)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))

  const temporada = await fetchTemporadaActiva(sb)
  let posicion_actual: number | null = null
  let puntos_actuales = 0
  const temporada_nombre = temporada?.nombre ?? null

  if (temporada) {
    const { data: fila, error: filaErr } = await sb
      .from('ranking_tabla')
      .select('posicion, puntos')
      .eq('jugador_id', jugadorId)
      .eq('temporada_id', temporada.id)
      .maybeSingle()

    if (filaErr) {
      console.error('[ranking] fetchHistorialJugador tabla:', filaErr.message)
    } else if (fila) {
      const f = fila as Record<string, unknown>
      posicion_actual = numOrNull(f.posicion)
      puntos_actuales = num(f.puntos)
    }
  }

  return {
    jugador_id: jugadorId,
    nombre_publico: str(jugadorRow.nombre_publico),
    temporada_nombre,
    posicion_actual,
    puntos_actuales,
    resultados,
  }
}
