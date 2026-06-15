export function PatrocinadoBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 bg-[#111111]/90 px-2.5 py-1 backdrop-blur-sm"
    >
      <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center bg-[#CC4B37]">
        <svg width="8" height="8" viewBox="0 0 14 14" fill="white" aria-hidden>
          <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" />
        </svg>
      </span>
      <span
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
        className="text-[8px] font-extrabold uppercase text-white"
      >
        PATROCINADO POR AIRNATION
      </span>
    </span>
  )
}
