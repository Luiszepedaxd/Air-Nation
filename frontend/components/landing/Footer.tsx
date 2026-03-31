const LINKS = {
  Plataforma: [
    { label: "Funciones",     href: "#funciones"     },
    { label: "Preview", href: "#preview" },
    { label: "Comunidad",     href: "#comunidad"     },
  ],
  Cuenta: [
    { label: "Registrarse",   href: "/signup" },
    { label: "Iniciar sesión",href: "/login"    },
  ],
  Legal: [
    { label: "Privacidad",    href: "/privacidad" },
    { label: "Términos",      href: "/terminos"   },
  ],
};

const FOOTER_BG =
  "linear-gradient(180deg, #020202 0%, #000000 33%, #1C1C1C 66%, #070707 100%)";

export default function Footer() {
  return (
    <footer
      className="border-t border-white/10 text-white"
      style={{ background: FOOTER_BG }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">

        {/* ── Top row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

          {/* Brand col */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-7 h-7 bg-an-accent flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
                </svg>
              </span>
              <span className="font-display font-black text-lg tracking-[0.18em] text-white uppercase leading-none">
                AIR<span className="text-an-accent">NATION</span>
              </span>
            </div>
            <p className="font-body text-sm leading-[1.7] max-w-[240px] text-white/50">
              La plataforma central del airsoft. Comunidad, identidad y documentación en un solo lugar.
            </p>
            <p className="font-body font-bold text-an-accent text-[0.65rem] uppercase tracking-[0.2em] mt-4 italic">
              Para jugadores · Por jugadores
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <h4 className="font-ui font-semibold text-white text-[0.72rem] uppercase tracking-[0.2em] mb-5 pb-2.5 border-b border-white/[0.15]">
                {group}
              </h4>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="font-body text-white text-sm hover:text-white/80 transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom row ── */}
        <div className="pt-8 border-t border-white/[0.15] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-white/50">
            © {new Date().getFullYear()} AirNation · airnation.online
          </p>
          <p className="font-body text-xs text-white/50">
            Early Access — México
          </p>
        </div>
      </div>
    </footer>
  );
}
