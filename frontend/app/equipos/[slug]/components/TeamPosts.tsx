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
        {posts.map((post) => (
          <article
            key={post.id}
            className="border border-[#EEEEEE] bg-[#FFFFFF]"
          >
            <div className="aspect-video w-full overflow-hidden bg-[#F4F4F4]">
              {post.foto_url ? (
                <img
                  src={post.foto_url}
                  alt=""
                  width={800}
                  height={450}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[#F4F4F4]" />
              )}
            </div>
            <div className="p-4">
              <h3
                style={jost}
                className="text-[16px] font-extrabold leading-snug text-[#111111]"
              >
                {post.title || 'Sin título'}
              </h3>
              <p
                className="mt-2 line-clamp-4 text-[14px] leading-relaxed text-[#111111]"
                style={lato}
              >
                {excerpt(post.content, 120)}
              </p>
              <time
                className="mt-3 block text-[12px] text-[#666666]"
                style={lato}
                dateTime={post.created_at}
              >
                {formatDate(post.created_at)}
              </time>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
