import Link from 'next/link'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/airnation_online',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1Gb9RJXiQ8/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M14 7h2.5V4H14c-2 0-3.5 1.5-3.5 3.5V10H8v3h2.5v8h3v-8H16l.5-3h-3V7.8c0-.5.4-.8.5-.8z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] px-5 py-14 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-4 lg:gap-12">
          {/* Columna 1: Logo + tagline + redes */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center bg-[#CC4B37]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M7 1L13 12H1L7 1Z"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className="text-[1.1rem] font-extrabold uppercase tracking-[0.06em] text-white"
                style={{ ...jost, fontWeight: 800 }}
              >
                AIR<span className="text-[#CC4B37]">NATION</span>
              </span>
            </Link>

            <p
              className="mt-5 max-w-xs text-[0.9rem] leading-[1.6] text-white/60"
              style={lato}
            >
              La plataforma central del airsoft. Comunidad, identidad y
              documentación en un solo lugar.
            </p>

            <p
              className="mt-5 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-[#CC4B37]"
              style={{ ...jost, fontWeight: 800 }}
            >
              Construyendo la comunidad real del airsoft mexicano
            </p>

            {/* Redes sociales */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center border border-solid border-white/15 text-white/60 transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
                  style={{ borderRadius: 2 }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Columna 2: Plataforma */}
          <div>
            <p
              className="mb-5 border-b border-solid border-white/10 pb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-white"
              style={{ ...jost, fontWeight: 800 }}
            >
              Plataforma
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/eventos"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Eventos
                </Link>
              </li>
              <li>
                <Link
                  href="/equipos"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Equipos
                </Link>
              </li>
              <li>
                <Link
                  href="/campos"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Campos
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  href="/store"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  AN Store
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Cuenta */}
          <div>
            <p
              className="mb-5 border-b border-solid border-white/10 pb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-white"
              style={{ ...jost, fontWeight: 800 }}
            >
              Cuenta
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/register"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Crear cuenta
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Mi feed
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/credencial"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Mi credencial
                </Link>
              </li>
              <li>
                <Link
                  href="#contacto"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Legal */}
          <div>
            <p
              className="mb-5 border-b border-solid border-white/10 pb-3 text-[0.7rem] font-extrabold uppercase tracking-[0.22em] text-white"
              style={{ ...jost, fontWeight: 800 }}
            >
              Legal
            </p>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacidad"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Aviso de Privacidad
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-[0.9rem] text-white/70 transition-colors hover:text-white"
                  style={lato}
                >
                  Términos y Condiciones
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea inferior */}
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-solid border-white/10 pt-6 sm:flex-row sm:items-center">
          <p
            className="text-[0.75rem] text-white/40"
            style={lato}
          >
            © {new Date().getFullYear()} AirNation · airnation.online
          </p>
          <p
            className="text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-white/40"
            style={{ ...jost, fontWeight: 800 }}
          >
            Early Access — México
          </p>
        </div>
      </div>
    </footer>
  )
}
