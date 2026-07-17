const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const router = express.Router()
function getServiceClient() {
return createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_SERVICE_KEY
)
}
// Middleware: verifica el JWT de Supabase y extrae el user_id
async function requireAuth(req, res, next) {
const auth = req.headers.authorization || ''
const token = auth.replace('Bearer ', '').trim()
if (!token) return res.status(401).json({ error: 'No autorizado' })
const supabase = getServiceClient()
const { data: { user }, error } = await supabase.auth.getUser(token)
if (error || !user) return res.status(401).json({ error: 'Token inválido' })
req.userId = user.id
next()
}
// POST /api/v1/push/subscribe
// Guarda o actualiza la suscripción push del usuario autenticado
router.post('/subscribe', requireAuth, async (req, res) => {
const { endpoint, p256dh, auth, userAgent } = req.body
if (!endpoint || !p256dh || !auth) {
return res.status(400).json({ error: 'Faltan datos de suscripción' })
}
const supabase = getServiceClient()
const { error } = await supabase
.from('push_subscriptions')
.upsert(
{
user_id: req.userId,
endpoint,
p256dh,
auth,
user_agent: userAgent || null,
},
{ onConflict: 'user_id,endpoint' }
)
if (error) {
console.error('[push/subscribe]', error)
return res.status(500).json({ error: 'No se pudo guardar la suscripción' })
}
res.json({ ok: true })
})
// DELETE /api/v1/push/unsubscribe
// Elimina la suscripción del dispositivo actual
router.delete('/unsubscribe', requireAuth, async (req, res) => {
const { endpoint } = req.body
if (!endpoint) return res.status(400).json({ error: 'Falta endpoint' })
const supabase = getServiceClient()
const { error } = await supabase
.from('push_subscriptions')
.delete()
.eq('user_id', req.userId)
.eq('endpoint', endpoint)
if (error) {
console.error('[push/unsubscribe]', error)
return res.status(500).json({ error: 'No se pudo eliminar la suscripción' })
}
res.json({ ok: true })
})
// POST /api/v1/push/notify
// Envía push a un usuario. Llamado desde el frontend tras eventos sociales.
router.post('/notify', requireAuth, async (req, res) => {
  const { recipientId, title, body, url } = req.body
  if (!recipientId || !title || !body) {
    return res.status(400).json({ error: 'Faltan datos' })
  }
  const { sendPushToUser } = require('../lib/push')
  try {
    await sendPushToUser(recipientId, { title, body, url })
    res.json({ ok: true })
  } catch (err) {
    console.error('[push/notify]', err)
    res.status(500).json({ error: 'Error al enviar push' })
  }
})

// POST /api/v1/push/fcm/register
router.post('/fcm/register', requireAuth, async (req, res) => {
  const { token, platform } = req.body
  if (!token || !platform) {
    return res.status(400).json({ error: 'Faltan token o platform' })
  }
  if (!['android', 'ios'].includes(platform)) {
    return res.status(400).json({ error: 'Platform debe ser android o ios' })
  }
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('fcm_tokens')
    .upsert(
      { user_id: req.userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,token' }
    )
  if (error) {
    console.error('[push/fcm/register]', error)
    return res.status(500).json({ error: 'No se pudo registrar el token' })
  }

  // Eliminar web-push del mismo OS para evitar notificaciones duplicadas.
  // El canal nativo (FCM) reemplaza al web-push en este dispositivo.
  try {
    const { data: webSubs } = await supabase
      .from('push_subscriptions')
      .select('id, user_agent')
      .eq('user_id', req.userId)

    if (webSubs && webSubs.length > 0) {
      const matchesOS = (ua) => {
        if (!ua) return false
        if (platform === 'android') return /Android/i.test(ua)
        if (platform === 'ios') return /iPhone|iPad|iPod/i.test(ua)
        return false
      }
      const toDelete = webSubs.filter((s) => matchesOS(s.user_agent)).map((s) => s.id)
      if (toDelete.length > 0) {
        await supabase.from('push_subscriptions').delete().in('id', toDelete)
        console.log(`[push/fcm/register] eliminadas ${toDelete.length} web-push subs de ${platform} para evitar duplicados`)
      }
    }
  } catch (cleanupErr) {
    console.error('[push/fcm/register] error limpiando web-push:', cleanupErr)
    // No es fatal — el token FCM ya se registró
  }

  res.json({ ok: true })
})

// DELETE /api/v1/push/fcm/unregister
router.delete('/fcm/unregister', requireAuth, async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Falta token' })
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('fcm_tokens')
    .delete()
    .eq('user_id', req.userId)
    .eq('token', token)
  if (error) {
    console.error('[push/fcm/unregister]', error)
    return res.status(500).json({ error: 'No se pudo eliminar el token' })
  }
  res.json({ ok: true })
})

module.exports = router
