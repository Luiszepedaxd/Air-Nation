import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { TablaRanking } from '@/app/ranking/components/TablaRanking'
import {
  FECHA_FIN_GRATIS_TEXTO,
  PRECIO_POR_JUGADOR,
  fetchTablaRanking,
  fetchTemporadaActiva,
} from '@/lib/ranking'

const BULLETS_ORGANIZADORES = [
  'Puntos oficiales para tus jugadores',
  'Resultados públicos y transparentes',
  'Arbitraje y resultados en vivo',
] as const

export default async function RankingNacionalHome() {
  const sb = createPublicSupabaseClient()
  const temporada = await fetchTemporadaActiva(sb)

  if (!temporada) return null

  const filas = await fetchTablaRanking(sb, temporada.id, 10)

  return (
    <section
      id="ranking-nacional"
      className="relative bg-[#FFFFFF] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <RevealOnScroll>
            <div>
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Ranking Nacional · {temporada.nombre}
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}
              >
                LOS MEJORES
                <br />
                DEL AIRSOFT
                <br />
                <span className="text-[#CC4B37]">MEXICANO.</span>
              </h2>
              <div className="mt-8">
                <TablaRanking filas={filas} compacta />
              </div>
              <Link
                href="/ranking"
                className="group mt-6 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37] hover:text-[#CC4B37]/80"
              >
                Ver ranking completo
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

          <RevealOnScroll delay={0.1} direction="up" distance={40}>
            <div className="flex h-full flex-col bg-[#111111] p-6 sm:p-8 lg:p-10">
              <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                Para organizadores
              </p>
              <h3
                className="mt-4 font-display font-black uppercase leading-[0.95] text-white"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}
              >
                ¿TIENES PENSADO HACER UN EVENTO?
              </h3>
              <p className="mt-5 font-body text-[15px] leading-[1.7] text-white/75">
                Haz que tus resultados cuenten para el Ranking Nacional. Cualquier
                tipo de evento: torneos, speedsoft, milsim o domingueras.
              </p>
              <ul className="mt-6 space-y-3">
                {BULLETS_ORGANIZADORES.map((texto) => (
                  <li
                    key={texto}
                    className="flex gap-3 font-body text-[14px] text-white/75"
                  >
                    <span className="mt-0.5 shrink-0 text-[#CC4B37]" aria-hidden>
                      ✓
                    </span>
                    {texto}
                  </li>
                ))}
              </ul>
              <p className="mt-8 font-body text-[14px] leading-relaxed text-white/70">
                ${PRECIO_POR_JUGADOR} MXN por jugador ·{' '}
                <span className="text-[#CC4B37]">
                  Gratis hasta el {FECHA_FIN_GRATIS_TEXTO}
                </span>
              </p>
              <Link
                href="/ranking#organizadores"
                className="mt-8 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                Quiero que mi evento cuente
              </Link>
              <Link
                href="/ranking#puntos"
                className="group mt-5 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/60 hover:text-white"
              >
                ¿Cómo funcionan los puntos?
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
        </div>
      </div>
    </section>
  )
}
