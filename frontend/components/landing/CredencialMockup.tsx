'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CredentialCard, type CredentialUserData } from '@/components/credential/CredentialCard'

type Props = {
  data: CredentialUserData
}

const HOLO_BG =
  'linear-gradient(120deg, transparent 30%, rgba(204, 75, 55, 0.25) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(204, 75, 55, 0.25) 55%, transparent 70%)'

export function CredencialMockup({ data }: Props) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="relative w-full max-w-[340px]"
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
      <div className="relative" style={{ borderRadius: 14, overflow: 'hidden' }}>
        <CredentialCard data={data} />

        {/* Overlay holográfico animado encima de la credencial real */}
        {!reducedMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{
              background: HOLO_BG,
              backgroundSize: '200% 100%',
              mixBlendMode: 'overlay',
              borderRadius: 14,
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
