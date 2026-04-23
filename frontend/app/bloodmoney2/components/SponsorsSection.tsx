import { getList, getStr, jost, lato } from './_shared'

export function SponsorsSection({ config }: { config: Record<string, unknown> }) {
  const titulo = getStr(config, 'titulo', 'PATROCINADORES OFICIALES')
  const logos = getList(config, 'logos')

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

        {logos.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 items-center gap-6 sm:grid-cols-3 md:mt-14 md:grid-cols-4 md:gap-10 lg:grid-cols-6">
            {logos.map((url, i) => (
              <div
                key={i}
                className="flex aspect-[3/2] items-center justify-center p-4 transition-all"
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="max-h-full max-w-full object-contain grayscale opacity-60 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
                />
              </div>
            ))}
          </div>
        ) : (
          <p
            className="mt-10 text-center text-[13px] text-[#AAAAAA]"
            style={lato}
          >
            Patrocinadores por anunciar.
          </p>
        )}
      </div>
    </section>
  )
}
