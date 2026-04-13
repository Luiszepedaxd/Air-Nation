import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { isDestacadoTrue } from '../components/DestacadoBadge'
import { CamposGrid } from '../components/CamposGrid'
import type { CampoListRow } from '../types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Campos de airsoft en Guadalajara 2026 — AirNation',
  description:
    'Encuentra los mejores campos de airsoft en Guadalajara y Zapopan. Gotcha CQB, Nido del Águila y más. Consulta horarios, ubicación y reseñas.',
  alternates: {
    canonical: 'https://www.airnation.online/campos/guadalajara',
  },
}

type FieldRowRaw = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  estado: string | null
  direccion: string | null
  foto_portada_url: string | null
  logo_url: string | null
  promedio_rating: number | string | null
  destacado: unknown
  orden_destacado: number | null
  tipo: string | null
}

async function fetchCamposGuadalajara(): Promise<{
  fields: CampoListRow[]
  forJsonLd: FieldRowRaw[]
}> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, ciudad, estado, direccion, foto_portada_url, logo_url, promedio_rating, destacado, orden_destacado, tipo'
    )
    .eq('status', 'aprobado')
    .eq('estado', 'Jalisco')
    .order('destacado', { ascending: false })
    .order('orden_destacado', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true })

  if (error) {
    console.error('[campos/guadalajara] list:', error.message)
    return { fields: [], forJsonLd: [] }
  }

  const rows = (data ?? []) as FieldRowRaw[]
  const fields: CampoListRow[] = rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    slug: r.slug,
    ciudad: r.ciudad,
    estado: r.estado,
    tipo: r.tipo,
    foto_portada_url: r.foto_portada_url,
    logo_url: r.logo_url,
    promedio_rating: r.promedio_rating,
    destacado: isDestacadoTrue(r.destacado),
    orden_destacado: r.orden_destacado,
  }))

  return { fields, forJsonLd: rows }
}

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function buildItemListJsonLd(rows: FieldRowRaw[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Campos de airsoft en Guadalajara',
    numberOfItems: rows.length,
    itemListElement: rows.map((f, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SportsActivityLocation',
        name: f.nombre,
        url: `https://www.airnation.online/campos/${f.slug}`,
        ...(f.foto_portada_url?.trim()
          ? { image: f.foto_portada_url.trim() }
          : {}),
        ...(f.ciudad?.trim() || f.estado?.trim() || f.direccion?.trim()
          ? {
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'MX',
                ...(f.ciudad?.trim()
                  ? { addressLocality: f.ciudad.trim() }
                  : {}),
                ...(f.estado?.trim()
                  ? { addressRegion: f.estado.trim() }
                  : {}),
                ...(f.direccion?.trim()
                  ? { streetAddress: f.direccion.trim() }
                  : {}),
              },
            }
          : {}),
      },
    })),
  }
}

export default async function CamposGuadalajaraPage() {
  const { fields, forJsonLd } = await fetchCamposGuadalajara()
  const jsonLd = buildItemListJsonLd(forJsonLd)

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <h1
            className="text-2xl font-extrabold uppercase leading-tight text-white"
            style={jost}
          >
            Campos de airsoft en Guadalajara
          </h1>
          <p className="mt-2 text-sm text-[#999999]" style={lato}>
            Zapopan, San Pedro Tlaquepaque y zona metropolitana
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <p
          className="mb-6 max-w-[720px] text-sm leading-relaxed text-[#666666]"
          style={lato}
        >
          La Zona Metropolitana de Guadalajara concentra los principales campos de
          airsoft de México. Campos indoor y outdoor para todos los niveles.
        </p>
        <CamposGrid fields={fields} />
        <section className="mt-14 border-t border-solid border-[#EEEEEE] pt-12">
          <h2
            className="text-xl font-extrabold uppercase leading-tight text-[#111111]"
            style={jost}
          >
            ¿Listo para jugar airsoft en Guadalajara?
          </h2>
          <p
            className="mt-3 max-w-[560px] text-sm leading-relaxed text-[#666666]"
            style={lato}
          >
            Regístrate en AirNation para guardar tus campos favoritos, ver eventos
            próximos y conectar con equipos de la zona.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-[2px] bg-[#CC4B37] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-95"
            style={jost}
          >
            Crear cuenta gratis
          </Link>
        </section>
      </div>
    </div>
  )
}
