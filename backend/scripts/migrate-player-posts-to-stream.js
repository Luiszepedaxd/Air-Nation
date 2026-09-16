'use strict'

/**
 * Migra videos progresivos (R2/MP4) de player_posts (y opcionalmente team_posts)
 * a Cloudflare Stream HLS, reutilizando uploadVideoToStream.
 *
 * NO borra los originales en R2.
 *
 * Uso (desde backend/):
 *   node scripts/migrate-player-posts-to-stream.js --dry-run
 *   node scripts/migrate-player-posts-to-stream.js --concurrency=2
 *   node scripts/migrate-player-posts-to-stream.js --limit=10
 *   node scripts/migrate-player-posts-to-stream.js --tables=player_posts,team_posts
 *
 * Railway (producción), con vars del servicio backend:
 *   railway run -s <backend-service> -- node scripts/migrate-player-posts-to-stream.js --dry-run
 *   railway run -s <backend-service> -- node scripts/migrate-player-posts-to-stream.js --concurrency=2
 *
 * Requiere en env:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   CLOUDFLARE_ACCOUNT_ID|CF_ACCOUNT_ID
 *   CF_STREAM_API_TOKEN|CLOUDFLARE_API_TOKEN
 */

const path = require('path')
const fs = require('fs')
const os = require('os')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const { createClient } = require('@supabase/supabase-js')
const { uploadVideoToStream } = require('../src/services/cloudflare')

const DEFAULT_CONCURRENCY = 2
const DOWNLOAD_MAX_BYTES = 250 * 1024 * 1024
const PAGE_SIZE = 200
/** Tope Stream al migrar legacy (productos nuevos: 60s; legacy puede variar). */
const STREAM_MAX_DURATION_SEC = Number(
  process.env.MIGRATE_STREAM_MAX_DURATION_SEC || 300
)

const TABLES_DEFAULT = ['player_posts']

function parseArgs(argv) {
  const out = {
    dryRun: false,
    concurrency: DEFAULT_CONCURRENCY,
    limit: null,
    tables: TABLES_DEFAULT.slice(),
    id: null,
  }
  for (const a of argv) {
    if (a === '--dry-run' || a === '--dryrun') out.dryRun = true
    else if (a.startsWith('--concurrency=')) {
      const n = Number(a.slice('--concurrency='.length))
      if (Number.isFinite(n) && n >= 1) out.concurrency = Math.floor(n)
    } else if (a.startsWith('--limit=')) {
      const n = Number(a.slice('--limit='.length))
      if (Number.isFinite(n) && n >= 1) out.limit = Math.floor(n)
    } else if (a.startsWith('--tables=')) {
      out.tables = a
        .slice('--tables='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (a.startsWith('--id=')) {
      out.id = a.slice('--id='.length).trim() || null
    } else if (a === '--help' || a === '-h') {
      out.help = true
    }
  }
  return out
}

/**
 * Alineado con FeedInlineVideo.isHlsUrl / URLs que guarda uploadVideoToStream.
 * Ya migrado si es HLS de Stream (.m3u8 / cloudflarestream / videodelivery).
 */
function isAlreadyStreamUrl(url) {
  if (!url || typeof url !== 'string') return false
  const clean = url.split('?')[0].toLowerCase()
  if (clean.endsWith('.m3u8') || clean.includes('.m3u8')) return true
  if (clean.includes('cloudflarestream.com')) return true
  if (clean.includes('videodelivery.net')) return true
  return false
}

function pickSourceUrl(row) {
  const mp4 =
    typeof row.video_mp4_url === 'string' ? row.video_mp4_url.trim() : ''
  const main = typeof row.video_url === 'string' ? row.video_url.trim() : ''
  // Preferir MP4 progresivo si existe y no es ya Stream.
  if (mp4 && !isAlreadyStreamUrl(mp4)) return mp4
  if (main && !isAlreadyStreamUrl(main)) return main
  if (mp4) return mp4
  if (main) return main
  return null
}

function filenameFromUrl(url) {
  try {
    const u = new URL(url)
    const base = path.basename(u.pathname) || 'video.mp4'
    return base.includes('.') ? base : `${base}.mp4`
  } catch {
    return 'video.mp4'
  }
}

function mimeFromUrlOrType(url, contentType) {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  if (ct.startsWith('video/')) return ct
  const lower = (url || '').toLowerCase()
  if (lower.includes('.webm')) return 'video/webm'
  if (lower.includes('.mov')) return 'video/quicktime'
  return 'video/mp4'
}

async function downloadToBuffer(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'AirNation-StreamMigrate/1.0' },
  })
  if (!res.ok) {
    throw new Error(`Download HTTP ${res.status} for ${url}`)
  }
  const lenHeader = res.headers.get('content-length')
  if (lenHeader) {
    const len = Number(lenHeader)
    if (Number.isFinite(len) && len > DOWNLOAD_MAX_BYTES) {
      throw new Error(
        `Archivo demasiado grande (${len} bytes > ${DOWNLOAD_MAX_BYTES})`
      )
    }
  }
  const ab = await res.arrayBuffer()
  if (ab.byteLength > DOWNLOAD_MAX_BYTES) {
    throw new Error(
      `Archivo demasiado grande (${ab.byteLength} bytes > ${DOWNLOAD_MAX_BYTES})`
    )
  }
  const contentType = res.headers.get('content-type')
  return {
    buffer: Buffer.from(ab),
    mimeType: mimeFromUrlOrType(url, contentType),
    filename: filenameFromUrl(url),
  }
}

