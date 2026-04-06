export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE = 'https://airnation.online'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1, changeFrequency: 'weekly' },
    { url: `${BASE}/blog`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/campos`, priority: 0.9, changeFrequency: 'daily' },
    { url: `${BASE}/equipos`, priority: 0.8, changeFrequency: 'daily' },
    { url: `${BASE}/eventos`, priority: 0.8, changeFrequency: 'daily' },
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
    ...postEntries,
    ...fieldEntries,
    ...teamEntries,
    ...eventEntries,
  ]
}
