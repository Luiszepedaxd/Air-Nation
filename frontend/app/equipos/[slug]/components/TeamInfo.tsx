import type { PublicTeam } from '../types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function TeamInfo({
  team,
}: {
  team: Pick<PublicTeam, 'descripcion' | 'historia'>
}) {
  const descripcion = team.descripcion?.trim() || ''
  const historia = team.historia?.trim() || ''

  if (!descripcion && !historia) return null

  return (
    <section className="mx-auto w-full max-w-[960px] px-4 pt-6">
      {descripcion ? (
        <p
          className="text-[14px] leading-relaxed text-[#111111]"
          style={lato}
        >
          {descripcion}
        </p>
      ) : null}

      {historia ? (
        <div className={descripcion ? 'mt-8' : ''}>
          <h2
            style={jost}
            className="text-[11px] font-extrabold uppercase tracking-wide text-[#CC4B37]"
          >
            HISTORIA
          </h2>
          <div className="my-3 h-px w-full bg-[#EEEEEE]" aria-hidden />
          <p
            className="text-[14px] leading-relaxed text-[#111111]"
            style={lato}
          >
            {historia}
          </p>
        </div>
      ) : null}
    </section>
  )
}
