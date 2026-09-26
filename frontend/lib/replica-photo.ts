/**
 * Foto de registro de réplica y el post automático del feed.
 *
 * El post solo existe si hay una URL http(s) de imagen ya guardada.
 * Un registro sin foto se guarda en el arsenal y no se publica.
 *
 * ponytail: HEIC se convierte en el navegador (WebKit del iPhone lo decodifica
 * a JPEG). El API no trae libheif; un HEIC crudo se rechaza con mensaje.
 * Upgrade: sharp/libheif en el backend si hace falta aceptarlo desde Chrome.
 */

export const PHOTO_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif'

export const PHOTO_UNSUPPORTED =
  'Ese formato no se puede usar. Elige JPG, PNG, WebP o HEIC.'
export const PHOTO_HEIC_FAIL =
  'No pudimos leer esta foto HEIC. Vuelve a elegirla o expórtala como JPG.'
export const PHOTO_DECODE_FAIL = 'No pudimos leer esa foto. Prueba con otra imagen.'
export const PHOTO_TOO_BIG = 'La foto es demasiado pesada. Prueba con otra.'
export const PHOTO_UPLOAD_FAIL =
  'No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.'

const PASS_THROUGH_MAX = 8 * 1024 * 1024
const MAX_EDGE = 2048
const UPLOAD_MAX = 10 * 1024 * 1024

export type ImageKind = 'jpeg' | 'png' | 'webp' | 'heic'

const MIME: Record<ImageKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
}

const EXT: Record<ImageKind, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  heic: 'heic',
}

export function sniffImageKind(bytes: Uint8Array | null | undefined): ImageKind | null {
  if (!bytes || bytes.length < 3) return null
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png'
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp'
  }
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase()
    if (
      brand === 'heic' ||
      brand === 'heix' ||
      brand === 'heif' ||
      brand === 'heim' ||
      brand === 'hevc' ||
      brand === 'mif1' ||
      brand === 'msf1'
    ) {
      return 'heic'
    }
  }
  return null
}

export function imageKindFromMime(mime: string | null | undefined): ImageKind | null {
  const m = String(mime || '').split(';')[0].trim().toLowerCase()
  if (m === 'image/jpeg' || m === 'image/jpg' || m === 'image/pjpeg') return 'jpeg'
  if (m === 'image/png') return 'png'
  if (m === 'image/webp') return 'webp'
  if (
    m === 'image/heic' ||
    m === 'image/heif' ||
    m === 'image/heic-sequence' ||
    m === 'image/heif-sequence'
  ) {
    return 'heic'
  }
  return null
}

export function imageKindFromName(name: string | null | undefined): ImageKind | null {
  const base = String(name || '').trim().toLowerCase()
  const dot = base.lastIndexOf('.')
  const ext = dot >= 0 ? base.slice(dot + 1) : ''
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'jfif') return 'jpeg'
  if (ext === 'png') return 'png'
  if (ext === 'webp') return 'webp'
  if (ext === 'heic' || ext === 'heif') return 'heic'
  return null
}

/**
 * Si hay bytes, solo vale la firma. Un PDF renombrado a .jpg no es un JPEG.
 * MIME y extensión se usan cuando todavía no leímos el archivo.
 */
export function resolveImageKind(input: {
  type?: string | null
  name?: string | null
  bytes?: Uint8Array | null
}): ImageKind | null {
  if (input.bytes && input.bytes.length > 0) return sniffImageKind(input.bytes)
  return imageKindFromMime(input.type) ?? imageKindFromName(input.name)
}

export function shouldTranscode(kind: ImageKind, size: number): boolean {
  if (kind === 'heic') return true
  return size > PASS_THROUGH_MAX
}

export function isPublishablePhotoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/** null = no publicar. El feed no debe recibir fotos_urls vacío. */
export function replicaRegistrationPhotos(
  fotoUrl: string | null | undefined
): string[] | null {
  if (!isPublishablePhotoUrl(fotoUrl)) return null
  return [String(fotoUrl).trim()]
}

function fileBase(name: string): string {
  const trimmed = name.trim()
  const dot = trimmed.lastIndexOf('.')
  const base = (dot > 0 ? trimmed.slice(0, dot) : trimmed) || 'replica'
  return base || 'replica'
}

function withDeclaredMime(file: File, kind: Exclude<ImageKind, 'heic'>): File {
  const mime = MIME[kind]
  if (file.type === mime) return file
  return new File([file], `${fileBase(file.name)}.${EXT[kind]}`, {
    type: mime,
    lastModified: file.lastModified,
  })
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode'))
    }
    img.src = url
  })
}

async function decodeForCanvas(file: File): Promise<{
  width: number
  height: number
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
}> {
  if (typeof createImageBitmap === 'function') {
    const attempts: Array<() => Promise<ImageBitmap>> = [
      () => createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions),
      () => createImageBitmap(file),
    ]
    for (const attempt of attempts) {
      try {
        const bitmap = await attempt()
        return {
          width: bitmap.width,
          height: bitmap.height,
          draw: (ctx, w, h) => {
            ctx.drawImage(bitmap, 0, 0, w, h)
            bitmap.close()
          },
        }
      } catch {
        /* siguiente decoder */
      }
    }
  }
  const img = await loadHtmlImage(file)
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    draw: (ctx, w, h) => {
      ctx.drawImage(img, 0, 0, w, h)
    },
  }
}

async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  const qualities = [0.82, 0.7, 0.55]
  let last: Blob | null = null
  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', quality)
    })
    if (!blob) throw new Error('decode')
    last = blob
    if (blob.size <= 9 * 1024 * 1024) return blob
  }
  if (last && last.size <= UPLOAD_MAX) return last
  throw new Error('too-big')
}

async function transcodeToJpeg(file: File): Promise<File> {
  const decoded = await decodeForCanvas(file)
  if (!decoded.width || !decoded.height) throw new Error('decode')
  const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height))
  const w = Math.max(1, Math.round(decoded.width * scale))
  const h = Math.max(1, Math.round(decoded.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('decode')
  decoded.draw(ctx, w, h)
  const blob = await canvasToJpeg(canvas)
  return new File([blob], `${fileBase(file.name)}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  })
}

export async function prepareReplicaPhoto(file: File): Promise<File> {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer())
  const kind = resolveImageKind({ type: file.type, name: file.name, bytes: head })
  if (!kind) throw new Error(PHOTO_UNSUPPORTED)
  try {
    let out: File
    if (kind === 'heic' || shouldTranscode(kind, file.size)) {
      out = await transcodeToJpeg(file)
    } else {
      out = withDeclaredMime(file, kind)
    }
    if (out.size > UPLOAD_MAX) throw new Error('too-big')
    return out
  } catch (err) {
    if (err instanceof Error && err.message === 'too-big') throw new Error(PHOTO_TOO_BIG)
    if (err instanceof Error && err.message === PHOTO_TOO_BIG) throw err
    throw new Error(kind === 'heic' ? PHOTO_HEIC_FAIL : PHOTO_DECODE_FAIL)
  }
}
