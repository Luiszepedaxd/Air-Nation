import { getStr, jost, lato } from './_shared'

const DEFAULT_CUERPO =
  'AirNation existe para documentar el airsoft en español como nadie lo ha hecho: feeds de jugadores, perfiles de equipos, cobertura por evento y una tienda con equipo real.\nEn BM2 vamos a estar en el campo, cámara en mano, subiendo contenido en vivo y con los equipos de la comunidad.\nCrea tu cuenta y súmate antes del primer disparo.'

export function AirnationSection({ config }: { config: Record<string, unknown> }) {
  const eyebrow = getStr(config, 'eyebrow', 'AIRNATION EN CAMPO')
  const titulo = getStr(config, 'titulo', '¿POR QUÉ ESTAMOS AQUÍ?')
  const cuerpo = getStr(config, 'cuerpo', DEFAULT_CUERPO)
  const ctaTexto = getStr(config, 'cta_texto', 'CREAR CUENTA GRATIS')
  const ctaLink = getStr(config, 'cta_link', '/register')

  const paragraphs = cuerpo.split('\n').filter((p) => p.trim().length > 0)

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[900px] px-5 md:px-10">
        <span
          className="inline-block border-l-2 border-[#CC4B37] pl-3 text-[10px] tracking-[0.18em] text-[#CC4B37] md:text-[11px]"
          style={jost}
        >
          {eyebrow}
        </span>
        <h2
          className="mt-3 text-[1.8rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[3rem]"
          style={jost}
        >
          {titulo}
        </h2>
        <div className="mt-6 flex flex-col gap-4">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-[15px] leading-[1.7] text-[#333333] md:text-[17px]"
              style={lato}
            >
              {p}
            </p>
          ))}
        </div>
        <a
          href={ctaLink}
          target={ctaLink.startsWith('http') ? '_blank' : undefined}
          rel={ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="mt-7 inline-flex items-center justify-center bg-[#CC4B37] px-6 py-3.5 text-[11px] tracking-[0.14em] text-white transition-opacity hover:opacity-90"
          style={jost}
        >
          {ctaTexto} →
        </a>
      </div>
    </section>
  )
}
