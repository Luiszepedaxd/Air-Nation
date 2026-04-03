'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient, createAdminSupabaseServerClient } from '../supabase-server'

export type Authority = 'GN' | 'SSP' | 'SCT' | 'PM'

export type CreateDocumentInput = {
  title: string
  authority: Authority
  ciudad: string
  file_url: string
  published: boolean
}

const AUTHORITIES: Authority[] = ['GN', 'SSP', 'SCT', 'PM']

function isAuthority(v: unknown): v is Authority {
  return typeof v === 'string' && (AUTHORITIES as string[]).includes(v)
}

export async function createDocument(
  data: CreateDocumentInput
): Promise<{ success: true; id: string } | { error: string }> {
  const title = data.title?.trim() ?? ''
  const ciudad = data.ciudad?.trim() ?? ''
  const file_url = data.file_url?.trim() ?? ''

  if (!title) {
    return { error: 'El título es obligatorio' }
  }
  if (!isAuthority(data.authority)) {
    return { error: 'Autoridad no válida' }
  }
  if (!ciudad) {
    return { error: 'La ciudad es obligatoria' }
  }
  if (!file_url) {
    return { error: 'La URL del archivo es obligatoria' }
  }

  const authClient = createAdminSupabaseServerClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user?.id) {
    return { error: 'No autenticado' }
  }

  const supabase = createAdminClient()

  const { data: inserted, error } = await supabase
    .from('documents')
    .insert({
      title,
      authority: data.authority,
      ciudad,
      file_url,
      published: Boolean(data.published),
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/documentos')
  return { success: true as const, id: inserted.id }
}

export async function toggleDocumentPublish(
  id: string,
  published: boolean
): Promise<{ success: true } | { error: string }> {
  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('documents')
    .update({ published })
    .eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/documentos')
  return { success: true as const }
}

export async function deleteDocument(
  id: string
): Promise<{ success: true } | { error: string }> {
  const trimmedId = id?.trim() ?? ''
  if (!trimmedId) {
    return { error: 'ID no válido' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('documents').delete().eq('id', trimmedId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/documentos')
  return { success: true as const }
}
