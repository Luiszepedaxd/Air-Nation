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

  if (error || !subs || subs.length === 0) return

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

  // Limpiar suscripciones expiradas o inválidas (410 Gone o 404)
  const toDelete = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const status = result.reason?.statusCode
      if (status === 410 || status === 404) {
        toDelete.push(subs[i].id)
      }
    }
  })

  if (toDelete.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('id', toDelete)
  }
}

module.exports = { sendPushToUser }
