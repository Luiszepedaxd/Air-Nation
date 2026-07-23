'use client'

import type { UserIdentity } from '@supabase/supabase-js'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PlayerHero } from '@/app/u/[id]/PlayerHero'
import { PlayerProfileClient } from '@/app/u/[id]/PlayerProfileClient'
import type {
  PlayerPostRow,
  PublicReplicaRow,
  PublicUserProfile,
} from '@/app/u/[id]/types'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { usePushNotifButton } from '@/components/PushNotifManager'
import type { ApprovedFieldNotice } from '@/lib/approved-field-notices'
import { isDarkModeEnabled, setDarkMode } from '@/lib/dark-mode'
import type { PendingFieldOwnerRequest } from '@/lib/pending-field-owner-requests'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'
import {
  fetchUnreadNotifCount,
  NOTIF_UPDATED_EVENT,
} from '@/lib/user-notifications'
import { MisCamposTab, type MisCampoItem } from './MisCamposTab'
import {
  MisEventosRsvpSection,
  type MisEventoRsvpItem,
} from './MisEventosRsvpSection'
import { MisEquiposSection, type MisEquipoItem } from './MisEquiposSection'
import { NotificacionesTab } from './NotificacionesTab'
import { BloqueadosSection } from './BloqueadosSection'
import { PerfilLogoutButton } from './PerfilLogoutButton'
import {
  ProfileView,
  type ProfileUserRow,
  type ProfileViewHandle,
} from './ProfileView'
import { CredencialClient } from '@/components/credential/CredencialClient'
import type { CredentialUserData } from '@/components/credential/CredentialCard'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type TabId =
  | 'perfil'
  | 'notificaciones'
  | 'credencial'
  | 'administrar'
  | 'configuracion'

type SubTabAdmin = 'eventos' | 'equipos' | 'campos'

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

const lato = { fontFamily: "'Lato', sans-serif" } as const

