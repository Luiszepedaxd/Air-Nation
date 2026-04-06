import type { TeamPostRow } from '../types'
import { PostPhotoGallery } from './PostPhotoGallery'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

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
}: {
  posts: TeamPostRow[]
  variant?: 'section' | 'tab'
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
          ? 'mx-auto w-full max-w-[960px] px-4 py-8'
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
    </section>
  )
}
