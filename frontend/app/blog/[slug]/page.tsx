import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { BlogShareButton } from './BlogShareButton'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type PostFull = {
  id: string
  title: string
  slug: string
  category: string | null
  excerpt: string | null
  content: string
  cover_url: string | null
  meta_title: string | null
  meta_description: string | null
  published: boolean
  created_at: string
  created_by: string | null
  faqs: unknown | null
}

type RelatedPost = {
  id: string
  title: string
  slug: string
  cover_url: string | null
  category: string | null
  created_at: string
}

function parsePostFaqs(raw: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(raw)) return []
  const out: { question: string; answer: string }[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const q = (item as { question?: unknown }).question
    const a = (item as { answer?: unknown }).answer
    if (typeof q !== 'string' || typeof a !== 'string') continue
    const question = q.trim()
    const answer = a.trim()
    if (!question || !answer) continue
    out.push({ question, answer })
  }
  return out
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

async function fetchPostBySlug(slug: string): Promise<PostFull | null> {
  const supabase = createPublicSupabaseClient()
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, title, slug, category, excerpt, content, cover_url, meta_title, meta_description, published, created_at, created_by, faqs'
    )
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error || !data) return null
  return data as PostFull
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await fetchPostBySlug(params.slug)
  if (!post) {
    return { title: 'AirNation' }
  }

  const description =
    post.meta_description?.trim() || post.excerpt?.trim() || undefined

  return {
    title: post.meta_title?.trim() || `${post.title} — AirNation`,
    description: description,
    alternates: {
      canonical: `https://www.airnation.online/blog/${post.slug}`,
    },
    openGraph: {
      title: post.meta_title?.trim() || post.title,
      description: description,
      url: `https://www.airnation.online/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.created_at,
      images: post.cover_url
        ? [{ url: post.cover_url, width: 1200, height: 630 }]
        : [{ url: 'https://www.airnation.online/og-default.jpg', width: 1200, height: 630 }],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await fetchPostBySlug(params.slug)
  if (!post) notFound()

  const faqItems = parsePostFaqs(post.faqs)

  const supabase = createPublicSupabaseClient()
  let related: RelatedPost[] = []

  if (post.category != null && post.category !== '') {
    const { data: rel } = await supabase
      .from('posts')
      .select('id, title, slug, cover_url, category, created_at')
      .eq('category', post.category)
      .neq('slug', params.slug)
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3)
    related = (rel as RelatedPost[] | null) ?? []
  }

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description?.trim() || post.excerpt?.trim() || '',
    datePublished: post.created_at,
    dateModified: post.created_at,
    url: `https://www.airnation.online/blog/${post.slug}`,
    author: {
      '@type': 'Organization',
      name: 'AirNation',
      url: 'https://www.airnation.online',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AirNation',
      url: 'https://www.airnation.online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.airnation.online/icons/icon-180.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.airnation.online/blog/${post.slug}`,
    },
    ...(post.cover_url ? { image: post.cover_url } : {}),
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqItems.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqItems.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      ) : null}

      {post.cover_url ? (
        <div className="w-full overflow-hidden bg-[#F4F4F4]">
          <img
            src={post.cover_url}
            alt=""
            width={1200}
            height={480}
            className="max-h-[480px] w-full object-cover object-top"
          />
        </div>
      ) : (
        <div className="h-[200px] w-full bg-[#F4F4F4]" />
      )}

      <article className="mx-auto max-w-[720px] px-6 py-8">
        {post.category ? (
          <p
            style={jost}
            className="text-[11px] font-extrabold uppercase tracking-widest text-[#CC4B37]"
          >
            {post.category}
          </p>
        ) : null}

        <h1
          style={jost}
          className="mt-2 text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
        >
          {post.title}
        </h1>

        <time
          style={lato}
          className="mt-2 block text-[13px] text-[#AAAAAA]"
          dateTime={post.created_at}
        >
          {formatPostDate(post.created_at)}
        </time>

        <div className="my-4 h-px w-full bg-[#EEEEEE]" />

        <div
          className="prose-airnation"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {faqItems.length > 0 ? (
          <section
            className="mt-10"
            aria-labelledby="blog-faq-heading"
          >
            <h2
              id="blog-faq-heading"
              style={jost}
              className="mb-4 text-[14px] font-extrabold uppercase tracking-widest text-[#111111] md:text-[16px]"
            >
              PREGUNTAS FRECUENTES
            </h2>
            <div className="space-y-2">
              {faqItems.map((faq, i) => (
                <details
                  key={`${faq.question.slice(0, 40)}-${i}`}
                  className="group border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
                >
                  <summary
                    className="cursor-pointer list-none px-4 py-3 text-left text-[13px] font-semibold text-[#111111] marker:hidden [&::-webkit-details-marker]:hidden"
                    style={lato}
                  >
                    <span className="flex items-start justify-between gap-2">
                      {faq.question}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="shrink-0 text-[#CC4B37] transition-transform group-open:rotate-180"
                        aria-hidden
                      >
                        <path
                          d="M6 9l6 6 6-6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div
                    className="border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 text-[14px] leading-relaxed text-[#333333]"
                    style={lato}
                  >
                    <p className="whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2
            style={jost}
            className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-[#111111]"
          >
            COMPARTIR
          </h2>
          <BlogShareButton />
        </section>

        <div className="my-8 h-px w-full bg-[#EEEEEE]" />

        {related.length > 0 ? (
          <section>
            <h2
              style={jost}
              className="mb-6 text-[14px] font-extrabold uppercase text-[#111111] md:text-[16px]"
            >
              MÁS DE {post.category ? post.category.toUpperCase() : 'BLOG'}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="border border-[#EEEEEE] bg-[#FFFFFF]"
                >
                  <div className="aspect-video w-full overflow-hidden bg-[#F4F4F4]">
                    {r.cover_url ? (
                      <img
                        src={r.cover_url}
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
                    {r.category ? (
                      <p
                        style={jost}
                        className="text-[10px] font-extrabold uppercase text-[#CC4B37]"
                      >
                        {r.category}
                      </p>
                    ) : null}
                    <h3
                      style={jost}
                      className="mt-1 line-clamp-2 text-[13px] font-extrabold uppercase leading-snug text-[#111111]"
                    >
                      {r.title}
                    </h3>
                    <time
                      className="mt-2 block text-[11px] text-[#AAAAAA]"
                      dateTime={r.created_at}
                    >
                      {formatPostDate(r.created_at)}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  )
}
