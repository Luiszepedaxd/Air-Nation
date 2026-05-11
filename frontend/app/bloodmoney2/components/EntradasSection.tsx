import { getStr, jost, lato } from './_shared'

const DEFAULT_NOTA =
  'La venta de boletos la opera Airsoft Experience México (AEM). AirNation es sponsor oficial: te llevamos la cobertura, pero tu entrada se compra en el sitio oficial del evento, donde verás inclusiones, facciones disponibles y todo el detalle.'

/**
 * Detecta si un estado representa "agotado / venta cerrada".
 * Acepta variantes: "agotado", "agotados", "venta finalizada",
 * "finalizada", "vendido", "sold out".
 */
function estaAgotado(estado: string): boolean {
  if (!estado || estado.trim().length === 0) return false
  return /agotad|finaliz|vendido|sold\s*out/i.test(estado)
}

function splitPrice(raw: string): [string, string | null] {
  const match = raw.trim().match(/^(.+?)[.,](\d{2})$/)
  if (!match) return [raw.trim(), null]
  return [match[1], match[2]]
}

function PriceDisplay({
  value,
  size = 'lg',
}: {
  value: string
  size?: 'lg' | 'md'
}) {
  const [entero, cents] = splitPrice(value)
  const enteroCls =
    size === 'lg' ? 'text-[32px] md:text-[40px]' : 'text-[22px] md:text-[26px]'
  const centsCls =
    size === 'lg' ? 'text-[13px] md:text-[15px]' : 'text-[10px] md:text-[11px]'
  return (
    <span className="inline-flex items-start leading-none" style={jost}>
      <span className={`${enteroCls} text-[#111111]`}>{entero}</span>
      {cents ? (
        <span
          className={`${centsCls} ml-0.5 mt-[2px] text-[#111111]`}
          aria-label={`punto ${cents}`}
        >
          {cents}
        </span>
      ) : null}
    </span>
  )
}

