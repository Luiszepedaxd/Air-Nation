'use client'

import { motion } from 'framer-motion'
import type { InscripcionConfig } from '../lib/types'

export function InscripcionSection({ config }: { config: InscripcionConfig }) {
  return (
    <section
      id="inscripcion"
      data-section="inscripcion"
      className="relative w-full overflow-hidden bg-[#CC4B37] py-24 text-white md:py-40"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><filter id=\'n\'><feTurbulence baseFrequency=\'0.85\' numOctaves=\'2\'/></filter><rect width=\'100%\' height=\'100%\' filter=\'url(%23n)\'/></svg>")',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[0.65rem] tracking-[0.5em] text-white/80 md:text-xs"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          {config.eyebrow}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-6 text-5xl leading-none md:text-8xl lg:text-9xl"
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.03em',
          }}
        >
          {config.titulo}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 1.5, rotate: -15 }}
          whileInView={{ opacity: 1, scale: 1, rotate: -8 }}
          viewport={{ once: true }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 18,
            delay: 0.4,
          }}
          className="my-12 inline-block md:my-16"
        >
          <motion.div
            animate={{
              x: [0, -5, 5, -4, 4, 0],
              rotate: [-8, -7, -9, -8.5, -7.5, -8],
            }}
            transition={{
              duration: 0.55,
              repeat: Infinity,
              repeatDelay: 18,
              ease: 'easeInOut',
            }}
          >
            <div
              className="inline-flex flex-col items-center border-4 border-white px-10 py-6 md:px-16 md:py-8"
              style={{
                boxShadow: '0 0 0 8px #CC4B37, 0 0 0 10px white inset',
              }}
            >
              <p
                className="text-[0.6rem] tracking-[0.4em] text-white/80 md:text-[0.7rem]"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
              >
                {config.subtitulo}
              </p>
              <motion.p
                animate={{
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 30,
                  ease: 'easeInOut',
                }}
                className="mt-2 text-6xl leading-none md:text-8xl lg:text-9xl"
                style={{
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                {config.precio}
              </motion.p>
              <p
                className="mt-3 text-[0.65rem] tracking-[0.3em] text-white/80 md:text-xs"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
              >
                HASTA {config.fecha_limite}
              </p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6"
        >
          {config.cta1_link ? (
            <ProgressCTA texto={config.cta1_texto} link={config.cta1_link} />
          ) : null}
          {config.cta2_link ? (
            <ProgressCTA texto={config.cta2_texto} link={config.cta2_link} />
          ) : null}
        </motion.div>
      </div>
    </section>
  )
}

function ProgressCTA({ texto, link }: { texto: string; link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-full max-w-xs overflow-hidden border-2 border-white px-8 py-4 text-center text-[0.7rem] uppercase tracking-[0.25em] text-white transition-colors hover:text-[#CC4B37] md:w-auto md:min-w-[280px]"
      style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
    >
      <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white transition-transform duration-500 ease-out group-hover:scale-x-100" />
      <span className="relative">{texto}</span>
    </a>
  )
}
