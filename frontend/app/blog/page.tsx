import type { Metadata } from 'next'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { BlogGrid, type BlogListPost } from './BlogGrid'

export const metadata: Metadata = {
  title: 'Blog — Airsoft en México | AirNation',
  description: 'Noticias, tutoriales y comunidad del airsoft en México.',
}

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export default async function BlogPage() {
  const supabase = createDashboardSupabaseServerClient()
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_url, category, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  const posts: BlogListPost[] =
    !error && data ? (data as BlogListPost[]) : []

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <header className="border-b border-solid border-[#EEEEEE] px-6 py-6">
        <h1
          style={jost}
          className="text-[32px] font-extrabold uppercase leading-tight text-[#111111]"
        >
          BLOG
        </h1>
        <p
          style={lato}
          className="mt-2 text-[14px] leading-relaxed text-[#666666]"
        >
          Noticias, tutoriales y comunidad
        </p>
      </header>

      <BlogGrid posts={posts} />
    </div>
  )
}
