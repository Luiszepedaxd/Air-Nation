import { getStr, jost, lato } from './_shared'

export function CtaFinalSection({ config }: { config: Record<string, unknown> }) {
  const titulo = getStr(config, 'titulo', 'NOS VEMOS EN AGUASCALIENTES')
  const subtitulo = getStr(
    config,
    'subtitulo',
    '16–17 mayo 2026. Crea tu cuenta en AirNation y no te pierdas la cobertura oficial del evento.'
  )
  const cta1Texto = getStr(config, 'cta1_texto', 'CREAR CUENTA')
  const cta1Link = getStr(config, 'cta1_link', '/register')
  const cta2Texto = getStr(config, 'cta2_texto', 'SITIO OFICIAL DEL EVENTO')
  const cta2Link = getStr(
    config,
    'cta2_link',
    'https://www.airsoftexperiencemexico.com/bloodmoney'
  )

  return (
    <section className="w-full bg-[#CC4B37] py-16 text-white md:py-24">
      <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6 px-5 text-center md:px-10">
        <h2
          className="text-[2rem] leading-[1] tracking-[0.02em] md:text-[3.8rem]"
          style={jost}
        >
          {titulo}
        </h2>
        <p
          className="max-w-[55ch] text-[15px] leading-[1.6] text-white/90 md:text-[17px]"
          style={lato}
        >
          {subtitulo}
        </p>
        <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href={cta1Link}
            target={cta1Link.startsWith('http') ? '_blank' : undefined}
            rel={cta1Link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center bg-white px-6 py-3.5 text-[11px] tracking-[0.14em] text-[#CC4B37] transition-opacity hover:opacity-90"
            style={jost}
          >
            {cta1Texto}
          </a>
          <a
            href={cta2Link}
            target={cta2Link.startsWith('http') ? '_blank' : undefined}
            rel={cta2Link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center border border-white bg-transparent px-6 py-3.5 text-[11px] tracking-[0.14em] text-white transition-colors hover:bg-white/10"
            style={jost}
          >
            {cta2Texto}
          </a>
        </div>
      </div>
    </section>
  )
}
