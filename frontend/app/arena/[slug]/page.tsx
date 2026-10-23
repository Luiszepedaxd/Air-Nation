import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchArenaFicha } from '@/lib/arena-public'
import { DetalleClient } from './DetalleClient'

export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const ficha = await fetchArenaFicha(params.slug)
  if (!ficha) return { title: { absolute: 'Reservar campo — AirNation ARENA' } }
  const { nombre, ciudad } = ficha.field
  const titulo = `Reserva en ${nombre}${ciudad ? `, ${ciudad}` : ''} | AirNation ARENA`
  const descripcion =
    ficha.field.descripcion?.slice(0, 160) ||
    `Reserva en línea tu día en ${nombre}: elige día y paquete, paga y llega con tu QR.`
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `https://www.airnation.online/arena/${params.slug}` },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `https://www.airnation.online/arena/${params.slug}`,
      type: 'website',
      ...(ficha.field.foto_portada_url ? { images: [ficha.field.foto_portada_url] } : {}),
    },
  }
}

export default async function ArenaCampoPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { fecha?: string; editar?: string }
}) {
  const ficha = await fetchArenaFicha(params.slug)
  // 404 si el campo no existe o si ARENA no está activo ahí.
  if (!ficha || !ficha.arena.activo) notFound()

  const desde = ficha.items.filter((i) => i.es_base).sort((a, b) => a.precio_centavos - b.precio_centavos)[0]

  // JSON-LD: el precio "desde" como oferta y el link de vuelta al directorio.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: ficha.field.nombre,
    url: `https://www.airnation.online/arena/${params.slug}`,
    sameAs: `https://www.airnation.online/campos/${params.slug}`,
    ...(ficha.field.descripcion ? { description: ficha.field.descripcion } : {}),
    ...(ficha.field.foto_portada_url ? { image: ficha.field.foto_portada_url } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: ficha.field.direccion ?? undefined,
      addressLocality: ficha.field.ciudad ?? undefined,
      addressRegion: ficha.field.estado ?? undefined,
      addressCountry: 'MX',
    },
    ...(Number(ficha.field.promedio_rating) > 0 && ficha.resenas.length > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(ficha.field.promedio_rating).toFixed(1),
            reviewCount: ficha.resenas.length,
          },
        }
      : {}),
    ...(desde
      ? {
          makesOffer: {
            '@type': 'Offer',
            name: desde.nombre,
            price: (desde.precio_centavos / 100).toFixed(2),
            priceCurrency: 'MXN',
            availability: 'https://schema.org/InStock',
            url: `https://www.airnation.online/arena/${params.slug}`,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DetalleClient
        ficha={ficha}
        fechaInicial={searchParams.fecha ?? ''}
        editarIndice={
          searchParams.editar !== undefined && /^\d+$/.test(searchParams.editar)
            ? Number(searchParams.editar)
            : null
        }
      />
    </>
  )
}