function ConfigMiniAvatarSpinner({ className = 'text-[#111111]' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

const permisosLabelStyle = {
  ...jost,
  fontSize: 10,
  color: '#999999',
} as const

function IosToggle({
  checked,
  disabled,
  onToggle,
  ariaLabel,
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onToggle()
      }}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#CC4B37]' : 'bg-[#DDDDDD]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`absolute top-[3px] h-[25px] w-[25px] rounded-full bg-white shadow transition-[left] duration-200 ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

type NativePushPerm = 'prompt' | 'granted' | 'denied'

function normalizePushPerm(receive: string): NativePushPerm {
  if (receive === 'granted' || receive === 'denied') return receive
  return 'prompt'
}

function PermisosSection({
  userId,
  triggerPush,
  pushLoading,
}: {
  userId: string
  triggerPush: () => void | Promise<void>
  pushLoading: boolean
}) {
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  )
  const [isNative, setIsNative] = useState(false)
  const [nativePerm, setNativePerm] = useState<NativePushPerm>('prompt')
  const [locationGranted, setLocationGranted] = useState(false)
  const [geoDenied, setGeoDenied] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [darkMode, setDarkModeState] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission)
    }
  }, [])

  useEffect(() => {
    setDarkModeState(isDarkModeEnabled())
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const { isNativeApp } = await import('@/lib/platform')
      if (!isNativeApp()) return
      if (cancelled) return
      setIsNative(true)
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const perm = await PushNotifications.checkPermissions()
      if (!cancelled) setNativePerm(normalizePushPerm(perm.receive))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!pushLoading && typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission)
    }
  }, [pushLoading])

  useEffect(() => {
    let cancelled = false
    void supabase
      .from('users')
      .select('location_lat')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.location_lat != null) {
          setLocationGranted(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    let cancelled = false
    let permStatus: PermissionStatus | null = null

    const persistCoords = (lat: number, lng: number) =>
      supabase
        .from('users')
        .update({ location_lat: lat, location_lng: lng })
        .eq('id', userId)

    const refreshCoords = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            void persistCoords(pos.coords.latitude, pos.coords.longitude)
          }
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 15_000 }
      )
    }

    const onGranted = () => {
      if (cancelled) return
      setLocationGranted(true)
      setGeoDenied(false)
      refreshCoords()
    }

    const onDenied = () => {
      if (cancelled) return
      setGeoDenied(true)
      setLocationGranted(false)
    }

    const onPrompt = () => {
      if (cancelled) return
      setGeoDenied(false)
      setLocationGranted(false)
    }

    const onPermChange = () => {
      if (!permStatus || cancelled) return
      if (permStatus.state === 'granted') onGranted()
      else if (permStatus.state === 'denied') onDenied()
      else onPrompt()
    }

    ;(async () => {
      try {
        const status = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        })
        if (cancelled) return
        permStatus = status
        if (status.state === 'granted') onGranted()
        else if (status.state === 'denied') onDenied()
        else onPrompt()

        status.addEventListener('change', onPermChange)
      } catch {
        if (!cancelled) onPrompt()
      }
    })()

    return () => {
      cancelled = true
      permStatus?.removeEventListener('change', onPermChange)
    }
  }, [userId])

  const onNotifToggle = () => {
    if (isNative) {
      if (nativePerm === 'granted' || nativePerm === 'denied') return
      void (async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session?.access_token) return
        const { registerFcmToken } = await import('@/lib/fcm-client')
        const ok = await registerFcmToken(session.access_token)
        const { PushNotifications } = await import('@capacitor/push-notifications')
        const perm = await PushNotifications.checkPermissions()
        setNativePerm(ok ? 'granted' : normalizePushPerm(perm.receive))
      })()
      return
    }
    if (pushLoading || notifPerm === 'denied') return
    if (notifPerm === 'granted') return
    void (async () => {
      await triggerPush()
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifPerm(Notification.permission)
      }
    })()
  }

  const onLocationToggle = () => {
    if (locationLoading || geoDenied || locationGranted) return
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase
          .from('users')
          .update({
            location_lat: pos.coords.latitude,
            location_lng: pos.coords.longitude,
          })
          .eq('id', userId)
        setLocationLoading(false)
        if (error) {
          console.error('[perfil] ubicación:', error)
          return
        }
        setLocationGranted(true)
        setGeoDenied(false)
      },
      () => {
        setLocationLoading(false)
        void navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((st) => {
            if (st.state === 'denied') {
              setGeoDenied(true)
              setLocationGranted(false)
            }
          })
          .catch(() => {})
      },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 15_000 }
    )
  }

  const onDarkModeToggle = () => {
    const next = !darkMode
    setDarkModeState(next)
    void setDarkMode(next)
  }

  const notifOn = isNative ? nativePerm === 'granted' : notifPerm === 'granted'
  const notifDisabled = isNative
    ? nativePerm === 'denied'
    : notifPerm === 'denied' || pushLoading
  const notifSub = isNative
    ? nativePerm === 'denied'
      ? 'Bloqueadas en Ajustes del dispositivo'
      : 'Recibe alertas de mensajes y eventos'
    : notifPerm === 'denied'
      ? 'Bloqueadas en tu navegador'
      : 'Recibe alertas de mensajes y eventos'

  const locSub = geoDenied
    ? 'Bloqueada en tu navegador'
    : 'Mejora tu feed con contenido cercano'
  const locDisabled = geoDenied || locationLoading
  const locOn = locationGranted

  return (
    <section className="mt-8 border-t border-[#EEEEEE] pt-8">
      <h2 style={permisosLabelStyle} className="mb-4">
        PREFERENCIAS
      </h2>
      <div className="divide-y divide-[#EEEEEE] border border-[#EEEEEE] bg-[#FFFFFF]">
        <div className="flex items-center justify-between gap-3 px-3 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="shrink-0 text-[22px] leading-none" aria-hidden>
              🔔
            </span>
            <div className="min-w-0">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                Notificaciones push
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                {notifSub}
              </p>
            </div>
          </div>
          <IosToggle
            checked={notifOn}
            disabled={notifDisabled}
            onToggle={onNotifToggle}
            ariaLabel="Notificaciones push"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="shrink-0 text-[22px] leading-none" aria-hidden>
              📍
            </span>
            <div className="min-w-0">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                Ubicación
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                {locSub}
              </p>
            </div>
          </div>
          <IosToggle
            checked={locOn}
            disabled={locDisabled}
            onToggle={onLocationToggle}
            ariaLabel="Ubicación"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="shrink-0 text-[22px] leading-none" aria-hidden>
              🌙
            </span>
            <div className="min-w-0">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                Modo oscuro
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                Tema oscuro en la app
              </p>
            </div>
          </div>
          <IosToggle
            checked={darkMode}
            onToggle={onDarkModeToggle}
            ariaLabel="Modo oscuro"
          />
        </div>
      </div>
    </section>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}

