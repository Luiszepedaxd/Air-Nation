'use client'

/**
 * Overlay sutil de textura de papel (noise SVG con feTurbulence).
 * Pensado como pseudo-elemento de fondo dentro de un contenedor relative.
 */
export function PaperTexture({
  opacity = 0.03,
  blend = 'multiply',
  className = '',
}: {
  opacity?: number
  blend?: 'multiply' | 'overlay' | 'normal'
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 ${className}`}
      style={{
        opacity,
        mixBlendMode: blend,
        backgroundImage:
          'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'tgn\'><feTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23tgn)\'/></svg>")',
        backgroundSize: '200px 200px',
      }}
    />
  )
}
