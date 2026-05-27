export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import { MontanaDeNieblaAdminClient } from './MontanaDeNieblaAdminClient'
import type { MDNRecord } from './MontanaDeNieblaAdminClient'
import type { MontanaDeNieblaSlug } from '@/app/montanadeniebla/lib/types'
import { MDN_SLUGS } from '@/app/montanadeniebla/lib/types'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminMontanaDeNieblaPage() {
  const adminId = await requireAppAdminUserId()
  if (!adminId) redirect('/admin')

  const db = createAdminClient()
  const { data, error } = await db
    .from('montanadeniebla_blocks')
    .select('id, slug, config, activo, orden')
    .in('slug', MDN_SLUGS as unknown as string[])
    .order('orden', { ascending: true })

  if (error) {
    console.error('[admin/montanadeniebla] blocks:', error.message)
  }

  const rows = (data ?? []) as {
    id: string
    slug: string
    config: unknown
    activo: unknown
    orden: unknown
  }[]

  const allowedSlugs = new Set(MDN_SLUGS as readonly string[])
  const orderedRows = rows.filter((r) => allowedSlugs.has(r.slug))

  function rowToRecord(r: (typeof orderedRows)[number]): MDNRecord {
    const slug = r.slug as MontanaDeNieblaSlug
    const cfg =
      r.config && typeof r.config === 'object' && !Array.isArray(r.config)
        ? (r.config as Record<string, unknown>)
        : {}
    return {
      id: r.id ? String(r.id) : null,
      slug,
      config: cfg,
      activo: Boolean(r.activo),
      orden: Number(r.orden ?? 0),
    }
  }

  const initialBlocks: MDNRecord[] = orderedRows.map(rowToRecord)
  const seen = new Set(initialBlocks.map((b) => b.slug))
  let nextOrden = initialBlocks.length + 1
  for (const slug of MDN_SLUGS) {
    if (seen.has(slug)) continue
    initialBlocks.push({
      id: null,
      slug,
      config: {},
      activo: true,
      orden: nextOrden++,
    })
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-solid border-[#EEEEEE] pb-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          MONTAÑA DE NIEBLA VII — LANDING
        </h1>
        <Link
          href="/montanadeniebla"
          target="_blank"
          className="bg-[#111111] px-4 py-2.5 text-[10px] tracking-[0.12em] text-white transition-colors hover:bg-[#CC4B37]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Ver landing →
        </Link>
      </div>

      <MontanaDeNieblaAdminClient initialBlocks={initialBlocks} />
    </div>
  )
}
