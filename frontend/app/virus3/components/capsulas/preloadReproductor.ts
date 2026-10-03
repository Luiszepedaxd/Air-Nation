import { preloadCapsulaHls } from './preloadHls'

let chunk: Promise<typeof import('./ReproductorInmersivo')> | null = null

/** Precarga el chunk del reproductor y hls.js (pointerdown en tarjeta/miniatura). */
export function preloadReproductorInmersivo() {
  preloadCapsulaHls()
  if (!chunk) chunk = import('./ReproductorInmersivo')
  return chunk
}
