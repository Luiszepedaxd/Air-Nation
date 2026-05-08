import type { CtaFinalConfig } from '../lib/types'

export function CtaFinalSection({ config }: { config: CtaFinalConfig }) {
  const label = config.cta_titulo || config.linea1 || 'sin título'
  return (
    <section
      data-section="cta_final"
      className="relative min-h-[40vh] w-full bg-[#0a0a0a] text-white"
    >
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#666]">
          [stub: cta_final — {label}]
        </p>
      </div>
    </section>
  )
}
