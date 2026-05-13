'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { VideosConfig, VideoItem } from '../lib/types'

export function VideosSection({ config }: { config: VideosConfig }) {
  const videos = (config.videos ?? []).filter((v) => typeof v.url === 'string' && v.url.trim())

  return (
    <section
      data-section="videos"
      className="relative w-full bg-[#F5F3EF] py-16 text-[#111111] md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-10 md:mb-14"
        >
          <p
            className="text-[0.65rem] tracking-[0.5em] text-[#CC4B37] md:text-xs"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {config.eyebrow ?? ''}
          </p>
          <h2
            className="mt-3 text-3xl leading-none sm:text-4xl md:text-5xl lg:text-6xl"
            style={{
              fontFamily: 'Jost, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
          >
            {config.titulo ?? ''}
          </h2>
        </motion.div>

        {videos.length === 0 ? (
          <div className="border border-[#E5E0DA] bg-white py-16 text-center">
            <p
              className="text-[0.7rem] uppercase tracking-[0.3em] text-[#999]"
              style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
            >
              Videos próximamente
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 md:gap-6 ${
              videos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
            }`}
          >
            {videos.map((v, i) => (
              <VideoCard key={`${v.url}-${i}`} video={v} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function VideoCard({ video, index }: { video: VideoItem; index: number }) {
  const [playing, setPlaying] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="relative aspect-video w-full overflow-hidden bg-black"
    >
      <video
        src={video.url}
        poster={video.poster?.trim() || undefined}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {video.titulo && !playing ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <p
            className="text-sm text-white md:text-base"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
          >
            {video.titulo}
          </p>
        </div>
      ) : null}
    </motion.div>
  )
}
