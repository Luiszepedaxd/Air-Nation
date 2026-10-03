'use client'

import type { ReproductorDebugSnapshot } from './reproductorDebug'

export function ReproductorDebugPanel({ snap }: { snap: ReproductorDebugSnapshot }) {
  return (
    <div
      className="pointer-events-none absolute left-2 top-2 z-[60] max-w-[min(100%,280px)] rounded bg-black/75 p-2 font-mono text-[9px] leading-snug text-green-300"
      aria-hidden
    >
      <p className="text-white/80">debug=capsulas</p>
      <p className="truncate">src: {snap.src || '—'}</p>
      <p>motor: {snap.motor}</p>
      <p>
        ready {snap.readyState} · net {snap.networkState} · {snap.paused ? 'paused' : 'playing'}
      </p>
      <p>
        t {snap.currentTime.toFixed(1)} / {snap.duration.toFixed(1)}
      </p>
      <p>evt: {snap.lastMediaEvent}</p>
      <p>play: {snap.lastPlayResult}</p>
      {snap.mediaErrorCode != null ? (
        <p className="text-red-300">
          MediaError {snap.mediaErrorCode}: {snap.mediaErrorMessage}
        </p>
      ) : null}
      {snap.hlsFatal ? <p className="text-red-300">hls: {snap.hlsFatal}</p> : null}
    </div>
  )
}
