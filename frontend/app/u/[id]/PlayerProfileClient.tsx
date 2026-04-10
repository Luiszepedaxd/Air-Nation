'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PostBox } from '@/app/dashboard/FeedHome'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { PhotoGrid } from '@/components/posts/PhotoGrid'
import { PostActions, PostMenu } from '@/components/posts/PostInteractions'
import { supabase } from '@/lib/supabase'
import type {
  PlayerEventRow,
  PlayerPostRow,
  PublicReplicaRow,
  PublicUserProfile,
} from './types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type TabId = 'posts' | 'info' | 'replicas' | 'eventos'

const PROFILE_TAB_IDS = ['posts', 'info', 'replicas', 'eventos'] as const

function profileTabFromSearchParams(
  sp: URLSearchParams | { get: (key: string) => string | null }
): TabId {
  const raw = sp.get('tab')
  if (raw && (PROFILE_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as TabId
  }
  return 'posts'
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

function formatDMY(iso: string) {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return ''
  }
}

function postPhotoUrls(post: PlayerPostRow): string[] {
  const raw = post.fotos_urls
  if (!Array.isArray(raw)) return []
  return raw
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 4)
}


export function PlayerProfileClient({
  user,
  posts,
  events,
  replicas,
  rolLabels,
  currentUserId,
  showPostBox = false,
}: {
  user: PublicUserProfile
  posts: PlayerPostRow[]
  events: PlayerEventRow[]
  replicas: PublicReplicaRow[]
  rolLabels: Record<string, string>
  currentUserId: string | null
  showPostBox?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tab, setTabState] = useState<TabId>(() =>
    profileTabFromSearchParams(new URLSearchParams(searchParams.toString()))
  )

  useEffect(() => {
    setTabState(profileTabFromSearchParams(new URLSearchParams(searchParams.toString())))
  }, [searchParams])

  function setTab(id: TabId) {
    setTabState(id)
    const next = new URLSearchParams(searchParams.toString())
    next.set('tab', id)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const tabs: [TabId, string][] = [
    ['posts', 'Posts'],
    ['info', 'Info'],
    ['replicas', 'Arsenal'],
    ['eventos', 'Eventos'],
  ]

  const fieldShell =
    'border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-3'

  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-[#EEEEEE] bg-[#FFFFFF]">
        <ScrollableTabsNav>
          <nav
            className="flex min-w-max gap-6 px-4 md:mx-auto md:max-w-[960px] md:gap-8 md:px-6"
            aria-label="Secciones del perfil"
          >
            {tabs.map(([id, label]) => {
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
                  style={jost}
                  className={`shrink-0 border-b-2 py-3 text-[11px] font-extrabold uppercase tracking-[0.15em] transition-colors ${
                    active
                      ? 'border-[#CC4B37] text-[#111111]'
                      : 'border-transparent text-[#666666] hover:text-[#111111]'
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
        {tab === 'posts' ? (
          <>
            {showPostBox && currentUserId ? (
              <div className="mx-auto mb-4 w-full max-w-[600px]">
                <PostBox
                  userId={currentUserId}
                  userAlias={user.alias}
                  userAvatar={user.avatar_url}
                  userTeams={[]}
                  userFields={[]}
                  onPublished={() => window.location.reload()}
                />
              </div>
            ) : null}
            <PostsPanel
              posts={posts}
              profileUserId={user.id}
              currentUserId={currentUserId}
            />
          </>
        ) : null}

        {tab === 'info' ? (
          <InfoPanel user={user} rolLabels={rolLabels} fieldShell={fieldShell} />
        ) : null}

        {tab === 'replicas' ? (
          <ReplicasPanel replicas={replicas} />
        ) : null}

        {tab === 'eventos' ? (
          <EventosPanel events={events} />
        ) : null}
      </div>
    </div>
  )
}

function PostsPanel({
  posts,
  profileUserId,
  currentUserId,
}: {
  posts: PlayerPostRow[]
  profileUserId: string
  currentUserId: string | null
}) {
  const router = useRouter()

  if (!posts.length) {
    return (
      <p className="py-12 text-center text-[14px] text-[#666666]" style={lato}>
        Aún no hay publicaciones
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => {
        const urls = postPhotoUrls(post)
        const isOwner = currentUserId === profileUserId

        return (
          <article
            id={`post-${post.id}`}
            key={post.id}
            className="mx-auto mb-4 w-full max-w-[600px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[11px] text-[#999999]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {new Intl.DateTimeFormat('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(post.created_at))}
              </p>
              <PostMenu
                canDelete={isOwner}
                onDelete={async () => {
                  const { error } = await supabase
                    .from('player_posts')
                    .delete()
                    .eq('id', post.id)
                    .eq('user_id', profileUserId)
                  if (!error) {
                    router.refresh()
                  }
                }}
              />
            </div>
            {post.content?.trim() ? (
              <p
                className="mb-3 text-[14px] leading-relaxed text-[#111111]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {post.content.trim()}
              </p>
            ) : null}
            {urls.length > 0 && <PhotoGrid urls={urls} />}
            <PostActions
              postType="player"
              postId={post.id}
              postOwnerId={profileUserId}
              postHref={`/u/${profileUserId}`}
              currentUserId={currentUserId}
              currentUserAlias={null}
              currentUserAvatar={null}
              shareUrl={`/u/${profileUserId}#post-${post.id}`}
              shareTitle="Publicación en AirNation"
            />
          </article>
        )
      })}
    </div>
  )
}

function InfoPanel({
  user,
  rolLabels,
  fieldShell,
}: {
  user: PublicUserProfile
  rolLabels: Record<string, string>
  fieldShell: string
}) {
  return (
    <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
      {user.bio ? (
        <div className={`${fieldShell} md:col-span-2`}>
          <p
            style={jost}
            className="text-[10px] font-extrabold uppercase text-[#666666]"
          >
            BIO
          </p>
          <p
            className="mt-1 text-[14px] leading-relaxed text-[#111111]"
            style={lato}
          >
            {user.bio}
          </p>
        </div>
      ) : null}

      <div className={fieldShell}>
        <p
          style={jost}
          className="text-[10px] font-extrabold uppercase text-[#666666]"
        >
          CIUDAD
        </p>
        <p className="mt-1 text-[15px] text-[#111111]" style={lato}>
          {user.ciudad || '—'}
        </p>
      </div>

      <div className={fieldShell}>
        <p
          style={jost}
          className="text-[10px] font-extrabold uppercase text-[#666666]"
        >
          ROL DE JUEGO
        </p>
        <p className="mt-1">
          <span
            style={jost}
            className="inline-block rounded-[2px] bg-[#F4F4F4] px-2 py-1 text-[12px] font-extrabold uppercase text-[#111111]"
          >
            {user.rol ? rolLabels[user.rol] || user.rol : '—'}
          </span>
        </p>
      </div>

      <div className={fieldShell}>
        <p
          style={jost}
          className="text-[10px] font-extrabold uppercase text-[#666666]"
        >
          EQUIPO
        </p>
        {user.teams ? (
          <p className="mt-1 text-[15px]" style={lato}>
            <Link
              href={`/equipos/${encodeURIComponent(user.teams.slug)}`}
              className="font-semibold text-[#111111] underline decoration-[#EEEEEE] underline-offset-2 transition-colors hover:text-[#CC4B37] hover:decoration-[#CC4B37]"
            >
              {user.teams.nombre}
            </Link>
          </p>
        ) : (
          <p className="mt-1 text-[15px] text-[#AAAAAA]" style={lato}>—</p>
        )}
      </div>

      <div className={fieldShell}>
        <p
          style={jost}
          className="text-[10px] font-extrabold uppercase text-[#666666]"
        >
          MIEMBRO DESDE
        </p>
        <p className="mt-1 text-[15px] text-[#111111]" style={lato}>
          {formatDMY(user.created_at)}
        </p>
      </div>

      {user.member_number != null &&
      String(user.member_number).trim() !== '' ? (
        <div className={fieldShell}>
          <p
            style={jost}
            className="text-[10px] font-extrabold uppercase text-[#666666]"
          >
            Nº MIEMBRO
          </p>
          <p
            style={jost}
            className="mt-1 text-[20px] font-extrabold text-[#CC4B37]"
          >
            #{user.member_number}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3L4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7L12 3Z"
        stroke="#AAAAAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12l2 2 4-4"
        stroke="#AAAAAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ReplicasPanel({ replicas }: { replicas: PublicReplicaRow[] }) {
  if (!replicas.length) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <ShieldIcon />
        <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">
          Este operador aún no ha registrado su arsenal
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {replicas.map((r) => (
        <div
          key={r.id}
          className="border border-[#EEEEEE] bg-[#FFFFFF] overflow-hidden"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
            {r.foto_url ? (
              <img src={r.foto_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShieldIcon />
              </div>
            )}
            {r.verificada && (
              <span
                className="absolute left-2 top-2 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white"
                style={jost}
              >
                ✓ Verificada
              </span>
            )}
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>
              {r.nombre}
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {r.sistema && (
                <span className="border border-[#EEEEEE] px-2 py-0.5 text-[10px] text-[#666666]" style={lato}>
                  {r.sistema}
                </span>
              )}
              {r.mecanismo && (
                <span className="border border-[#EEEEEE] px-2 py-0.5 text-[10px] text-[#666666]" style={lato}>
                  {r.mecanismo}
                </span>
              )}
            </div>
            {r.ciudad && (
              <p className="mt-1.5 text-[11px] text-[#999999]" style={lato}>
                {r.ciudad}{r.estado ? `, ${r.estado}` : ''}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function EventosPanel({ events }: { events: PlayerEventRow[] }) {
  if (!events.length) {
    return (
      <p className="py-12 text-center text-[14px] text-[#666666]" style={lato}>
        Aún no ha asistido a eventos
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((ev) => (
        <Link
          key={ev.id}
          href={`/eventos/${ev.id}`}
          className="block border border-[#EEEEEE] bg-[#FFFFFF] transition-colors hover:bg-[#F4F4F4]"
        >
          <div className="h-[140px] w-full overflow-hidden bg-[#111111]">
            {ev.imagen_url ? (
              <img
                src={ev.imagen_url}
                alt=""
                width={400}
                height={200}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="p-3">
            <p
              style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
              className="text-[14px] text-[#111111] line-clamp-2"
            >
              {ev.title || 'Evento'}
            </p>
            {ev.fecha ? (
              <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                {formatDate(ev.fecha)}
              </p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  )
}
