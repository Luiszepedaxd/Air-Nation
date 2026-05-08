import type { SponsorsConfig } from '../lib/types'

export function SponsorsSection({ config }: { config: SponsorsConfig }) {
  return (
    <section
      data-section="sponsors"
      className="relative min-h-[40vh] w-full bg-[#0a0a0a] text-white"
    >
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#666]">
          [stub: sponsors — {config.titulo || 'sin título'}]
        </p>
      </div>
    </section>
  )
}
