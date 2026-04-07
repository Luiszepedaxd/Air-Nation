import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'

export default async function PublicSiteHeader() {
  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <header className="w-full border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 flex items-center justify-between">
      <a href="/" className="flex items-center gap-2">
        <span className="w-6 h-6 bg-[#CC4B37] flex items-center justify-center">
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
          </svg>
        </span>
        <span
          style={{ fontFamily: "'Jost', sans-serif", fontWeight: 900 }}
          className="text-[1rem] tracking-[0.18em] text-[#111111] uppercase"
        >
          AIR<span className="text-[#CC4B37]">NATION</span>
        </span>
      </a>

      {session ? (
        <a
          href="/dashboard"
          style={{ fontFamily: "'Jost',sans-serif" }}
          className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#111111] border border-[#EEEEEE] px-3 py-2"
        >
          MI PERFIL
        </a>
      ) : (
        <a
          href="/register"
          style={{ fontFamily: "'Jost',sans-serif" }}
          className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white bg-[#CC4B37] px-3 py-2"
        >
          REGISTRARSE
        </a>
      )}
    </header>
  )
}
