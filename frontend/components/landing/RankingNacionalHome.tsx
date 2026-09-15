import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { TablaRanking } from '@/app/ranking/components/TablaRanking'
import { fetchTablaRanking, fetchTemporadaActiva } from '@/lib/ranking'
import { TEXTOS_HOME } from '@/lib/ranking-contenido'

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
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-stretch lg:gap-10">
          <RevealOnScroll>
            <div>
              <div className="mb-6">
                <div className="mb-5 flex items-center gap-4">
                  <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                  <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                    {TEXTOS_HOME.eyebrow} · {temporada.nombre}
                  </p>
                </div>
                <h2
                  className="font-display font-black uppercase leading-[0.95] text-[#111111]"
                  style={{ fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)' }}
                >
                  LOS MEJORES DEL AIRSOFT{' '}
                  <span className="text-[#CC4B37]">MEXICANO.</span>
                </h2>
                <p className="mt-3 font-body text-[0.95rem] text-[#666666]">
                  Juega, suma puntos y compite por ser el número 1 del país.
                </p>
              </div>
              <TablaRanking filas={filas} compacta />
              <Link
                href="/ranking"
                className="group mt-6 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37] hover:text-[#CC4B37]/80"
              >
                {TEXTOS_HOME.verCompleto}
              </Link>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={0.1} direction="up" distance={40}>
            <div className="flex h-full flex-col justify-center bg-[#111111] p-8 lg:p-10">
              <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                {TEXTOS_HOME.orgEyebrow}
              </p>
              <h3
                className="mt-4 font-display font-black uppercase leading-[0.95] text-white"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)' }}
              >
                {TEXTOS_HOME.orgTitulo}
              </h3>
              <p className="mt-5 font-body text-[15px] leading-[1.7] text-white/75">
                {TEXTOS_HOME.orgTexto}
              </p>
              <ul className="mt-6 space-y-3">
                {TEXTOS_HOME.orgBullets.map((texto) => (
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
                <span className="text-[#CC4B37]">{TEXTOS_HOME.orgPrecio}</span>
                {' · '}
                {TEXTOS_HOME.orgPrecioDespues}
              </p>
              <Link
                href="/ranking#organizadores"
                className="mt-8 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                {TEXTOS_HOME.orgCta}
              </Link>
              <Link
                href="/ranking#puntos"
                className="group mt-5 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/60 hover:text-white"
              >
                {TEXTOS_HOME.orgLink}
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  )
}