function createLimiter(concurrency) {
  let active = 0
  const queue = []
  const runNext = () => {
    if (active >= concurrency) return
    const job = queue.shift()
    if (!job) return
    active += 1
    Promise.resolve()
      .then(job.fn)
      .then(job.resolve, job.reject)
      .finally(() => {
        active -= 1
        runNext()
      })
  }
  return function limit(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject })
      runNext()
    })
  }
}

function requireEnv() {
  const missing = []
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY')
  const account =
    process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID
  const token =
    process.env.CF_STREAM_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
  if (!account) missing.push('CLOUDFLARE_ACCOUNT_ID|CF_ACCOUNT_ID')
  if (!token) missing.push('CF_STREAM_API_TOKEN|CLOUDFLARE_API_TOKEN')
  return missing
}

async function fetchCandidates(supabase, table, opts) {
  const cols =
    'id, video_url, video_mp4_url, thumbnail_url, video_duration_s, created_at'
  const candidates = []
  let offset = 0
  for (;;) {
    let q = supabase
      .from(table)
      .select(cols)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)
    if (opts.id) q = q.eq('id', opts.id)

    const { data, error } = await q
    if (error) {
      // team_posts puede no tener columnas de video en algunos entornos
      if (
        table !== 'player_posts' &&
        /column|does not exist|video_/i.test(error.message || '')
      ) {
        console.warn(
          `[migrate] tabla ${table}: columnas de video no disponibles (${error.message}). Se omite.`
        )
        return []
      }
      throw new Error(`[${table}] select: ${error.message}`)
    }
    const rows = data || []
    for (const row of rows) {
      if (!row.video_url) continue
      if (isAlreadyStreamUrl(row.video_url)) continue
      const source = pickSourceUrl(row)
      if (!source) continue
      if (isAlreadyStreamUrl(source) && isAlreadyStreamUrl(row.video_url)) {
        continue
      }
      candidates.push({ table, row, sourceUrl: source })
      if (opts.limit != null && candidates.length >= opts.limit) {
        return candidates
      }
    }
    if (rows.length < PAGE_SIZE) break
    offset += PAGE_SIZE
    if (opts.id) break
  }
  return candidates
}

