import { getSiteAssets } from '@/lib/site-assets'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { QueEsCard } from './QueEsCard'

type Feature = {
  key: string
  assetKey: string
  eyebrow: string
  titulo: string
  descripcion: string
  href: string
  cta: string
}

const FEATURES: Feature[] = [
  {
    key: 'feed',
    assetKey: 'home_que_es_image_1',
    eyebrow: '01 · COMUNIDAD',
    titulo: 'Tu feed',
    descripcion:
      'Comparte fotos, videos y experiencias de tus partidas. Conecta con tu equipo y con jugadores de toda la república.',
    href: '/dashboard',
    cta: 'Ver el feed',
  },
  {
    key: 'equipos',
    assetKey: 'home_que_es_image_2',
    eyebrow: '02 · IDENTIDAD',
    titulo: 'Tu equipo',
    descripcion:
      'Crea o únete a tu equipo. Roles claros, miembros activos, reservas y trial. Tu identidad táctica vive aquí.',
    href: '/equipos',
    cta: 'Ver equipos',
  },
  {
    key: 'eventos',
    assetKey: 'home_que_es_image_3',
    eyebrow: '03 · AGENDA',
    titulo: 'Eventos',
    descripcion:
      'Calendario público de partidas, milsim y torneos en México. Filtros por mes y ciudad. Confirma tu asistencia gratis.',
    href: '/eventos',
    cta: 'Ver eventos',
  },
  {
    key: 'marketplace',
    assetKey: 'home_que_es_image_4',
    eyebrow: '04 · ARSENAL',
    titulo: 'Marketplace + Tienda',
    descripcion:
      'Compra y vende réplicas y gear entre la comunidad. Tienda oficial AN Store con descuento por transferencia.',
    href: '/store',
    cta: 'Ver tienda',
  },
]

export default async function QueEsAirNation() {
  const assets = await getSiteAssets()

  return (
    <section
      id="que-es"
      className="relative bg-white px-5 py-20 sm:px-8 sm:py-24 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div className="mb-5 flex items-center gap-4">
              <span className="block h-[2px] w-7 bg-[#CC4B37]" />
              <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                Qué es AirNation
              </p>
            </div>
            <h2
              className="font-display font-black uppercase leading-[0.9] text-[#111111]"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
            >
              UNA PLATAFORMA.
              <br />
              <span className="text-[#CC4B37]">TODO EL AIRSOFT.</span>
            </h2>
            <p className="mt-6 max-w-2xl font-body text-base leading-[1.7] text-[#666666] sm:text-[1.05rem]">
              Construida desde adentro del juego. Cada función conectada a la
              siguiente. La identidad, comunidad, agenda y arsenal del airsoft
              mexicano viven aquí.
            </p>
          </div>
        </RevealOnScroll>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {FEATURES.map((f, i) => (
            <RevealOnScroll
              key={f.key}
              delay={i * 0.1}
              direction="up"
              distance={40}
            >
              <QueEsCard
                imageUrl={assets[f.assetKey] ?? '/og-default.jpg'}
                eyebrow={f.eyebrow}
                titulo={f.titulo}
                descripcion={f.descripcion}
                href={f.href}
                cta={f.cta}
              />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
