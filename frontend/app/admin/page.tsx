export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Suspense } from 'react'
import { createAdminClient } from './supabase-server'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4 md:p-5"
        >
          <div className="mb-2 h-9 w-20 animate-pulse bg-[#EEEEEE]" />
          <div className="h-3 w-28 animate-pulse bg-[#EEEEEE]" />
        </div>
      ))}
    </div>
  )
}

async function AdminMetrics() {
  const supabase = createAdminClient()

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
            className={`border border-solid p-4 md:p-5 ${
              highlight
                ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.08)]'
                : 'border-[#EEEEEE] bg-[#F4F4F4]'
            }`}
          >
            <p
              className={`text-3xl tabular-nums md:text-4xl ${
                highlight ? 'text-[#CC4B37]' : 'text-[#111111]'
              }`}
              style={jostHeading}
            >
              {m.value}
            </p>
            <p
              className="mt-1 text-xs text-[#666666]"
              style={latoBody}
            >
              {m.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminHomePage() {
  return (
    <div style={latoBody}>
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        PANEL ADMIN
      </h1>

      <Suspense fallback={<MetricsSkeleton />}>
        <AdminMetrics />
      </Suspense>

      <section className="mt-10 border-t border-solid border-[#EEEEEE] pt-8">
        <h2
          className="mb-4 text-[0.7rem] tracking-[0.18em] text-[#666666]"
          style={jostHeading}
        >
          Accesos rápidos
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/posts/nuevo"
            className="inline-flex bg-[#111111] px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
            style={{ ...latoBody, borderRadius: 2, fontWeight: 700 }}
          >
            Nuevo post
          </Link>
          <Link
            href="/admin/usuarios"
            className="inline-flex bg-[#111111] px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
            style={{ ...latoBody, borderRadius: 2, fontWeight: 700 }}
          >
            Ver usuarios
          </Link>
          <Link
            href="/admin/campos"
            className="inline-flex bg-[#111111] px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
            style={{ ...latoBody, borderRadius: 2, fontWeight: 700 }}
          >
            Aprobar campos
          </Link>
          <Link
            href="/admin/bloodmoney2"
            className="inline-flex bg-[#CC4B37] px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
            style={{ ...latoBody, borderRadius: 2, fontWeight: 700 }}
          >
            Landing Blood Money 2
          </Link>
        </div>
      </section>
    </div>
  )
}
