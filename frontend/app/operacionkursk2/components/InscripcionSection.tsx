import type { InscripcionConfig } from '../lib/types'

export function InscripcionSection({ config }: { config: InscripcionConfig }) {
  return (
    <section
      data-section="inscripcion"
      className="relative min-h-[40vh] w-full bg-[#0a0a0a] text-white"
    >
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#666]">
          [stub: inscripcion — {config.titulo || 'sin título'}]
        </p>
      </div>
    </section>
  )
}
