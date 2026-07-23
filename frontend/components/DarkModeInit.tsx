'use client'

import { useEffect } from 'react'
import { applyDarkMode, isDarkModeEnabled } from '@/lib/dark-mode'

// Timer compartido entre instancias. Cada sección de la app monta su propio
// AppShell, así que al navegar entre secciones se desmonta una instancia y
// se monta otra. El apagado se agenda en el cleanup y la instancia entrante
// lo cancela, evitando el parpadeo a claro en cada cambio de sección.
let pendingDisable: ReturnType<typeof setTimeout> | null = null

/**
 * Aplica la preferencia de modo oscuro mientras el usuario está dentro
 * del shell de la app autenticada.
 *
 * Montado en AppShell (no en el root layout) porque el modo oscuro es una
 * preferencia de cuenta, no un tema del sitio: login, registro, landing,
 * onboarding y /store deben verse siempre en claro.
 *
 * DarkReader es global al document y no se apaga solo, de ahí el cleanup:
 * sin él, el tema quedaría pegado al hacer logout o salir del shell.
 * No renderiza nada. Por defecto: modo claro.
 */
export function DarkModeInit() {
  useEffect(() => {
    // Si veníamos de otra sección con dark activo, cancelar el apagado
    // que dejó agendado su cleanup.
    if (pendingDisable) {
      clearTimeout(pendingDisable)
      pendingDisable = null
    }

    if (isDarkModeEnabled()) {
      void applyDarkMode(true)
    }

    return () => {
      // Apagado diferido: si otra instancia de AppShell monta enseguida
      // (navegación entre secciones), cancelará este timer y el tema
      // se mantiene sin parpadeo.
      pendingDisable = setTimeout(() => {
        pendingDisable = null
        void applyDarkMode(false)
      }, 0)
    }
  }, [])

  return null
}
