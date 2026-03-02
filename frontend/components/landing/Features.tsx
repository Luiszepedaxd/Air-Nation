const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3L25 8.5v11L14 25 3 19.5v-11L14 3Z" stroke="#2ECC71" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 3v22M3 8.5l11 5.5 11-5.5" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Registro de Equipos",
    description:
      "Crea el perfil oficial de tu equipo con logo, integrantes, roles y sede. Tu equipo, centralizado.",
    tag: "MVP",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="5" width="20" height="18" rx="2" stroke="#2ECC71" strokeWidth="1.5"/>
        <circle cx="10" cy="12" r="2.5" stroke="#2ECC71" strokeWidth="1.5"/>
        <path d="M16 10h5M16 14h4" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 20c0-2 5-3 5-3s5 1 5 3" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Credencial Digital",
    description:
      "Cada integrante obtiene su credencial con QR verificable. Foto, equipo, rol — listo para enseñar.",
    tag: "MVP",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M8 4h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="#2ECC71" strokeWidth="1.5"/>
        <path d="M10 10h8M10 14h8M10 18h5" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Documentos Oficiales",
    description:
      "GN, SSP, Policía Municipal, SCT — todos los documentos para transportar réplicas en un solo lugar.",
    tag: "MVP",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 10c0-2 1.5-4 4-4h8c2.5 0 4 2 4 4v4c0 4-3 8-8 8s-8-4-8-8v-4Z" stroke="#2ECC71" strokeWidth="1.5"/>
        <path d="M10 14l2 2 4-4" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 4v2M10 5l1 1.5M18 5l-1 1.5" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Registro de Réplicas",
    description:
      "Número de serie, historial de propietarios, transferencia entre usuarios. Tu réplica, rastreable — como el REPUVE.",
    tag: "MVP",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke="#F97316" strokeWidth="1.5"/>
        <path d="M14 9v5l3 3" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Tienda AirNation",
    description:
      "Equipo táctico, réplicas y accesorios de la marca directamente en la plataforma que ya usas.",
    tag: "Próximamente",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 20l5-5 4 4 5-6 6 7" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8h4M4 12h6M4 16h3" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Eventos y Partidas",
    description:
      "Publica y encuentra partidas en tu ciudad. Big games, domingos y MilSim — toda la agenda aquí.",
    tag: "Próximamente",
  },
];

export default function Features() {
  return (
    <section id="funciones" className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-air-border" />
            <span className="font-mono text-xs text-air-muted tracking-widest uppercase">Funciones</span>
            <div className="h-px flex-1 bg-air-border" />
          </div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] text-center text-air-text tracking-wider leading-none">
            TODO LO QUE NECESITAS
            <br />
            <span className="text-gradient-green">EN UN SOLO LUGAR</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-xl border border-air-border bg-air-surface hover:border-air-green/30 transition-all duration-300 hover:bg-air-surface/80"
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "radial-gradient(ellipse at 30% 30%, rgba(46,204,113,0.04), transparent 60%)" }}
              />

              <div className="relative">
                {/* Tag */}
                <span className={`inline-block mb-4 px-2 py-0.5 rounded text-xs font-mono ${
                  f.tag === "MVP"
                    ? "bg-air-green/10 text-air-green border border-air-green/20"
                    : "bg-air-orange/10 text-air-orange border border-air-orange/20"
                }`}>
                  {f.tag}
                </span>

                <div className="mb-4">{f.icon}</div>
                <h3 className="font-display text-2xl tracking-wider text-air-text mb-2">{f.title}</h3>
                <p className="font-body text-air-text-dim text-sm leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
