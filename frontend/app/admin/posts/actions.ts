'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

export type PostInput = {
  title: string
  slug: string
  category: string
  excerpt: string
  cover_url: string | null
  content: string
  meta_title: string
  meta_description: string
  published: boolean
}

function textFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function createPost(
  formData: PostInput
): Promise<{ success: true; id: string } | { error: string }> {
  const title = formData.title?.trim() ?? ''
  const slug = formData.slug?.trim() ?? ''
  const category = formData.category?.trim() ?? ''
  const content = formData.content?.trim() ?? ''

  if (!title || !slug || !category || !textFromHtml(content)) {
    return { error: 'Título, slug, categoría y contenido son obligatorios' }
  }

  const authClient = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user?.id) {
    return { error: 'No autenticado' }
  }

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) {
    return { error: 'Ese slug ya está en uso' }
  }

  const { data: inserted, error } = await supabase
    .from('posts')
    .insert({
      title,
      slug,
      category,
      excerpt: formData.excerpt?.trim() || null,
      content,
      cover_url: formData.cover_url || null,
      meta_title: formData.meta_title?.trim() || null,
      meta_description: formData.meta_description?.trim() || null,
      published: formData.published,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/posts')
  revalidatePath(`/blog/${slug}`)
  return { success: true as const, id: inserted.id }
}

export async function updatePost(
  id: string,
  formData: PostInput
): Promise<{ success: true } | { error: string }> {
  const title = formData.title?.trim() ?? ''
  const slug = formData.slug?.trim() ?? ''
  const category = formData.category?.trim() ?? ''
  const content = formData.content?.trim() ?? ''

  if (!title || !slug || !category || !textFromHtml(content)) {
    return { error: 'Título, slug, categoría y contenido son obligatorios' }
  }

  const supabase = createAdminClient()

  const { data: conflict } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', slug)
    .neq('id', id)
    .maybeSingle()

  if (conflict) {
    return { error: 'Ese slug ya está en uso en otro post' }
  }

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      slug,
      category,
      excerpt: formData.excerpt?.trim() || null,
      content,
      cover_url: formData.cover_url || null,
      meta_title: formData.meta_title?.trim() || null,
      meta_description: formData.meta_description?.trim() || null,
      published: formData.published,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/posts')
  revalidatePath(`/blog/${slug}`)
  return { success: true as const }
}

export async function deletePost(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/posts')
  return { success: true as const }
}

export async function togglePublish(
  id: string,
  published: boolean
): Promise<{ success: true } | { error: string }> {
  const supabase = createAdminClient()

  const { data: row, error: fetchErr } = await supabase
    .from('posts')
    .select('slug')
    .eq('id', id)
    .single()

  if (fetchErr || !row) {
    return { error: fetchErr?.message ?? 'Post no encontrado' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ published })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/posts')
  revalidatePath(`/blog/${row.slug}`)
  return { success: true as const }
}
