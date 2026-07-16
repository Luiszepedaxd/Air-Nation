const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

// ── Firebase Admin (FCM) ─────────────────────────────────────────────────────
let firebaseApp = null

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    console.warn('[push] FIREBASE_SERVICE_ACCOUNT_JSON no definida — FCM desactivado')
    return null
  }
  try {
    const admin = require('firebase-admin')
    const serviceAccount = JSON.parse(raw)
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.log('[push] Firebase Admin inicializado OK')
    return firebaseApp
  } catch (err) {
    console.error('[push] Error inicializando Firebase Admin:', err)
    return null
  }
}

function getServiceClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )
}

// ── FCM: enviar a tokens nativos ─────────────────────────────────────────────
async function sendFcmToUser(userId, payload) {
  const app = getFirebaseApp()
  if (!app) return

  const supabase = getServiceClient()
  const { data: tokens, error } = await supabase
    .from('fcm_tokens')
    .select('id, token, platform')
    .eq('user_id', userId)

  if (error || !tokens || tokens.length === 0) return

  const admin = require('firebase-admin')
  const messaging = admin.messaging(app)

  console.log('[push:fcm] sending to', tokens.length, 'native devices for user', userId)

  const toDelete = []

  await Promise.allSettled(
    tokens.map(async (t) => {
      try {
        await messaging.send({
          token: t.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            url: payload.url || '/dashboard/perfil?tab=notificaciones',
          },
          android: {
            notification: {
              icon: 'ic_notification',
              color: '#CC4B37',
              sound: 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
              },
            },
          },
        })
        console.log('[push:fcm] sent OK to', t.platform, t.token.slice(0, 20))
      } catch (err) {
        const code = err?.errorInfo?.code || ''
        console.error('[push:fcm] failed:', code, t.token.slice(0, 20))
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          toDelete.push(t.id)
        }
      }
    })
  )

  if (toDelete.length > 0) {
    await supabase.from('fcm_tokens').delete().in('id', toDelete)
    console.log('[push:fcm] cleaned up', toDelete.length, 'expired tokens')
  }
}

// ── Web-push: enviar a suscripciones PWA ────────────────────────────────────
async function sendWebPushToUser(userId, payload) {
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    console.warn('[push:web] VAPID keys missing, skipping web-push for user', userId)
    return
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)

  const supabase = getServiceClient()
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error || !subs || subs.length === 0) return

  console.log('[push:web] sending to', subs.length, 'PWA devices for user', userId)

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/dashboard/perfil?tab=notificaciones',
    icon: payload.icon || '/icons/icon-192.png',
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      )
    )
  )

  const toDelete = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const status = result.reason?.statusCode
      if (status === 410 || status === 404) toDelete.push(subs[i].id)
    }
  })

  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', toDelete)
  }
}

// ── Función principal: manda a ambos canales en paralelo ────────────────────
async function sendPushToUser(userId, payload) {
  await Promise.allSettled([
    sendWebPushToUser(userId, payload),
    sendFcmToUser(userId, payload),
  ])
}

module.exports = { sendPushToUser }
