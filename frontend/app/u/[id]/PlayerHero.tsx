'use client'

import { ClickableImage } from '@/components/ui/ClickableImage'
import type { PublicUserProfile } from './page'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
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

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function YouTubeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13.5 10.5h-2v-1c0-.5.3-.6.8-.6h1.2V6.2h-2.1c-2 0-2.9 1-2.9 2.6V10.5H7v2.8h1.5V22h3.2v-8.7h2.2l.3-2.8z"
        fill="currentColor"
      />
    </svg>
  )
}

function socialHref(kind: 'instagram' | 'tiktok' | 'youtube' | 'facebook', value: string): string {
  const v = value.trim()
  if (!v) return '#'
  if (v.startsWith('http')) return v
  if (kind === 'instagram') return `https://instagram.com/${v.replace(/^@/, '')}`
  if (kind === 'tiktok') return `https://tiktok.com/@${v.replace(/^@/, '')}`
  if (kind === 'youtube') return v.startsWith('http') ? v : `https://youtube.com/${v}`
  return `https://facebook.com/${v.replace(/^@/, '')}`
}

export function PlayerHero({
  user,
  subtitle,
}: {
  user: PublicUserProfile
  subtitle: string
}) {
  const initial = (user.alias?.trim()?.[0] || '?').toUpperCase()
  const hasMemberNo =
    user.member_number != null && String(user.member_number).trim() !== ''

  const ig = user.instagram?.trim()
  const tt = user.tiktok?.trim()
  const yt = user.youtube?.trim()
  const fb = user.facebook?.trim()

  return (
    <header className="w-full">
      <div className="relative w-full">
        <div className="relative h-[200px] w-full overflow-hidden bg-[#111111] md:h-[260px]">
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
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-[1] flex w-full -translate-x-1/2 translate-y-1/2 justify-center">
          <div
            className="pointer-events-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-[#CC4B37] [border:4px_solid_#FFFFFF]"
            style={{ borderRadius: '50%' }}
          >
            {user.avatar_url ? (
              <ClickableImage
                src={user.avatar_url}
                alt=""
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[28px] text-[#FFFFFF]" style={jost}>
                {initial}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-4 pb-6 pt-16 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1
            style={jost}
            className="text-[24px] font-extrabold uppercase leading-tight text-[#111111] md:text-[28px]"
          >
            {user.alias}
          </h1>
          {hasMemberNo ? (
            <span
              style={jost}
              className="inline-flex items-center gap-1 rounded-[2px] bg-[#111111] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              <CheckIcon />
              VERIFICADO
            </span>
          ) : null}
        </div>

        <p
          className="mt-3 text-[14px] leading-relaxed text-[#666666]"
          style={lato}
        >
          {subtitle}
        </p>

        {hasMemberNo ? (
          <p
            style={jost}
            className="mt-3 text-[14px] font-extrabold uppercase text-[#CC4B37]"
          >
            MIEMBRO #{user.member_number}
          </p>
        ) : null}

        {user.teams ? (
          <p className="mt-3 text-[14px] text-[#111111]" style={lato}>
            <a
              href={`/equipos/${encodeURIComponent(user.teams.slug)}`}
              className="font-semibold text-[#111111] underline decoration-[#EEEEEE] underline-offset-2 transition-colors hover:text-[#CC4B37] hover:decoration-[#CC4B37]"
            >
              {user.teams.nombre}
            </a>
          </p>
        ) : null}

        {user.bio ? (
          <p
            className="mx-auto mt-3 max-w-[480px] text-[14px] leading-relaxed text-[#666666]"
            style={lato}
          >
            {user.bio}
          </p>
        ) : null}

        {ig || tt || yt || fb ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
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
            {tt ? (
              <a
                href={socialHref('tiktok', tt)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                style={lato}
              >
                <TikTokIcon />
                <span>TikTok</span>
              </a>
            ) : null}
            {yt ? (
              <a
                href={socialHref('youtube', yt)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                style={lato}
              >
                <YouTubeIcon />
                <span>YouTube</span>
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
          </div>
        ) : null}
      </div>
    </header>
  )
}
