import type { MemberDisplay, PublicTeam } from '../types'
import { ClickableImage } from '@/components/ui/ClickableImage'
import { TeamEditLink } from './TeamEditLink'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export function TeamHero({
  team,
  members,
}: {
  team: PublicTeam
  members: MemberDisplay[]
}) {
  const initial = (team.nombre?.trim()?.[0] || '?').toUpperCase()

  return (
    <header className="w-full">
      <div className="relative w-full">
        <div
          className="relative h-[240px] w-full overflow-hidden bg-[#111111] md:h-[360px]"
        >
          <ClickableImage
            src={team.foto_portada_url}
            alt=""
            width={1920}
            height={720}
            className="h-full w-full object-cover"
          >
            <div className="h-full w-full bg-[#111111]" />
          </ClickableImage>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] flex w-full -translate-x-1/2 translate-y-1/2 justify-center">
          <div
            className="pointer-events-auto flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-[#F4F4F4] [border:3px_solid_#FFFFFF]"
          >
            {team.logo_url ? (
              <ClickableImage
                src={team.logo_url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="text-[28px] text-[#CC4B37]"
                style={jost}
              >
                {initial}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 pb-6 pt-14 text-center">
        <h1
          style={jost}
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
        >
          {team.nombre}
        </h1>

        <TeamEditLink members={members} slug={team.slug} />
      </div>
    </header>
  )
}
