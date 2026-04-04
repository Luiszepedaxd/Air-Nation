import type { TeamPostRow } from '../types'

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

function PostMediaGrid({ urls }: { urls: string[] }) {
  const n = urls.length
  if (n === 0) return null
  if (n === 1) {
    return (
      <div className="aspect-[16/9] w-full overflow-hidden bg-[#F4F4F4]">
        <img
          src={urls[0]}
          alt=""
          width={800}
          height={450}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {urls.slice(0, 4).map((u) => (
        <div
          key={u}
          className="aspect-square w-full overflow-hidden bg-[#F4F4F4]"
        >
          <img
            src={u}
            alt=""
            width={400}
            height={400}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  )
}

export function TeamPosts({ posts }: { posts: TeamPostRow[] }) {
  if (!posts.length) return null

  return (
    <section className="mx-auto w-full max-w-[960px] px-4 py-8">
      <h2
        style={jost}
        className="mb-6 text-[14px] font-extrabold uppercase tracking-wide text-[#111111] md:text-[16px]"
      >
        Publicaciones
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {posts.map((post) => {
          const urls = postPhotoUrls(post)
          const ex = excerpt(post.content, 120)

          return (
            <article
              key={post.id}
              className="border border-[#EEEEEE] bg-[#FFFFFF]"
            >
              {urls.length > 0 ? (
                <div className="w-full overflow-hidden bg-[#F4F4F4]">
                  <PostMediaGrid urls={urls} />
                </div>
              ) : null}
              <div className="p-4">
                {ex ? (
                  <p
                    className="text-[14px] leading-relaxed text-[#111111] line-clamp-4"
                    style={lato}
                  >
                    {ex}
                  </p>
                ) : null}
                <time
                  className="mt-3 block text-[12px] text-[#666666]"
                  style={lato}
                  dateTime={post.created_at}
                >
                  {formatDate(post.created_at)}
                </time>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
