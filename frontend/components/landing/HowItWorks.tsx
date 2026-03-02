const steps = [
  {
    num: "01",
    title: "Registra tu equipo",
    description: "Crea el perfil de tu equipo con nombre, sede y logo. Invita a tus integrantes y asígnales roles.",
  },
  {
    num: "02",
    title: "Genera credenciales",
    description: "Cada integrante recibe su credencial digital con QR verificable. Descárgala y úsala en el campo.",
  },
  {
    num: "03",
    title: "Registra tus réplicas",
    description: "Ingresa el número de serie de cada réplica. Transfiérela, repórtala o consulta su historial.",
  },
  {
    num: "04",
    title: "Lleva tus documentos",
    description: "Accede a documentación oficial organizada por autoridad. Siempre lista cuando la necesites.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 sm:py-28 px-4 sm:px-6 relative">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(46,204,113,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="mb-12 sm:mb-16 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-air-border" />
            <span className="font-mono text-xs text-air-muted tracking-widest uppercase">Cómo funciona</span>
            <div className="h-px flex-1 bg-air-border" />
          </div>
          <h2 className="font-display text-[clamp(2.5rem,6vw,5rem)] text-air-text tracking-wider leading-none">
            SIMPLE.<br />
            <span className="text-gradient-green">ASÍ DE SIMPLE.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col">
              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-1rem)] w-8 h-px bg-air-border z-10" />
              )}

              <div className="p-6 rounded-xl border border-air-border bg-air-surface hover:border-air-green/20 transition-colors">
                {/* Step number */}
                <span className="font-display text-5xl text-air-green/20 leading-none block mb-4">
                  {step.num}
                </span>
                <h3 className="font-display text-xl tracking-wider text-air-text mb-2">{step.title}</h3>
                <p className="font-body text-air-text-dim text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="mt-16 text-center">
          <p className="font-body text-air-text-dim text-sm">
            Enfocado 100% en{" "}
            <span className="text-air-green">Airsoft</span> para la comunidad en México.
          </p>
        </div>
      </div>
    </section>
  );
}
