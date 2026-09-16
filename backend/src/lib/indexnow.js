'use strict'

function getSupabase() {
  return require('./supabase')
}

const INDEXNOW_API = 'https://api.indexnow.org/indexnow'
const BATCH_SIZE = 10000
const DB_CHUNK = 500
const SITEMAP_TIMEOUT_MS = 15000
const KEY_TIMEOUT_MS = 10000

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

function getConfig() {
  const key = process.env.INDEXNOW_KEY
  const host = process.env.INDEXNOW_HOST || 'www.airnation.online'
  return {
    key,
    host,
    keyLocation: key ? `https://${host}/${key}.txt` : '',
    sitemapUrl: `https://${host}/sitemap.xml`,
  }
}

function hostPrefix(host) {
  return `https://${host}/`
}

async function fetchConTimeout(url, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function normalizarLastmod(valor) {
  if (valor == null || valor === '') return null
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return String(valor).trim()
  return d.toISOString()
}

function parsearBloquesUrl(xml) {
  const entradas = []
  const reBloque = /<url>([\s\S]*?)<\/url>/gi
  let bloque
  while ((bloque = reBloque.exec(xml)) !== null) {
    const fragmento = bloque[1]
    const locMatch = fragmento.match(/<loc>([^<]+)<\/loc>/i)
    if (!locMatch) continue
    const lastmodMatch = fragmento.match(/<lastmod>([^<]+)<\/lastmod>/i)
    entradas.push({
      url: locMatch[1].trim(),
      lastmod: lastmodMatch ? normalizarLastmod(lastmodMatch[1].trim()) : null,
    })
  }
  return entradas
}

async function obtenerUrlsSitemap() {
  const { host, sitemapUrl } = getConfig()
  const prefix = hostPrefix(host)
  const res = await fetchConTimeout(sitemapUrl, SITEMAP_TIMEOUT_MS)
  if (!res.ok) {
    throw new Error(`No se pudo descargar el sitemap (${res.status})`)
  }
  const xml = await res.text()
  const porUrl = new Map()
  for (const entrada of parsearBloquesUrl(xml)) {
    if (!entrada.url.startsWith(prefix)) continue
    const prev = porUrl.get(entrada.url)
    if (!prev) {
      porUrl.set(entrada.url, entrada)
      continue
    }
    if (entrada.lastmod && (!prev.lastmod || entrada.lastmod > prev.lastmod)) {
      porUrl.set(entrada.url, entrada)
    }
  }
  return [...porUrl.values()]
}

async function verificarLlave() {
  const { key, keyLocation } = getConfig()
  if (!key || !keyLocation) return false
  try {
    const res = await fetchConTimeout(keyLocation, KEY_TIMEOUT_MS)
    if (!res.ok) return false
    const texto = (await res.text()).trim()
    return texto === key
  } catch {
    return false
  }
}

async function enviarLote(urlList) {
  const { key, host, keyLocation } = getConfig()
  const res = await fetch(INDEXNOW_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList,
    }),
  })
  const status = res.status
  return {
    enviadas: urlList.length,
    status,
    mensaje: mensajeEstado(status),
  }
}

async function enviarUrls(urls) {
  const resultados = []
  const lista = urls.map((u) => (typeof u === 'string' ? u : u.url))

  for (let i = 0; i < lista.length; i += BATCH_SIZE) {
    const lote = lista.slice(i, i + BATCH_SIZE)
    const r = await enviarLote(lote)
    resultados.push(r)
    if (r.status === 429) break
  }

  return resultados
}

async function cargarRegistrosExistentes(urls) {
  const mapa = new Map()
  for (let i = 0; i < urls.length; i += DB_CHUNK) {
    const chunk = urls.slice(i, i + DB_CHUNK)
    const { data, error } = await getSupabase()
      .from('seo_indexnow_urls')
      .select('url, lastmod')
      .in('url', chunk)
    if (error) {
      console.error('[indexnow] Error al leer seo_indexnow_urls:', error.message)
      continue
    }
    for (const row of data || []) {
      mapa.set(row.url, normalizarLastmod(row.lastmod))
    }
  }
  return mapa
}

function filtrarPendientes(entradas, existentes, forzar) {
  if (forzar) return entradas
  return entradas.filter((e) => {
    const guardado = existentes.get(e.url)
    if (guardado === undefined) return true
    if (e.lastmod == null) return false
    return e.lastmod !== guardado
  })
}

async function guardarEnviadas(entradas, status) {
  const ahora = new Date().toISOString()
  const filas = entradas.map((e) => ({
    url: e.url,
    lastmod: e.lastmod,
    ultimo_status: status,
    enviado_at: ahora,
  }))
  for (let i = 0; i < filas.length; i += DB_CHUNK) {
    const chunk = filas.slice(i, i + DB_CHUNK)
    const { error } = await getSupabase()
      .from('seo_indexnow_urls')
      .upsert(chunk, { onConflict: 'url' })
    if (error) {
      console.error('[indexnow] Error al guardar URLs:', error.message)
    }
  }
}

async function sincronizarIndexNow({ forzar = false, filtro = null } = {}) {
  try {
    const { key } = getConfig()
    if (!key) {
      console.log('[indexnow] Falta INDEXNOW_KEY')
      return { omitido: true }
    }

    const llaveOk = await verificarLlave()
    if (!llaveOk) {
      console.log(
        '[indexnow] El archivo de la llave no está publicado en producción'
      )
      return { omitido: true }
    }

    let entradas = await obtenerUrlsSitemap()
    if (filtro) {
      entradas = entradas.filter((e) => e.url.includes(filtro))
    }

    const existentes = forzar
      ? new Map()
      : await cargarRegistrosExistentes(entradas.map((e) => e.url))

    const pendientes = filtrarPendientes(entradas, existentes, forzar)

    if (pendientes.length === 0) {
      console.log('[indexnow] Sin cambios')
      return { enviadas: 0 }
    }

    let totalEnviadas = 0
    let ultimoStatus = 0
    let ultimoMensaje = ''
    const resultados = []

    for (let i = 0; i < pendientes.length; i += BATCH_SIZE) {
      const loteEntradas = pendientes.slice(i, i + BATCH_SIZE)
      const r = await enviarLote(loteEntradas.map((e) => e.url))
      resultados.push(r)
      totalEnviadas += r.enviadas
      ultimoStatus = r.status
      ultimoMensaje = r.mensaje
      if (r.status === 200 || r.status === 202) {
        await guardarEnviadas(loteEntradas, r.status)
      }
      if (r.status === 429) break
    }

    console.log(
      `[indexnow] ${totalEnviadas} URLs enviadas · ${ultimoStatus} ${ultimoMensaje}`
    )

    return {
      enviadas: totalEnviadas,
      status: ultimoStatus,
      mensaje: ultimoMensaje,
      resultados,
    }
  } catch (err) {
    console.error('[indexnow] Error:', err.message || err)
    return { error: true }
  }
}

module.exports = {
  getConfig,
  obtenerUrlsSitemap,
  verificarLlave,
  enviarUrls,
  sincronizarIndexNow,
  mensajeEstado,
}
