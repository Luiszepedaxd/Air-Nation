import { getList, jost } from './_shared'

const DEFAULTS = [
  '16–17 MAYO 2026',
  'DRINKINTEAM GOTCHA',
  'AGUASCALIENTES',
  '4 FACCIONES',
  'JUGGERNAUT EN CAMPO',
  'VIP CONFIRMADO',
]

export function TickerSection({ config }: { config: Record<string, unknown> }) {
  const items = getList(config, 'items')
  const list = items.length > 0 ? items : DEFAULTS

  const doubled = [...list, ...list, ...list]

  return (
    <section className="w-full overflow-hidden bg-[#CC4B37] py-3 text-white">
      <div className="flex whitespace-nowrap" style={{ animation: 'bm2-ticker 45s linear infinite' }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-4 px-5 text-[11px] tracking-[0.14em] md:text-[12px]"
            style={jost}
          >
            {item}
            <span aria-hidden className="text-white/60">·</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes bm2-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  )
}
