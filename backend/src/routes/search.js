const express = require('express')
const router = express.Router()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const RESULTS_PER_CATEGORY = 3

// GET /api/v1/search?q=término&user_id=uuid (user_id opcional para logs)
router.get('/', async (req, res) => {
  try {
    const raw = (req.query.q ?? '').toString().replace(/[%_]/g, '').trim()
    const userId = req.query.user_id?.toString() ?? null

    if (raw.length < 2) {
      return res.json({
        results: {
          operadores: [],
          equipos: [],
          campos: [],
          listings: [],
          eventos: [],
          blog: [],
          arsenal: [],
        },
        total: 0,
      })
    }

    const term = `%${raw}%`

    // Queries en paralelo
    const [
      operadoresRes,
      equiposRes,
      camposRes,
      listingsRes,
      eventosRes,
      blogRes,
      arsenalRes,
    ] = await Promise.all([
      // Operadores
      supabase
        .from('users')
        .select('id, alias, nombre, avatar_url')
        .or(`alias.ilike.${term},nombre.ilike.${term}`)
        .limit(RESULTS_PER_CATEGORY),

      // Equipos
      supabase
        .from('teams')
        .select('id, nombre, slug, avatar_url')
        .ilike('nombre', term)
        .limit(RESULTS_PER_CATEGORY),

      // Campos
      supabase
        .from('campos')
        .select('id, nombre, slug, ciudad, estado')
        .or(`nombre.ilike.${term},ciudad.ilike.${term}`)
        .limit(RESULTS_PER_CATEGORY),

      // Marketplace listings activos
      supabase
        .from('marketplace_listings')
        .select('id, titulo, precio, fotos_urls')
        .ilike('titulo', term)
        .eq('status', 'activo')
        .eq('vendido', false)
        .limit(RESULTS_PER_CATEGORY),

      // Eventos
      supabase
        .from('events')
        .select('id, titulo, fecha_inicio, slug')
        .ilike('titulo', term)
        .limit(RESULTS_PER_CATEGORY),

      // Blog
      supabase
        .from('blog_posts')
        .select('id, titulo, slug, published_at')
        .ilike('titulo', term)
        .eq('published', true)
        .limit(RESULTS_PER_CATEGORY),

      // Arsenal (réplicas públicas)
      supabase
        .from('replicas')
        .select('id, nombre, sistema, foto_url, owner_id')
        .ilike('nombre', term)
        .limit(RESULTS_PER_CATEGORY),
    ])

    const results = {
      operadores: operadoresRes.data ?? [],
      equipos:    equiposRes.data ?? [],
      campos:     camposRes.data ?? [],
      listings:   listingsRes.data ?? [],
      eventos:    eventosRes.data ?? [],
      blog:       blogRes.data ?? [],
      arsenal:    arsenalRes.data ?? [],
    }

    const total = Object.values(results).reduce(
      (sum, arr) => sum + arr.length,
      0
    )

    // Registrar log (sin bloquear la respuesta)
    supabase
      .from('search_logs')
      .insert({ query: raw, user_id: userId, results_count: total })
      .then(() => {})
      .catch(() => {})

    return res.json({ results, total })
  } catch (err) {
    console.error('[search]', err)
    return res.status(500).json({ error: 'Error en búsqueda' })
  }
})

module.exports = router
