import { jost } from '../theme'

type PhotoPlaceholderProps = {
  label?: string
  className?: string
  compact?: boolean
}

export function PhotoPlaceholder({
  label = 'Foto del campo',
  className = '',
  compact = false,
}: PhotoPlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center border border-dashed border-[#CCCCCC] bg-[#F4F4F4] text-[#999999] ${className}`}
      role="img"
      aria-label={label}
    >
      <svg
        width={compact ? 20 : 32}
        height={compact ? 20 : 32}
        viewBox="0 0 24 24"
        fill="none"
        className="opacity-60"
        aria-hidden
      >
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
        <path
          d="M3 16l4.5-4.5 3 3L14 11l7 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={`mt-2 text-center uppercase tracking-[0.12em] text-[#999999] ${
          compact ? 'px-1 text-[8px]' : 'text-[10px]'
        }`}
        style={{ ...jost, fontWeight: 800 }}
      >
        {label}
      </span>
    </div>
  )
}
