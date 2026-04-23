import { getStr, jost, lato } from './_shared'

const FACCIONES_DEFAULT = [
  {
    nombre: 'USASF',
    desc: 'Fuerza de tarea regular. Disciplina, potencia de fuego y dominio territorial.',
  },
  {
    nombre: 'RESISTENCIA',
    desc: 'Insurgencia local. Guerrilla, emboscada y movimiento rápido en terreno difícil.',
  },
  {
    nombre: 'NOVA',
    desc: 'Corporación privada. Tecnología de punta y reglas propias del contrato.',
  },
  {
    nombre: 'MERCENARIOS',
    desc: 'Sin bandera. Cobran en efectivo, juegan para el mejor postor.',
  },
]

export function FaccionesSection({ config }: { config: Record<string, unknown> }) {
  const titulo = getStr(config, 'titulo', '¿DE QUÉ LADO ESTARÁS?')

  const facciones = [1, 2, 3, 4].map((i) => ({
    nombre: getStr(config, `f${i}_nombre`, FACCIONES_DEFAULT[i - 1].nombre),
    desc: getStr(config, `f${i}_desc`, FACCIONES_DEFAULT[i - 1].desc),
    imagen: getStr(config, `f${i}_imagen`),
  }))

  return (
    <section className="w-full bg-[#0A0A0A] py-16 text-white md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <h2
          className="text-[1.8rem] leading-[1.05] tracking-[0.02em] md:text-[3rem]"
          style={jost}
        >
          {titulo}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mt-12 md:gap-5 lg:grid-cols-4">
          {facciones.map((f, i) => (
            <article
              key={i}
              className="group relative flex flex-col overflow-hidden border border-white/10 bg-[#111111] transition-colors hover:border-[#CC4B37]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1a0a0a]">
                {f.imagen ? (
                  <img
                    src={f.imagen}
                    alt={f.nombre}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1a0a0a,#330505)]">
                    <span
                      className="text-[2.4rem] leading-none text-white/10"
                      style={jost}
                    >
                      {f.nombre.slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="absolute left-0 top-0 bg-[#CC4B37] px-2.5 py-1 text-[9px] tracking-[0.18em]" style={jost}>
                  0{i + 1}
                </div>
              </div>
              <div className="flex flex-col gap-2 p-5">
                <h3 className="text-[16px] tracking-[0.08em] md:text-[18px]" style={jost}>
                  {f.nombre}
                </h3>
                <p className="text-[13px] leading-[1.55] text-white/70" style={lato}>
                  {f.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
