'use client'

import Link from 'next/link'

const jost = { fontFamily: "'Jost', sans-serif" } as const

type Props = {
  title: string
  href?: string
  /** Texto del enlace (por defecto coincide con otras secciones del home). */
  linkLabel?: string
}

export function SectionHeader({ title, href, linkLabel }: Props) {
  return (
    <div className="w-full border-t border-[#EEEEEE]">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:mx-auto md:max-w-[1200px] md:px-6">
        <h2
          style={jost}
          className="text-[13px] font-extrabold uppercase tracking-widest text-[#111111]"
        >
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="shrink-0 font-normal text-[11px] text-[#CC4B37]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {linkLabel ?? 'VER TODOS →'}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
