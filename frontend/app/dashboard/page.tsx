import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { SaludoSection, SaludoSkeleton } from './feed-saludo'
import { NoticiasSection, NoticiasSkeleton } from './feed-noticias'
import { VideosSection, VideosSkeleton } from './feed-videos'
import { CamposSection, CamposSkeleton } from './feed-campos'
import { EventosSection, EventosSkeleton } from './feed-eventos'

export default async function DashboardHomePage() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: access } = await supabase
    .from('users')
    .select('alias')
    .eq('id', user.id)
    .maybeSingle()

  if (!access?.alias) redirect('/onboarding')

  return (
    <main className="min-h-full bg-[#FFFFFF]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-4 md:px-6 md:py-6">
        <Suspense fallback={<SaludoSkeleton />}>
          <SaludoSection />
        </Suspense>

        <Suspense fallback={<NoticiasSkeleton />}>
          <NoticiasSection />
        </Suspense>

        <Suspense fallback={<VideosSkeleton />}>
          <VideosSection />
        </Suspense>

        <Suspense fallback={<CamposSkeleton />}>
          <CamposSection />
        </Suspense>

        <Suspense fallback={<EventosSkeleton />}>
          <EventosSection />
        </Suspense>
      </div>
    </main>
  )
}
