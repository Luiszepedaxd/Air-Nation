import type { HeroConfig } from '../lib/types'

export function HeroSection({ config }: { config: HeroConfig }) {
  return (
    <section
      data-section="hero"
      className="relative min-h-screen w-full bg-[#0a0a0a] text-white"
    >
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#666]">
          [stub: hero — {config.titulo || 'sin título'}]
        </p>
      </div>
    </section>
  )
}
