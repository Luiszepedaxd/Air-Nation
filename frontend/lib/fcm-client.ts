const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

export async function registerFcmToken(authToken: string): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return false

    const platform = Capacitor.getPlatform() as 'android' | 'ios'

    const { PushNotifications } = await import('@capacitor/push-notifications')

    // Pedir permiso
    const permResult = await PushNotifications.requestPermissions()
    if (permResult.receive !== 'granted') {
      console.warn('[fcm] permiso denegado')
      return false
    }

    // Registrar listeners ANTES de register() para evitar race condition
    const tokenPromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        alert('[FCM] TIMEOUT - no llegó token en 10s')
        resolve(null)
      }, 10_000)

      PushNotifications.addListener('registration', (t) => {
        clearTimeout(timeout)
        alert('[FCM] Token recibido: ' + t.value?.slice(0, 40))
        resolve(t.value)
      })

      PushNotifications.addListener('registrationError', (err) => {
        clearTimeout(timeout)
        alert('[FCM] registrationError: ' + JSON.stringify(err))
        resolve(null)
      })
    })

    alert('[FCM] Llamando register()...')
    await PushNotifications.register()

    const token = await tokenPromise

    if (!token) {
      alert('[FCM] Sin token, abortando')
      return false
    }

    // Guardar en sessionStorage para no re-registrar cada vez
    try { sessionStorage.setItem('an_fcm_token', token) } catch { /* ignore */ }

    // Registrar en backend
    const res = await fetch(`${API_URL}/push/fcm/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, platform }),
    })

    alert('[FCM] Backend response: ' + res.status + ' ok=' + res.ok)

    return res.ok
  } catch (err) {
    console.error('[fcm] registerFcmToken error:', err)
    return false
  }
}

export async function unregisterFcmToken(authToken: string): Promise<void> {
  try {
    const token = sessionStorage.getItem('an_fcm_token')
    if (!token) return

    await fetch(`${API_URL}/push/fcm/unregister`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token }),
    })

    sessionStorage.removeItem('an_fcm_token')
  } catch (err) {
    console.error('[fcm] unregisterFcmToken error:', err)
  }
}
