import { preloadHlsJs } from './capsulaHls'

/** Precarga hls.js (llamar en pointerdown junto al reproductor). */
export function preloadCapsulaHls() {
  void preloadHlsJs()
}
