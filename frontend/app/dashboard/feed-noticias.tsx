import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { Carrusel } from './components/Carrusel'
import { SectionHeader } from './components/SectionHeader'

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

export function NoticiasSkeleton() {
  return (
    <section>
      <div className="w-full border-t border-[#EEEEEE]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:mx-auto md:max-w-[1200px] md:px-6">
          <div className="h-4 w-44 animate-pulse bg-[#F4F4F4]" />
          <div className="h-3 w-24 animate-pulse bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pt-1 md:px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[280px] shrink-0 overflow-hidden border border-[#EEEEEE] md:w-[320px]"
          >
            <div className="aspect-video w-full animate-pulse bg-[#F4F4F4]" />
            <div className="bg-white p-3">
              <div className="h-2.5 w-14 animate-pulse bg-[#F4F4F4]" />
              <div className="mt-2 h-3.5 w-full animate-pulse bg-[#F4F4F4]" />
              <div className="mt-2 h-3 w-full animate-pulse bg-[#F4F4F4]" />
              <div className="mt-2 h-2.5 w-20 animate-pulse bg-[#F4F4F4]" />
            </div>
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
    <section>
      <SectionHeader title="ÚLTIMAS NOTICIAS" href="/blog" />
      <Carrusel>
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="w-[280px] shrink-0 snap-start border border-[#EEEEEE] bg-[#FFFFFF] md:w-[320px]"
          >
            <article>
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
              <div className="p-3">
                {post.category ? (
                  <p
                    style={jost}
                    className="text-[10px] font-extrabold uppercase text-[#CC4B37]"
                  >
                    {post.category}
                  </p>
                ) : null}
                <h3
                  style={jost}
                  className="mt-1 line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]"
                >
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#666666]">
                    {post.excerpt}
                  </p>
                ) : null}
                <time
                  className="mt-2 block text-[11px] text-[#AAAAAA]"
                  dateTime={post.created_at}
                >
                  {formatPostDate(post.created_at)}
                </time>
              </div>
            </article>
          </Link>
        ))}
      </Carrusel>
    </section>
  )
}
