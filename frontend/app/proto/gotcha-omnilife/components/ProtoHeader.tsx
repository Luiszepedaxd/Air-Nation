import Link from 'next/link'
import { jost } from '../theme'

export function ProtoHeader() {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center bg-[#CC4B37]">
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
          </svg>
        </span>
        <span
          style={{ ...jost, fontWeight: 900 }}
          className="text-[1rem] uppercase tracking-[0.18em] text-[#111111]"
        >
          AIR<span className="text-[#CC4B37]">NATION</span>
        </span>
        <span className="text-[#CCCCCC]">/</span>
        <span
          style={{ ...jost, fontWeight: 800 }}
          className="text-[0.65rem] uppercase tracking-[0.15em] text-[#111111]"
        >
          ARENA
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <span
          className="bg-[#FFF3F1] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#CC4B37]"
          style={jost}
        >
          Prototipo
        </span>
        <Link
          href="/"
          style={{ ...jost, fontWeight: 700 }}
          className="text-[0.65rem] uppercase tracking-[0.12em] text-[#666666] hover:text-[#111111]"
        >
          ← Volver
        </Link>
      </div>
    </header>
  )
}
