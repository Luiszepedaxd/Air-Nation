'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PhotoGrid } from '@/components/posts/PhotoGrid'
import { FeedInlineVideo, parseContentWithMentions } from '@/app/dashboard/FeedHome'
import { supabase } from '@/lib/supabase'
import type { EventFeedPostRow } from '../page'
import { EventoPostBoxMini } from './EventoPostBoxMini'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function formatRelative(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch {
    return ''
  }
}

function initialFrom(nombre: string | null, alias: string | null) {
  const s = alias?.trim()?.[0] || nombre?.trim()?.[0] || '?'
  return s.toUpperCase()
}

export function EventoPostsTab({
  eventId,
  initialPosts,
  sessionUserId,
  currentUserAlias,
  currentUserAvatar,
  canPublish,
}: {
  eventId: string
  initialPosts: EventFeedPostRow[]
  sessionUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  canPublish: boolean
}) {
  const [posts, setPosts] = useState<EventFeedPostRow[]>(initialPosts)

  const refreshPosts = async () => {
    const [playerRes, teamRes] = await Promise.all([
      supabase
        .from('player_posts')
        .select(
          `id, user_id, content, fotos_urls, video_url, video_mp4_url, video_duration_s, mentions, created_at,
           users!player_posts_user_id_fkey ( id, nombre, alias, avatar_url )`
        )
        .eq('event_id', eventId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('team_posts')
        .select(
          `id, team_id, content, fotos_urls, video_url, video_mp4_url, video_duration_s, mentions, created_at,
           teams!team_posts_team_id_fkey ( id, nombre, slug, logo_url )`
        )
        .eq('event_id', eventId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    const playerRows: EventFeedPostRow[] = (playerRes.data ?? []).map((raw) => {
      const r = raw as Record<string, unknown>
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo = (u ?? {}) as Record<string, unknown>
      const mentions = Array.isArray(r.mentions) ? (r.mentions as unknown[]).map(String) : null
      return {
        kind: 'player',
        id: String(r.id),
        content: (r.content as string | null) ?? null,
        fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
        video_url: (r.video_url as string | null) ?? null,
        video_mp4_url: (r.video_mp4_url as string | null) ?? null,
        video_duration_s:
          r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
            ? Number(r.video_duration_s)
            : null,
        mentions,
        mentionAliasById: null,
        created_at: String(r.created_at ?? ''),
        author_id: String(r.user_id ?? ''),
        author_nombre: (uo.nombre as string | null) ?? null,
        author_alias: (uo.alias as string | null) ?? null,
        author_slug: null,
        author_avatar_url: (uo.avatar_url as string | null) ?? null,
      }
    })

    const teamRows: EventFeedPostRow[] = (teamRes.data ?? []).map((raw) => {
      const r = raw as Record<string, unknown>
      const t = Array.isArray(r.teams) ? r.teams[0] : r.teams
      const to = (t ?? {}) as Record<string, unknown>
      const mentions = Array.isArray(r.mentions) ? (r.mentions as unknown[]).map(String) : null
      return {
        kind: 'team',
        id: String(r.id),
        content: (r.content as string | null) ?? null,
        fotos_urls: Array.isArray(r.fotos_urls) ? (r.fotos_urls as string[]) : null,
        video_url: (r.video_url as string | null) ?? null,
        video_mp4_url: (r.video_mp4_url as string | null) ?? null,
        video_duration_s:
          r.video_duration_s != null && Number.isFinite(Number(r.video_duration_s))
            ? Number(r.video_duration_s)
            : null,
        mentions,
        mentionAliasById: null,
        created_at: String(r.created_at ?? ''),
        author_id: String(r.team_id ?? ''),
        author_nombre: (to.nombre as string | null) ?? null,
        author_alias: null,
        author_slug: (to.slug as string | null) ?? null,
        author_avatar_url: (to.logo_url as string | null) ?? null,
      }
    })

    const merged = [...playerRows, ...teamRows].sort((a, b) => {
      const ta = new Date(a.created_at).getTime()
      const tb = new Date(b.created_at).getTime()
      return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta)
    })

    setPosts(merged)
  }

  return (
    <div className="px-4 py-6 md:px-6 md:py-8">
      {canPublish && sessionUserId ? (
        <div className="mx-auto mb-6 w-full max-w-[600px]">
          <EventoPostBoxMini
            eventId={eventId}
            userId={sessionUserId}
            userAlias={currentUserAlias}
            userAvatar={currentUserAvatar}
            onPublished={() => void refreshPosts()}
          />
        </div>
      ) : null}

      {posts.length === 0 ? (
        <p
          className="py-12 text-center text-[14px] text-[#666666]"
          style={lato}
        >
          Aún no hay publicaciones de este evento.
        </p>
      ) : (
        <div className="mx-auto flex w-full max-w-[600px] flex-col gap-4">
          {posts.map((post) => {
            const fotos = (post.fotos_urls ?? []).slice(0, 4)
            const authorName = (post.author_nombre || post.author_alias || '—').trim()
            const href =
              post.kind === 'player'
                ? `/u/${post.author_id}`
                : post.author_slug
                  ? `/equipos/${encodeURIComponent(post.author_slug)}`
                  : '#'

            return (
              <article
                key={`${post.kind}-${post.id}`}
                className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Link href={href}>
                    <div className="h-9 w-9 shrink-0 overflow-hidden bg-[#F4F4F4]">
                      {post.author_avatar_url ? (
                        <img
                          src={post.author_avatar_url}
                          alt=""
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-[13px] text-[#CC4B37]"
                          style={{ ...jost, fontWeight: 700 }}
                        >
                          {initialFrom(post.author_nombre, post.author_alias)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={href} className="block">
                      <p
                        className="truncate text-[14px] font-semibold text-[#111111]"
                        style={lato}
                      >
                        {authorName}
                        {post.kind === 'team' ? (
                          <span
                            className="ml-2 inline-block bg-[#111111] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
                            style={jost}
                          >
                            EQUIPO
                          </span>
                        ) : null}
                      </p>
                    </Link>
                    <p
                      className="text-[11px] text-[#999999]"
                      style={lato}
                    >
                      {formatRelative(post.created_at)}
                    </p>
                  </div>
                </div>

                {post.content?.trim() ? (
                  <p
                    className="mb-3 whitespace-pre-wrap text-[14px] leading-relaxed text-[#111111]"
                    style={lato}
                  >
                    {parseContentWithMentions(
                      post.content,
                      post.mentions ?? null,
                      post.mentionAliasById ?? null
                    )}
                  </p>
                ) : null}

                {fotos.length > 0 ? <PhotoGrid urls={fotos} /> : null}
                {post.video_url ? (
                  <FeedInlineVideo
                    src={post.video_url}
                    videoMp4Url={post.video_mp4_url}
                  />
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
