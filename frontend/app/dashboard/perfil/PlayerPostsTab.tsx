'use client'

import { useCallback, useEffect, useState } from 'react'
import { PhotoGrid } from '@/components/posts/PhotoGrid'
import { PostActions, PostMenu } from '@/components/posts/PostInteractions'
import { supabase } from '@/lib/supabase'
import { PostBox, FeedInlineVideo } from '@/app/dashboard/FeedHome'

const lato = { fontFamily: "'Lato', sans-serif" } as const

type PlayerPost = {
  id: string
  user_id: string
  content: string | null
  fotos_urls: string[] | null
  published: boolean
  created_at: string
  video_url?: string | null
}

function normalizeFotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
}

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

function SpinnerInline({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-5 w-5 animate-spin text-[#FFFFFF]'}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function PlayerPostsTab({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<PlayerPost[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('player_posts')
      .select('id, user_id, content, fotos_urls, video_url, published, created_at')
      .eq('user_id', userId)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      console.log('[PlayerPostsTab] raw data:', JSON.stringify(data?.slice(0, 3)))
      setPosts(data as PlayerPost[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void fetchPosts()
  }, [fetchPosts])

  return (
    <div className="mx-auto max-w-[640px] pb-10">
      <PostBox
        userId={userId}
        userAlias={null}
        userAvatar={null}
        userTeams={[]}
        userFields={[]}
        onPublished={async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await fetchPosts()
        }}
      />

      <hr className="my-8 border-0 border-t border-solid border-[#EEEEEE]" />

      {loading ? (
        <ul className="flex flex-col" aria-busy aria-label="Cargando publicaciones">
          {[0, 1, 2].map((k) => (
            <li key={k} className="list-none">
              <div className="mx-auto mb-4 w-full max-w-[600px] animate-pulse border border-solid border-[#EEEEEE] p-4">
                <div className="mb-3 h-4 max-w-[85%] rounded-sm bg-[#EEEEEE]" />
                <div className="grid grid-cols-2 gap-[2px]">
                  <div className="h-[140px] bg-[#EEEEEE]" />
                  <div className="h-[140px] bg-[#F4F4F4]" />
                </div>
                <div className="mt-3 h-3 w-24 rounded-sm bg-[#F4F4F4]" />
              </div>
            </li>
          ))}
        </ul>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <p style={lato} className="text-[14px] text-[#666666]">
            Aún no hay publicaciones
          </p>
        </div>
      ) : (
        <ul className="flex w-full min-w-0 flex-col">
          {posts.map((post) => {
            const urls = normalizeFotoUrls(post.fotos_urls).slice(0, 4)
            return (
              <li key={post.id} className="list-none">
                <div className="mx-auto mb-4 w-full max-w-[600px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] text-[#999999]" style={lato}>
                      {formatDate(post.created_at)}
                    </p>
                    <PostMenu
                      canDelete={true}
                      onDelete={async () => {
                        const { error } = await supabase
                          .from('player_posts')
                          .delete()
                          .eq('id', post.id)
                          .eq('user_id', userId)
                        if (!error) {
                          setPosts((prev) => prev.filter((x) => x.id !== post.id))
                        }
                      }}
                    />
                  </div>
                  {post.content?.trim() ? (
                    <p
                      className="mb-3 min-w-0 max-w-full break-words whitespace-pre-wrap text-[14px] text-[#111111]"
                      style={lato}
                    >
                      {post.content.trim()}
                    </p>
                  ) : null}
                  {urls.length > 0 && <PhotoGrid urls={urls} />}
                  {(post as PlayerPost & { video_url?: string | null }).video_url ? (
                    <FeedInlineVideo
                      src={(post as PlayerPost & { video_url?: string | null }).video_url!}
                    />
                  ) : null}
                  <PostActions
                    postType="player"
                    postId={post.id}
                    postOwnerId={userId}
                    postHref={`/u/${userId}`}
                    currentUserId={userId}
                    currentUserAlias={null}
                    currentUserAvatar={null}
                    shareUrl={`/u/${userId}#post-${post.id}`}
                    shareTitle="Publicación en AirNation"
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
