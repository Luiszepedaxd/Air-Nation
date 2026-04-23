import { getStr, jost, lato } from './_shared'

const DEFAULT_NOTA =
  'La venta de boletos la opera Airsoft Experience México (AEM). AirNation es sponsor oficial: te llevamos la cobertura, pero tu entrada se compra en el sitio oficial del evento.'

export function EntradasSection({ config }: { config: Record<string, unknown> }) {
  const notaSuperior = getStr(config, 'nota_superior', DEFAULT_NOTA)
  const precioIndividual = getStr(config, 'precio_individual', '$1,499.00')
  const comisionIndividual = getStr(config, 'comision_individual', '+$37.48')
  const teamPassPrecio = getStr(config, 'team_pass_precio', '$4,998')
  const teamPassEstado = getStr(config, 'team_pass_estado', 'Venta finalizada')
  const fechaCierre = getStr(config, 'fecha_cierre_venta', '10 mayo, 11:50 p.m.')
  const ctaTexto = getStr(
    config,
    'cta_texto',
    'COMPRAR EN AIRSOFTEXPERIENCEMEXICO.COM'
  )
  const ctaLink = getStr(
    config,
    'cta_link',
    'https://www.airsoftexperiencemexico.com/bloodmoney'
  )

  const pases = [
    { tag: 'SÁBADO', titulo: 'Pase día 1', desc: 'Jornada completa de operaciones.' },
    { tag: 'DOMINGO', titulo: 'Pase día 2', desc: 'Cierre del conflicto.' },
    { tag: '2 DÍAS', titulo: 'Pase general', desc: 'Acceso a ambas jornadas.' },
    { tag: 'EXTRA', titulo: 'Acceso VIP', desc: 'Zonas y horarios especiales.' },
  ]

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <h2
          className="text-[1.8rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[3rem]"
          style={jost}
        >
          ENTRADAS
        </h2>
        <p className="mt-4 max-w-[70ch] text-[14px] leading-[1.65] text-[#666666] md:text-[15px]" style={lato}>
          {notaSuperior}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
          {pases.map((p, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 border border-[#E5E0DA] bg-[#FAF8F5] p-5"
            >
              <span
                className="w-fit bg-[#111111] px-2 py-1 text-[9px] tracking-[0.18em] text-white"
                style={jost}
              >
                {p.tag}
              </span>
              <div>
                <h3 className="text-[16px] text-[#111111]" style={jost}>
                  {p.titulo}
                </h3>
                <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
                  {p.desc}
                </p>
              </div>
              <div className="mt-auto flex items-baseline gap-2">
                <span className="text-[22px] text-[#111111]" style={jost}>
                  {precioIndividual}
                </span>
                <span className="text-[11px] text-[#999999]" style={lato}>
                  {comisionIndividual}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-2 border-[#CC4B37] bg-[rgba(204,75,55,0.05)] p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span
              className="text-[10px] tracking-[0.18em] text-[#CC4B37]"
              style={jost}
            >
              TEAM PASS · 2 JUGADORES
            </span>
            <p className="text-[15px] text-[#111111]" style={lato}>
              <strong style={{ fontWeight: 700, fontSize: 20 }}>{teamPassPrecio}</strong>
              <span className="ml-2 text-[13px] text-[#999999]">{teamPassEstado}</span>
            </p>
          </div>
          <p className="text-[12px] text-[#666666]" style={lato}>
            Cierre de venta: <strong style={{ fontWeight: 700 }}>{fechaCierre}</strong>
          </p>
        </div>

        <a
          href={ctaLink}
          target={ctaLink.startsWith('http') ? '_blank' : undefined}
          rel={ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="mt-6 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 text-[11px] tracking-[0.14em] text-white transition-opacity hover:opacity-90 md:w-fit"
          style={jost}
        >
          {ctaTexto}
        </a>
      </div>
    </section>
  )
}