function CuentaAccesoSection({ email }: { email: string | null }) {
  const [identities, setIdentities] = useState<UserIdentity[]>([])
  const [loading, setLoading] = useState(true)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Leer ?oauth_error= de la URL para mostrar mensaje tras volver del callback
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('oauth_error')
    if (oauthError === 'identity_already_linked') {
      setError('Esta cuenta de Google ya está vinculada a otro usuario de AirNation.')
    } else if (oauthError) {
      setError('No se pudo vincular Google. Intenta de nuevo.')
    }

    supabase.auth.getUserIdentities().then(({ data, error: idErr }) => {
      if (!idErr && data?.identities) {
        setIdentities(data.identities)
      }
      setLoading(false)
    })
  }, [])

  const hasGoogle = identities.some(i => i.provider === 'google')
  const hasApple = identities.some(i => i.provider === 'apple')
  const hasEmail = identities.some(i => i.provider === 'email')
  const googleIdentity = identities.find(i => i.provider === 'google')
  const appleIdentity = identities.find(i => i.provider === 'apple')

  const handleAddPassword = async () => {
    if (!email) return
    setSending(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSending(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  const handleLinkGoogle = async () => {
    setSending(true)
    setError('')
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard/perfil?tab=configuracion')}`,
      },
    })
    if (error) {
      setError(error.message)
      setSending(false)
      return
    }
    if (data?.url) {
      window.location.href = data.url
    } else {
      setSent(true)
      setSending(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return
    setSending(true)
    setError('')
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
    if (error) {
      setError(error.message)
      setSending(false)
      return
    }
    setIdentities(prev => prev.filter(i => i.provider !== 'google'))
    setSending(false)
  }

  const handleLinkApple = async () => {
    setSending(true)
    setError('')
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard/perfil?tab=configuracion')}`,
      },
    })
    if (error) {
      setError(error.message)
      setSending(false)
      return
    }
    if (data?.url) {
      window.location.href = data.url
    } else {
      setSent(true)
      setSending(false)
    }
  }

  const handleUnlinkApple = async () => {
    if (!appleIdentity) return
    setSending(true)
    setError('')
    const { error } = await supabase.auth.unlinkIdentity(appleIdentity)
    if (error) {
      setError(error.message)
      setSending(false)
      return
    }
    setIdentities(prev => prev.filter(i => i.provider !== 'apple'))
    setSending(false)
  }

  if (loading) return null

  return (
    <section className="mt-8 border-t border-[#EEEEEE] pt-8">
      <h2 style={{ ...jost, fontSize: 10, color: '#999999' }} className="mb-4">
        ACCESO
      </h2>
      <div className="divide-y divide-[#EEEEEE] border border-[#EEEEEE] bg-[#FFFFFF]">

        {hasEmail && (
          <div className="flex items-center gap-3 px-3 py-4">
            <span className="shrink-0 text-[22px] leading-none" aria-hidden>📧</span>
            <div className="min-w-0">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                Email y contraseña
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                {email ?? 'tu correo'}
              </p>
            </div>
          </div>
        )}

        {hasGoogle && (
          <div className="flex items-center justify-between gap-3 px-3 py-4">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[22px] leading-none" aria-hidden>🔵</span>
              <div className="min-w-0">
                <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                  Google vinculado
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                  Puedes entrar con tu cuenta de Google
                </p>
              </div>
            </div>
            {/* Solo mostrar desvincular si también tiene email/password */}
            {hasEmail && (
              <button
                type="button"
                onClick={() => void handleUnlinkGoogle()}
                disabled={sending}
                style={jost}
                className="shrink-0 border border-[#EEEEEE] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#999999] hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-50"
              >
                {sending ? '...' : 'DESVINCULAR'}
              </button>
            )}
          </div>
        )}

        {hasApple && (
          <div className="flex items-center justify-between gap-3 px-3 py-4">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-[22px] leading-none" aria-hidden>🍎</span>
              <div className="min-w-0">
                <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                  Apple vinculado
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                  Puedes entrar con tu cuenta de Apple
                </p>
              </div>
            </div>
            {hasEmail && (
              <button
                type="button"
                onClick={() => void handleUnlinkApple()}
                disabled={sending}
                style={jost}
                className="shrink-0 border border-[#EEEEEE] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-[#999999] hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-50"
              >
                {sending ? '...' : 'DESVINCULAR'}
              </button>
            )}
          </div>
        )}

        {!hasApple && hasEmail && (
          <div className="px-3 py-4">
            <p className="mb-3 text-[12px] leading-relaxed text-[#666666]" style={lato}>
              Vincula tu cuenta de Apple para entrar más rápido sin escribir tu contraseña.
            </p>
            <button
              type="button"
              onClick={() => void handleLinkApple()}
              disabled={sending}
              style={jost}
              className="flex items-center gap-2 border border-[#DDDDDD] bg-[#111111] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:opacity-50"
            >
              <AppleIcon />
              {sending ? 'REDIRIGIENDO...' : 'VINCULAR CON APPLE'}
            </button>
            {error && <p className="mt-2 text-[12px] text-[#CC4B37]" style={lato}>{error}</p>}
          </div>
        )}

        {hasGoogle && !hasEmail && (
          <div className="px-3 py-4">
            <p className="mb-3 text-[12px] leading-relaxed text-[#666666]" style={lato}>
              Agrega una contraseña para poder iniciar sesión también con tu correo.
            </p>
            {sent ? (
              <p className="text-[12px] font-semibold text-[#2E7D32]" style={lato}>
                ✓ Revisa tu correo — te enviamos el link para crear tu contraseña.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleAddPassword()}
                  disabled={sending}
                  style={jost}
                  className="bg-[#111111] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:opacity-50"
                >
                  {sending ? 'ENVIANDO...' : 'AGREGAR CONTRASEÑA'}
                </button>
                {error && <p className="mt-2 text-[12px] text-[#CC4B37]" style={lato}>{error}</p>}
              </>
            )}
          </div>
        )}

        {hasEmail && !hasGoogle && (
          <div className="px-3 py-4">
            <p className="mb-3 text-[12px] leading-relaxed text-[#666666]" style={lato}>
              Vincula tu cuenta de Google para entrar más rápido sin escribir tu contraseña.
            </p>
            {sent ? (
              <p className="text-[12px] font-semibold text-[#2E7D32]" style={lato}>
                ✓ Google vinculado correctamente.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handleLinkGoogle()}
                  disabled={sending}
                  style={jost}
                  className="flex items-center gap-2 border border-[#DDDDDD] bg-white px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:opacity-50"
                >
                  <GoogleIcon />
                  {sending ? 'REDIRIGIENDO...' : 'VINCULAR CON GOOGLE'}
                </button>
                {error && <p className="mt-2 text-[12px] text-[#CC4B37]" style={lato}>{error}</p>}
              </>
            )}
          </div>
        )}

      </div>
    </section>
  )
}

