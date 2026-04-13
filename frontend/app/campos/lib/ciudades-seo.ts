import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { isDestacadoTrue } from '../components/DestacadoBadge'
import type { CampoListRow } from '../types'

/** Slugs de URL → datos de ciudad (landings en /campos/[slug] cuando slug está aquí). */
export const CIUDADES: Record<
  string,
  {
    label: string
    supabaseValues: string[]
    descripcion: string
    estado: string
  }
> = {
  guadalajara: {
    label: 'Guadalajara',
    supabaseValues: [
      'Guadalajara',
      'guadalajara',
      'GDL',
      'Zapopan',
      'Tlaquepaque',
      'Tonalá',
    ],
    descripcion:
      'Encuentra los mejores campos de airsoft en Guadalajara y zona metropolitana. Partidas, eventos y comunidad airsofter en Jalisco.',
    estado: 'Jalisco',
  },
  cdmx: {
    label: 'Ciudad de México',
    supabaseValues: [
      'Ciudad de México',
      'CDMX',
      'Ciudad de Mexico',
      'México',
      'Mexico City',
    ],
    descripcion:
      'Los mejores campos de airsoft en la Ciudad de México. Encuentra dónde jugar, reserva tu lugar y únete a la comunidad airsofter en CDMX.',
    estado: 'Ciudad de México',
  },
  monterrey: {
    label: 'Monterrey',
    supabaseValues: [
      'Monterrey',
      'monterrey',
      'MTY',
      'San Pedro Garza García',
      'Guadalupe',
      'Apodaca',
    ],
    descripcion:
      'Campos de airsoft en Monterrey y área metropolitana. Partidas, torneos y comunidad airsofter en Nuevo León.',
    estado: 'Nuevo León',
  },
}

export async function fetchCamposCiudad(
  supabaseValues: string[]
): Promise<CampoListRow[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, ciudad, estado, tipo, foto_portada_url, logo_url, promedio_rating, destacado, orden_destacado'
    )
    .eq('status', 'aprobado')
    .in('ciudad', supabaseValues)
    .order('destacado', { ascending: false })
    .order('orden_destacado', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true })

  if (error) {
    console.error('[campos/ciudad] list:', error.message)
    return []
  }

  const rows = (data ?? []) as CampoListRow[]
  return rows.map((r) => ({
    ...r,
    destacado: isDestacadoTrue(r.destacado),
  }))
}
