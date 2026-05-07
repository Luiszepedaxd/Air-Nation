import Link from 'next/link'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { getSiteAssets } from '@/lib/site-assets'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'

export default async function CtaBandaUnete() {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const assets = await getSiteAssets()
  const bgUrl = assets['home_cta_mid_background'] ?? '/herofoto2.jpg'

  const hasSession = !!session

  return (
    <section className="relative overflow-hidden bg-[#111111]">
      {/* Imagen de fondo */}
      <div className="absolute inset-0 z-0">
        <img
          src={bgUrl}
          alt=""
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Overlay con gradient mesh animado */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-[#111111]/95 via-[#111111]/80 to-[#CC4B37]/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] animate-an-mesh-shift opacity-60"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(204, 75, 55, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(204, 75, 55, 0.3) 0%, transparent 50%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
        <RevealOnScroll>
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
              {hasSession ? 'ORGANIZA TU PARTIDA' : 'ÚNETE A LA COMUNIDAD'}
            </p>
            <h2
              className="mt-5 font-display font-black uppercase leading-[0.95] text-white"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
            >
              {hasSession ? (
                <>
                  TU PRÓXIMO
                  <br />
                  <span className="text-[#CC4B37]">EVENTO,</span> AQUÍ.
                </>
              ) : (
                <>
                  ESTO ES
                  <br />
                  <span className="text-[#CC4B37]">PARA TI.</span>
                </>
              )}
            </h2>
            <p className="mx-auto mt-6 max-w-xl font-body text-base leading-[1.7] text-white/75 sm:text-[1.05rem]">
              {hasSession
                ? 'Crea tu evento gratis. Aparece en el calendario público, conecta con jugadores y arma tu comunidad desde el día uno.'
                : 'Crea tu cuenta gratis y empieza a vivir el airsoft mexicano: credencial digital, equipos, calendario de eventos, marketplace y más.'}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={hasSession ? '/eventos/nuevo' : '/register'}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden bg-[#CC4B37] px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-[#CC4B37]/90"
              >
                <span
                  className="absolute inset-0 -z-10 animate-an-glow-pulse opacity-0"
                  aria-hidden
                />
                {hasSession ? 'CREAR EVENTO' : 'CREAR CUENTA GRATIS'}
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
              <Link
                href={hasSession ? '/dashboard' : '/login'}
                className="inline-flex items-center justify-center border border-white/35 px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white/90 transition-colors hover:border-white hover:text-white"
              >
                {hasSession ? 'IR AL DASHBOARD' : 'INICIAR SESIÓN'}
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  )
}