export function PerfilTabsClient({
  user,
  teamNombre,
  teamSlug,
  misEquipos,
  misCampos,
  misEventosProximos,
  misEventosPasados,
  initialJoinRequests,
  approvedFieldNotices,
  ownerPendingFieldRequests,
  isAdmin,
  pendingJoinPending,
  initialTab,
  campoRegistradoNotice,
  credencialData,
  posts,
  replicas,
}: {
  user: ProfileUserRow
  teamNombre: string | null
  teamSlug: string | null
  misEquipos: MisEquipoItem[]
  misCampos: MisCampoItem[]
  misEventosProximos: MisEventoRsvpItem[]
  misEventosPasados: MisEventoRsvpItem[]
  initialJoinRequests: JoinRequestRow[]
  approvedFieldNotices: ApprovedFieldNotice[]
  ownerPendingFieldRequests: PendingFieldOwnerRequest[]
  isAdmin: boolean
  pendingJoinPending: { id: string; nombre: string }[]
  initialTab?: TabId
  campoRegistradoNotice?: boolean
  credencialData: CredentialUserData
  posts: PlayerPostRow[]
  replicas: PublicReplicaRow[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'perfil')
  const [adminSubTab, setAdminSubTab] = useState<SubTabAdmin>('equipos')
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests)
  const [localApprovedFieldNotices, setLocalApprovedFieldNotices] =
    useState(approvedFieldNotices)
  const [localOwnerPendingFieldRequests, setLocalOwnerPendingFieldRequests] =
    useState(ownerPendingFieldRequests)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const { trigger: triggerPush, loading: pushLoading } = usePushNotifButton()
  const profileViewRef = useRef<ProfileViewHandle>(null)
  const [configProfileUser, setConfigProfileUser] = useState(user)
  const [configProfileEditing, setConfigProfileEditing] = useState(false)
  const [compactAvatarUi, setCompactAvatarUi] = useState({
    uploading: false,
    error: '',
  })

  const handleConfigUserUpdated = useCallback((u: ProfileUserRow) => {
    setConfigProfileUser(u)
  }, [])

  const handleCompactAvatarState = useCallback(
    (s: { uploading: boolean; error: string }) => {
      setCompactAvatarUi(s)
    },
    []
  )

  const pendingCount =
    joinRequests.length +
    localApprovedFieldNotices.length +
    localOwnerPendingFieldRequests.length

  const tabClass = (tabId: TabId) =>
    activeTab === tabId
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  const removeRequest = useCallback((id: string) => {
    setJoinRequests((r) => r.filter((x) => x.id !== id))
    setLocalApprovedFieldNotices((r) => r.filter((x) => x.id !== id))
    setLocalOwnerPendingFieldRequests((r) => r.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    setJoinRequests(initialJoinRequests)
  }, [initialJoinRequests])
  useEffect(() => {
    setLocalApprovedFieldNotices(approvedFieldNotices)
  }, [approvedFieldNotices])
  useEffect(() => {
    setLocalOwnerPendingFieldRequests(ownerPendingFieldRequests)
  }, [ownerPendingFieldRequests])

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [activeTab])

  useEffect(() => {
    let cancelled = false
    fetchUnreadNotifCount(supabase, user.id).then((n) => {
      if (!cancelled) setUnreadNotifCount(n)
    })
    const onUpd = () => {
      fetchUnreadNotifCount(supabase, user.id).then((n) => {
        if (!cancelled) setUnreadNotifCount(n)
      })
    }
    window.addEventListener(NOTIF_UPDATED_EVENT, onUpd)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIF_UPDATED_EVENT, onUpd)
    }
  }, [user.id])

  useEffect(() => {
    setConfigProfileUser(user)
  }, [user])

  useEffect(() => {
    if (activeTab !== 'configuracion') setConfigProfileEditing(false)
  }, [activeTab])

  useEffect(() => {
    const loadFollows = async () => {
      const [{ count: fc }, { count: fg }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id),
      ])
      setFollowersCount(fc ?? 0)
      setFollowingCount(fg ?? 0)
    }
    void loadFollows()
  }, [user.id])

  const publicUser: PublicUserProfile = {
    ...user,
    perfil_publico: true,
    teams: null,
    teams_list: misEquipos.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      slug: e.slug,
      logo_url: e.logo_url,
      team_role: e.rol_plataforma,
    })),
  }

  const isVerified =
    !!publicUser.avatar_url &&
    !!publicUser.foto_portada_url &&
    (replicas.length > 0 || posts.length > 0)

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] pb-10">
      <div className="sticky top-0 z-40 -mx-0 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:top-16">
        <ScrollableTabsNav>
          {(
            [
              { id: 'perfil' as TabId, label: 'MI PERFIL' },
              {
                id: 'notificaciones' as TabId,
                label: 'NOTIFICACIONES',
                badge: pendingCount + unreadNotifCount,
              },
              { id: 'credencial' as TabId, label: 'CREDENCIAL' },
              { id: 'administrar' as TabId, label: 'ADMINISTRAR' },
              { id: 'configuracion' as TabId, label: 'CONFIGURACIÓN' },
            ] as { id: TabId; label: string; badge?: number }[]
          ).map(({ id, label, badge }) => (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'nearest',
                  block: 'nearest',
                })
                setActiveTab(id)
                if (id === 'notificaciones') setUnreadNotifCount(0)
              }}
              style={jost}
              className={`${tabBase} inline-flex items-center gap-1.5 ${tabClass(id)}`}
            >
              <span>{label}</span>
              {badge && badge > 0 ? (
                <span
                  style={jost}
                  className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </button>
          ))}
        </ScrollableTabsNav>
      </div>

      <div className="mt-0">
        {activeTab === 'perfil' && (
          <div>
            <PlayerHero
              user={publicUser}
              subtitle={
                [user.ciudad, user.rol].filter(Boolean).join(' · ') || '—'
              }
              followersCount={followersCount}
              followingCount={followingCount}
              isFollowing={false}
              currentUserId={user.id}
              teamRole={null}
              isVerified={isVerified}
              isOwner
              onEditClick={() => setActiveTab('configuracion')}
              arsenalCount={replicas.length}
              postsCount={posts.length}
            />
            <PlayerProfileClient
              user={publicUser}
              posts={posts}
              events={[]}
              replicas={replicas}
              rolLabels={{
                rifleman: 'Jugador',
                sniper: 'Francotirador',
                support: 'Support',
                medic: 'Medic',
                team_leader: 'Líder de equipo',
                scout: 'Scout',
                rookie: 'Rookie',
              }}
              currentUserId={user.id}
              currentUserAlias={user.alias ?? null}
              currentUserAvatar={user.avatar_url ?? null}
              showPostBox
            />
          </div>
        )}

        {activeTab === 'notificaciones' && (
          <div className="px-4 pt-4">
            <NotificacionesTab
              userId={user.id}
              requests={joinRequests}
              approvedFieldNotices={localApprovedFieldNotices}
              ownerPendingFieldRequests={localOwnerPendingFieldRequests}
              onRemove={removeRequest}
            />
          </div>
        )}

        {activeTab === 'credencial' && (
          <div className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
            <h1 style={jost} className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]">
              MI CREDENCIAL
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#666666]" style={{ fontFamily: "'Lato', sans-serif" }}>
              Tu identificación digital AirNation
            </p>
            <CredencialClient data={credencialData} />
          </div>
        )}

        {activeTab === 'administrar' && (
          <div className="pt-4">
            <div className="flex gap-4 border-b border-[#EEEEEE] px-4">
              {(
                [
                  { id: 'equipos' as SubTabAdmin, label: 'MIS EQUIPOS' },
                  { id: 'campos' as SubTabAdmin, label: 'MIS CAMPOS' },
                  { id: 'eventos' as SubTabAdmin, label: 'MIS EVENTOS' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAdminSubTab(id)}
                  style={jost}
                  className={`shrink-0 pb-3 pt-2 text-[11px] font-extrabold uppercase transition-colors ${
                    adminSubTab === id
                      ? 'border-b-2 border-[#CC4B37] text-[#111111]'
                      : 'border-b-2 border-transparent text-[#666666]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="px-4 pt-4">
              {adminSubTab === 'equipos' && (
                <MisEquiposSection
                  teams={misEquipos}
                  userId={user.id}
                  variant="tab"
                />
              )}
              {adminSubTab === 'campos' && (
                <>
                  {campoRegistradoNotice && (
                    <div
                      className="mb-4 border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-[13px] leading-relaxed text-[#111111]"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Tu campo quedará visible cuando un administrador lo
                      apruebe.
                    </div>
                  )}
                  <MisCamposTab items={misCampos} />
                </>
              )}
              {adminSubTab === 'eventos' && (
                <MisEventosRsvpSection
                  proximos={misEventosProximos}
                  pasados={misEventosPasados}
                  currentUserId={user.id}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'configuracion' && (
          <div className="px-4 pt-4">
            <h1
              style={jost}
              className="mb-6 text-[22px] font-extrabold uppercase text-[#111111]"
            >
              CONFIGURACIÓN
            </h1>
            {!configProfileEditing ? (
              <div className="mb-2 max-w-[640px]">
                <div className="flex flex-col items-center border-b border-[#EEEEEE] pb-6">
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#CC4B37] md:h-[88px] md:w-[88px]"
                    style={{ borderRadius: '50%' }}
                  >
                    {configProfileUser.avatar_url ? (
                      <img
                        src={configProfileUser.avatar_url}
                        alt=""
                        width={88}
                        height={88}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-[28px] text-[#FFFFFF] md:text-[32px]"
                        style={jost}
                      >
                        {(
                          configProfileUser.alias?.trim()?.[0] ||
                          configProfileUser.nombre?.trim()?.[0] ||
                          '?'
                        ).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p
                    className="mt-3 text-center text-[15px] font-semibold text-[#111111]"
                    style={lato}
                  >
                    {configProfileUser.nombre?.trim() || '—'}
                  </p>
                  <p
                    className="mt-1 text-center text-[13px] text-[#666666]"
                    style={lato}
                  >
                    {configProfileUser.alias?.trim()
                      ? configProfileUser.alias.trim().startsWith('@')
                        ? configProfileUser.alias.trim()
                        : `@${configProfileUser.alias.trim()}`
                      : '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => profileViewRef.current?.openAvatarPicker()}
                    disabled={compactAvatarUi.uploading}
                    style={jost}
                    className="mt-3 inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[2px] border border-solid border-[#111111] bg-transparent px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#111111] disabled:opacity-60"
                  >
                    {compactAvatarUi.uploading ? <ConfigMiniAvatarSpinner /> : null}
                    {compactAvatarUi.uploading ? 'SUBIENDO…' : 'CAMBIAR FOTO'}
                  </button>
                  {compactAvatarUi.error ? (
                    <p className="mt-2 text-center text-[12px] text-[#CC4B37]" style={lato}>
                      {compactAvatarUi.error}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => profileViewRef.current?.startEdit()}
                    style={jost}
                    className="mt-3 w-full max-w-[240px] rounded-[2px] bg-[#111111] py-2.5 text-[11px] font-extrabold uppercase text-[#FFFFFF]"
                  >
                    EDITAR PERFIL
                  </button>
                </div>
              </div>
            ) : null}
            <ProfileView
              ref={profileViewRef}
              user={user}
              teamNombre={teamNombre}
              teamSlug={teamSlug}
              pendingJoinPending={pendingJoinPending}
              compactReadMode
              onEditModeChange={setConfigProfileEditing}
              onUserUpdated={handleConfigUserUpdated}
              onCompactAvatarState={handleCompactAvatarState}
            />
            <PermisosSection
              userId={user.id}
              triggerPush={triggerPush}
              pushLoading={pushLoading}
            />
            <CuentaAccesoSection email={user.email ?? null} />
            <div className="mt-8 max-w-[640px]">
              <BloqueadosSection userId={user.id} />
            </div>
            <div className="mt-8 space-y-3 border-t border-[#EEEEEE] pt-8">
              {isAdmin && (
                <Link
                  href="/admin"
                  style={jost}
                  className="flex h-12 w-full items-center justify-center gap-2 border border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                >
                  ADMINISTRACIÓN
                </Link>
              )}
              {/* Eliminar cuenta */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <Link
                  href="/eliminar-cuenta"
                  className="flex items-center justify-center w-full py-3 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Eliminar mi cuenta
                </Link>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Esta acción es permanente y no se puede deshacer.
                </p>
              </div>
              <PerfilLogoutButton />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
