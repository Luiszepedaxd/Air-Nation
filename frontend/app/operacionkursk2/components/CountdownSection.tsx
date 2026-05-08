import type { CountdownConfig } from '../lib/types'

export function CountdownSection({ config }: { config: CountdownConfig }) {
  return (
    <section
      data-section="countdown"
      className="relative min-h-[40vh] w-full bg-[#0a0a0a] text-white"
    >
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#666]">
          [stub: countdown — {config.eyebrow || config.fecha_inicio || 'sin título'}]
        </p>
      </div>
    </section>
  )
}
