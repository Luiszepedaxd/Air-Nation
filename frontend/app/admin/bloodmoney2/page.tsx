export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import { BloodMoney2AdminClient } from './BloodMoney2AdminClient'
import type { BM2Record } from './BloodMoney2AdminClient'
import type { BloodMoney2Slug } from '@/app/bloodmoney2/types'
import { BM2_SLUGS } from '@/app/bloodmoney2/types'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminBloodMoney2Page() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()
  const { data, error } = await db
    .from('bloodmoney2_blocks')
    .select('id, slug, config, activo, orden')
    .in('slug', BM2_SLUGS as unknown as string[])
    .order('orden', { ascending: true })

  if (error) {
    console.error('[admin/bloodmoney2] blocks:', error.message)
  }

  const rows = (data ?? []) as {
    id: string
    slug: string
    config: unknown
    activo: unknown
    orden: unknown
  }[]

  const initialBlocks: BM2Record[] = BM2_SLUGS.map((slug, i) => {
    const found = rows.find((r) => r.slug === slug)
    const cfg =
      found?.config && typeof found.config === 'object' && !Array.isArray(found.config)
        ? (found.config as Record<string, unknown>)
        : {}
    return {
      id: found?.id ? String(found.id) : null,
      slug: slug as BloodMoney2Slug,
      config: cfg,
      activo: found ? Boolean(found.activo) : true,
      orden: found ? Number(found.orden ?? i + 1) : i + 1,
    }
  })

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-solid border-[#EEEEEE] pb-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          BLOOD MONEY 2 — LANDING
        </h1>
        <Link
          href="/bloodmoney2"
          target="_blank"
          className="bg-[#111111] px-4 py-2.5 text-[10px] tracking-[0.12em] text-white transition-colors hover:bg-[#CC4B37]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Ver landing →
        </Link>
      </div>

      <BloodMoney2AdminClient initialBlocks={initialBlocks} />
    </div>
  )
}