export function EntradasSection({ config }: { config: Record<string, unknown> }) {
  const notaSuperior = getStr(config, 'nota_superior', DEFAULT_NOTA)
  const precioIndividual = getStr(config, 'precio_individual', '$1,499.00')
  const comisionIndividual = getStr(config, 'comision_individual', '+$37.48')
  const paseIndividualEstado = getStr(config, 'pase_individual_estado', '')
  const teamPassPrecio = getStr(config, 'team_pass_precio', '$4,998.00')
  const teamPassComision = getStr(config, 'team_pass_comision', '+$124.95')
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

  const individualAgotado = estaAgotado(paseIndividualEstado)
  const teamPassAgotado = estaAgotado(teamPassEstado)
  const todoAgotado = individualAgotado && teamPassAgotado

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <h2
          className="text-[1.8rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[3rem]"
          style={jost}
        >
          ENTRADAS
        </h2>
        <p
          className="mt-4 max-w-[70ch] text-[14px] leading-[1.65] text-[#666666] md:text-[15px]"
          style={lato}
        >
          {notaSuperior}
        </p>

        {todoAgotado && (
          <div className="mt-6 inline-flex items-center gap-2 border-2 border-[#CC4B37] bg-[rgba(204,75,55,0.06)] px-4 py-2.5">
            <span
              className="inline-block h-2 w-2 rounded-full bg-[#CC4B37]"
              aria-hidden
            />
            <span
              className="text-[11px] tracking-[0.14em] text-[#CC4B37]"
              style={jost}
            >
              BOLETOS AGOTADOS · NOS VEMOS EN CAMPO
            </span>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {/* Card 1 — Pase Individual */}
          <div
            className={`flex flex-col gap-5 border p-6 md:p-7 ${
              individualAgotado
                ? 'border-[#E5E0DA] bg-[#F5F3EF]'
                : 'border-[#E5E0DA] bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`px-2.5 py-1 text-[9px] tracking-[0.18em] text-white ${
                  individualAgotado ? 'bg-[#999999]' : 'bg-[#111111]'
                }`}
                style={jost}
              >
                PASE INDIVIDUAL
              </span>
              {individualAgotado ? (
                <span
                  className="text-[10px] tracking-[0.14em] text-[#CC4B37]"
                  style={jost}
                >
                  AGOTADO
                </span>
              ) : (
                <span
                  className="text-[10px] tracking-[0.14em] text-[#999999]"
                  style={jost}
                >
                  4 FACCIONES
                </span>
              )}
            </div>

            <div>
              <h3 className="text-[18px] text-[#111111] md:text-[20px]" style={jost}>
                ACCESO AL EVENTO
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-[#666666]" style={lato}>
                Entrada para una sola facción (USASF, Resistencia, NOVA o Mercenarios). Inclusiones y detalle completo en el sitio oficial.
              </p>
            </div>

            <div className="mt-auto flex items-end justify-between">
              <div
                className={`flex flex-col gap-1 ${
                  individualAgotado ? 'opacity-50' : ''
                }`}
              >
                <PriceDisplay value={precioIndividual} size="lg" />
                <span className="text-[11px] text-[#999999]" style={lato}>
                  {comisionIndividual} de comisión
                </span>
              </div>
              <span
                className={`text-[10px] tracking-[0.14em] ${
                  individualAgotado ? 'text-[#CC4B37]' : 'text-[#666666]'
                }`}
                style={jost}
              >
                {individualAgotado
                  ? paseIndividualEstado.toUpperCase()
                  : `CIERRE ${fechaCierre.toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* Card 2 — Team Pass */}
          <div
            className={`flex flex-col gap-5 border-2 p-6 md:p-7 ${
              teamPassAgotado
                ? 'border-[#E5E0DA] bg-[#F5F3EF]'
                : 'border-[#CC4B37] bg-[rgba(204,75,55,0.05)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`px-2.5 py-1 text-[9px] tracking-[0.18em] text-white ${
                  teamPassAgotado ? 'bg-[#999999]' : 'bg-[#CC4B37]'
                }`}
                style={jost}
              >
                TEAM PASS · 5 OPERADORES
              </span>
              {teamPassAgotado ? (
                <span
                  className="text-[10px] tracking-[0.14em] text-[#CC4B37]"
                  style={jost}
                >
                  AGOTADO
                </span>
              ) : (
                <span
                  className="text-[10px] tracking-[0.14em] text-[#666666]"
                  style={jost}
                >
                  EDICIÓN LIMITADA
                </span>
              )}
            </div>

            <div>
              <h3 className="text-[18px] text-[#111111] md:text-[20px]" style={jost}>
                PAQUETE PARA ESCUADRA
              </h3>
              <p className="mt-2 text-[13px] leading-[1.55] text-[#666666]" style={lato}>
                Pase grupal para 5 operadores en una misma facción. Incluye parche de edición. Detalle en el sitio oficial.
              </p>
            </div>

            <div className="mt-auto flex items-end justify-between">
              <div
                className={`flex flex-col gap-1 ${
                  teamPassAgotado ? 'opacity-50' : ''
                }`}
              >
                <PriceDisplay value={teamPassPrecio} size="lg" />
                <span className="text-[11px] text-[#999999]" style={lato}>
                  {teamPassComision} de comisión
                </span>
              </div>
              <span
                className={`text-[10px] tracking-[0.14em] ${
                  teamPassAgotado ? 'text-[#CC4B37]' : 'text-[#666666]'
                }`}
                style={jost}
              >
                {teamPassEstado.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {todoAgotado ? (
          <div
            aria-disabled
            className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center bg-[#999999] px-6 py-4 text-[11px] tracking-[0.14em] text-white opacity-80 md:w-fit"
            style={jost}
          >
            BOLETOS AGOTADOS — VENTA CERRADA
          </div>
        ) : (
          <a
            href={ctaLink}
            target={ctaLink.startsWith('http') ? '_blank' : undefined}
            rel={ctaLink.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="mt-6 inline-flex w-full items-center justify-center bg-[#CC4B37] px-6 py-4 text-[11px] tracking-[0.14em] text-white transition-opacity hover:opacity-90 md:w-fit"
            style={jost}
          >
            {ctaTexto} →
          </a>
        )}

        <p className="mt-4 text-[11px] leading-[1.55] text-[#999999]" style={lato}>
          {todoAgotado
            ? 'La venta de boletos cerró. Si compraste boleto, llega con tu QR el día del evento. Te esperamos en Aguascalientes.'
            : 'Al hacer clic sales de AirNation y entras al sitio oficial de AEM, donde completas tu compra.'}
        </p>
      </div>
    </section>
  )
}
