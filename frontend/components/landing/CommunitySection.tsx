import Link from "next/link";

const STATS = [
  { num: "200k+",  label: "Réplicas esperando ser registradas"  },
  { num: "N.º 1",  label: "Plataforma diseñada por jugadores",  accent: true },
  { num: "México", label: "Primer mercado — escala global"       },
];

export default function CommunitySection() {
  return (
    <section id="comunidad" className="bg-[#F4F4F4] py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">

        <div className="relative overflow-hidden bg-[#F4F4F4] border border-an-border">

          {/* Mitad derecha: foto + velo */}
          <div className="absolute inset-y-0 right-0 z-0 hidden w-1/2 overflow-hidden lg:block">
            <img
              src="/comunidad-foto-1.jpg"
              alt="Comunidad de airsoft"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[#F4F4F4]/40" aria-hidden />
          </div>

          <div className="relative z-10 max-w-2xl px-8 sm:px-12 lg:px-16 py-14 sm:py-20">

            <div className="flex items-center gap-3 mb-6">
              <span className="block w-7 h-[2px] bg-an-accent" />
              <p className="font-body font-bold text-an-accent text-[0.65rem] uppercase tracking-[0.28em]">
                Comunidad
              </p>
            </div>

            <h2
              className="font-display font-black uppercase text-an-text leading-[0.9] mb-6"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.8rem)" }}
            >
              ¿QUIERES CAMBIAR
              <br />
              EL AIRSOFT?
            </h2>

            <p className="font-body text-an-text-dim text-base sm:text-[1.05rem] leading-[1.7] mb-10">
              AirNation nació de la comunidad. Cada perfil, cada credencial y cada réplica registrada construye la plataforma que todos queríamos.
            </p>

            <div className="grid grid-cols-3 gap-px bg-an-border mb-10">
              {STATS.map(({ num, label, accent }) => (
                <div
                  key={label}
                  className={`flex flex-col items-center text-center py-5 px-3 ${
                    accent ? "bg-an-accent" : "bg-an-surface2"
                  }`}
                >
                  <span className={`font-display font-black text-xl sm:text-2xl uppercase leading-none ${
                    accent ? "text-white" : "text-an-text"
                  }`}>
                    {num}
                  </span>
                  <span className={`font-body text-[0.58rem] sm:text-[0.62rem] uppercase tracking-[0.1em] mt-1.5 leading-snug ${
                    accent ? "text-white/80" : "text-an-text-dim"
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-[1.1rem] bg-an-accent text-white font-body font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-an-accent-h transition-colors"
              >
                Únete gratis
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                    stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-[1.1rem] border border-an-border text-an-text-dim font-body font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:border-an-text-dim hover:text-an-text transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
