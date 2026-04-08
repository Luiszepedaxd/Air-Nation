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
module.exports = router
