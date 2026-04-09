'use client'

import Link from 'next/link'
import { useState } from 'react'
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

function instagramUrl(raw: string) {
  return raw.startsWith('http') ? raw : `https://instagram.com/${raw.replace(/^@/, '')}`
}

function tiktokUrl(raw: string) {
  return raw.startsWith('http') ? raw : `https://tiktok.com/@${raw.replace(/^@/, '')}`
}

function youtubeUrl(raw: string) {
  return raw.startsWith('http') ? raw : `https://youtube.com/@${raw}`
}

function facebookUrl(raw: string) {
  return raw.startsWith('http') ? raw : `https://facebook.com/${raw}`
}

function SocialInstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#666666]">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function SocialTiktokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#666666]">
      <path
        d="M9 12a4 4 0 104 4V4a5 5 0 005 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SocialYoutubeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="text-[#666666]">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
    </svg>
  )
}

function SocialFacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="text-[#666666]">
      <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13.5 10.5h-2v-1c0-.5.3-.6.8-.6h1.2V6.2h-2.1c-2 0-2.9 1-2.9 2.6V10.5H7v2.8h1.5V22h3.2v-8.7h2.2l.3-2.8z"
        fill="currentColor"
      />
    </svg>
  )
}

function mapPlatformRole(rol: string | null | undefined): string | null {
  if (rol == null || rol === '') return null
  const r = String(rol).toLowerCase()
  if (r === 'founder') return 'Fundador'
  if (r === 'admin') return 'Admin'
  if (r === 'member') return 'Miembro'
  return null
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
  const [teamsExpanded, setTeamsExpanded] = useState(false)

  const initial = (user.alias?.trim()?.[0] || '?').toUpperCase()
  const hasMemberNo =
    user.member_number != null && String(user.member_number).trim() !== ''

  const showMeta = subtitle && subtitle !== '—'

  const showActionRow = !currentUserId || currentUserId !== user.id

  const teams =
    user.teams_list && user.teams_list.length > 0
      ? user.teams_list
      : user.teams
        ? [{ ...user.teams, team_role: null as string | null }]
        : []

  const singleRoleLabel =
    teams.length === 1 ? mapPlatformRole(teams[0].team_role) ?? teamRole : null

  const hasSocials =
    !!(user.instagram?.trim() || user.tiktok?.trim() || user.youtube?.trim() || user.facebook?.trim())

  return (
    <header className="w-full bg-[#FFFFFF]">
      {/* 1. PORTADA */}
      <div className="relative h-[120px] w-full overflow-hidden bg-[#111111] md:h-[200px]">
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
          <div className="relative z-10 -mt-10 h-[80px] w-[80px] shrink-0 overflow-hidden rounded-full border-[3px] border-[#EEEEEE] bg-[#CC4B37] md:border-white">
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

        {/* FILA 5b: redes sociales */}
        {hasSocials ? (
          <div className={`mb-2 flex items-center gap-3 ${!user.bio ? 'mt-1' : ''}`}>
            {user.instagram?.trim() ? (
              <a
                href={instagramUrl(user.instagram.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex border-0 bg-transparent p-0"
                aria-label="Instagram"
              >
                <SocialInstagramIcon />
              </a>
            ) : null}
            {user.tiktok?.trim() ? (
              <a
                href={tiktokUrl(user.tiktok.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex border-0 bg-transparent p-0"
                aria-label="TikTok"
              >
                <SocialTiktokIcon />
              </a>
            ) : null}
            {user.youtube?.trim() ? (
              <a
                href={youtubeUrl(user.youtube.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex border-0 bg-transparent p-0"
                aria-label="YouTube"
              >
                <SocialYoutubeIcon />
              </a>
            ) : null}
            {user.facebook?.trim() ? (
              <a
                href={facebookUrl(user.facebook.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex border-0 bg-transparent p-0"
                aria-label="Facebook"
              >
                <SocialFacebookIcon />
              </a>
            ) : null}
          </div>
        ) : null}

        {/* FILA 6: team(s) */}
        {teams.length === 1 ? (
          <Link
            href={`/equipos/${encodeURIComponent(teams[0].slug)}`}
            className="mb-3 flex w-full items-center gap-2 rounded-[6px] border border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2"
          >
            {teams[0].logo_url ? (
              <img
                src={teams[0].logo_url}
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
                {teams[0].nombre}
              </p>
              {singleRoleLabel ? (
                <p className="text-[11px] text-[#666666]" style={lato}>
                  {singleRoleLabel}
                </p>
              ) : null}
            </div>
            <ChevronRightIcon />
          </Link>
        ) : teams.length > 1 ? (
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {teams.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTeamsExpanded((v) => !v)}
                  className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-0 bg-[#FAFAFA] p-0"
                  aria-expanded={teamsExpanded}
                  aria-label={`Equipo ${t.nombre}`}
                >
                  {t.logo_url ? (
                    <img src={t.logo_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[#CC4B37]" />
                  )}
                </button>
              ))}
            </div>
            <div
              className={`overflow-hidden transition-all duration-200 ease-out ${
                teamsExpanded ? 'max-h-[200px]' : 'max-h-0'
              }`}
            >
              <ul className="mt-2 flex flex-col gap-2 pb-1">
                {teams.map((t) => {
                  const rl = mapPlatformRole(t.team_role)
                  return (
                    <li key={`exp-${t.id}`}>
                      <Link
                        href={`/equipos/${encodeURIComponent(t.slug)}`}
                        className="flex w-full items-center gap-2 rounded-[6px] border border-[#EEEEEE] bg-[#FAFAFA] px-3 py-2"
                      >
                        {t.logo_url ? (
                          <img
                            src={t.logo_url}
                            alt=""
                            width={20}
                            height={20}
                            className="h-5 w-5 shrink-0 rounded-[4px] object-cover"
                          />
                        ) : (
                          <div className="h-5 w-5 shrink-0 rounded-[4px] bg-[#CC4B37]" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-extrabold text-[#111111]" style={jostName}>
                            {t.nombre}
                          </p>
                          {rl ? (
                            <p className="text-[11px] text-[#666666]" style={lato}>
                              {rl}
                            </p>
                          ) : null}
                        </div>
                        <ChevronRightIcon />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
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
