'use client'

import { useState } from 'react'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { EventoInfo } from './EventoInfo'
import { EventoPostsTab } from './EventoPostsTab'
import type { EventFeedPostRow } from '../page'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type TabId = 'info' | 'publicaciones'

export function EventoTabs({
  eventId,
  descripcion,
  disciplina,
  fecha,
  field_nombre,
  field_slug,
  ciudad,
  sede_nombre,
  sede_ciudad,
  cupo,
  rsvpCount,
  urlExterna,
  organizador_id,
  organizador_nombre,
  organizador_alias,
  organizador_avatar_url,
  sessionUserId,
  userHasRsvp,
  initialPosts,
  currentUserAlias,
  currentUserAvatar,
  canPublish,
}: {
  eventId: string
  descripcion: string | null
  disciplina: string | null
  fecha: string
  field_nombre: string | null
  field_slug: string | null
  ciudad: string | null
  sede_nombre: string | null
  sede_ciudad: string | null
  cupo: number
  rsvpCount: number
  urlExterna: string | null
  organizador_id: string | null
  organizador_nombre: string | null
  organizador_alias: string | null
  organizador_avatar_url: string | null
  sessionUserId: string | null
  userHasRsvp: boolean
  initialPosts: EventFeedPostRow[]
  currentUserAlias: string | null
  currentUserAvatar: string | null
  canPublish: boolean
}) {
  const [tab, setTab] = useState<TabId>('info')
  const postsCount = initialPosts.length

  const tabBtn = (id: TabId, label: string, count?: number) => {
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
        className={`shrink-0 border-b-2 px-4 py-3 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
          active
            ? 'border-[#CC4B37] text-[#111111]'
            : 'border-transparent text-[#999999]'
        }`}
        style={jost}
      >
        {label}
        {count != null && count > 0 ? (
          <span className="ml-1.5 text-[#666666]">({count})</span>
        ) : null}
      </button>
    )
  }

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-[#EEEEEE] bg-[#FFFFFF]">
        <ScrollableTabsNav>
          <nav
            className="flex min-w-max gap-2 px-4 md:mx-auto md:max-w-[960px] md:px-6"
            aria-label="Secciones del evento"
          >
            {tabBtn('info', 'Info')}
            {tabBtn('publicaciones', 'Publicaciones', postsCount)}
          </nav>
        </ScrollableTabsNav>
      </div>

      <div className="mx-auto w-full max-w-[960px]">
        {tab === 'info' ? (
          <EventoInfo
            eventId={eventId}
            descripcion={descripcion}
            disciplina={disciplina}
            fecha={fecha}
            field_nombre={field_nombre}
            field_slug={field_slug}
            ciudad={ciudad}
            sede_nombre={sede_nombre}
            sede_ciudad={sede_ciudad}
            cupo={cupo}
            rsvpCount={rsvpCount}
            urlExterna={urlExterna}
            organizador_id={organizador_id}
            organizador_nombre={organizador_nombre}
            organizador_alias={organizador_alias}
            organizador_avatar_url={organizador_avatar_url}
            sessionUserId={sessionUserId}
            userHasRsvp={userHasRsvp}
          />
        ) : null}

        {tab === 'publicaciones' ? (
          <EventoPostsTab
            eventId={eventId}
            initialPosts={initialPosts}
            sessionUserId={sessionUserId}
            currentUserAlias={currentUserAlias}
            currentUserAvatar={currentUserAvatar}
            canPublish={canPublish}
          />
        ) : null}
      </div>
    </div>
  )
}
