'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notifyNotifUpdated } from '@/lib/user-notifications'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

async function sendPushNotif(
  recipientId: string,
  title: string,
  body: string,
  url: string
) {
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      console.warn('[push] no session token')
      return
    }
    const res = await fetch(`${API_URL}/push/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ recipientId, title, body, url }),
    })
    if (!res.ok) {
      console.warn('[push] notify failed:', res.status, await res.text())
    } else {
      console.log('[push] notify ok para', recipientId)
    }
  } catch (err) {
    console.warn('[push] sendPushNotif error:', err)
  }
}

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

type PostComment = {
  id: string
  user_id: string
  content: string
  created_at: string
  user: { alias: string | null; nombre: string | null; avatar_url: string | null }
  likeCount: number
  likedByMe: boolean
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
  postType: 'player' | 'team' | 'field'
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
}: {
  canDelete: boolean
  onDelete: () => void
  canPin?: boolean
  isPinned?: boolean
  onPin?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  if (!canDelete && !canPin) return null

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
  postType: 'player' | 'team' | 'field'
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
          'Nueva reacción',
          `Alguien reaccionó a tu publicación`,
          postHref
        )
      }
    }
  }

  const handleShare = async () => {
    const fullUrl = `https://airnation.online${shareUrl}`
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
  postType: 'player' | 'team' | 'field'
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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadComments = async (pageNum: number, append = false) => {
    const from = 0
    const to = pageNum * COMMENTS_PAGE_SIZE - 1

    const { data, count } = await supabase
      .from('post_comments')
      .select(`
        id, user_id, content, created_at,
        users ( alias, nombre, avatar_url )
      `, { count: 'exact' })
      .eq('post_type', postType)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!data) return

    const rows = data as Record<string, unknown>[]

    let likedIds: string[] = []
    if (currentUserId && rows.length > 0) {
      const ids = rows.map(r => String(r.id))
      const { data: likedData } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('post_type', 'comment')
        .eq('user_id', currentUserId)
        .in('post_id', ids)
      likedIds = (likedData ?? []).map((x: Record<string, unknown>) => String(x.post_id))
    }

    let likeMap: Record<string, number> = {}
    if (rows.length > 0) {
      const { data: likeCounts } = await supabase
        .from('post_reactions')
        .select('post_id')
        .eq('post_type', 'comment')
        .in('post_id', rows.map(r => String(r.id)))

      likeMap = {}
      for (const lc of likeCounts ?? []) {
        const pid = String((lc as Record<string, unknown>).post_id)
        likeMap[pid] = (likeMap[pid] ?? 0) + 1
      }
    }

    const parsed: PostComment[] = rows.map(r => {
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo = (u ?? {}) as Record<string, unknown>
      return {
        id: String(r.id),
        user_id: String(r.user_id),
        content: String(r.content),
        created_at: String(r.created_at),
        user: {
          alias: uo.alias ? String(uo.alias) : null,
          nombre: uo.nombre ? String(uo.nombre) : null,
          avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
        },
        likeCount: likeMap[String(r.id)] ?? 0,
        likedByMe: likedIds.includes(String(r.id)),
      }
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
      })
      .select(`id, user_id, content, created_at, users(alias, nombre, avatar_url)`)
      .single()

    if (!error && data) {
      const r = data as Record<string, unknown>
      const u = Array.isArray(r.users) ? r.users[0] : r.users
      const uo = (u ?? {}) as Record<string, unknown>
      const newComment: PostComment = {
        id: String(r.id),
        user_id: String(r.user_id),
        content: String(r.content),
        created_at: String(r.created_at),
        user: {
          alias: uo.alias ? String(uo.alias) : null,
          nombre: uo.nombre ? String(uo.nombre) : null,
          avatar_url: uo.avatar_url ? String(uo.avatar_url) : null,
        },
        likeCount: 0,
        likedByMe: false,
      }
      setComments(prev => [newComment, ...prev])
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
          `Alguien comentó tu publicación`,
          postHref
        )
      }
    }
    setPosting(false)
  }

  const handleLikeComment = async (commentId: string, likedByMe: boolean) => {
    if (!currentUserId) return
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, likedByMe: !likedByMe, likeCount: likedByMe ? c.likeCount - 1 : c.likeCount + 1 }
        : c
    ))
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
        const comment = comments.find(c => c.id === commentId)
        if (comment && comment.user_id !== currentUserId) {
          await supabase.from('user_notifications').insert({
            recipient_id: comment.user_id,
            actor_id: currentUserId,
            type: 'like_comment',
            post_type: 'comment',
            post_id: commentId,
            comment_id: commentId,
            href: postHref,
          })
          notifyNotifUpdated()
          void sendPushNotif(
            comment.user_id,
            'Nueva reacción',
            `Alguien reaccionó a tu comentario`,
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

      {/* Lista comentarios — más recientes primero */}
      {displayedComments.map(c => {
        const name = c.user.alias?.trim() || c.user.nombre?.trim() || 'Jugador'
        return (
          <div key={c.id} className="flex gap-2">
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
