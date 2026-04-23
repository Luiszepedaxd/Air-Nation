import { getStr, jost, lato } from './_shared'

const DEFAULT_CUERPO =
  'Un activo blindado en campo que cambia el balance de cada escenario. Alta resistencia a impactos, armamento pesado simulado y reglas especiales de neutralización: quien lo controle, controla el mapa.'

export function JuggernautSection({ config }: { config: Record<string, unknown> }) {
  const imagen = getStr(config, 'imagen_url')
  const eyebrow = getStr(config, 'eyebrow', 'ACTIVO TÁCTICO')
  const titulo = getStr(config, 'titulo', 'JUGGERNAUT')
  const cuerpo = getStr(config, 'cuerpo', DEFAULT_CUERPO)

  const paragraphs = cuerpo.split('\n').filter((p) => p.trim().length > 0)

  return (
    <section className="w-full bg-[#0A0A0A] py-16 text-white md:py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 md:grid-cols-[1.2fr,1fr] md:items-center md:gap-12 md:px-10">
        <div className="flex flex-col gap-5">
          <span
            className="inline-block w-fit border-l-2 border-[#CC4B37] pl-3 text-[10px] tracking-[0.18em] text-[#CC4B37] md:text-[11px]"
            style={jost}
          >
            {eyebrow}
          </span>
          <h2
            className="text-[2rem] leading-[1] tracking-[0.02em] md:text-[3.8rem]"
            style={jost}
          >
            {titulo}
          </h2>
          <div className="flex flex-col gap-3">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-[1.65] text-white/75 md:text-[17px]"
                style={lato}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#111111] md:aspect-[4/5]">
          {imagen ? (
            <img src={imagen} alt={titulo} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1a0a0a,#2b0505)] text-white/10">
              <span className="text-[3rem]" style={jost}>JGN</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
