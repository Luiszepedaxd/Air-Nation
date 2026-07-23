const STORAGE_KEY = 'airnation_dark_mode'

// sepia 0 evita que el rojo de marca (#CC4B37) se vuelva anaranjado.
const DARK_OPTIONS = {
  brightness: 100,
  contrast: 90,
  sepia: 0,
}

export function isDarkModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

async function syncNativeStatusBar(enabled: boolean): Promise<void> {
  try {
    const { isNativeApp } = await import('@/lib/platform')
    if (!isNativeApp()) return
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    if (enabled) {
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.setBackgroundColor({ color: '#1A1A1A' })
    } else {
      await StatusBar.setStyle({ style: Style.Dark })
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' })
    }
  } catch {
    /* algunos devices no soportan, ignorar */
  }
}

export async function applyDarkMode(enabled: boolean): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const DarkReader = await import('darkreader')
    if (enabled) {
      DarkReader.enable(DARK_OPTIONS)
    } else {
      DarkReader.disable()
    }
  } catch (err) {
    console.warn('[dark-mode] no se pudo aplicar:', err)
  }
  await syncNativeStatusBar(enabled)
}

export async function setDarkMode(enabled: boolean): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    /* ignore */
  }
  await applyDarkMode(enabled)
}
