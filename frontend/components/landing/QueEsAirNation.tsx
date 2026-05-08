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
    eyebrow: 'COMUNIDAD',
    titulo: 'Tu feed',
    descripcion:
      'Comparte fotos, videos y experiencias de tus partidas. Conecta con tu equipo y con jugadores de toda la república.',
    href: '/dashboard',
    cta: 'Ver el feed',
  },
  {
    key: 'equipos',
    assetKey: 'home_que_es_image_2',
    eyebrow: 'EQUIPOS',
    titulo: 'Tu equipo',
    descripcion:
      'Dale visibilidad a tu equipo, publica contenido y recluta nuevos integrantes.',
    href: '/equipos',
    cta: 'Ver equipos',
  },
  {
    key: 'eventos',
    assetKey: 'home_que_es_image_3',
    eyebrow: 'AGENDA',
    titulo: 'Eventos',
    descripcion:
      'Calendario público de partidas, milsim y torneos en México. Filtros por mes y ciudad. Confirma tu asistencia gratis.',
    href: '/eventos',
    cta: 'Ver eventos',
  },
  {
    key: 'marketplace',
    assetKey: 'home_que_es_image_4',
    eyebrow: 'MARKETPLACE',
    titulo: 'Marketplace',
    descripcion:
      'Compra y vende réplicas y gear entre la comunidad.',
    href: '/marketplace',
    cta: 'Ver marketplace',
  },
]

export default async function QueEsAirNation() {
  const assets = await getSiteAssets()

  return (
    <section
      id="que-es"
      className="relative bg-white px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <RevealOnScroll>
          <div className="mb-8 sm:mb-10 lg:mb-14">
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

        {/* Mobile: carrusel horizontal con scroll-snap centrado */}
        <div className="-mx-5 sm:hidden">
          <div
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingLeft: '1.25rem',
              paddingRight: '1.25rem',
              scrollPaddingLeft: '1.25rem',
              scrollPaddingRight: '1.25rem',
            }}
          >
            {FEATURES.map((f, idx) => (
              <div
                key={f.key}
                className={`h-[480px] w-[78%] shrink-0 snap-start ${
                  idx === FEATURES.length - 1 ? 'pr-5' : ''
                }`}
                style={{
                  scrollSnapAlign:
                    idx === 0
                      ? 'start'
                      : idx === FEATURES.length - 1
                        ? 'end'
                        : 'start',
                }}
              >
                <QueEsCard
                  imageUrl={assets[f.assetKey] ?? '/og-default.jpg'}
                  eyebrow={f.eyebrow}
                  titulo={f.titulo}
                  descripcion={f.descripcion}
                  href={f.href}
                  cta={f.cta}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-1.5 px-5">
            {FEATURES.map((f) => (
              <span
                key={f.key}
                className="h-1 w-1 rounded-full bg-[#CCCCCC]"
                aria-hidden
              />
            ))}
          </div>
        </div>

        {/* Desktop: grid con stagger reveal */}
        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
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
