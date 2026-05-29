'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { sendPushNotif } from '@/lib/sendPushNotif'
import { notifyNotifUpdated } from '@/lib/user-notifications'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / (1000 * 60 * 60))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return `hace ${h}h`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch { return '' }
}

type FeedPostType =
  | 'player'
  | 'team'
  | 'field'
  | 'blog'
  | 'new_team'
  | 'noticia'
  | 'event'
  | 'video'
  | 'replica'
  | 'listing'

type PostComment = {
  id: string
  user_id: string
  content: string
  created_at: string
  parent_id: string | null
  reply_to_user_id: string | null
  reply_to_user_alias: string | null
  user: { alias: string | null; nombre: string | null; avatar_url: string | null }
  likeCount: number
  likedByMe: boolean
  replies: PostComment[]
  repliesShown: number
}

type ReplyTarget = {
  rootCommentId: string
  replyToUserId: string
  replyToUserAlias: string
}

export function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21C12 21 3 15.5 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-9 12-9 12Z"
        fill={filled ? '#CC4B37' : 'none'}
        stroke={filled ? '#CC4B37' : '#999999'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LikesModal({
  postType,
  postId,
  onClose,
}: {
  postType: FeedPostType
  postId: string
  onClose: () => void
}) {
  const [users, setUsers] = useState<{
    id: string
    alias: string | null
    nombre: string | null
    avatar_url: string | null
  }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('post_reactions')
        .select(`
          user_id,
          users ( id, alias, nombre, avatar_url )
        `)
        .eq('post_type', postType)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .limit(50)

      const rows = (data ?? []) as Record<string, unknown>[]
      setUsers(rows.map(r => {
        const u = Array.isArray(r.users) ? r.users[0] : r.users
        const uo = (u ?? {}) as Record<string, unknown>
        return {
          id: String(uo.id ?? r.user_id),
          alias: uo.alias ? String(uo.alias) : null,
          nombre: uo.nombre ? String(uo.nombre) : null,
          avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
        }
      }))
      setLoading(false)
    })()
  }, [postType, postId])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white md:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-3">
          <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
            Reacciones
          </p>
          <button type="button" onClick={onClose} className="text-[#999999] hover:text-[#111111]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F4F4F4] animate-pulse shrink-0" />
                  <div className="h-3 w-32 bg-[#F4F4F4] animate-pulse" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <p style={lato} className="py-8 text-center text-[13px] text-[#999999]">
              Sin reacciones aún
            </p>
          ) : (
            <ul className="divide-y divide-[#EEEEEE]">
              {users.map(u => {
                const name = u.alias?.trim() || u.nombre?.trim() || 'Jugador'
                return (
                  <li key={u.id}>
                    <Link
                      href={`/u/${u.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#F4F4F4] transition-colors"
                    >
                      <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[#CC4B37]" style={jost}>
                              {name[0].toUpperCase()}
                            </div>
                        }
                      </div>
                      <span style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
                        {name}
                      </span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto text-[#CCCCCC]" aria-hidden>
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export function PostMenu({
  canDelete,
  onDelete,
  canPin = false,
  isPinned = false,
  onPin,
  canReport = false,
  onReport,
}: {
  canDelete: boolean
  onDelete: () => void
  canPin?: boolean
  isPinned?: boolean
  onPin?: () => void
  canReport?: boolean
  onReport?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!canDelete && !canPin && !canReport) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setConfirming(false) }}
        className="flex items-center justify-center w-8 h-8 rounded hover:bg-[#F4F4F4] transition-colors text-[#999999] hover:text-[#666666]"
        aria-label="Opciones"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => { setOpen(false); setConfirming(false) }}
            aria-hidden
          />
          <div className="absolute right-0 top-8 z-[100] min-w-[160px] border border-[#EEEEEE] bg-white shadow-lg">
            {confirming && canDelete ? (
              <div className="px-4 py-3">
                <p style={lato} className="text-[12px] text-[#111111] mb-2">
                  ¿Eliminar este post?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { onDelete(); setOpen(false); setConfirming(false) }}
                    style={jost}
                    className="bg-[#CC4B37] px-3 py-1.5 text-[10px] font-extrabold uppercase text-white"
                  >
                    SÍ
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    style={jost}
                    className="border border-[#EEEEEE] px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#666666]"
                  >
                    NO
                  </button>
                </div>
              </div>
            ) : (
              <>
                {canPin && onPin && (
                  <button
                    type="button"
                    onClick={() => { onPin(); setOpen(false); setConfirming(false) }}
                    style={lato}
                    className={`flex w-full items-center gap-2 px-4 py-3 text-[13px] transition-colors hover:bg-[#F4F4F4] ${
                      isPinned ? 'text-[#CC4B37]' : 'text-[#111111]'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                    </svg>
                    {isPinned ? 'Desfijar publicación' : 'Fijar en el feed'}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    style={lato}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-[#CC4B37] hover:bg-[#FFF8F7] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Eliminar publicación
                  </button>
                )}
                {canReport && onReport && (
                  <button
                    type="button"
                    onClick={() => { onReport(); setOpen(false); setConfirming(false) }}
                    style={lato}
                    className="flex w-full items-center gap-2 px-4 py-3 text-[13px] text-[#666666] hover:bg-[#F4F4F4] transition-colors border-t border-[#EEEEEE]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M4 21V4M4 4h13l-2 4 2 4H4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Reportar publicación
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function PostActions({
  postType,
  postId,
  postOwnerId,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
  shareUrl,
  shareTitle,
  postHref,
}: {
  postType: FeedPostType
  postId: string
  postOwnerId: string | null
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  shareUrl: string
  shareTitle: string
  postHref: string
}) {
  const [likeCount, setLikeCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [copying, setCopying] = useState(false)
  const [showLikesModal, setShowLikesModal] = useState(false)

  useEffect(() => {
    if (!postId) return
    let cancelled = false
    ;(async () => {
      const [{ count: lc }, { count: cc }] = await Promise.all([
        supabase.from('post_reactions')
          .select('*', { count: 'exact', head: true })
          .eq('post_type', postType)
          .eq('post_id', postId),
        supabase.from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_type', postType)
          .eq('post_id', postId),
      ])
      if (cancelled) return
      setLikeCount(lc ?? 0)
      setCommentCount(cc ?? 0)

      if (currentUserId) {
        const { data } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_type', postType)
          .eq('post_id', postId)
          .eq('user_id', currentUserId)
          .maybeSingle()
        if (!cancelled) setLiked(!!data)
      } else if (!cancelled) {
        setLiked(false)
      }
    })()
    return () => { cancelled = true }
  }, [postId, postType, currentUserId])

  const handleLike = async () => {
    if (!currentUserId) return
    if (liked) {
      setLiked(false)
      setLikeCount(c => Math.max(0, c - 1))
      await supabase.from('post_reactions').delete()
        .eq('post_type', postType)
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
    } else {
      setLiked(true)
      setLikeCount(c => c + 1)
      const { error } = await supabase.from('post_reactions').insert({
        user_id: currentUserId,
        post_type: postType,
        post_id: postId,
        reaction: 'fire',
      })
      if (!error && postOwnerId && postOwnerId !== currentUserId) {
        await supabase.from('user_notifications').insert({
          recipient_id: postOwnerId,
          actor_id: currentUserId,
          type: 'like_post',
          post_type: postType,
          post_id: postId,
          href: postHref,
        })
        notifyNotifUpdated()
        void sendPushNotif(
          postOwnerId,
          'Le gustó tu publicación',
          `${currentUserAlias ?? 'Alguien'} reaccionó a tu post`,
          postHref
        )
      }
    }
  }

  const handleShare = async () => {
    const fullUrl =
      shareUrl.startsWith('http://') || shareUrl.startsWith('https://')
        ? shareUrl
        : `https://airnation.online${shareUrl}`
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, url: fullUrl }) } catch { /* cancelado */ }
    } else {
      try {
        await navigator.clipboard.writeText(fullUrl)
        setCopying(true)
        setTimeout(() => setCopying(false), 2000)
      } catch { /* ignore */ }
    }
  }

  return (
    <div className="mt-3">
      {/* Barra de acciones */}
      <div className="flex items-center gap-1 pt-3 border-t border-[#EEEEEE]">
        {/* Like */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleLike()}
            disabled={!currentUserId}
            className="flex items-center p-1.5 rounded hover:bg-[#F4F4F4] transition-colors disabled:opacity-30"
          >
            <HeartIcon filled={liked} size={18} />
          </button>
          {likeCount > 0 && (
            <button
              type="button"
              onClick={() => setShowLikesModal(true)}
              style={lato}
              className="text-[12px] font-semibold text-[#666666] hover:text-[#CC4B37] hover:underline transition-colors"
            >
              {likeCount}
            </button>
          )}
        </div>

        {/* Comentar */}
        <button
          type="button"
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F4F4F4] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke={showComments ? '#CC4B37' : '#999999'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {commentCount > 0 && (
            <span style={lato} className={`text-[12px] font-semibold ${showComments ? 'text-[#CC4B37]' : 'text-[#666666]'}`}>
              {commentCount}
            </span>
          )}
        </button>

        {/* Compartir */}
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#F4F4F4] transition-colors ml-auto"
        >
          {copying ? (
            <span style={lato} className="text-[11px] text-[#CC4B37] font-semibold">¡Copiado!</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4"
                stroke="#999999"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Sección comentarios — toggle */}
      {showComments && (
        <CommentsSection
          postType={postType}
          postId={postId}
          postOwnerId={postOwnerId}
          currentUserId={currentUserId}
          currentUserAlias={currentUserAlias}
          currentUserAvatar={currentUserAvatar}
          postHref={postHref}
        />
      )}

      {showLikesModal && (
        <LikesModal
          postType={postType}
          postId={postId}
          onClose={() => setShowLikesModal(false)}
        />
      )}
    </div>
  )
}

const REPLIES_PAGE_SIZE = 2
const COMMENTS_PAGE_SIZE = 3

export function CommentsSection({
  postType,
  postId,
  postOwnerId,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
  postHref,
}: {
  postType: FeedPostType
  postId: string
  postOwnerId: string | null
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  postHref: string
}) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyPosting, setReplyPosting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadComments = async (pageNum: number, append = false) => {
    const from = 0
    const to = pageNum * COMMENTS_PAGE_SIZE - 1

    const { data: rootsData, count } = await supabase
      .from('post_comments')
      .select(`
        id, user_id, content, created_at, parent_id, reply_to_user_id,
        users ( alias, nombre, avatar_url )
      `, { count: 'exact' })
      .eq('post_type', postType)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
      .range(from, to)

    if (!rootsData) return

    const roots = rootsData as Record<string, unknown>[]
    const rootIds = roots.map(r => String(r.id))

    let repliesData: Record<string, unknown>[] = []
    if (rootIds.length > 0) {
      const { data: rd } = await supabase
        .from('post_comments')
        .select(`
          id, user_id, content, created_at, parent_id, reply_to_user_id,
          users ( alias, nombre, avatar_url )
        `)
        .in('parent_id', rootIds)
        .order('created_at', { ascending: true })
      repliesData = (rd ?? []) as Record<string, unknown>[]
    }

    const targetUserIds = Array.from(
      new Set(
        repliesData
          .map(r => r.reply_to_user_id ? String(r.reply_to_user_id) : null)
          .filter((x): x is string => !!x)
      )
    )

    let aliasById: Record<string, string> = {}
    if (targetUserIds.length > 0) {
      const { data: targetUsers } = await supabase
        .from('users')
        .select('id, alias, nombre')
        .in('id', targetUserIds)
      for (const u of (targetUsers ?? []) as Record<string, unknown>[]) {
        aliasById[String(u.id)] =
          (u.alias ? String(u.alias) : null)
          ?? (u.nombre ? String(u.nombre) : null)
          ?? 'Jugador'
      }
    }

    const allIds = [...rootIds, ...repliesData.map(r => String(r.id))]
    let likedIds: string[] = []
    if (currentUserId && allIds.length > 0) {
      const { data: likedData } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('post_type', 'comment')
        .eq('user_id', currentUserId)
        .in('post_id', allIds)
      likedIds = (likedData ?? []).map((x: Record<string, unknown>) => String(x.post_id))
    }

    let likeMap: Record<string, number> = {}
    if (allIds.length > 0) {
      const { data: likeCounts } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('post_type', 'comment')
        .in('post_id', allIds)

      for (const lc of likeCounts ?? []) {
        const pid = String((lc as Record<string, unknown>).post_id)
        likeMap[pid] = (likeMap[pid] ?? 0) + 1
      }
    }

    const buildComment = (r: Record<string, unknown>): PostComment => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo = (u ?? {}) as Record<string, unknown>
      const rtuid = r.reply_to_user_id ? String(r.reply_to_user_id) : null
      return {
        id: String(r.id),
        user_id: String(r.user_id),
        content: String(r.content),
        created_at: String(r.created_at),
        parent_id: r.parent_id ? String(r.parent_id) : null,
        reply_to_user_id: rtuid,
        reply_to_user_alias: rtuid ? (aliasById[rtuid] ?? null) : null,
        user: {
          alias: uo.alias ? String(uo.alias) : null,
          nombre: uo.nombre ? String(uo.nombre) : null,
          avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
        },
        likeCount: likeMap[String(r.id)] ?? 0,
        likedByMe: likedIds.includes(String(r.id)),
        replies: [],
        repliesShown: REPLIES_PAGE_SIZE,
      }
    }

    const repliesByParent: Record<string, PostComment[]> = {}
    for (const r of repliesData) {
      const pid = String(r.parent_id)
      if (!repliesByParent[pid]) repliesByParent[pid] = []
      repliesByParent[pid].push(buildComment(r))
    }

    const parsed: PostComment[] = roots.map(r => {
      const c = buildComment(r)
      c.replies = repliesByParent[c.id] ?? []
      return c
    })

    setTotal(count ?? 0)
    setComments(append ? prev => [...prev, ...parsed.slice(prev.length)] : parsed)
  }

  useEffect(() => {
    setPage(1)
    void loadComments(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload comments when post identity or user changes
  }, [postId, postType, currentUserId])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    const next = page + 1
    setPage(next)
    await loadComments(next, true)
    setLoadingMore(false)
  }

  const handlePost = async () => {
    if (!currentUserId || !text.trim() || posting) return
    setPosting(true)
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        user_id: currentUserId,
        post_type: postType,
        post_id: postId,
        content: text.trim(),
        parent_id: null,
      })
      .select(`id, user_id, content, created_at, parent_id, users(alias, nombre, avatar_url)`)
      .single()

    if (!error && data) {
      const r = data as Record<string, unknown>
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo = (u ?? {}) as Record<string, unknown>
      const trimmed = text.trim()
      const newComment: PostComment = {
        id: String(r.id),
        user_id: String(r.user_id),
        content: String(r.content),
        created_at: String(r.created_at),
        parent_id: null,
        reply_to_user_id: null,
        reply_to_user_alias: null,
        user: {
          alias: uo.alias ? String(uo.alias) : null,
          nombre: uo.nombre ? String(uo.nombre) : null,
          avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
        },
        likeCount: 0,
        likedByMe: false,
        replies: [],
        repliesShown: REPLIES_PAGE_SIZE,
      }
      setComments(prev => [...prev, newComment])
      setTotal(t => t + 1)
      setText('')
      if (postOwnerId && postOwnerId !== currentUserId) {
        await supabase.from('user_notifications').insert({
          recipient_id: postOwnerId,
          actor_id: currentUserId,
          type: 'comment_post',
          post_type: postType,
          post_id: postId,
          href: postHref,
        })
        notifyNotifUpdated()
        void sendPushNotif(
          postOwnerId,
          'Nuevo comentario',
          `${currentUserAlias ?? 'Alguien'}: ${trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed}`,
          postHref
        )
      }
    }
    setPosting(false)
  }

  const handlePostReply = async () => {
    if (!currentUserId || !replyText.trim() || replyPosting || !replyTarget) return
    setReplyPosting(true)

    const rootComment = comments.find(c => c.id === replyTarget.rootCommentId)
    if (!rootComment) {
      setReplyPosting(false)
      return
    }

    const trimmed = replyText.trim()
    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        user_id: currentUserId,
        post_type: postType,
        post_id: postId,
        content: trimmed,
        parent_id: replyTarget.rootCommentId,
        reply_to_user_id: replyTarget.replyToUserId,
      })
      .select(`id, user_id, content, created_at, parent_id, reply_to_user_id, users(alias, nombre, avatar_url)`)
      .single()

    if (!error && data) {
      const r = data as Record<string, unknown>
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo = (u ?? {}) as Record<string, unknown>
      const newReply: PostComment = {
        id: String(r.id),
        user_id: String(r.user_id),
        content: String(r.content),
        created_at: String(r.created_at),
        parent_id: String(r.parent_id),
        reply_to_user_id: replyTarget.replyToUserId,
        reply_to_user_alias: replyTarget.replyToUserAlias,
        user: {
          alias: uo.alias ? String(uo.alias) : null,
          nombre: uo.nombre ? String(uo.nombre) : null,
          avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
        },
        likeCount: 0,
        likedByMe: false,
        replies: [],
        repliesShown: REPLIES_PAGE_SIZE,
      }

      setComments(prev => prev.map(c =>
        c.id === replyTarget.rootCommentId
          ? { ...c, replies: [...c.replies, newReply], repliesShown: Math.max(c.repliesShown, c.replies.length + 1) }
          : c
      ))
      setReplyText('')
      setReplyTarget(null)

      if (replyTarget.replyToUserId !== currentUserId) {
        await supabase.from('user_notifications').insert({
          recipient_id: replyTarget.replyToUserId,
          actor_id: currentUserId,
          type: 'reply_comment',
          post_type: postType,
          post_id: postId,
          comment_id: replyTarget.rootCommentId,
          href: postHref,
        })
        notifyNotifUpdated()
        void sendPushNotif(
          replyTarget.replyToUserId,
          'Nueva respuesta',
          `${currentUserAlias ?? 'Alguien'}: ${trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed}`,
          postHref
        )
      }
    }
    setReplyPosting(false)
  }

  const handleLikeComment = async (commentId: string, likedByMe: boolean) => {
    if (!currentUserId) return

    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, likedByMe: !likedByMe, likeCount: likedByMe ? c.likeCount - 1 : c.likeCount + 1 }
      }
      if (c.replies.some(r => r.id === commentId)) {
        return {
          ...c,
          replies: c.replies.map(r =>
            r.id === commentId
              ? { ...r, likedByMe: !likedByMe, likeCount: likedByMe ? r.likeCount - 1 : r.likeCount + 1 }
              : r
          ),
        }
      }
      return c
    }))

    if (likedByMe) {
      await supabase.from('post_reactions').delete()
        .eq('post_type', 'comment')
        .eq('post_id', commentId)
        .eq('user_id', currentUserId)
    } else {
      const { error } = await supabase.from('post_reactions').insert({
        user_id: currentUserId,
        post_type: 'comment',
        post_id: commentId,
        reaction: 'fire',
      })
      if (!error) {
        let targetComment: PostComment | undefined
        for (const c of comments) {
          if (c.id === commentId) { targetComment = c; break }
          const rep = c.replies.find(r => r.id === commentId)
          if (rep) { targetComment = rep; break }
        }
        if (targetComment && targetComment.user_id !== currentUserId) {
          await supabase.from('user_notifications').insert({
            recipient_id: targetComment.user_id,
            actor_id: currentUserId,
            type: 'like_comment',
            post_type: 'comment',
            post_id: commentId,
            comment_id: commentId,
            href: postHref,
          })
          notifyNotifUpdated()
          void sendPushNotif(
            targetComment.user_id,
            'Nueva reacción',
            `${currentUserAlias ?? 'Alguien'} reaccionó a tu comentario`,
            postHref
          )
        }
      }
    }
  }

  const displayedComments = comments.slice(0, page * COMMENTS_PAGE_SIZE)
  const hasMore = total > displayedComments.length

  return (
    <div className="mt-3 border-t border-[#EEEEEE] pt-3 space-y-3">
      {/* Input nuevo comentario */}
      {currentUserId && (
        <div className="flex gap-2 items-start">
          <div className="w-7 h-7 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
            {currentUserAvatar
              ? <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[10px] text-[#CC4B37] font-bold" style={jost}>
                  {(currentUserAlias ?? 'U')[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="flex-1 flex gap-2">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handlePost() } }}
              placeholder="Escribe un comentario…"
              rows={1}
              style={lato}
              className="flex-1 resize-none border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] rounded-[2px]"
            />
            <button
              type="button"
              onClick={() => void handlePost()}
              disabled={!text.trim() || posting}
              style={jost}
              className="shrink-0 bg-[#CC4B37] px-3 py-2 text-[10px] font-extrabold uppercase text-white disabled:opacity-40"
            >
              {posting ? '…' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Lista comentarios raíz + replies */}
      {displayedComments.map(c => {
        const name = c.user.alias?.trim() || c.user.nombre?.trim() || 'Jugador'
        const visibleReplies = c.replies.slice(0, c.repliesShown)
        const hiddenReplies = c.replies.length - visibleReplies.length

        return (
          <div key={c.id} className="space-y-2">
            <div className="flex gap-2">
              <div className="w-7 h-7 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
                {c.user.avatar_url
                  ? <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[10px] text-[#CC4B37] font-bold" style={jost}>
                      {name[0].toUpperCase()}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-[#F4F4F4] px-3 py-2 rounded-[2px]">
                  <p style={jost} className="text-[11px] font-extrabold uppercase text-[#111111]">{name}</p>
                  <p style={lato} className="text-[13px] text-[#111111] mt-0.5 break-words">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 ml-1">
                  <p style={lato} className="text-[11px] text-[#999999]">{formatRelativeTime(c.created_at)}</p>
                  <button
                    type="button"
                    onClick={() => void handleLikeComment(c.id, c.likedByMe)}
                    disabled={!currentUserId}
                    className="flex items-center gap-1 disabled:opacity-30"
                  >
                    <HeartIcon filled={c.likedByMe} size={13} />
                    {c.likeCount > 0 && (
                      <span style={lato} className="text-[11px] text-[#999999]">{c.likeCount}</span>
                    )}
                  </button>
                  {currentUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        const isCurrentTarget = replyTarget?.rootCommentId === c.id && replyTarget?.replyToUserId === c.user_id
                        if (isCurrentTarget) {
                          setReplyTarget(null)
                          setReplyText('')
                        } else {
                          setReplyTarget({
                            rootCommentId: c.id,
                            replyToUserId: c.user_id,
                            replyToUserAlias: name,
                          })
                          setReplyText('')
                        }
                      }}
                      style={lato}
                      className="text-[11px] text-[#666666] font-semibold hover:text-[#CC4B37]"
                    >
                      {replyTarget?.rootCommentId === c.id && replyTarget?.replyToUserId === c.user_id ? 'Cancelar' : 'Responder'}
                    </button>
                  )}
                </div>

                {replyTarget?.rootCommentId === c.id && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 bg-[#F4F4F4] px-3 py-1.5 rounded-[2px]">
                      <span style={lato} className="text-[11px] text-[#666666]">
                        Respondiendo a <span className="font-semibold text-[#CC4B37]">@{replyTarget.replyToUserAlias}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => { setReplyTarget(null); setReplyText('') }}
                        className="ml-auto text-[#999999] hover:text-[#CC4B37]"
                        aria-label="Cancelar respuesta"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
                        {currentUserAvatar
                          ? <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[9px] text-[#CC4B37] font-bold" style={jost}>
                              {(currentUserAlias ?? 'U')[0].toUpperCase()}
                            </div>
                        }
                      </div>
                      <div className="flex-1 flex gap-2">
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value.slice(0, 500))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handlePostReply() } }}
                          placeholder={`Responder a ${replyTarget.replyToUserAlias}…`}
                          rows={1}
                          autoFocus
                          style={lato}
                          className="flex-1 resize-none border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] rounded-[2px]"
                        />
                        <button
                          type="button"
                          onClick={() => void handlePostReply()}
                          disabled={!replyText.trim() || replyPosting}
                          style={jost}
                          className="shrink-0 bg-[#CC4B37] px-3 py-2 text-[10px] font-extrabold uppercase text-white disabled:opacity-40"
                        >
                          {replyPosting ? '…' : 'OK'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {visibleReplies.length > 0 && (
                  <div className="mt-2 ml-4 space-y-2 border-l border-[#EEEEEE] pl-3">
                    {visibleReplies.map(rep => {
                      const repName = rep.user.alias?.trim() || rep.user.nombre?.trim() || 'Jugador'
                      return (
                        <div key={rep.id} className="flex gap-2">
                          <div className="w-6 h-6 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
                            {rep.user.avatar_url
                              ? <img src={rep.user.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[9px] text-[#CC4B37] font-bold" style={jost}>
                                  {repName[0].toUpperCase()}
                                </div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-[#F4F4F4] px-3 py-2 rounded-[2px]">
                              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#111111]">{repName}</p>
                              <p style={lato} className="text-[12px] text-[#111111] mt-0.5 break-words">
                                {rep.reply_to_user_alias && rep.reply_to_user_id && rep.reply_to_user_id !== c.user_id && (
                                  <Link
                                    href={`/u/${rep.reply_to_user_id}`}
                                    className="font-semibold text-[#CC4B37] hover:underline mr-1"
                                  >
                                    @{rep.reply_to_user_alias}
                                  </Link>
                                )}
                                {rep.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-1">
                              <p style={lato} className="text-[11px] text-[#999999]">{formatRelativeTime(rep.created_at)}</p>
                              <button
                                type="button"
                                onClick={() => void handleLikeComment(rep.id, rep.likedByMe)}
                                disabled={!currentUserId}
                                className="flex items-center gap-1 disabled:opacity-30"
                              >
                                <HeartIcon filled={rep.likedByMe} size={12} />
                                {rep.likeCount > 0 && (
                                  <span style={lato} className="text-[11px] text-[#999999]">{rep.likeCount}</span>
                                )}
                              </button>
                              {currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const isCurrentTarget = replyTarget?.rootCommentId === c.id && replyTarget?.replyToUserId === rep.user_id
                                    if (isCurrentTarget) {
                                      setReplyTarget(null)
                                      setReplyText('')
                                    } else {
                                      setReplyTarget({
                                        rootCommentId: c.id,
                                        replyToUserId: rep.user_id,
                                        replyToUserAlias: repName,
                                      })
                                      setReplyText('')
                                    }
                                  }}
                                  style={lato}
                                  className="text-[11px] text-[#666666] font-semibold hover:text-[#CC4B37]"
                                >
                                  {replyTarget?.rootCommentId === c.id && replyTarget?.replyToUserId === rep.user_id ? 'Cancelar' : 'Responder'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {hiddenReplies > 0 && (
                      <button
                        type="button"
                        onClick={() => setComments(prev => prev.map(x =>
                          x.id === c.id ? { ...x, repliesShown: x.replies.length } : x
                        ))}
                        style={lato}
                        className="text-[11px] text-[#CC4B37] font-semibold"
                      >
                        Ver {hiddenReplies} respuesta{hiddenReplies > 1 ? 's' : ''} más
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Ver más */}
      {hasMore && (
        <button
          type="button"
          onClick={() => void handleLoadMore()}
          disabled={loadingMore}
          style={lato}
          className="text-[12px] text-[#CC4B37] font-semibold disabled:opacity-40"
        >
          {loadingMore ? 'Cargando…' : `Ver más comentarios (${total - displayedComments.length} restantes)`}
        </button>
      )}
    </div>
  )
}
