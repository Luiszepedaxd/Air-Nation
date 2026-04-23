import { getStr, jost, lato } from './_shared'

const DEFAULT_CUERPO =
  'Blood Money 2 es la segunda edición del evento de airsoft más esperado del país: dos días de operaciones, 4 facciones en conflicto, un Juggernaut en campo, invitado VIP confirmado y escenarios diseñados para llevar la narrativa al límite.\nAirNation es sponsor oficial y documenta cada movimiento desde adentro.'

export function EventoSection({ config }: { config: Record<string, unknown> }) {
  const eyebrow = getStr(config, 'eyebrow', 'EL EVENTO')
  const titulo = getStr(config, 'titulo', 'QUÉ ES BLOOD MONEY 2')
  const cuerpo = getStr(config, 'cuerpo', DEFAULT_CUERPO)

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
        <div className="mt-6 flex flex-col gap-4 md:mt-8">
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
      </div>
    </section>
  )
}
