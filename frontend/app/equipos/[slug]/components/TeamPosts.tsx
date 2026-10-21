'use client'

import type { TeamPostRow } from '../types'
import { PostContent } from '@/components/feed/PostContent'
import { PostMedia } from '@/components/posts/PhotoGrid'
import { postCardBreakout, postCardColumn, postCardShell } from '@/components/posts/post-card'
import { PostActions } from '@/components/posts/PostInteractions'
import { adminDeleteTeamPost } from '@/app/admin/feed/actions'
import { ReportablePostMenu } from '@/components/posts/ReportablePostMenu'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

function postPhotoUrls(post: TeamPostRow): string[] {
  const raw = post.fotos_urls
  if (!Array.isArray(raw)) return []
  return raw
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 4)
}

export function TeamPosts({
  posts,
  variant = 'section',
  currentUserId = null,
  userTeamRole = null,
  isAdmin = false,
  teamSlug = '',
  teamOwnerId = null,
}: {
  posts: TeamPostRow[]
  variant?: 'section' | 'tab'
  currentUserId?: string | null
  userTeamRole?: 'founder' | 'admin' | null
  isAdmin?: boolean
  teamSlug?: string
  teamOwnerId?: string | null
}) {
  if (!posts.length) {
    if (variant === 'tab') {
      return (
        <p className="text-sm text-dim" style={lato}>
          No hay publicaciones aún.
        </p>
      )
    }
    return null
  }

  return (
    <section
      className={
        variant === 'section'
          ? 'mx-auto w-full max-w-[960px] px-4 py-8 md:px-6'
          : 'w-full'
      }
    >
      {variant === 'section' ? (
        <h2
          style={jost}
          className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
        >
          Publicaciones
        </h2>
      ) : null}
      <div className={`flex flex-col ${postCardBreakout}`}>
        <div className={postCardColumn}>
        {posts.map((post) => {
          const urls = postPhotoUrls(post)
          const authorId = post.created_by ?? teamOwnerId
          const reportReporterId =
            currentUserId && authorId && currentUserId !== authorId
              ? currentUserId
              : null

          return (
            <article
              key={post.id}
              className={postCardShell}
            >
              <div className="px-4 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <time
                  className="text-[12px] text-[#666666]"
                  style={lato}
                  dateTime={post.created_at}
                >
                  {formatDate(post.created_at)}
                </time>
                <ReportablePostMenu
                  canDelete={
                    userTeamRole === 'founder' || userTeamRole === 'admin' || isAdmin
                  }
                  onDelete={async () => {
                    if (userTeamRole === 'founder' || userTeamRole === 'admin') {
                      const { error } = await supabase
                        .from('team_posts')
                        .delete()
                        .eq('id', post.id)
                      if (!error) {
                        window.location.reload()
                      }
                    } else if (isAdmin) {
                      const res = await adminDeleteTeamPost(post.id)
                      if ('ok' in res) {
                        window.location.reload()
                      }
                    }
                  }}
                  reporterId={reportReporterId}
                  targetType="post"
                  targetId={post.id}
                  targetLabel={post.content?.trim().slice(0, 80) || 'Publicación del equipo'}
                />
              </div>
              {post.content?.trim() ? (
                <PostContent content={post.content} className="mb-3" />
              ) : null}
              </div>
              <PostMedia
                urls={urls}
                video={
                  post.video_url
                    ? {
                        src: post.video_url,
                        videoMp4Url: post.video_mp4_url,
                        poster: post.thumbnail_url,
                      }
                    : null
                }
              />
              <div className="px-4 pb-3">
              <PostActions
                postType="team"
                postId={post.id}
                postOwnerId={post.created_by ?? teamOwnerId}
                postHref={`/dashboard?highlight_id=${post.id}&highlight_type=team`}
                currentUserId={currentUserId}
                currentUserAlias={null}
                currentUserAvatar={null}
                shareUrl={`/equipos/${teamSlug}`}
                shareTitle="Publicación del equipo en AirNation"
              />
              </div>
            </article>
          )
        })}
        </div>
      </div>
    </section>
  )
}
