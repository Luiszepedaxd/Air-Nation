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

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#FFFFFF] py-24 sm:py-32 px-5 sm:px-8">

      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-16 sm:mb-20">
          <div className="flex items-center gap-4 mb-5">
            <span className="block w-7 h-[2px] bg-an-accent" />
            <p className="font-body font-bold text-an-accent text-[0.65rem] uppercase tracking-[0.28em]">
              Cómo funciona
            </p>
          </div>
          <h2
            className="font-display font-black uppercase text-an-text leading-[0.9]"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5.2rem)" }}
          >
            SIMPLE.
            <br />
            ASÍ DE SIMPLE.
          </h2>
        </div>

        {/* ── Steps ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="relative">

              {/* Connector line between steps (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-[1.65rem] left-[calc(100%+0.75rem)] right-0 w-6 h-[1px] bg-an-border" />
              )}

              {/* Step num */}
              <div className="flex items-center gap-3 mb-5">
                <span className="font-display font-black text-an-accent text-[2.2rem] leading-none">
                  {step.num}
                </span>
                <span className="flex-1 h-[1px] bg-an-border" />
              </div>

              {/* Title */}
              <h3 className="font-ui font-semibold text-an-text text-[1rem] mb-2.5 leading-snug">
                {step.title}
              </h3>

              {/* Description */}
              <p className="font-body text-an-text-dim text-sm leading-[1.75]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* ── Bottom note ── */}
        <div className="mt-16 pt-10 border-t border-an-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-body text-an-text-dim text-sm">
            Pensado para <span className="text-an-text font-bold">Airsoft</span> — funciona para toda la comunidad en México y más allá.
          </p>
          <a
            href="/signup"
            className="font-body font-bold text-an-accent text-[0.75rem] uppercase tracking-[0.18em] hover:underline underline-offset-4 shrink-0 flex items-center gap-2"
          >
            Empezar ahora
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
