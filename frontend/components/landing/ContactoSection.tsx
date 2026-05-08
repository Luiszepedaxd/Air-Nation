import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { ContactoForm } from './ContactoForm'

export default function ContactoSection() {
  return (
    <section
      id="contacto"
      className="relative bg-[#111111] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="pointer-events-none absolute inset-0 z-0 opacity-30" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 15% 30%, rgba(204, 75, 55, 0.4) 0%, transparent 50%), radial-gradient(circle at 85% 70%, rgba(204, 75, 55, 0.25) 0%, transparent 50%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
          {/* Columna izquierda: editorial */}
          <RevealOnScroll>
            <div>
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Hablemos
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.92] text-white"
                style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4.5rem)' }}
              >
                ¿BUSCAS PATROCINIO
                <br />
                O QUIERES DAR
                <br />
                <span className="text-[#CC4B37]">FEEDBACK?</span>
              </h2>
              <p className="mt-6 max-w-md font-body text-base leading-[1.7] text-white/70 sm:text-[1.05rem]">
                AirNation está construido con y para la comunidad airsoftera mexicana. Si tu evento necesita visibilidad, tienes una idea para mejorar la plataforma o quieres explorar una alianza, escríbenos.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  'Patrocinio de tu evento con landing dedicada',
                  'Feedback o sugerencias sobre la plataforma',
                  'Alianzas comerciales, marcas y campos',
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
                    <span className="font-body text-[0.95rem] text-white/85">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-8 font-body text-[0.85rem] text-white/55">
                Te responderemos en menos de 48 horas.
              </p>
            </div>
          </RevealOnScroll>

          {/* Columna derecha: formulario */}
          <RevealOnScroll delay={0.15}>
            <ContactoForm />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  )
}
