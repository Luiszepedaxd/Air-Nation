'use client'

import { motion, useReducedMotion } from 'framer-motion'

type Props = {
  imageUrl: string | null
}

const HOLO_BG =
  'linear-gradient(120deg, transparent 30%, rgba(204, 75, 55, 0.25) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(204, 75, 55, 0.25) 55%, transparent 70%)'

/** Patrón QR estático (evita hydration mismatch por Math.random). */
function qrCellFilled(i: number) {
  return ((i * 11 + 17) % 10) > 4
}

export function CredencialMockup({ imageUrl }: Props) {
  const reducedMotion = useReducedMotion()

  // Si hay imagen real subida en assets
  if (imageUrl && imageUrl !== '/og-default.jpg') {
    return (
      <motion.div
        className="relative w-full max-w-[420px]"
        animate={
          reducedMotion
            ? {}
            : {
                rotateY: [-3, 3, -3],
                rotateX: [2, -2, 2],
              }
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 1200,
        }}
      >
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt="Credencial AirNation"
            className="h-auto w-full"
            loading="lazy"
          />

          {/* Overlay holográfico animado */}
          {!reducedMotion ? (
            <motion.div
              className="pointer-events-none absolute inset-0"
              style={{
                background: HOLO_BG,
                backgroundSize: '200% 100%',
                mixBlendMode: 'overlay',
              }}
              animate={{
                backgroundPosition: ['200% 0%', '-200% 0%'],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'linear',
              }}
              aria-hidden
            />
          ) : null}
        </div>
      </motion.div>
    )
  }

  // Fallback: render visual de credencial cuando no hay imagen
  return (
    <motion.div
      className="relative w-full max-w-[380px]"
      animate={
        reducedMotion
          ? {}
          : {
              rotateY: [-3, 3, -3],
              rotateX: [2, -2, 2],
            }
      }
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1200,
      }}
    >
      <div
        className="relative aspect-[5/8] w-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6"
        style={{
          borderRadius: 16,
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <span className="font-body text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[#CC4B37]">
            AirNation · MX
          </span>
          <span
            className="bg-[#CC4B37] px-2 py-0.5 font-body text-[0.55rem] font-extrabold uppercase tracking-[0.15em] text-white"
            style={{ borderRadius: 2 }}
          >
            ID
          </span>
        </div>

        {/* Avatar placeholder */}
        <div className="mt-6 flex flex-col items-center">
          <div
            className="h-24 w-24 bg-[#222] sm:h-28 sm:w-28"
            style={{ borderRadius: 999 }}
          />
          <p className="mt-4 font-display text-[1.4rem] font-extrabold uppercase tracking-tight text-white">
            CERO UNO
          </p>
          <p className="mt-1 font-body text-[0.7rem] uppercase tracking-[0.18em] text-white/50">
            Operador · GDL
          </p>
        </div>

        {/* QR placeholder */}
        <div className="mt-6 flex items-center justify-center">
          <div className="grid grid-cols-6 gap-0.5">
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 ${
                  qrCellFilled(i) ? 'bg-white' : 'bg-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute inset-x-6 bottom-6 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="font-body text-[0.55rem] uppercase tracking-[0.15em] text-white/40">
            #00114
          </span>
          <span className="font-body text-[0.55rem] uppercase tracking-[0.15em] text-white/40">
            DESDE 2026
          </span>
        </div>

        {/* Overlay holográfico */}
        {!reducedMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: HOLO_BG,
              backgroundSize: '200% 100%',
              mixBlendMode: 'overlay',
            }}
            animate={{
              backgroundPosition: ['200% 0%', '-200% 0%'],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
            aria-hidden
          />
        ) : null}
      </div>
    </motion.div>
  )
}
