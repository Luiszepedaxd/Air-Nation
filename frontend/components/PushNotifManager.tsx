'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { subscribeToPush, updateAppBadge } from '@/lib/push-client'
import { fetchUnreadNotifCount, NOTIF_UPDATED_EVENT } from '@/lib/user-notifications'

const STORAGE_KEY = 'an_push_subscribed'

export function PushNotifManager({ userId }: { userId: string }) {
  const subscribedRef = useRef(false)

  // ── Suscripción automática al montar ─────────────────────────────────────
  useEffect(() => {
    if (subscribedRef.current) return
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission === 'denied') return

    subscribedRef.current = true

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const { subscribeToPush } = await import('@/lib/push-client')
      const ok = await subscribeToPush(session.access_token)
      if (ok) {
        try { sessionStorage.setItem('an_push_subscribed', '1') } catch { /* ignore */ }
      }
    }

    // En standalone (PWA) ejecutar inmediato, en browser esperar 3s
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      void run()
      return
    }
    const t = window.setTimeout(() => void run(), 3000)
    return () => window.clearTimeout(t)
  }, [])

  // ── Badge en ícono de la app ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const refresh = async () => {
      const count = await fetchUnreadNotifCount(supabase, userId)
      if (!cancelled) updateAppBadge(count)
    }

    void refresh()

    const handler = () => void refresh()
    window.addEventListener(NOTIF_UPDATED_EVENT, handler)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIF_UPDATED_EVENT, handler)
    }
  }, [userId])

  return null
}

export function usePushNotifButton() {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const canShow =
    mounted &&
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    permission !== 'denied' &&
    permission !== 'granted' &&
    !done

  const trigger = useCallback(async () => {
    if (loading) return
    setLoading(true)
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) { setLoading(false); return }
    const { subscribeToPush } = await import('@/lib/push-client')
    const ok = await subscribeToPush(session.access_token)
    if (ok) {
      try { sessionStorage.setItem('an_push_subscribed', '1') } catch { /* ignore */ }
      setDone(true)
      setPermission('granted')
    } else {
      // Actualizar el estado real del permiso después del intento
      if ('Notification' in window) setPermission(Notification.permission)
    }
    setLoading(false)
  }, [loading])

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent)

  return { canShow, isIOS, trigger, loading }
}
