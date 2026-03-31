// No hooks needed
const FEATURES = [
  {
    num: "01",
    tag: "Identidad",
    title: "Perfil de Jugador",
    description:
      "Tu alias, foto, ciudad y rol en un solo lugar. Una página que te representa en toda la comunidad — sin repetirte en cada campo.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <circle cx="11" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3.5 19c0-4 3.36-6 7.5-6s7.5 2 7.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "02",
    tag: "ID",
    title: "Credencial Digital",
    description:
      "Tu identificación con QR verificable. Descárgala una vez, úsala en cualquier campo. Sin impresiones, sin papel.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="2" y="5" width="18" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12.5 9h5M12.5 12h3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "03",
    tag: "Equipos",
    title: "Registro de Equipos",
    description:
      "Crea el perfil de tu equipo, invita integrantes y asígnales roles. Perfil público visible para toda la comunidad.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <circle cx="8" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="14" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1.5 18c0-3 2.9-4.5 6.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8.5 18c0-3 2.46-4.5 5.5-4.5S19.5 15 19.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "04",
    tag: "Legal",
    title: "Documentos Oficiales",
    description:
      "PDFs de GN, SSP, SCT y Policía Municipal organizados y siempre disponibles. Transporte legal de réplicas sin complicaciones.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M7 2h8l4 4v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M15 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 10h8M7 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: "05",
    tag: "Réplicas",
    title: "Registro de Réplicas",
    description:
      "Número de serie, historial de propietarios y transferencias verificables. El REPUVE del airsoft — si la pierdes, ya tienes cómo demostrar que era tuya.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path d="M3 13.5V9a1 1 0 0 1 1-1h11l3 3.5-1 4H4a1 1 0 0 1-1-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M6 8V6.5C6 5.1 7.1 4 8.5 4H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="7.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="15.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
];

const STEPS = [
  {
    num: "01",
    title: "Crea tu cuenta",
    description:
      "Regístrate gratis con tu correo. En menos de dos minutos ya tienes perfil.",
  },
  {
    num: "02",
    title: "Completa tu perfil",
    description:
      "Agrega alias, foto, ciudad y rol. Únete o crea tu equipo.",
  },
  {
    num: "03",
    title: "Genera tu credencial",
    description:
      "Tu ID digital con QR se genera automáticamente. Descárgala o guárdala en el cel.",
  },
  {
    num: "04",
    title: "Registra tus réplicas",
    description:
      "Ingresa número de serie y fotos. Historial permanente, transferencia en un tap.",
  },
];

export default function Features() {
  return (
    <section id="funciones" className="bg-an-bg py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center gap-4 mb-5">
            <span className="block w-7 h-[2px] bg-an-accent" />
            <p className="font-body font-bold text-an-accent text-[0.65rem] uppercase tracking-[0.28em]">
              Funciones
            </p>
          </div>
          <h2
            className="font-display font-black uppercase text-an-text leading-[0.9]"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5.2rem)" }}
          >
            5 HERRAMIENTAS.
            <br />
            UNA PLATAFORMA.
          </h2>
          <p className="font-body text-an-text-dim text-base sm:text-[1.05rem] leading-[1.7] mt-6 max-w-lg">
            Todo lo que la comunidad de airsoft necesitaba — reunido en un solo lugar.
          </p>
        </div>

        {/* ── Grid: 3 + 2 ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`group relative border border-an-border bg-an-bg p-8 sm:p-10 transition-colors duration-300 hover:bg-an-surface hover:shadow-[inset_2px_0_0_0_#CC4B37] ${
                i === 4 ? "lg:col-start-2" : ""
              }`}
            >
              {/* Number + tag row */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-display font-black text-[2.8rem] leading-none text-[#EEEEEE] select-none">
                  {f.num}
                </span>
                <span className="font-body font-bold text-[0.6rem] uppercase tracking-[0.22em] text-an-muted border border-an-border px-2.5 py-1">
                  {f.tag}
                </span>
              </div>

              {/* Icon */}
              <div className="text-an-accent mb-4">{f.icon}</div>

              {/* Title */}
              <h3 className="font-ui font-semibold text-an-text text-[1.05rem] mb-3 leading-snug">
                {f.title}
              </h3>

              {/* Description */}
              <p className="font-body text-an-text-dim text-sm leading-[1.75]">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-[#EEEEEE] pt-12">
          <p className="mb-8 font-body text-sm text-[#444444]">En 4 pasos —</p>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.num}>
                <p className="font-display text-2xl font-black leading-none text-[#CC4B37] sm:text-[1.75rem]">
                  {step.num}
                </p>
                <h3 className="font-ui mt-4 text-sm font-semibold leading-snug text-[#111111] sm:text-base">
                  {step.title}
                </h3>
                <p className="font-body mt-2 text-sm font-normal leading-[1.75] text-[#444444]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
