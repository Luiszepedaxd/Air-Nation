import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CampoCard } from '@/app/campos/components/CampoCard'
import { fetchArenaLanding, type ArenaLandingCard } from '@/lib/arena-landing'
import { ArenaFiltros } from './ArenaFiltros'

export const revalidate = 0

const ARENA_DESCRIPTION =
  'Reserva en línea tu día de airsoft en México: elige campo, día y paquete, paga y llega con tu QR. Precios por persona y cancelación clara.'

export const metadata: Metadata = {
  title: 'ARENA — Reserva tu día de airsoft | AirNation',
  description: ARENA_DESCRIPTION,
  alternates: { canonical: 'https://www.airnation.online/arena' },
  openGraph: {
    title: 'ARENA — Reserva tu día de airsoft',
    description: ARENA_DESCRIPTION,
    url: 'https://www.airnation.online/arena',
    type: 'website',
  },
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const PAGINA = 24

/** La landing reusa la tarjeta de `/campos` y le agrega el precio "desde". */
function Tarjeta({ campo }: { campo: ArenaLandingCard }) {
  return (
    <div className="relative">
      <CampoCard
        field={{
          id: campo.id,
          nombre: campo.nombre,
          slug: campo.slug,
          ciudad: campo.ciudad,
          estado: campo.estado,
          tipo: campo.tipo,
          foto_portada_url: campo.foto_portada_url,
          logo_url: campo.logo_url,
          promedio_rating: campo.promedio_rating,
          destacado: campo.destacado,
          orden_destacado: null,
        }}
        precioDesdeCentavos={campo.precio_desde_centavos}
      />
      {campo.es_prueba ? (
        <span
          style={jost}
          className="absolute right-2 top-2 bg-[#CC4B37] px-2 py-1 text-[10px] tracking-[0.08em] text-white"
        >
          PRUEBA
        </span>
      ) : null}
      {campo.resumen ? (
        <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
          {campo.resumen}
        </p>
      ) : null}
    </div>
  )
}

export default async function ArenaLandingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { fields, total, filtros } = await fetchArenaLanding(searchParams)
  const offset = Math.max(Number(searchParams.offset) || 0, 0)

  const linkPagina = (nuevoOffset: number) => {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      const valor = Array.isArray(v) ? v[0] : v
      if (valor && k !== 'offset') qs.set(k, valor)
    }
    if (nuevoOffset > 0) qs.set('offset', String(nuevoOffset))
    return qs.toString() ? `/arena?${qs}` : '/arena'
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <p className="text-[11px] tracking-[0.2em] text-[#CC4B37]" style={jost}>
            AIRNATION ARENA
          </p>
          <h1 style={jost} className="mt-2 text-[26px] leading-tight text-white md:text-[34px]">
            Reserva tu día de airsoft
          </h1>
          <p className="mt-2 max-w-[560px] text-sm text-[#999999]" style={lato}>
            Elige campo, día y paquete. Pagas en línea y llegas con tu QR.
          </p>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <Suspense fallback={null}>
          <ArenaFiltros estados={filtros.estados} ciudades={filtros.ciudades} />
        </Suspense>

        {fields.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#666666]" style={lato}>
            Ningún campo coincide con esos filtros. Prueba con otro día o quita el
            límite de precio.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((c) => (
              <li key={c.id}>
                <Tarjeta campo={c} />
              </li>
            ))}
          </ul>
        )}

        {total > PAGINA ? (
          <nav className="flex items-center justify-between gap-3 text-[11px]" style={jost}>
            {offset > 0 ? (
              <Link
                href={linkPagina(Math.max(offset - PAGINA, 0))}
                className="border border-solid border-[#EEEEEE] px-3 py-2 tracking-[0.12em] text-[#666666]"
              >
                ← ANTERIORES
              </Link>
            ) : (
              <span />
            )}
            <span className="text-[#999999]" style={lato}>
              {offset + 1}–{offset + fields.length} de {total}
            </span>
            {offset + fields.length < total ? (
              <Link
                href={linkPagina(offset + PAGINA)}
                className="border border-solid border-[#EEEEEE] px-3 py-2 tracking-[0.12em] text-[#666666]"
              >
                SIGUIENTES →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </div>
  )
}
