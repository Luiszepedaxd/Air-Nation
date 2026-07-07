'use client'

import { useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { PhotoPlaceholder } from './PhotoPlaceholder'

interface LightboxProps {
  labels: string[]
  index: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function Lightbox({ labels, index, onClose, onPrev, onNext }: LightboxProps) {
  const isOpen = index !== null

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    },
    [isOpen, onClose, onNext, onPrev]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && index !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 text-white hover:text-[#CC4B37]"
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 p-2 text-white md:left-6"
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>

          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <PhotoPlaceholder
              label={labels[index]}
              className="aspect-[4/3] w-full"
            />
          </motion.div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 p-2 text-white md:right-6"
            aria-label="Siguiente"
          >
            <ChevronRight size={36} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {index + 1} / {labels.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
