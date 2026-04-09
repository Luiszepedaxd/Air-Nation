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

const followButtonClass =
  'flex-1 py-2 text-[13px] font-extrabold rounded-[6px]'
const messageButtonClass =
  'w-[42px] py-2 rounded-[6px] border border-[#DBDBDB] flex items-center justify-center shrink-0'

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

  const showActionRow = !currentUserId || currentUserId !== user.id

  return (
    <header className="w-full bg-[#FFFFFF]">
      {/* 1. PORTADA — solo desktop */}
      <div className="relative hidden h-[200px] w-full overflow-hidden bg-[#111111] md:block">
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

      {/* 2. BLOQUE PRINCIPAL */}
      <div className="mx-auto max-w-[960px] px-4 pb-2 pt-4 md:px-6 md:pt-0">
        {/* FILA 1: avatar + stats */}
        <div className="mb-3 flex items-center gap-4">
          <div className="relative h-[80px] w-[80px] shrink-0 overflow-hidden rounded-full border-[3px] border-[#EEEEEE] bg-[#CC4B37] md:relative md:z-10 md:-mt-10 md:border-[3px] md:border-white">
            {user.avatar_url ? (
              <ClickableImage
                src={user.avatar_url}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[26px] text-[#FFFFFF]" style={jost}>
                {initial}
              </span>
            )}
          </div>
          <div className="flex flex-1 gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[17px] font-extrabold text-[#111111]" style={jost}>
                {followersCount}
              </span>
              <span className="text-[12px] text-[#666666]" style={lato}>
                Seguidores
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[17px] font-extrabold text-[#111111]" style={jost}>
                {followingCount}
              </span>
              <span className="text-[12px] text-[#666666]" style={lato}>
                Siguiendo
              </span>
            </div>
          </div>
        </div>

        {/* FILA 2: nombre + badge */}
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-[17px] font-extrabold text-[#111111]" style={jostName}>
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

        {/* FILA 3: ciudad · rol */}
        {showMeta ? (
          <p className="mb-1 text-[12px] text-[#666666]" style={lato}>
            {subtitle}
          </p>
        ) : null}

        {/* FILA 4: MIEMBRO # */}
        {hasMemberNo ? (
          <p style={jost} className="mb-1 text-[14px] font-extrabold uppercase text-[#CC4B37]">
            MIEMBRO #{user.member_number}
          </p>
        ) : null}

        {/* FILA 5: bio */}
        {user.bio ? (
          <p className="mb-2 mt-1 text-[13px] leading-relaxed text-[#444444]" style={lato}>
            {user.bio}
          </p>
        ) : null}

        {/* FILA 6: team pill */}
        {user.teams ? (
          <Link
            href={`/equipos/${encodeURIComponent(user.teams.slug)}`}
            className="mb-3 flex w-full items-center gap-2 rounded-[6px] border border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2"
          >
            {user.teams.logo_url ? (
              <img
                src={user.teams.logo_url}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-[4px] object-cover"
              />
            ) : (
              <div className="h-6 w-6 shrink-0 rounded-[4px] bg-[#CC4B37]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-extrabold text-[#111111]" style={jostName}>
                {user.teams.nombre}
              </p>
              {teamRole ? (
                <p className="text-[11px] text-[#666666]" style={lato}>
                  {teamRole}
                </p>
              ) : null}
            </div>
            <ChevronRightIcon />
          </Link>
        ) : null}

        {/* FILA 7: acciones */}
        {showActionRow ? (
          <div className="mb-3 flex gap-2">
            <FollowButton
              profileUserId={user.id}
              currentUserId={currentUserId}
              initialIsFollowing={isFollowing}
              className={followButtonClass}
            />
            <MessageButton
              profileUserId={user.id}
              currentUserId={currentUserId}
              className={messageButtonClass}
            />
          </div>
        ) : null}

        <div className="mt-4" />
      </div>
    </header>
  )
}
