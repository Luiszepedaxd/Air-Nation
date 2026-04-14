'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

type TeamCardItem = {
  id: string
  nombre: string
  slug: string
  logo_url: string | null
  team_role: string | null
}

function teamLogoInitial(nombre: string) {
  return (nombre?.trim()?.[0] || '?').toUpperCase()
}

type SocialKey = 'instagram' | 'tiktok' | 'youtube' | 'facebook'

type SocialLinkItem = { key: SocialKey; url: string }

function socialLinkAria(key: SocialKey): string {
  switch (key) {
    case 'instagram':
      return 'Instagram'
    case 'tiktok':
      return 'TikTok'
    case 'youtube':
      return 'YouTube'
    case 'facebook':
      return 'Facebook'
    default:
      return 'Red social'
  }
}

function SocialIconFor({ socialKey }: { socialKey: SocialKey }) {
  switch (socialKey) {
    case 'instagram':
      return <SocialInstagramIcon />
    case 'tiktok':
      return <SocialTiktokIcon />
    case 'youtube':
      return <SocialYoutubeIcon />
    case 'facebook':
      return <SocialFacebookIcon />
  }
}

export function PlayerHero({
  user,
  subtitle,
  followersCount,
  followingCount,
  isFollowing,
  currentUserId,
  teamRole,
  isVerified,
  isOwner = false,
  onEditClick,
  arsenalCount,
}: {
  user: PublicUserProfile
  subtitle: string
  followersCount: number
  followingCount: number
  isFollowing: boolean
  currentUserId: string | null
  teamRole: string | null
  isVerified: boolean
  isOwner?: boolean
  onEditClick?: () => void
  arsenalCount?: number
}) {
  const router = useRouter()
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [showAllSocials, setShowAllSocials] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const initial = (user.alias?.trim()?.[0] || '?').toUpperCase()
  const hasMemberNo =
    user.member_number != null && String(user.member_number).trim() !== ''

  const showMeta = subtitle && subtitle !== '—'

  const showActionRow = !currentUserId || currentUserId !== user.id

  const teams: TeamCardItem[] =
    user.teams_list && user.teams_list.length > 0
      ? user.teams_list
      : user.teams
        ? [{ ...user.teams, team_role: null as string | null }]
        : []

  const singleRoleLabel =
    teams.length === 1 ? mapPlatformRole(teams[0].team_role) ?? teamRole : null

  const socialLinks: SocialLinkItem[] = [
    user.instagram?.trim() && {
      key: 'instagram' as const,
      url: instagramUrl(user.instagram.trim()),
    },
    user.tiktok?.trim() && {
      key: 'tiktok' as const,
      url: tiktokUrl(user.tiktok.trim()),
    },
    user.youtube?.trim() && {
      key: 'youtube' as const,
      url: youtubeUrl(user.youtube.trim()),
    },
    user.facebook?.trim() && {
      key: 'facebook' as const,
      url: facebookUrl(user.facebook.trim()),
    },
  ].filter((x): x is SocialLinkItem => Boolean(x))

  const handleTeamClick = (team: TeamCardItem) => {
    if (activeTeamId === team.id) {
      router.push(`/equipos/${encodeURIComponent(team.slug)}`)
    } else {
      setActiveTeamId(team.id)
    }
  }

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
      <div className="relative mx-auto max-w-[960px] px-4 pb-2 pt-4 md:px-6 md:pt-0">
        {socialLinks.length > 0 ? (
          <div className="absolute right-4 top-4" style={{ zIndex: 10 }}>
            <div className="flex items-center gap-3">
              {socialLinks.slice(0, 2).map((item) => (
                <a
                  key={item.key}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex p-0"
                  aria-label={socialLinkAria(item.key)}
                >
                  <SocialIconFor socialKey={item.key} />
                </a>
              ))}
              {socialLinks.length > 2 ? (
                <button
                  type="button"
                  onClick={() => setShowAllSocials((p) => !p)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center text-[13px] font-extrabold text-[#666666]"
                  aria-label={showAllSocials ? 'Ocultar' : 'Más redes'}
                >
                  {showAllSocials ? '×' : '+'}
                </button>
              ) : null}
            </div>
            {showAllSocials && socialLinks.length > 2 ? (
              <div
                className="absolute right-0 top-full mt-2 grid grid-cols-2 gap-3 rounded-[6px] border border-[#EEEEEE] bg-[#FFFFFF] p-2"
                style={{ zIndex: 20 }}
              >
                {socialLinks.slice(2).map((item) => (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex p-0"
                    aria-label={socialLinkAria(item.key)}
                  >
                    <SocialIconFor socialKey={item.key} />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
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
          <div className="flex min-w-0 flex-1 items-center gap-6">
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
            {isOwner && onEditClick ? (
              <button
                type="button"
                onClick={onEditClick}
                className="ml-auto flex h-8 w-8 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] transition-colors hover:border-[#CCCCCC]"
                aria-label="Editar perfil"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="5" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* FILA 2: nombre + badge */}
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-[17px] font-extrabold text-[#111111]" style={jostName}>
            {user.alias}
          </h1>
          {!isVerified && isOwner ? (
            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              aria-label="Ver requisitos de verificación"
              className="relative inline-flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="10" cy="10" r="9" stroke="#CCCCCC" strokeWidth="1.6" />
                <path
                  d="M6 10.5L8.5 13L14 7"
                  stroke="#CCCCCC"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -right-[3px] -top-[3px] h-[8px] w-[8px] rounded-full bg-[#CC4B37]" />
            </button>
          ) : null}
          {isVerified ? (
            <span
              style={jost}
              className="inline-flex items-center gap-1 rounded-[2px] bg-[#CC4B37] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
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
          <div className="mb-3 flex items-center gap-2 overflow-hidden">
            {teams.map((t) => {
              const expanded = activeTeamId === t.id
              const rolLabel = mapPlatformRole(t.team_role)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTeamClick(t)}
                  className="flex items-center gap-2 overflow-hidden rounded-[6px] border border-[#EEEEEE] bg-[#FAFAFA] transition-all duration-200"
                  style={{
                    width: expanded ? 'auto' : '44px',
                    minWidth: expanded ? '160px' : '44px',
                    padding: expanded ? '8px 12px' : '4px',
                    flexShrink: 0,
                  }}
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Abrir perfil del equipo ${t.nombre}`
                      : `Mostrar datos de ${t.nombre}`
                  }
                >
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#CC4B37] text-[13px] text-[#FFFFFF]"
                      style={jost}
                    >
                      {teamLogoInitial(t.nombre)}
                    </div>
                  )}
                  {expanded ? (
                    <>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[13px] font-extrabold text-[#111111]" style={jostName}>
                          {t.nombre}
                        </p>
                        {rolLabel ? (
                          <p className="text-[11px] text-[#666666]" style={lato}>
                            {rolLabel}
                          </p>
                        ) : null}
                      </div>
                      <ChevronRightIcon />
                    </>
                  ) : null}
                </button>
              )
            })}
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

      {showVerifyModal && isOwner ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-0 md:items-center md:px-4"
          onClick={() => setShowVerifyModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-[12px] bg-[#FFFFFF] px-6 pt-6 pb-6 md:rounded-[8px]"
            style={{ marginBottom: 'calc(4rem + max(env(safe-area-inset-bottom), 12px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 style={jost} className="text-[16px] font-extrabold uppercase text-[#111111]">
                VERIFICACIÓN DE PERFIL
              </h2>
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="text-[#999999]"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="mb-5 text-[13px] leading-relaxed text-[#666666]" style={lato}>
              Completa estos requisitos para obtener tu badge de jugador verificado.
            </p>
            <div className="space-y-3">
              {[
                { label: 'Foto de perfil', done: !!user.avatar_url },
                { label: 'Foto de portada', done: !!user.foto_portada_url },
                { label: 'Pertenecer a un equipo', done: (user.teams_list?.length ?? 0) > 0 },
                { label: 'Al menos una réplica en arsenal', done: (arsenalCount ?? 0) > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? 'bg-[#CC4B37]' : 'border-2 border-[#DDDDDD]'}`}
                  >
                    {done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                        <path
                          d="M2.5 6.5L5 9L9.5 3.5"
                          stroke="#FFFFFF"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                  <span className={`text-[14px] ${done ? 'text-[#111111]' : 'text-[#999999]'}`} style={lato}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
