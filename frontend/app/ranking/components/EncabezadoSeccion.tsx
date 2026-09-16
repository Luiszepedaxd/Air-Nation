import type { ReactNode } from 'react'

type Props = {
  numero: string
  eyebrow: string
  titulo: ReactNode
  subtitulo?: string
  oscuro?: boolean
}

export function EncabezadoSeccion({
  numero,
  eyebrow,
  titulo,
  subtitulo,
  oscuro,
}: Props) {
  const tituloClass = oscuro ? 'text-white' : 'text-[#111111]'
  const subClass = oscuro ? 'text-white/70' : 'text-[#666666]'
  const eyebrowClass = 'text-[#CC4B37]'
  const lineClass = 'bg-[#CC4B37]'

  return (
    <header className="mb-10 max-w-3xl">
      <div className="mb-5 flex items-center gap-4">
        <span className={`block h-[2px] w-7 shrink-0 ${lineClass}`} />
        <p
          className={`font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] ${eyebrowClass}`}
        >
          {numero} — {eyebrow}
        </p>
      </div>
      <h2
        className={`font-display font-black uppercase leading-[0.95] ${tituloClass}`}
        style={{ fontSize: 'clamp(1.9rem, 4vw, 3.25rem)' }}
      >
        {titulo}
      </h2>
      {subtitulo ? (
        <p className={`mt-4 max-w-2xl font-body text-base leading-relaxed ${subClass}`}>
          {subtitulo}
        </p>
      ) : null}
    </header>
  )
}
