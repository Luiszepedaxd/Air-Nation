'use client'

import Link from 'next/link'
import { TiltCard } from '@/components/animations/TiltCard'

type Props = {
  imageUrl: string
  eyebrow: string
  titulo: string
  descripcion: string
  href: string
  cta: string
}

export function QueEsCard({
  imageUrl,
  eyebrow,
  titulo,
  descripcion,
  href,
  cta,
}: Props) {
  return (
    <Link href={href} className="group block h-full">
      <TiltCard intensity={6} className="h-full">
        <div className="relative flex h-full flex-col overflow-hidden border border-solid border-[#EEEEEE] bg-white transition-all duration-300 group-hover:border-[#CC4B37] group-hover:shadow-[0_20px_40px_-15px_rgba(204,75,55,0.25)]">
          {/* Imagen del feature - mobile altura fija, desktop aspect-ratio */}
          <div className="relative h-[260px] w-full shrink-0 overflow-hidden bg-[#111111] sm:h-auto sm:aspect-[3/4]">
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 z-[1] h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,rgba(204,75,55,0.25)_0%,transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden
            />
          </div>

          {/* Contenido textual - flex-1 para ocupar resto de altura */}
          <div className="flex flex-1 flex-col p-5 sm:p-7">
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
              {eyebrow}
            </p>
            <h3
              className="mt-2 font-display font-black uppercase leading-[1.05] text-[#111111] transition-colors group-hover:text-[#CC4B37]"
              style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.75rem)' }}
            >
              {titulo}
            </h3>
            <p className="mt-2 line-clamp-3 flex-1 font-body text-[0.825rem] leading-[1.6] text-[#666666] sm:text-[0.875rem]">
              {descripcion}
            </p>
            <span className="mt-3 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37]">
              {cta}
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </TiltCard>
    </Link>
  )
}
