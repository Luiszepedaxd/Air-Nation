import { getStr, jost, lato } from './_shared'

export function LogisticaSection({ config }: { config: Record<string, unknown> }) {
  const fechaInicio = getStr(config, 'fecha_inicio', 'Sábado 16 de mayo, 11:00 a.m.')
  const fechaCierre = getStr(config, 'fecha_cierre', 'Domingo 17 de mayo, 2:00 p.m.')
  const sedeNombre = getStr(config, 'sede_nombre', 'Drinkinteam Gotcha')
  const sedeDireccion = getStr(
    config,
    'sede_direccion',
    'Aguascalientes, Ags. México'
  )
  const sedeMapsUrl = getStr(config, 'sede_maps_url')
  const hotelNombre = getStr(config, 'hotel_nombre')
  const hotelTarifas = getStr(config, 'hotel_tarifas')
  const hotelTelefono = getStr(config, 'hotel_telefono')
  const hotelEmail = getStr(config, 'hotel_email')

  const tarifas = hotelTarifas
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  return (
    <section className="w-full bg-[#F7F5F3] py-16 md:py-24">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <h2
          className="text-[1.6rem] leading-[1.05] tracking-[0.02em] text-[#111111] md:text-[2.6rem]"
          style={jost}
        >
          LOGÍSTICA
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-3 md:gap-5">
          <div className="flex flex-col gap-3 border border-[#E5E0DA] bg-white p-6">
            <span
              className="text-[10px] tracking-[0.18em] text-[#CC4B37]"
              style={jost}
            >
              FECHAS
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-[15px] text-[#111111]" style={lato}>
                <strong style={{ fontWeight: 700 }}>Apertura:</strong> {fechaInicio}
              </p>
              <p className="text-[15px] text-[#111111]" style={lato}>
                <strong style={{ fontWeight: 700 }}>Cierre:</strong> {fechaCierre}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border border-[#E5E0DA] bg-white p-6">
            <span
              className="text-[10px] tracking-[0.18em] text-[#CC4B37]"
              style={jost}
            >
              SEDE
            </span>
            <p className="text-[17px] text-[#111111]" style={jost}>
              {sedeNombre}
            </p>
            <p className="text-[13px] leading-[1.55] text-[#666666]" style={lato}>
              {sedeDireccion}
            </p>
            {sedeMapsUrl ? (
              <a
                href={sedeMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex w-fit items-center gap-1.5 text-[11px] tracking-[0.12em] text-[#CC4B37] hover:underline"
                style={jost}
              >
                VER EN GOOGLE MAPS →
              </a>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border border-[#E5E0DA] bg-white p-6">
            <span
              className="text-[10px] tracking-[0.18em] text-[#CC4B37]"
              style={jost}
            >
              HOSPEDAJE
            </span>
            {hotelNombre ? (
              <p className="text-[17px] text-[#111111]" style={jost}>
                {hotelNombre}
              </p>
            ) : (
              <p className="text-[13px] text-[#999999]" style={lato}>
                Por confirmar
              </p>
            )}
            {tarifas.length > 0 && (
              <ul className="flex flex-col gap-1 text-[13px] text-[#333333]" style={lato}>
                {tarifas.map((t, i) => (
                  <li key={i}>· {t}</li>
                ))}
              </ul>
            )}
            {(hotelTelefono || hotelEmail) && (
              <div className="mt-1 flex flex-col gap-0.5 text-[12px] text-[#666666]" style={lato}>
                {hotelTelefono && <span>Tel: {hotelTelefono}</span>}
                {hotelEmail && <span>Email: {hotelEmail}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
