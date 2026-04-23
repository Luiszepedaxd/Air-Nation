import { getStr, jost, lato } from './_shared'

export function HeroSection({ config }: { config: Record<string, unknown> }) {
  const imagen = getStr(config, 'imagen_url')
  const eyebrow = getStr(config, 'eyebrow', 'COBERTURA OFICIAL · 16–17 MAYO 2026')
  const titulo = getStr(config, 'titulo', 'OP. BLOOD MONEY 2')
  const subtitulo = getStr(
    config,
    'subtitulo',
    'El evento más esperado del año llega a Aguascalientes. AirNation es sponsor oficial.'
  )
  const cta1Texto = getStr(config, 'cta1_texto', 'CREAR CUENTA EN AIRNATION')
  const cta1Link = getStr(config, 'cta1_link', '/register')
  const cta2Texto = getStr(config, 'cta2_texto', 'COMPRAR BOLETO EN AEM')
  const cta2Link = getStr(
    config,
    'cta2_link',
    'https://www.airsoftexperiencemexico.com/bloodmoney'
  )

  return (
    <section className="relative w-full overflow-hidden bg-[#0A0A0A] text-white">
      {imagen ? (
        <>
          <img
            src={imagen}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/80" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#1a0a0a_0%,#0A0A0A_50%,#2a0808_100%)]" />
      )}

      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-start justify-center gap-5 px-5 py-20 md:min-h-[78vh] md:px-10 md:py-28">
        <span
          className="inline-block bg-[#CC4B37] px-3 py-1.5 text-[10px] tracking-[0.18em] text-white md:text-[11px]"
          style={jost}
        >
          {eyebrow}
        </span>
        <h1
          className="max-w-[20ch] text-[2.3rem] leading-[0.95] tracking-[0.02em] md:text-[4.5rem]"
          style={jost}
        >
          {titulo}
        </h1>
        <p
          className="max-w-[48ch] text-[14px] leading-[1.55] text-white/85 md:text-[17px]"
          style={lato}
        >
          {subtitulo}
        </p>
        <div className="mt-3 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={cta1Link}
            className="inline-flex items-center justify-center bg-[#CC4B37] px-6 py-3.5 text-[11px] tracking-[0.14em] text-white transition-opacity hover:opacity-90"
            style={jost}
          >
            {cta1Texto}
          </a>
          <a
            href={cta2Link}
            target={cta2Link.startsWith('http') ? '_blank' : undefined}
            rel={cta2Link.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center justify-center border border-white/70 bg-transparent px-6 py-3.5 text-[11px] tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white/10"
            style={jost}
          >
            {cta2Texto}
          </a>
        </div>
      </div>
    </section>
  )
}
