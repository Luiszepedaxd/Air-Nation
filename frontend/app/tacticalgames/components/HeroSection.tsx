'use client'

import { motion } from 'framer-motion'
import type { HeroConfig } from '../lib/types'
import { TG_COLORS, TG_FONTS, TG_HEADER_STYLE } from './ui/theme'
import { PaperTexture } from './ui/PaperTexture'
import { StampBadge } from './ui/StampBadge'
import { CornerBrackets } from './ui/CornerBrackets'

function WordSplit({ text, delay = 0 }: { text: string; delay?: number }) {
  const display = text.trim() || 'AIRSOFT TACTICAL GAMES'
  const words = display.split(/\s+/).filter(Boolean)

  return (
    <span
      aria-label={display}
      className="inline-block max-w-full"
      style={{ wordBreak: 'normal', overflowWrap: 'break-word' }}
    >
      {words.map((word, i) => (
        <span key={`${i}-${word}`} className="inline-block whitespace-nowrap">
          <motion.span
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: delay + i * 0.12, ease: 'easeOut' }}
            className="inline-block"
            aria-hidden
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? <span aria-hidden>{'\u00A0'}</span> : null}
        </span>
      ))}
    </span>
  )
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith('//')
}

export function HeroSection({ config }: { config: HeroConfig }) {
  const eyebrow = config.eyebrow?.trim() || 'COMPETICIÓN TÁCTICA INDIVIDUAL'
  const titulo = config.titulo?.trim() || 'AIRSOFT TACTICAL GAMES'
  const subtitulo = config.subtitulo?.trim() || 'MÉXICO · 27-28 JUNIO 2026'
  const mediaUrl = config.media_url?.trim() || ''
  const mediaType = config.media_type === 'video' ? 'video' : 'image'
  const cta1Link = config.cta1_link?.trim() || ''
  const cta2Link = config.cta2_link?.trim() || ''

  return (
    <section
      data-section="hero"
      className="relative min-h-[80vh] w-full overflow-hidden text-white md:min-h-screen"
      style={{ backgroundColor: TG_COLORS.dark }}
    >
      {mediaUrl ? (
        <div className="absolute inset-0 z-0">
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover object-center"
              style={{ filter: 'grayscale(0.5) contrast(1.05)' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt=""
              className="h-full w-full object-cover object-center"
              style={{ filter: 'grayscale(0.5) contrast(1.05)' }}
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </div>
      ) : null}

      <PaperTexture opacity={0.05} blend="overlay" />

      <div className="relative z-30 flex min-h-[80vh] flex-col items-center justify-center px-4 py-24 text-center md:min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -16 }}
          animate={{ opacity: 1, scale: 1, rotate: -6 }}
          transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.1 }}
          className="mb-8"
          style={{ boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}
        >
          <StampBadge
            color={TG_COLORS.red}
            rotate={-6}
            animate={false}
            className="!opacity-100 text-[0.65rem] md:text-sm"
          >
            CLASIFICADO
          </StampBadge>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-[0.6rem] tracking-[0.4em] md:text-xs"
          style={{
            fontFamily: TG_FONTS.mono,
            fontWeight: 700,
            color: '#FFFFFF',
            opacity: 0.9,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {eyebrow}
        </motion.p>

        <CornerBrackets color={TG_COLORS.red} size={20} thickness={2} className="mt-6 px-6 py-4 md:px-10 md:py-6">
          <h1
            className="mx-auto max-w-5xl leading-[0.95]"
            style={{
              ...TG_HEADER_STYLE,
              fontWeight: 900,
              fontSize: 'clamp(2rem, 9vw, 6rem)',
              wordBreak: 'normal',
              overflowWrap: 'break-word',
              color: '#FFFFFF',
              textShadow: '0 2px 12px rgba(0,0,0,0.6)',
            }}
          >
            <WordSplit text={titulo} delay={0.4} />
          </h1>
        </CornerBrackets>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-6 text-[0.7rem] tracking-[0.3em] md:text-base"
          style={{
            fontFamily: TG_FONTS.mono,
            fontWeight: 700,
            color: '#F2C200',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {subtitulo}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.15 }}
          className="mt-12 flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:gap-5"
        >
          {cta1Link ? (
            <a
              href={cta1Link}
              {...(isExternalHref(cta1Link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex w-full items-center justify-center px-7 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ fontFamily: TG_FONTS.mono, fontWeight: 700, backgroundColor: '#CC4B37' }}
            >
              {config.cta1_texto?.trim() || 'INSCRIBIRME'}
            </a>
          ) : null}
          {cta2Link ? (
            <a
              href={cta2Link}
              {...(isExternalHref(cta2Link) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="inline-flex w-full items-center justify-center border-2 px-7 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] text-white transition-colors hover:bg-white/10 sm:w-auto"
              style={{
                fontFamily: TG_FONTS.mono,
                fontWeight: 700,
                borderColor: '#FFFFFF',
                color: '#FFFFFF',
                backdropFilter: 'blur(4px)',
              }}
            >
              {config.cta2_texto?.trim() || 'MÁS INFO'}
            </a>
          ) : null}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
        className="absolute bottom-6 left-0 right-0 z-30 mx-auto flex max-w-md items-center gap-4 px-6"
      >
        <span className="h-px flex-1" style={{ borderTop: `1px dashed ${TG_COLORS.border}` }} />
        <span
          className="text-[0.55rem] tracking-[0.4em] text-white/60"
          style={{ fontFamily: TG_FONTS.mono, fontWeight: 400 }}
        >
          SCROLL
        </span>
        <span className="h-px flex-1" style={{ borderTop: `1px dashed ${TG_COLORS.border}` }} />
      </motion.div>
    </section>
  )
}
