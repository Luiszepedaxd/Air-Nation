import { getStr, jost, lato } from './_shared'

const FACCIONES_DEFAULT = [
  {
    nombre: 'USASF',
    desc: 'Fuerzas desplegadas por Estados Unidos para asegurar activos estratégicos. Línea de orden. Control institucional.',
  },
  {
    nombre: 'RESISTENCIA',
    desc: 'Movimiento civil levantado contra el sistema colapsado. Sin estructura formal. Convicción por encima del número.',
  },
  {
    nombre: 'NOVA',
    desc: 'Fuerza alineada con intereses del bloque ruso. Doctrina rígida. Disciplina de operación.',
  },
  {
    nombre: 'MERCENARIOS',
    desc: 'Sin bandera, sin lealtad. Historia de victorias en AEM. Precisión y resultado.',
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

        {/* Mobile: carrusel horizontal con scroll-snap — oculto en md+ */}
        <div className="mt-8 md:hidden">
          <div
            className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {facciones.map((f, i) => (
              <FaccionCard
                key={i}
                facc={f}
                index={i}
                className="w-[82%] shrink-0 snap-start"
              />
            ))}
          </div>

          {/* Dots indicadores */}
          <div className="mt-2 flex justify-center gap-1.5">
            {facciones.map((_, i) => (
              <span
                key={i}
                className="h-1 w-6 bg-white/20"
                aria-hidden
              />
            ))}
          </div>

          {/* Hint swipe */}
          <p
            className="mt-3 text-center text-[10px] tracking-[0.14em] text-white/40"
            style={jost}
          >
            DESLIZA PARA VER LAS 4 FACCIONES →
          </p>
        </div>

        {/* Desktop: grid 2×2 / 4 cols — oculto en mobile */}
        <div className="mt-8 hidden grid-cols-2 gap-3 md:mt-12 md:grid md:gap-5 lg:grid-cols-4">
          {facciones.map((f, i) => (
            <FaccionCard key={i} facc={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FaccionCard({
  facc,
  index,
  className = '',
}: {
  facc: { nombre: string; desc: string; imagen: string }
  index: number
  className?: string
}) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden border border-white/10 bg-[#111111] transition-colors hover:border-[#CC4B37] ${className}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1a0a0a]">
        {facc.imagen ? (
          <img
            src={facc.imagen}
            alt={facc.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1a0a0a,#330505)]">
            <span
              className="text-[2.4rem] leading-none text-white/10"
              style={jost}
            >
              {facc.nombre.slice(0, 2)}
            </span>
          </div>
        )}
        <div
          className="absolute left-0 top-0 bg-[#CC4B37] px-2.5 py-1 text-[9px] tracking-[0.18em]"
          style={jost}
        >
          0{index + 1}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <h3
          className="text-[16px] tracking-[0.08em] md:text-[18px]"
          style={jost}
        >
          {facc.nombre}
        </h3>
        <p className="text-[13px] leading-[1.55] text-white/70" style={lato}>
          {facc.desc}
        </p>
      </div>
    </article>
  )
}
