import { getStr, jost, lato } from './_shared'

const DEFAULT_CUERPO =
  'Creador de contenido y referente del airsoft en habla hispana. Su presencia en BM2 garantiza cobertura masiva y un plus de intensidad para toda la comunidad.'

export function VipSection({ config }: { config: Record<string, unknown> }) {
  const imagen = getStr(config, 'imagen_url')
  const eyebrow = getStr(config, 'eyebrow', 'VIP CONFIRMADO')
  const titulo = getStr(config, 'titulo', 'YIO AIRSOFT')
  const cuerpo = getStr(config, 'cuerpo', DEFAULT_CUERPO)

  const paragraphs = cuerpo.split('\n').filter((p) => p.trim().length > 0)

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-5 md:grid-cols-[1fr,1.2fr] md:items-center md:gap-12 md:px-10">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0A0A0A] md:order-1">
          {imagen ? (
            <img src={imagen} alt={titulo} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0A0A0A,#1a1a1a)] text-white/10">
              <span className="text-[4rem]" style={jost}>VIP</span>
            </div>
          )}
          <div className="absolute left-0 top-4 bg-[#CC4B37] px-3 py-1.5 text-[10px] tracking-[0.18em] text-white" style={jost}>
            {eyebrow}
          </div>
        </div>
        <div className="flex flex-col gap-5 md:order-2">
          <h2
            className="text-[2rem] leading-[1] tracking-[0.02em] text-[#111111] md:text-[3.8rem]"
            style={jost}
          >
            {titulo}
          </h2>
          <div className="flex flex-col gap-3">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-[1.65] text-[#333333] md:text-[17px]"
                style={lato}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
