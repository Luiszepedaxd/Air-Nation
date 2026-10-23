import Link from 'next/link'
import type { ArenaFichaPublica } from '@/lib/arena-api'
import { formatCentavos } from '@/components/arena/MoneyText'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const UNIDAD: Record<string, string> = {
  por_persona: 'por persona',
  por_reserva: 'por reserva',
  por_unidad: 'por unidad',
}

/** Paquetes y derechos de campo con precio, en la ficha pública. */
export function ArenaPaquetes({
  slug,
  ficha,
}: {
  slug: string
  ficha: ArenaFichaPublica
}) {
  const base = ficha.items.filter((i) => i.es_base)
  // Galería de /admin/arena/landing; un backend viejo no la manda.
  const fotosLanding = ficha.arena.fotos_landing ?? []
  if (base.length === 0) return null

  return (
    <section className="border-b border-solid border-[#EEEEEE] px-4 py-8 md:px-6" style={lato}>
      <h2 style={jost} className="text-[18px] text-[#111111] md:text-[22px]">
        PAQUETES Y PRECIOS
      </h2>
      <p className="mt-1 text-[13px] text-[#666666]">
        Reserva en línea tu día en {ficha.field.nombre}. Pagas aquí y llegas con tu QR.
      </p>

      {fotosLanding.length > 0 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {fotosLanding.map((url) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className="h-[140px] w-[200px] shrink-0 object-cover"
            />
          ))}
        </div>
      ) : null}

      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {base.map((item) => (
          <li
            key={item.id}
            className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
          >
            {item.fotos_urls[0] ? (
              <img
                src={item.fotos_urls[0]}
                alt=""
                className="h-[160px] w-full object-cover"
                loading="lazy"
              />
            ) : null}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <p style={jost} className="text-[9px] tracking-[0.1em] text-[#666666]">
                {item.tipo === 'paquete' ? 'PAQUETE' : 'DERECHO DE CAMPO'}
              </p>
              <p className="text-[16px] font-bold text-[#111111]">{item.nombre}</p>
              <p className="text-[18px] text-[#CC4B37]" style={jost}>
                {formatCentavos(item.precio_centavos, false)}
                <span className="ml-1 text-[11px] text-[#666666]">
                  {UNIDAD[item.unidad] ?? ''}
                </span>
              </p>
              {item.descripcion ? (
                <p className="text-[13px] text-[#666666]">{item.descripcion}</p>
              ) : null}
              {item.incluye.length > 0 ? (
                <ul className="list-inside list-disc text-[12px] text-[#666666]">
                  {item.incluye.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              ) : null}
              {item.min_jugadores || item.max_jugadores ? (
                <p className="text-[12px] text-[#999999]">
                  {item.min_jugadores ? `Desde ${item.min_jugadores} jugadores` : ''}
                  {item.min_jugadores && item.max_jugadores ? ' · ' : ''}
                  {item.max_jugadores ? `Hasta ${item.max_jugadores}` : ''}
                </p>
              ) : null}
              {/* La reserva se arma en /arena/[slug]: ahí está el calendario. */}
              <div className="mt-auto">
                <Link
                  href={`/arena/${slug}`}
                  style={jost}
                  className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#111111] px-4 text-[11px] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                >
                  RESERVAR
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {ficha.arena.politica_cancelacion ? (
        <p className="mt-5 max-w-[640px] text-[12px] text-[#666666]">
          {ficha.arena.politica_cancelacion}
        </p>
      ) : (
        <p className="mt-5 text-[12px] text-[#666666]">
          Cancela hasta {ficha.arena.cancelacion_horas_limite} h antes de la hora de apertura y
          te devolvemos el 100%.
        </p>
      )}
    </section>
  )
}
