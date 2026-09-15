import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { isDestacadoTrue } from '@/app/campos/components/DestacadoBadge'
import type { CampoListRow } from '@/app/campos/types'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { CamposHomeCarouselTrack } from './CamposHomeCarouselTrack'

const HOME_CAMPOS_LIMIT = 12

async function fetchCamposHome(): Promise<CampoListRow[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, ciudad, estado, tipo, foto_portada_url, logo_url, promedio_rating, destacado, orden_destacado'
    )
    .eq('status', 'aprobado')
    .order('destacado', { ascending: false })
    .order('orden_destacado', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true })
    .limit(HOME_CAMPOS_LIMIT)

  if (error) {
    console.error('[home/campos] list:', error.message)
    return []
  }

  const rows = (data ?? []) as CampoListRow[]
  return rows.map((r) => ({
    ...r,
    destacado: isDestacadoTrue(r.destacado),
  }))
}

export default async function CamposHomeCarousel() {
  const campos = await fetchCamposHome()

  if (campos.length === 0) return null

  return (
    <section
      id="campos"
      className="relative bg-[#F4F4F4] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Campos
                </p>
              </div>
              <h2 className="font-display text-2xl font-black uppercase leading-[1.05] text-[#111111] sm:text-3xl md:text-4xl">
                Dónde se juega en{' '}
                <span className="text-[#CC4B37]">México</span>
              </h2>
              <p className="mt-3 font-body text-sm leading-[1.7] text-[#666666] sm:text-base">
                Campo listo para tu dominguera, o para el evento que vas a armar.
              </p>
            </div>
            <Link
              href="/campos"
              className="group inline-flex shrink-0 items-center gap-2 self-start font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37] hover:text-[#CC4B37]/80 sm:self-end"
            >
              Ver todos
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </RevealOnScroll>

        <CamposHomeCarouselTrack fields={campos} />
      </div>
    </section>
  )
}
