const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
export async function subscribeToPush(authToken: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const registration = await navigator.serviceWorker.ready

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY no definida')
      return false
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })

    const sub = subscription.toJSON()
    if (!sub.keys?.p256dh || !sub.keys?.auth) return false

    const res = await fetch(`${API_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent: navigator.userAgent,
      }),
    })

    return res.ok
  } catch (err) {
    console.error('[push] subscribeToPush error:', err)
    return false
  }
}
export async function unsubscribeFromPush(authToken: string): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()

    await fetch(`${API_URL}/push/unsubscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ endpoint }),
    })
  } catch (err) {
    console.error('[push] unsubscribeFromPush error:', err)
  }
}
export function updateAppBadge(count: number): void {
  if (!('setAppBadge' in navigator)) return
  try {
    if (count > 0) {
      // @ts-ignore — Badging API aún no tipada en todos los envs
      navigator.setAppBadge(count)
    } else {
      // @ts-ignore
      navigator.clearAppBadge()
    }
  } catch {
    // Silencioso — no todos los browsers lo soportan
  }
}
