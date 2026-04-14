'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import type {
  AlbumWithPhotos,
  MemberDisplay,
  PublicTeam,
  TeamEventoPastRow,
  TeamEventoUpcomingRow,
  TeamPostRow,
} from '../types'
import { JoinButton } from './JoinButton'
import { TeamAlbums } from './TeamAlbums'
import { TeamEventos } from './TeamEventos'
import { TeamInfo } from './TeamInfo'
import { TeamMembers } from './TeamMembers'
import { TeamPosts } from './TeamPosts'

const lato = { fontFamily: "'Lato', sans-serif" } as const

const TEAM_TAB_IDS = [
  'info',
  'integrantes',
  'publicaciones',
  'albumes',
  'eventos',
] as const
type TeamTabId = (typeof TEAM_TAB_IDS)[number]

function teamTabFromSearchParams(
  sp: URLSearchParams | { get: (key: string) => string | null }
): TeamTabId {
  const raw = sp.get('tab')
  if (raw && (TEAM_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as TeamTabId
  }
  return 'info'
}

function PinIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0 text-[#666666]"
    >
      <path
        d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z"
        stroke="currentColor"
        strokeWidth={1.4}
      />
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M13.5 10.5h-2v-1c0-.5.3-.6.8-.6h1.2V6.2h-2.1c-2 0-2.9 1-2.9 2.6V10.5H7v2.8h1.5V22h3.2v-8.7h2.2l.3-2.8z"
        fill="currentColor"
      />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M20.5 3.5A9.9 9.9 0 0012.1 0 9.9 9.9 0 002.2 9.9c0 1.7.4 3.4 1.2 4.9L1 24l9.4-2.5a9.8 9.8 0 004.7 1.2h.1c5.5 0 9.9-4.4 9.9-9.9a9.8 9.8 0 00-2.9-7.1l-.3-.2zM12 18.4h-.1a8.2 8.2 0 01-4.2-1.1l-.3-.2-4.9 1.3 1.3-4.8-.3-.5a8.2 8.2 0 1113.5 5.3zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.2-.2 0-.4.1-.5.1-.1.2-.3.4-.5.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.5-1.3-.7-1.8-.2-.5-.4-.4-.5-.5h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.2.9 2.4 1 2.6.1.2 1.7 2.6 4.1 3.7.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.3-.2-.5-.3z"
      />
    </svg>
  )
}

function socialHref(
  kind: 'instagram' | 'facebook' | 'whatsapp',
  value: string
): string {
  const v = value.trim()
  if (!v) return '#'
  if (kind === 'whatsapp') {
    if (v.startsWith('http')) return v
    const digits = v.replace(/\D/g, '')
    return digits ? `https://wa.me/${digits}` : v
  }
  if (v.startsWith('http')) return v
  if (kind === 'instagram') return `https://instagram.com/${v.replace(/^@/, '')}`
  return `https://facebook.com/${v.replace(/^@/, '')}`
}

export function TeamPublicTabs({
  team,
  slug,
  members,
  posts,
  albums,
  upcoming,
  past,
  currentUserId = null,
  userTeamRole = null,
}: {
  team: PublicTeam
  slug: string
  members: MemberDisplay[]
  posts: TeamPostRow[]
  albums: AlbumWithPhotos[]
  upcoming: TeamEventoUpcomingRow[]
  past: TeamEventoPastRow[]
  currentUserId?: string | null
  userTeamRole?: 'founder' | 'admin' | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tab, setTabState] = useState<TeamTabId>(() =>
    teamTabFromSearchParams(new URLSearchParams(searchParams.toString()))
  )

  useEffect(() => {
    setTabState(teamTabFromSearchParams(new URLSearchParams(searchParams.toString())))
  }, [searchParams])

  function setTab(id: TeamTabId) {
    setTabState(id)
    const next = new URLSearchParams(searchParams.toString())
    next.set('tab', id)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const ig = team.instagram?.trim()
  const fb = team.facebook?.trim()
  const wa = team.whatsapp_url?.trim()
  const ciudad = team.ciudad?.trim()

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-[#EEEEEE] bg-[#FFFFFF]">
        <ScrollableTabsNav>
          <nav
            className="flex min-w-max gap-6 px-4 md:mx-auto md:max-w-[960px] md:gap-8 md:px-6"
            aria-label="Secciones del equipo"
          >
            {(
              [
                ['info', 'Info'],
                ['integrantes', 'Integrantes'],
                ['publicaciones', 'Publicaciones'],
                ['albumes', 'Álbumes'],
                ['eventos', 'Eventos'],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.scrollIntoView({
                      behavior: 'smooth',
                      inline: 'nearest',
                      block: 'nearest',
                    })
                    setTab(id)
                  }}
                  className={`shrink-0 border-b-2 py-3 font-body text-[0.75rem] uppercase tracking-[0.15em] transition-colors ${
                    active
                      ? 'border-[#CC4B37] font-bold text-[#111111]'
                      : 'border-transparent font-normal text-[#444444] hover:text-[#111111]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </nav>
        </ScrollableTabsNav>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-6 md:px-6 md:py-8">
        {tab === 'info' ? (
          <div className="space-y-8">
            <TeamInfo team={team} />

            {ciudad ? (
              <p
                className="flex items-center gap-2 text-[14px] text-[#111111]"
                style={lato}
              >
                <PinIcon />
                <span>{ciudad}</span>
              </p>
            ) : null}

            {team.anio_fundacion ? (
              <p
                className="text-[14px] text-[#111111]"
                style={lato}
              >
                Fundado en {team.anio_fundacion}
              </p>
            ) : null}

            {ig || fb || wa ? (
              <div className="flex flex-wrap gap-2">
                {ig ? (
                  <a
                    href={socialHref('instagram', ig)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                    style={lato}
                  >
                    <InstagramIcon />
                    <span>Instagram</span>
                  </a>
                ) : null}
                {fb ? (
                  <a
                    href={socialHref('facebook', fb)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                    style={lato}
                  >
                    <FacebookIcon />
                    <span>Facebook</span>
                  </a>
                ) : null}
                {wa ? (
                  <a
                    href={socialHref('whatsapp', wa)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                    style={lato}
                  >
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-center pt-2 md:justify-start">
              <JoinButton
                teamId={team.id}
                slug={slug}
                teamNombre={team.nombre}
                members={members}
              />
            </div>
          </div>
        ) : null}

        {tab === 'integrantes' ? (
          <TeamMembers members={members} variant="tab" />
        ) : null}

        {tab === 'publicaciones' ? (
          <TeamPosts
            posts={posts}
            variant="tab"
            currentUserId={currentUserId}
            userTeamRole={userTeamRole}
            teamSlug={slug}
            teamOwnerId={team.created_by ?? null}
          />
        ) : null}

        {tab === 'albumes' ? (
          <TeamAlbums albums={albums} variant="tab" />
        ) : null}

        {tab === 'eventos' ? (
          <TeamEventos upcoming={upcoming} past={past} variant="tab" />
        ) : null}
      </div>
    </div>
  )
}
