import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'

const jost = { fontFamily: "'Jost', sans-serif" } as const

type PostRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_url: string | null
  category: string | null
  created_at: string
}

export function NoticiasSkeleton() {
  return (
    <section className="space-y-3">
      <div className="h-4 w-40 animate-pulse bg-[#F4F4F4]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border-b border-[#EEEEEE] p-3 md:border-b-0 md:border-r md:border-[#EEEEEE] last:border-b-0 md:last:border-r-0"
          >
            <div className="aspect-video w-full animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-3 w-16 animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-4 w-full animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-3 w-full animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-3 w-24 animate-pulse bg-[#F4F4F4]" />
          </div>
        ))}
      </div>
    </section>
  )
}

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

export async function NoticiasSection() {
  const supabase = createDashboardSupabaseServerClient()
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_url, category, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error || !data?.length) return null

  const posts = data as PostRow[]

  return (
    <section className="space-y-3">
      <h2
        style={jost}
        className="text-[14px] uppercase tracking-widest font-extrabold text-[#666666]"
      >
        Últimas noticias
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
        {posts.map((post, idx) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className={`block border-b border-[#EEEEEE] p-3 last:border-b-0 md:border-r md:border-[#EEEEEE] md:border-b-0 ${
              idx === posts.length - 1 ? 'md:border-r-0' : ''
            }`}
          >
            <article>
              <div className="aspect-video w-full overflow-hidden bg-[#F4F4F4]">
                {post.cover_url ? (
                  <img
                    src={post.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              {post.category ? (
                <p
                  style={jost}
                  className="mt-2 text-[10px] uppercase font-extrabold text-[#CC4B37]"
                >
                  {post.category}
                </p>
              ) : null}
              <h3
                style={jost}
                className={`font-extrabold text-sm uppercase text-[#111111] leading-snug ${
                  post.category ? 'mt-1' : 'mt-2'
                }`}
              >
                {post.title}
              </h3>
              {post.excerpt ? (
                <p className="mt-1 text-[13px] text-[#666666] line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              ) : null}
              <time
                className="mt-2 block text-[11px] text-[#AAAAAA]"
                dateTime={post.created_at}
              >
                {formatPostDate(post.created_at)}
              </time>
            </article>
          </Link>
        ))}
      </div>
    </section>
  )
}
