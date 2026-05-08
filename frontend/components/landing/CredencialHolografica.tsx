import Link from 'next/link'
import { createAdminSupabaseServerClient } from '@/app/admin/supabase-server'
import { getSiteAssets } from '@/lib/site-assets'
import { getSiteAssetValues } from '@/lib/site-assets'
import type { CredentialUserData } from '@/components/credential/CredentialCard'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { CredencialMockup } from './CredencialMockup'

export default async function CredencialHolografica() {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const [assets, values] = await Promise.all([
    getSiteAssets(),
    getSiteAssetValues(),
  ])

  const fotoCredencial = assets['credencial_avatar'] ?? null

  // Construir el objeto CredentialUserData desde site_assets
  const fechaAltaIso = values['credencial_fecha_alta'] || '2026-04-01'
  const fechaAltaForCreatedAt = (() => {
    try {
      const d = new Date(fechaAltaIso + 'T00:00:00')
      if (Number.isNaN(d.getTime())) return new Date('2026-04-01T00:00:00').toISOString()
      return d.toISOString()
    } catch {
      return new Date('2026-04-01T00:00:00').toISOString()
    }
  })()

  const equipoNombre = (values['credencial_equipo'] || '').trim()

  const mockData: CredentialUserData = {
    id: 'home-mockup',
    nombre: null,
    alias: values['credencial_alias'] || 'CERO UNO',
    ciudad: values['credencial_ciudad'] || 'Guadalajara',
    rol: (values['credencial_rol'] || 'sniper').toLowerCase().replace(/\s+/g, '_'),
    avatar_url: null,
    foto_credencial_url: fotoCredencial,
    credencial_nombre_completo: values['credencial_nombre'] || 'Luis Gutierrez',
    credencial_fecha_nacimiento: values['credencial_fecha_nacimiento'] || '2000-03-20',
    member_number: values['credencial_numero'] || '1015',
    created_at: fechaAltaForCreatedAt,
    teamNombre: equipoNombre || null,
    teamsActivos: equipoNombre ? [equipoNombre] : [],
  }

  const hasSession = !!session
  const ctaHref = hasSession ? '/dashboard/credencial' : '/register'
  const ctaLabel = hasSession ? 'Ver mi credencial' : 'Crear cuenta gratis'

  return (
    <section className="relative overflow-hidden bg-[#111111] px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
      {/* Background gradient sutil */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 80% 50%, rgba(204, 75, 55, 0.3) 0%, transparent 60%)',
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Texto */}
          <RevealOnScroll direction="left" distance={40}>
            <div>
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Identidad táctica
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.92] text-white"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
              >
                TU CREDENCIAL
                <br />
                <span className="text-[#CC4B37]">DIGITAL.</span>
              </h2>
              <p className="mt-6 max-w-md font-body text-base leading-[1.7] text-white/70 sm:text-[1.05rem]">
                Tu identificación oficial en AirNation. Con QR único de
                verificación, descargable y válida en eventos AN. Gratis para
                siempre.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  'QR único de verificación',
                  'Descargable a tu Apple Wallet',
                  'Tu equipo, ciudad y rol oficial',
                  'Válida en eventos AN',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                      className="mt-1 shrink-0"
                    >
                      <path
                        d="M3 7.5l3 3 5-6"
                        stroke="#CC4B37"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-body text-[0.95rem] text-white/80">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className="group mt-10 inline-flex items-center gap-2.5 bg-[#CC4B37] px-8 py-[1.1rem] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-[#CC4B37]/90"
              >
                {ctaLabel}
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

          {/* Mockup credencial */}
          <RevealOnScroll direction="right" distance={40} delay={0.15}>
            <div className="flex items-center justify-center">
              <CredencialMockup data={mockData} />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  )
}
