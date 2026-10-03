let chunk: Promise<typeof import('./ReproductorInmersivo')> | null = null

/** Precarga el chunk del reproductor (llamar en pointerdown de tarjeta/miniatura). */
export function preloadReproductorInmersivo() {
  if (!chunk) chunk = import('./ReproductorInmersivo')
  return chunk
}
