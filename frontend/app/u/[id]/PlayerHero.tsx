'use client'

import Link from 'next/link'
import { ClickableImage } from '@/components/ui/ClickableImage'
import type { PublicUserProfile } from './types'
import { FollowButton } from './FollowButton'
import { MessageButton } from './MessageButton'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const jostName = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7.5L5.5 10.5L11.5 3.5"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#999999]">
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlayerHero({
  user,
  subtitle,
  followersCount,
  followingCount,
  isFollowing,
  currentUserId,
  teamRole,
}: {
  user: PublicUserProfile
  subtitle: string
  followersCount: number
  followingCount: number
  isFollowing: boolean
  currentUserId: string | null
  teamRole: string | null
}) {
  const initial = (user.alias?.trim()?.[0] || '?').toUpperCase()
  const hasMemberNo =
    user.member_number != null && String(user.member_number).trim() !== ''

  const showMeta = subtitle && subtitle !== '—'

  return (
    <header className="w-full">
      {/* PORTADA */}
      <div className="relative h-[120px] w-full overflow-hidden bg-[#111111] md:h-[180px]">
        <ClickableImage
          src={user.foto_portada_url}
          alt=""
          width={1920}
          height={720}
          className="h-full w-full object-cover"
        >
          <div className="h-full w-full bg-[#111111]" />
        </ClickableImage>
      </div>

      {/* CUERPO */}
      <div className="mx-auto max-w-[960px] px-4 md:px-6">
        {/* FILA SUPERIOR: avatar + acciones en la misma fila */}
        <div className="flex items-end justify-between -mt-8 mb-4">
          <div className="relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-[#CC4B37]">
            {user.avatar_url ? (
              <ClickableImage
                src={user.avatar_url}
                alt=""
                width={72}
                height={72}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[22px] text-[#FFFFFF]" style={jost}>
                {initial}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 pb-1">
            <MessageButton profileUserId={user.id} currentUserId={currentUserId} />
            <FollowButton
              profileUserId={user.id}
              currentUserId={currentUserId}
              initialIsFollowing={isFollowing}
            />
          </div>
        </div>

        {/* INFO + EQUIPO en grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-start md:gap-x-10">
          {/* Columna izquierda */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                style={jostName}
                className="text-[20px] font-extrabold leading-tight text-[#111111]"
              >
                {user.alias}
              </h1>
              {hasMemberNo ? (
                <span
                  style={jost}
                  className="inline-flex items-center gap-1 rounded-[2px] bg-[#111111] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
                >
                  <CheckIcon />
                  VERIFICADO
                </span>
              ) : null}
            </div>

            {showMeta ? (
              <p className="text-[12px] text-[#666666]" style={lato}>
                {subtitle}
              </p>
            ) : null}

            {hasMemberNo ? (
              <p
                style={jost}
                className="text-[14px] font-extrabold uppercase text-[#CC4B37]"
              >
                MIEMBRO #{user.member_number}
              </p>
            ) : null}

            <div className="flex gap-5 pt-1">
              <div className="flex flex-col">
                <span style={jost} className="text-[16px] font-extrabold text-[#111111]">
                  {followersCount}
                </span>
                <span style={lato} className="text-[11px] text-[#666666]">
                  Seguidores
                </span>
              </div>
              <div className="flex flex-col">
                <span style={jost} className="text-[16px] font-extrabold text-[#111111]">
                  {followingCount}
                </span>
                <span style={lato} className="text-[11px] text-[#666666]">
                  Siguiendo
                </span>
              </div>
            </div>

            {user.bio ? (
              <p
                className="pt-1 text-[13px] leading-relaxed text-[#666666]"
                style={lato}
              >
                {user.bio}
              </p>
            ) : null}
          </div>

          {/* Columna derecha — equipo */}
          {user.teams ? (
            <div className="mt-4 md:mt-0">
              <Link
                href={`/equipos/${encodeURIComponent(user.teams.slug)}`}
                className="flex w-full max-w-[240px] items-center gap-2 rounded-[6px] border border-[#EEEEEE] p-2 transition-colors hover:bg-[#FAFAFA]"
              >
                {user.teams.logo_url ? (
                  <img
                    src={user.teams.logo_url}
                    alt=""
                    width={28}
                    height={28}
                    className="h-[28px] w-[28px] shrink-0 rounded-[4px] object-cover"
                  />
                ) : (
                  <div className="h-[28px] w-[28px] shrink-0 rounded-[4px] bg-[#CC4B37]" />
                )}
                <div className="min-w-0 flex-1">
                  <p style={jostName} className="truncate text-[13px] font-extrabold text-[#111111]">
                    {user.teams.nombre}
                  </p>
                  {teamRole ? (
                    <p style={lato} className="text-[11px] text-[#666666]">
                      {teamRole}
                    </p>
                  ) : null}
                </div>
                <ChevronRightIcon />
              </Link>
            </div>
          ) : null}
        </div>

        {/* Separador antes de tabs */}
        <div className="mt-4" />
      </div>
    </header>
  )
}
