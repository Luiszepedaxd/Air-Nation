'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PostPhotoGallery } from '@/app/equipos/[slug]/components/PostPhotoGallery'
import type {
  PlayerEventRow,
  PlayerPostRow,
  PublicUserProfile,
} from './types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type TabId = 'posts' | 'info' | 'replicas' | 'eventos'

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

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerpt(content: string | null, max: number) {
  if (!content) return ''
  const text = stripHtml(content)
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function postPhotoUrls(post: PlayerPostRow): string[] {
  const raw = post.fotos_urls
  if (!Array.isArray(raw)) return []
  return raw
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .slice(0, 4)
}

function BulletIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden className="mt-1.5 shrink-0">
      <circle cx="4" cy="4" r="4" fill="#CC4B37" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="#CC4B37" strokeWidth="1.6" />
      <path d="M12 7v5l3 3" stroke="#CC4B37" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlayerProfileClient({
  user,
  posts,
  events,
  rolLabels,
}: {
  user: PublicUserProfile
  posts: PlayerPostRow[]
  events: PlayerEventRow[]
  rolLabels: Record<string, string>
}) {
  const [tab, setTab] = useState<TabId>('posts')

  const tabs: [TabId, string][] = [
    ['posts', 'Posts'],
    ['info', 'Info'],
    ['replicas', 'Réplicas'],
    ['eventos', 'Eventos'],
  ]

  const fieldShell =
    'border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-3'

  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-[#EEEEEE] bg-[#FFFFFF]">
        <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                  onClick={() => setTab(id)}
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
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 py-6 md:px-6 md:py-8">
        {tab === 'posts' ? (
          <PostsPanel posts={posts} />
        ) : null}

        {tab === 'info' ? (
          <InfoPanel user={user} rolLabels={rolLabels} fieldShell={fieldShell} />
        ) : null}

        {tab === 'replicas' ? (
          <ReplicasPanel />
        ) : null}

        {tab === 'eventos' ? (
          <EventosPanel events={events} />
        ) : null}
      </div>
    </div>
  )
}

function PostsPanel({ posts }: { posts: PlayerPostRow[] }) {
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
        const ex = excerpt(post.content, 120)

        return (
          <article
            key={post.id}
            className="mx-auto mb-4 w-full max-w-[600px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            {ex ? (
              <p
                className="mb-3 text-[14px] leading-relaxed text-[#111111] line-clamp-4"
                style={lato}
              >
                {ex}
              </p>
            ) : null}
            {urls.length > 0 ? <PostPhotoGallery urls={urls} /> : null}
            <time
              className="mt-3 block text-[12px] text-[#666666]"
              style={lato}
              dateTime={post.created_at}
            >
              {formatDate(post.created_at)}
            </time>
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

function ReplicasPanel() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#CC4B37]/10">
        <ClockIcon />
      </div>
      <p
        style={jost}
        className="mt-4 text-[11px] font-extrabold uppercase tracking-wide text-[#CC4B37]"
      >
        PRÓXIMAMENTE
      </p>
      <h2
        style={jost}
        className="mt-2 text-[18px] font-extrabold uppercase text-[#111111]"
      >
        RÉPLICAS DEL JUGADOR
      </h2>
      <p className="mt-3 max-w-[400px] text-[14px] leading-relaxed text-[#666666]" style={lato}>
        Pronto podrás ver el arsenal completo de este jugador.
      </p>
      <ul className="mt-6 space-y-3 text-left">
        <li className="flex items-start gap-2 text-[13px] text-[#111111]" style={lato}>
          <BulletIcon />
          <span>Listado de réplicas con fotos y especificaciones</span>
        </li>
        <li className="flex items-start gap-2 text-[13px] text-[#111111]" style={lato}>
          <BulletIcon />
          <span>Marca, modelo y tipo de réplica</span>
        </li>
        <li className="flex items-start gap-2 text-[13px] text-[#111111]" style={lato}>
          <BulletIcon />
          <span>Upgrades y modificaciones</span>
        </li>
      </ul>
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
