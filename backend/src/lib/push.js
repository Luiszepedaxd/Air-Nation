const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

/**
 * Envía un push a todos los dispositivos suscritos de un usuario.
 * @param {string} userId
 * @param {{ title: string, body: string, url?: string, icon?: string }} payload
 */
async function sendPushToUser(userId, payload) {
  const supabase = getServiceClient()

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) {
    console.error('[push] error fetching subs for', userId, error.message)
    return
  }

  if (!subs || subs.length === 0) {
    console.warn('[push] no subs found for', userId)
    return
  }

  console.log('[push] sending to', subs.length, 'devices for user', userId)

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/dashboard/perfil?tab=notificaciones',
    icon: payload.icon || '/icons/icon-192.png',
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notification
      )
    )
  )

  const toDelete = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      console.log('[push] sent OK to', subs[i].endpoint.slice(0, 60))
    } else {
      const status = result.reason?.statusCode
      const msg = result.reason?.message || 'unknown error'
      console.error('[push] failed to', subs[i].endpoint.slice(0, 60), 'status:', status, 'msg:', msg)
      if (status === 410 || status === 404) {
        toDelete.push(subs[i].id)
      }
    }
  })

  if (toDelete.length > 0) {
    console.log('[push] cleaning up', toDelete.length, 'expired subs')
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', toDelete)
  }
}

module.exports = { sendPushToUser }
