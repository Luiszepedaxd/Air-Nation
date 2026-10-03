export type ReproductorDebugSnapshot = {
  src: string
  motor: 'nativo' | 'hls.js' | '—'
  readyState: number
  networkState: number
  paused: boolean
  currentTime: number
  duration: number
  lastMediaEvent: string
  mediaErrorCode: number | null
  mediaErrorMessage: string
  hlsFatal: string
  lastPlayResult: string
}

export const DEBUG_VACIO: ReproductorDebugSnapshot = {
  src: '',
  motor: '—',
  readyState: 0,
  networkState: 0,
  paused: true,
  currentTime: 0,
  duration: 0,
  lastMediaEvent: '—',
  mediaErrorCode: null,
  mediaErrorMessage: '',
  hlsFatal: '',
  lastPlayResult: '—',
}
