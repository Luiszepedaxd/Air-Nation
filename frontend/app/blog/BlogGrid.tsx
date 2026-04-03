'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type BlogListPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_url: string | null
  category: string | null
  created_at: string
}

const FILTERS = [
  { id: 'todos' as const, label: 'TODOS' },
  { id: 'noticias' as const, label: 'NOTICIAS' },
  { id: 'tutoriales' as const, label: 'TUTORIALES' },
  { id: 'eventos' as const, label: 'EVENTOS' },
  { id: 'comunidad' as const, label: 'COMUNIDAD' },
]

type FilterId = (typeof FILTERS)[number]['id']

function formatPostDate(iso: string) {
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

function DocumentoIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 3h8l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1Z"
        stroke="#AAAAAA"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M15 3v4h4M9 11h6M9 15h4"
        stroke="#AAAAAA"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BlogGrid({ posts }: { posts: BlogListPost[] }) {
  const [active, setActive] = useState<FilterId>('todos')

  const filtered = useMemo(() => {
    if (active === 'todos') return posts
    return posts.filter(
      (p) => (p.category ?? '').toLowerCase() === active
    )
  }, [posts, active])

  return (
    <div className="min-w-[375px] bg-[#FFFFFF] pb-12">
      <div className="flex flex-wrap gap-2 px-6 pt-6">
        {FILTERS.map((f) => {
          const isOn = active === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActive(f.id)}
              style={jost}
              className={`rounded-[2px] px-[14px] py-[6px] text-[11px] font-extrabold uppercase transition-colors duration-150 ${
                isOn
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div
            className="col-span-full py-16 text-center text-[14px] text-[#666666]"
            style={lato}
          >
            No hay posts en esta categoría
          </div>
        ) : (
          filtered.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block overflow-hidden rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] transition-all duration-150 hover:border-[#CCCCCC] hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
            >
              <div className="aspect-video w-full overflow-hidden bg-[#F4F4F4]">
                {post.cover_url ? (
                  <img
                    src={post.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <DocumentoIcon />
                  </div>
                )}
              </div>
              <div className="px-3 pb-3 pt-0">
                {post.category ? (
                  <p
                    style={jost}
                    className="mt-3 text-[10px] font-extrabold uppercase text-[#CC4B37]"
                  >
                    {post.category}
                  </p>
                ) : null}
                <h2
                  style={jost}
                  className={`line-clamp-2 text-[15px] font-extrabold uppercase leading-snug text-[#111111] ${
                    post.category ? 'mt-1' : 'mt-3'
                  }`}
                >
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p
                    style={lato}
                    className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-[#666666]"
                  >
                    {post.excerpt}
                  </p>
                ) : null}
                <time
                  style={lato}
                  className="mt-2 block text-[11px] text-[#AAAAAA]"
                  dateTime={post.created_at}
                >
                  {formatPostDate(post.created_at)}
                </time>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
