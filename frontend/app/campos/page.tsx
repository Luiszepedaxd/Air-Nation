import type { Metadata } from 'next'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { isDestacadoTrue } from './components/DestacadoBadge'
import { CamposGrid } from './components/CamposGrid'
import type { CampoListRow } from './types'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Campos de airsoft — AirNation',
  description:
    'Listado de campos de airsoft aprobados. Encuentra dónde jugar cerca de ti.',
}

async function fetchCamposAprobados(): Promise<CampoListRow[]> {
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

  if (error) {
    console.error('[campos] list:', error.message)
    return []
  }
  const rows = (data ?? []) as CampoListRow[]
  return rows.map((r) => ({
    ...r,
    destacado: isDestacadoTrue(r.destacado),
  }))
}

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export default async function CamposPage() {
  const fields = await fetchCamposAprobados()

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <h1
            className="text-2xl font-extrabold uppercase leading-tight text-white"
            style={jost}
          >
            Campos de airsoft
          </h1>
          <p
            className="mt-2 text-sm text-[#999999]"
            style={lato}
          >
            Encuentra dónde jugar cerca de ti
          </p>
        </div>
      </header>

      {/* Links a páginas de ciudad — SEO interno */}
      <div className="border-b border-[#EEEEEE] bg-[#F4F4F4]">
        <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-6">
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
              style={{ fontFamily: "'Jost', sans-serif" }}
            >
              Por ciudad:
            </span>
            {[
              { label: 'Guadalajara', href: '/campos/guadalajara' },
              { label: 'CDMX', href: '/campos/cdmx' },
              { label: 'Monterrey', href: '/campos/monterrey' },
            ].map((c) => (
              <a
                key={c.href}
                href={c.href}
                className="border border-[#DDDDDD] bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#333333] hover:border-[#CC4B37] hover:text-[#CC4B37] transition-colors"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        <CamposGrid fields={fields} />
      </div>
    </div>
  )
}
