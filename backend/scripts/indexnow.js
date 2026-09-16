'use strict'

const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const KEY = process.env.INDEXNOW_KEY
const HOST = process.env.INDEXNOW_HOST || 'www.airnation.online'
const KEY_LOCATION = KEY ? `https://${HOST}/${KEY}.txt` : ''
const SITEMAP_URL = `https://${HOST}/sitemap.xml`
const HOST_PREFIX = `https://${HOST}/`
const INDEXNOW_API = 'https://api.indexnow.org/indexnow'
const BATCH_SIZE = 10000

function mensajeEstado(status) {
  switch (status) {
    case 200:
      return 'Enviadas correctamente'
    case 202:
      return 'Recibidas, pendientes de validar la llave'
    case 400:
      return 'Formato inválido'
    case 403:
      return 'Llave no válida'
    case 422:
      return 'URLs no pertenecen al host o llave no coincide'
    case 429:
      return 'Demasiadas solicitudes, intenta más tarde'
    default:
      return `Respuesta HTTP ${status}`
  }
}

async function extraerUrlsDelSitemap(filtro) {
  const res = await fetch(SITEMAP_URL)
  if (!res.ok) {
    throw new Error(`[indexnow] No se pudo descargar el sitemap (${res.status})`)
  }
  const xml = await res.text()
  const urls = []
  const re = /<loc>([^<]+)<\/loc>/g
  let match
  while ((match = re.exec(xml)) !== null) {
    const url = match[1].trim()
    if (!filtro || filtro(url)) urls.push(url)
  }
  return urls
}

async function verificarLlaveEnProduccion() {
  const res = await fetch(KEY_LOCATION)
  if (!res.ok) {
    console.error('[indexnow] El archivo de la llave no está publicado en producción')
    process.exit(1)
  }
  const texto = (await res.text()).trim()
  if (texto !== KEY) {
    console.error('[indexnow] El archivo de la llave no está publicado en producción')
    process.exit(1)
  }
}

async function enviarLote(urlList) {
  const res = await fetch(INDEXNOW_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  })
  console.log(mensajeEstado(res.status))
  return res.status
}

async function main() {
  if (!KEY) {
    console.error('[indexnow] Falta INDEXNOW_KEY')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const rankingOnly = args.includes('--ranking')
  const urlArgs = args.filter(
    (a) => a !== '--ranking' && (a.startsWith('http://') || a.startsWith('https://'))
  )

  let urls
  if (urlArgs.length > 0) {
    urls = urlArgs
  } else if (rankingOnly) {
    urls = await extraerUrlsDelSitemap((u) => u.includes('/ranking'))
  } else {
    urls = await extraerUrlsDelSitemap()
  }

  urls = [...new Set(urls.filter((u) => u.startsWith(HOST_PREFIX)))]

  await verificarLlaveEnProduccion()

  if (urls.length === 0) {
    console.log('No hay URLs para enviar.')
    process.exit(0)
  }

  let ultimoCodigo = 0
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const lote = urls.slice(i, i + BATCH_SIZE)
    ultimoCodigo = await enviarLote(lote)
  }

  console.log(`Total de URLs enviadas: ${urls.length}. Código de respuesta: ${ultimoCodigo}`)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
