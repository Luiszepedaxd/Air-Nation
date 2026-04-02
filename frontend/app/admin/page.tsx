import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminSupabaseServerClient } from './supabase-server'

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="border border-[#1E2226] bg-[#111315] p-4 md:p-5"
        >
          <div className="mb-2 h-9 w-20 animate-pulse bg-[#1E2226]" />
          <div className="h-3 w-28 animate-pulse bg-[#1E2226]" />
        </div>
      ))}
    </div>
  )
}

async function AdminMetrics() {
  const supabase = createAdminSupabaseServerClient()

  const [usersQ, postsQ, fieldsQ, pendingQ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('fields').select('*', { count: 'exact', head: true }),
    supabase
      .from('fields')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const totalUsers = usersQ.error ? 0 : usersQ.count ?? 0
  const totalPosts = postsQ.error ? 0 : postsQ.count ?? 0
  const totalFields = fieldsQ.error ? 0 : fieldsQ.count ?? 0
  const pendingFields = pendingQ.error ? 0 : pendingQ.count ?? 0

  const metrics = [
    { value: totalUsers, label: 'Total usuarios' },
    { value: totalPosts, label: 'Total posts' },
    { value: totalFields, label: 'Total campos' },
    {
      value: pendingFields,
      label: 'Campos pendientes',
      highlight: pendingFields > 0,
    },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {metrics.map((m) => {
        const highlight = 'highlight' in m && m.highlight
        return (
          <div
            key={m.label}
            className={`border bg-[#111315] p-4 md:p-5 ${
              highlight
                ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.08)]'
                : 'border-[#1E2226]'
            }`}
          >
            <p
              className={`text-3xl font-black tabular-nums md:text-4xl ${
                highlight ? 'text-[#CC4B37]' : 'text-[#EDEDEB]'
              }`}
              style={{ fontFamily: 'Jost, sans-serif' }}
            >
              {m.value}
            </p>
            <p className="mt-1 text-xs text-[#8A8A88]">{m.label}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminHomePage() {
  return (
    <div>
      <h1
        className="mb-8 text-2xl font-black uppercase tracking-[0.12em] text-[#EDEDEB] md:text-3xl"
        style={{ fontFamily: 'Jost, sans-serif' }}
      >
        PANEL ADMIN
      </h1>

      <Suspense fallback={<MetricsSkeleton />}>
        <AdminMetrics />
      </Suspense>

      <section className="mt-10 border-t border-[#1E2226] pt-8">
        <h2
          className="mb-4 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#8A8A88]"
          style={{ fontFamily: 'Jost, sans-serif' }}
        >
          Accesos rápidos
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts/nuevo"
            className="inline-flex border border-[#1E2226] bg-[#111315] px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#EDEDEB] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
            style={{ borderRadius: 2 }}
          >
            Nuevo post
          </Link>
          <Link
            href="/admin/usuarios"
            className="inline-flex border border-[#1E2226] bg-[#111315] px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#EDEDEB] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
            style={{ borderRadius: 2 }}
          >
            Ver usuarios
          </Link>
          <Link
            href="/admin/campos"
            className="inline-flex border border-[#1E2226] bg-[#111315] px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#EDEDEB] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
            style={{ borderRadius: 2 }}
          >
            Aprobar campos
          </Link>
        </div>
      </section>
    </div>
  )
}