async function migrateOne(supabase, item, dryRun) {
  const { table, row, sourceUrl } = item
  const id = row.id
  const label = `${table}/${id}`

  if (dryRun) {
    console.log(
      `[dry-run] WOULD migrate ${label} source=${sourceUrl.slice(0, 120)}`
    )
    return { ok: true, dryRun: true }
  }

  console.log(`[start] ${label} downloading ${sourceUrl.slice(0, 100)}…`)
  const downloaded = await downloadToBuffer(sourceUrl)
  console.log(
    `[upload] ${label} bytes=${downloaded.buffer.length} mime=${downloaded.mimeType}`
  )

  const knownDur =
    row.video_duration_s != null && Number.isFinite(Number(row.video_duration_s))
      ? Number(row.video_duration_s)
      : null
  const maxDur = Math.max(
    STREAM_MAX_DURATION_SEC,
    knownDur != null ? Math.ceil(knownDur) + 5 : 0
  )

  const stream = await uploadVideoToStream(
    downloaded.buffer,
    downloaded.filename,
    downloaded.mimeType,
    {
      maxDurationSeconds: maxDur,
      readyTimeoutMs: 180000,
    }
  )

  if (!stream.video_url) {
    throw new Error('Stream no devolvió video_url (HLS)')
  }

  const patch = {
    video_url: stream.video_url,
    video_mp4_url: stream.video_mp4_url != null ? stream.video_mp4_url : null,
  }
  if (stream.thumbnail_url) {
    patch.thumbnail_url = stream.thumbnail_url
  }
  // Conservar duración conocida; si no había, usar la de Stream.
  if (
    (knownDur == null || knownDur <= 0) &&
    stream.duration_s != null &&
    stream.duration_s > 0
  ) {
    // video_duration_s es smallint en Supabase — no aceptar decimales (ej. 29.9).
    patch.video_duration_s = Math.max(1, Math.round(Number(stream.duration_s)))
  }

  const { error: updErr } = await supabase.from(table).update(patch).eq('id', id)
  if (updErr) {
    throw new Error(`update: ${updErr.message}`)
  }

  console.log(
    `[ok] ${label} -> ${stream.video_url} uid=${stream.stream_uid || '?'}`
  )
  return { ok: true, stream_uid: stream.stream_uid, video_url: stream.video_url }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(`Usage: node scripts/migrate-player-posts-to-stream.js [options]
  --dry-run              Solo listar candidatos
  --concurrency=N        Paralelo (default ${DEFAULT_CONCURRENCY})
  --limit=N              Máximo de posts a migrar
  --tables=a,b           Tablas (default: player_posts)
  --id=<uuid>            Solo un post`)
    process.exit(0)
  }

  const missing = requireEnv()
  if (missing.length) {
    console.error(
      `[migrate] Faltan variables de entorno: ${missing.join(', ')}`
    )
    console.error(
      'Carga backend/.env o exporta las vars (p.ej. railway run -s backend -- …).'
    )
    process.exit(1)
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  console.log(
    `[migrate] dryRun=${opts.dryRun} concurrency=${opts.concurrency} limit=${opts.limit ?? '∞'} tables=${opts.tables.join(',')}`
  )

  let all = []
  for (const table of opts.tables) {
    const remaining =
      opts.limit != null ? Math.max(0, opts.limit - all.length) : null
    if (opts.limit != null && remaining === 0) break
    const part = await fetchCandidates(supabase, table, {
      id: opts.id,
      limit: remaining,
    })
    console.log(`[migrate] ${table}: ${part.length} candidatos`)
    all = all.concat(part)
  }

  const candidates = opts.limit != null ? all.slice(0, opts.limit) : all
  console.log(`[migrate] total candidatos: ${candidates.length}`)

  if (candidates.length === 0) {
    console.log('[migrate] nada que hacer')
    return
  }

  const limit = createLimiter(opts.concurrency)
  let migrated = 0
  let failed = 0
  const failures = []

  await Promise.all(
    candidates.map((item) =>
      limit(async () => {
        try {
          await migrateOne(supabase, item, opts.dryRun)
          migrated += 1
        } catch (e) {
          failed += 1
          const msg = e && e.message ? e.message : String(e)
          failures.push({ table: item.table, id: item.row.id, error: msg })
          console.error(`[fail] ${item.table}/${item.row.id}: ${msg}`)
        }
      })
    )
  )

  console.log('── resumen ──')
  console.log(
    JSON.stringify(
      {
        dryRun: opts.dryRun,
        candidates: candidates.length,
        migrated,
        failed,
        failures,
      },
      null,
      2
    )
  )

  if (failed > 0) process.exitCode = 2
}

main().catch((e) => {
  console.error('[migrate] fatal:', e && e.message ? e.message : e)
  process.exit(1)
})
