import Link from 'next/link'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import type { BlogListPost } from '@/app/blog/BlogGrid'

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

function BlogHomeCard({ post }: { post: BlogListPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] transition-all duration-150 hover:border-[#CCCCCC] hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]"
    >
      <div className="aspect-video w-full shrink-0 overflow-hidden bg-[#F4F4F4]">
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
      <div className="flex flex-1 flex-col px-3 pb-3 pt-0">
        {post.category ? (
          <p className="mt-3 font-display text-[10px] font-extrabold uppercase text-[#CC4B37]">
            {post.category}
          </p>
        ) : null}
        <h3
          className={`line-clamp-2 font-display text-[15px] font-black uppercase leading-snug text-[#111111] ${
            post.category ? 'mt-1' : 'mt-3'
          }`}
        >
          {post.title}
        </h3>
        {post.excerpt ? (
          <p className="mt-1 line-clamp-3 flex-1 font-body text-[13px] leading-relaxed text-[#666666]">
            {post.excerpt}
          </p>
        ) : null}
        <time
          className="mt-2 block font-body text-[11px] text-[#AAAAAA]"
          dateTime={post.created_at}
        >
          {formatPostDate(post.created_at)}
        </time>
      </div>
    </Link>
  )
}

async function fetchRecentPosts(): Promise<BlogListPost[]> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_url, category, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    console.error('[home/blog] list:', error.message)
    return []
  }

  return (data as BlogListPost[]) ?? []
}

export default async function BlogHome() {
  const posts = await fetchRecentPosts()

  if (posts.length === 0) return null

  return (
    <section
      id="blog"
      className="relative bg-[#FFFFFF] px-5 py-10 sm:px-8 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-6 flex flex-col gap-6 sm:mb-10 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 flex items-center gap-4">
                <span className="block h-[2px] w-7 bg-[#CC4B37]" />
                <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
                  Blog
                </p>
              </div>
              <h2
                className="font-display font-black uppercase leading-[0.9] text-[#111111]"
                style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)' }}
              >
                NOTICIAS Y
                <br />
                <span className="text-[#CC4B37]">COMUNIDAD.</span>
              </h2>
              <p className="mt-6 font-body text-base leading-[1.7] text-[#666666] sm:text-[1.05rem]">
                Tutoriales, noticias y lo último del airsoft en México.
              </p>
            </div>
            <Link
              href="/blog"
              className="group inline-flex shrink-0 items-center gap-2 self-start font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37] hover:text-[#CC4B37]/80 lg:self-end"
            >
              Ver todo el blog
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </RevealOnScroll>

        <div className="-mx-5 md:hidden">
          <div
            className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
            style={{
              WebkitOverflowScrolling: 'touch',
              paddingLeft: '1.25rem',
              paddingRight: '1.25rem',
              scrollPaddingLeft: '1.25rem',
              scrollPaddingRight: '1.25rem',
            }}
          >
            {posts.map((post, i) => (
              <div
                key={post.id}
                className={`w-[82%] shrink-0 snap-start ${
                  i === posts.length - 1 ? 'pr-5' : ''
                }`}
                style={{
                  scrollSnapAlign:
                    i === 0
                      ? 'start'
                      : i === posts.length - 1
                        ? 'end'
                        : 'start',
                }}
              >
                <BlogHomeCard post={post} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-1.5 px-5">
            {posts.map((p) => (
              <span
                key={p.id}
                className="h-1 w-1 rounded-full bg-[#CCCCCC]"
                aria-hidden
              />
            ))}
          </div>
        </div>

        <div className="hidden gap-6 md:grid md:grid-cols-3 md:gap-8">
          {posts.map((post, i) => (
            <RevealOnScroll
              key={post.id}
              delay={i * 0.1}
              direction="up"
              distance={40}
            >
              <BlogHomeCard post={post} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}
