'use server'

import { createAdminClient } from '@/app/admin/supabase-server'

export async function createBoothUser(input: {
  email: string
  password: string
}): Promise<{ ok: true } | { error: string }> {
  const email = input.email?.trim().toLowerCase()
  const password = input.password
  if (!email || !password) return { error: 'Correo y contraseña requeridos.' }
  if (password.length < 6) return { error: 'Mínimo 6 caracteres.' }

  const admin = createAdminClient()

  const { data: configRow, error: configErr } = await admin
    .from('booth_config')
    .select('active, event_name')
    .eq('id', 1)
    .maybeSingle()

  if (configErr) return { error: 'No se pudo verificar booth.' }

  const config = configRow as { active: boolean; event_name: string | null } | null
  if (!config || !config.active || !config.event_name) {
    return { error: 'El modo booth está inactivo.' }
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createErr || !created?.user) {
    const msg = createErr?.message || 'No se pudo crear la cuenta.'
    if (msg.toLowerCase().includes('already')) {
      return { error: 'Ese correo ya tiene cuenta. Pide al usuario iniciar sesión.' }
    }
    return { error: msg }
  }

  const userId = created.user.id

  await new Promise((r) => setTimeout(r, 300))

  const { error: updErr } = await admin
    .from('users')
    .update({ registered_at_event: config.event_name })
    .eq('id', userId)

  if (updErr) {
    const { error: insErr } = await admin.from('users').upsert(
      {
        id: userId,
        email,
        registered_at_event: config.event_name,
      },
      { onConflict: 'id' }
    )
    if (insErr) {
      console.error('[booth] failed to mark event:', insErr.message)
    }
  }

  return { ok: true }
}
