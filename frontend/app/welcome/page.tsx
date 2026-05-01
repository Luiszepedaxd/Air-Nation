import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bienvenido a AirNation',
  description:
    'La base del Airsoft, Gotcha y Gelsoft en México. Únete a la comunidad.',
  robots: { index: false, follow: false },
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 900,
  textTransform: 'uppercase' as const,
} as const

const jostBold = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export default function WelcomePage() {
  return (
    <main
      className="flex min-h-[100dvh] min-w-[320px] flex-col bg-white text-[#111111]"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
      }}
    >
      {/* Logo bloque superior */}
      <div className="flex flex-col items-center px-6 pt-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center bg-[#CC4B37]">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          <span
            style={jostBold}
            className="text-[1.25rem] tracking-[0.18em] text-[#111111]"
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </div>
      </div>

      {/* Bloque central: copy */}
      <div className="flex flex-1 flex-col justify-center px-6">
        <p
          className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]"
          style={lato}
        >
          BIENVENIDO
        </p>
        <h1
          style={jost}
          className="text-[2.25rem] leading-[0.95] text-[#111111] sm:text-[2.5rem]"
        >
          LA BASE DEL AIRSOFT,
          <br />
          GOTCHA Y GELSOFT
          <br />
          EN MÉXICO.
        </h1>
        <p
          style={lato}
          className="mt-6 max-w-[420px] text-[15px] leading-relaxed text-[#444444]"
        >
          Únete a la comunidad. Tu credencial digital, tu equipo, tu arsenal y los
          mejores campos del país en un solo lugar.
        </p>
      </div>

      {/* Botones inferiores */}
      <div className="flex flex-col gap-3 px-6 pb-2">
        <Link
          href="/register"
          className="flex w-full items-center justify-center bg-[#CC4B37] py-4 text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{
            ...jostBold,
            fontSize: 14,
            letterSpacing: '0.18em',
            borderRadius: 0,
          }}
        >
          CREAR MI CUENTA →
        </Link>
        <Link
          href="/login"
          className="flex w-full items-center justify-center border border-solid border-[#111111] bg-white py-4 text-[#111111] transition-colors hover:bg-[#F4F4F4] active:bg-[#EEEEEE]"
          style={{
            ...jostBold,
            fontSize: 14,
            letterSpacing: '0.18em',
            borderRadius: 0,
          }}
        >
          YA TENGO CUENTA
        </Link>

        {/* Legal footer */}
        <p
          style={lato}
          className="mt-4 text-center text-[11px] leading-relaxed text-[#666666]"
        >
          Al continuar aceptas nuestros{' '}
          <Link href="/terminos" className="underline">
            Términos
          </Link>{' '}
          y{' '}
          <Link href="/privacidad" className="underline">
            Aviso de Privacidad
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
