export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 3600

import type { MetadataRoute } from 'next'
import { createPublicSupabaseClient } from '@/app/u/supabase-public'
import { createClient } from '@/lib/supabase/server'

const BASE = 'https://www.airnation.online'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let rankingEventEntries: MetadataRoute.Sitemap = []
  let rankingLastModified: Date | undefined

  try {
    const sb = createPublicSupabaseClient()
    const { data, error } = await sb
      .from('ranking_eventos')
      .select('slug, updated_at')
      .eq('estado', 'publicado')
      .order('fecha', { ascending: false })

    if (error) {
      console.error('[sitemap] ranking:', error.message)
    } else if (data) {
      const rows = data.filter((row) => row.slug)
      for (const row of rows) {
        if (row.updated_at) {
          const d = new Date(row.updated_at)
          if (!rankingLastModified || d > rankingLastModified) {
            rankingLastModified = d
          }
        }
      }
      rankingEventEntries = rows.map((row) => ({
        url: `${BASE}/ranking/eventos/${row.slug}`,
        lastModified: new Date(row.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch {
    rankingEventEntries = []
  }

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1, changeFrequency: 'weekly' },
    { url: `${BASE}/blog`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/campos`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/equipos`, priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE}/eventos`, priority: 0.8, changeFrequency: 'daily' },
    {
      url: `${BASE}/ranking`,
      priority: 0.8,
      changeFrequency: 'weekly',
      ...(rankingLastModified ? { lastModified: rankingLastModified } : {}),
    },
  ]

  let postEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('posts')
      .select('slug, created_at')
      .eq('published', true)
    if (!error && data) {
      postEntries = data
        .filter((row) => row.slug)
        .map((row) => ({
          url: `${BASE}/blog/${row.slug}`,
          lastModified: new Date(row.created_at),
          changeFrequency: 'monthly' as const,
          priority: 0.8,
        }))
    }
  } catch {
    postEntries = []
  }

  let fieldEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('fields')
      .select('slug, created_at')
      .eq('status', 'approved')
    if (!error && data) {
      fieldEntries = data
        .filter((row) => row.slug)
        .map((row) => ({
          url: `${BASE}/campos/${row.slug}`,
          lastModified: new Date(row.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    }
  } catch {
    fieldEntries = []
  }

  let teamEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('teams')
      .select('slug, created_at')
    if (!error && data) {
      teamEntries = data
        .filter((row) => row.slug)
        .map((row) => ({
          url: `${BASE}/equipos/${row.slug}`,
          lastModified: new Date(row.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
    }
  } catch {
    teamEntries = []
  }

  let eventEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('events')
      .select('id, created_at')
      .eq('status', 'published')
    if (!error && data) {
      eventEntries = data.map((row) => ({
        url: `${BASE}/eventos/${row.id}`,
        lastModified: new Date(row.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch {
    eventEntries = []
  }

  return [
    ...staticEntries,
    ...rankingEventEntries,
    ...postEntries,
    ...fieldEntries,
    ...teamEntries,
    ...eventEntries,
  ]
}
