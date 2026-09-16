/**
 * Preferencia de audio del feed a nivel de sesión (módulo en memoria).
 * Default: unmuted. Se reinicia en reload completo / nueva apertura de la app.
 * No usa localStorage ni sessionStorage para que un F5 vuelva al default.
 */

type Listener = (muted: boolean) => void

/** false = con sonido (default). */
let mutedPreference = false
const listeners = new Set<Listener>()

export function getFeedAudioMuted(): boolean {
  return mutedPreference
}

export function setFeedAudioMuted(muted: boolean): void {
  if (mutedPreference === muted) return
  mutedPreference = muted
  for (const listener of listeners) listener(muted)
}

/** Suscripción para sincronizar instancias de FeedInlineVideo en la misma sesión. */
export function subscribeFeedAudioMuted(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
