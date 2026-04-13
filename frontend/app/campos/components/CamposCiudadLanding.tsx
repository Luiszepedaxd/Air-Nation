import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import type { CampoListRow } from '../types'
import { CamposGrid } from './CamposGrid'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type CiudadConfig = {
  label: string
  descripcion: string
  estado: string
}

export function CamposCiudadLanding({
  slug,
  ciudad,
  fields,
}: {
  slug: string
  ciudad: CiudadConfig
  fields: CampoListRow[]
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Campos de airsoft en ${ciudad.label}`,
    description: ciudad.descripcion,
    url: `https://airnation.online/campos/${slug}`,
    numberOfItems: fields.length,
    itemListElement: fields.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: f.nombre,
      url: `https://airnation.online/campos/${f.slug}`,
    })),
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="bg-[#111111] px-4 py-8 md:py-10">
        <div className="mx-auto max-w-[1200px] md:px-6">
          <p
            className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#CC4B37]"
            style={jost}
          >
            {ciudad.estado}
          </p>
          <h1
            className="text-2xl font-extrabold uppercase leading-tight text-white md:text-3xl"
            style={jost}
          >
            Campos de airsoft en {ciudad.label}
          </h1>
          <p className="mt-2 text-sm text-[#999999]" style={lato}>
            {ciudad.descripcion}
          </p>
          {fields.length > 0 && (
            <p className="mt-3 text-xs text-[#666666]" style={lato}>
              {fields.length}{' '}
              {fields.length === 1 ? 'campo encontrado' : 'campos encontrados'}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8">
        {fields.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#999999]"
              style={jost}
            >
              Aún no hay campos registrados en {ciudad.label}
            </p>
            <p className="mt-2 text-sm text-[#999999]" style={lato}>
              ¿Eres operador? Registra tu campo gratis en AirNation.
            </p>
            <a
              href="/register"
              className="mt-6 inline-flex items-center gap-2 bg-[#CC4B37] px-6 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white"
              style={jost}
            >
              Registrar mi campo
            </a>
          </div>
        ) : (
          <CamposGrid fields={fields} />
        )}
      </div>

      <div className="border-t border-[#EEEEEE] bg-[#F4F4F4] px-4 py-10 text-center">
        <p
          className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#111111]"
          style={jost}
        >
          ¿Juegas airsoft en {ciudad.label}?
        </p>
        <p className="mt-2 text-sm text-[#666666]" style={lato}>
          Crea tu perfil, registra tus réplicas y encuentra tu equipo en AirNation.
        </p>
        <a
          href="/register"
          className="mt-5 inline-flex items-center gap-2 bg-[#CC4B37] px-7 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white"
          style={jost}
        >
          Crear cuenta gratis
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
              d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}
