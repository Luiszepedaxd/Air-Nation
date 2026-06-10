'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { MusicaConfig } from '../lib/types'

export function MusicaSection({ config }: { config: MusicaConfig }) {
  const audioUrl = config.audio_url?.trim()

  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const eyebrow = config.eyebrow?.trim() || 'BANDA SONORA OFICIAL'
  const titulo = config.titulo?.trim() || 'TEMA OFICIAL'
  const artista = config.artista?.trim() || ''
  const coverUrl = config.cover_url?.trim()

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => {
      setCurrentTime(el.currentTime)
      setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0)
    }
    const onLoaded = () => setDuration(el.duration)
    const onEnded = () => setPlaying(false)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('ended', onEnded)
    }
  }, [audioUrl])

  async function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      await el.play()
      setPlaying(true)
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    el.currentTime = ratio * el.duration
  }

  function fmt(s: number) {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (!audioUrl) return null

  return (
    <section
      id="musica"
      data-section="musica"
      className="relative w-full bg-[#0d0d0d] py-16 text-white md:py-20"
    >
      <div className="mx-auto max-w-2xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37]"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {eyebrow}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center gap-5 rounded-sm border border-[#2a2a2a] bg-[#1a1a1a] p-5 md:p-6"
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-[#333] md:h-20 md:w-20">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={titulo} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#222]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 18V5l12-2v13" stroke="#CC4B37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="6" cy="18" r="3" stroke="#CC4B37" strokeWidth="1.5"/>
                  <circle cx="18" cy="16" r="3" stroke="#CC4B37" strokeWidth="1.5"/>
                </svg>
              </div>
            )}
            {playing && (
              <span className="absolute inset-0 animate-ping rounded-sm bg-[#CC4B37]/20" />
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div>
              <p
                className="truncate text-sm leading-tight md:text-base"
                style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, textTransform: 'uppercase' }}
              >
                {titulo}
              </p>
              {artista && (
                <p className="mt-0.5 truncate text-xs text-white/50" style={{ fontFamily: 'Lato, sans-serif' }}>
                  {artista}
                </p>
              )}
            </div>

            <div
              className="group relative h-1.5 w-full cursor-pointer bg-[#333] rounded-full"
              onClick={handleSeek}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#CC4B37] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] tabular-nums text-white/40" style={{ fontFamily: 'Lato, sans-serif' }}>
                {fmt(currentTime)} / {fmt(duration)}
              </span>
              <button
                onClick={togglePlay}
                aria-label={playing ? 'Pausar' : 'Reproducir'}
                className="flex h-9 w-9 items-center justify-center bg-[#CC4B37] transition-opacity hover:opacity-90"
                style={{ borderRadius: 2 }}
              >
                {playing ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white" aria-hidden>
                    <path d="M5 3l14 9-14 9V3z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}
    </section>
  )
}
