import type { NarrativaConfig } from '../lib/types'

export function NarrativaSection({ config }: { config: NarrativaConfig }) {
  const label = config.bloques?.[0]?.anio || config.bloques?.[0]?.texto?.slice(0, 40) || 'sin título'
  return (
    <section
      data-section="narrativa"
      className="relative min-h-[40vh] w-full bg-[#0a0a0a] text-white"
    >
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#666]">
          [stub: narrativa — {label}]
        </p>
      </div>
    </section>
  )
}
