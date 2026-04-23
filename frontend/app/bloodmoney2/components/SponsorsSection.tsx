import { getList, getStr, jost, lato } from './_shared'

export function SponsorsSection({ config }: { config: Record<string, unknown> }) {
  const titulo = getStr(config, 'titulo', 'PATROCINADORES OFICIALES')
  const logos = getList(config, 'logos')

  // Duplicar el array para el loop continuo.
  const doubled = logos.length > 0 ? [...logos, ...logos] : []

  return (
    <section className="w-full bg-[#F7F5F3] py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className="text-[10px] tracking-[0.18em] text-[#999999]"
            style={jost}
          >
            GRACIAS A
          </span>
          <h2
            className="text-[1.5rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[2.2rem]"
            style={jost}
          >
            {titulo}
          </h2>
          <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
            Organizado por Airsoft Experience México (AEM)
          </p>
        </div>
      </div>

      {logos.length > 0 ? (
        <div
          className="mt-10 w-full overflow-hidden md:mt-14"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0, black 40px, black calc(100% - 40px), transparent 100%)',
          }}
        >
          <div
            className="flex w-max items-center gap-10 md:gap-16"
            style={{
              animation: 'bm2-sponsors-scroll 30s linear infinite',
            }}
          >
            {doubled.map((url, i) => (
              <div
                key={i}
                className="flex h-16 w-28 shrink-0 items-center justify-center md:h-20 md:w-36"
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="max-h-full max-w-full object-contain opacity-60 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p
          className="mt-10 text-center text-[13px] text-[#AAAAAA]"
          style={lato}
        >
          Patrocinadores por anunciar.
        </p>
      )}

      <style>{`
        @keyframes bm2-sponsors-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="bm2-sponsors-scroll"] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
