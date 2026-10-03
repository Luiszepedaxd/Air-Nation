import type { CapsulaItem } from '../../lib/types'
import { acento } from './helpers'
import { posterDe } from './poster'

export function PosterVisual({
  capsula,
  className,
  imgClassName,
  width = 104,
  height = 185,
}: {
  capsula: CapsulaItem
  className?: string
  imgClassName?: string
  width?: number
  height?: number
}) {
  const url = posterDe(capsula)
  const color = acento(capsula.color)

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={imgClassName ?? 'h-full w-full object-cover'}
      />
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? 'h-full w-full'}`}
      style={{
        background: `linear-gradient(160deg, ${color} 0%, #0a0a0a 72%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.35) 2px, rgba(0,0,0,0.35) 4px)',
        }}
        aria-hidden
      />
      <span
        className="absolute inset-0 flex items-center justify-center text-4xl opacity-90"
        style={{ fontFamily: 'Jost, sans-serif', fontWeight: 900, color }}
        aria-hidden
      >
        {capsula.numero}
      </span>
    </div>
  )
}
