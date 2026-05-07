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
          {/* Mockup iPhone */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-[#0F0F0F] via-[#1A1A1A] to-[#111111]">
            {/* Glow rojo difuminado en hover */}
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(204,75,55,0.25)_0%,transparent_60%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden
            />

            {/* Imagen mockup */}
            <div className="absolute inset-0 z-[2] flex items-center justify-center p-6 sm:p-8">
              <div
                className="relative h-full w-auto max-w-[180px] overflow-hidden border-[3px] border-solid border-[#222222] bg-[#000000]"
                style={{
                  aspectRatio: '9 / 19',
                  borderRadius: '32px',
                  boxShadow:
                    '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 2px #1a1a1a',
                }}
              >
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {/* Notch */}
                <div
                  className="absolute left-1/2 top-2 z-10 h-[14px] w-[60px] -translate-x-1/2 bg-black"
                  style={{ borderRadius: '999px' }}
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {/* Contenido textual */}
          <div className="flex flex-1 flex-col p-6 sm:p-7">
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
              {eyebrow}
            </p>
            <h3
              className="mt-3 font-display font-black uppercase leading-[1.05] text-[#111111] transition-colors group-hover:text-[#CC4B37]"
              style={{ fontSize: 'clamp(1.4rem, 2.2vw, 1.75rem)' }}
            >
              {titulo}
            </h3>
            <p className="mt-3 flex-1 font-body text-[0.875rem] leading-[1.65] text-[#666666]">
              {descripcion}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37]">
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
