const express = require("express");
const supabase = require("../lib/supabase");
const {
  generateTeamSlug,
  resolveUniqueTeamSlug,
} = require("../lib/teamSlug");

const router = express.Router();

/**
 * GET /api/v1/teams/search
 * @query {string} [q] - texto para filtrar por nombre (menos de 2 caracteres: sin búsqueda)
 * @query {string} [ciudad] - ciudad exacta para filtrar equipos
 */
router.get("/search", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const ciudad = typeof req.query.ciudad === "string" ? req.query.ciudad : "";

    if (q.length < 2) {
      return res.json({ teams: [], allow_create: true });
    }

    const { data: teams, error: searchError } = await supabase
      .from("teams")
      .select("id, nombre, ciudad")
      .eq("ciudad", ciudad)
      .ilike("nombre", `%${q}%`)
      .limit(6);

    if (searchError) {
      return res.status(500).json({ error: searchError.message });
    }

    const { count, error: countError } = await supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("ciudad", ciudad);

    if (countError) {
      return res.status(500).json({ error: countError.message });
    }

    const allow_create = (count ?? 0) < 10;
    res.json({ teams: teams || [], allow_create });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/teams
 * Lista paginada de equipos.
 * @query {number} [page=1] - número de página (base 1)
 * @query {number} [limit=10] - elementos por página
 */
router.get("/", async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search.length >= 2) {
      const { data, error } = await supabase
        .from("teams")
        .select("id, nombre")
        .ilike("nombre", `%${search}%`)
        .limit(5);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json({
        teams: data || [],
        page: 1,
        limit: 5,
        total: (data || []).length,
      });
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("teams")
      .select("*", { count: "exact" })
      .range(from, to);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      teams: data || [],
      page,
      limit,
      total: count ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/teams/:id
 * @param {string} req.params.id - UUID del equipo
 */
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ team: data, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/teams
 * @param {string} req.body.nombre - nombre del equipo
 * @param {string} req.body.ciudad - ciudad
 * @param {string} req.body.created_by - id del usuario creador
 * @param {string} [req.body.slug] - slug opcional (se normaliza; si falta se deriva del nombre)
 */
router.post("/", async (req, res) => {
  try {
    const { nombre, ciudad, created_by, slug: rawSlug } = req.body || {};
    if (!nombre || !ciudad || !created_by) {
      return res.status(400).json({ error: "nombre, ciudad y created_by son requeridos" });
    }

    const nombreTrim = String(nombre).trim();
    const baseSlug = generateTeamSlug(rawSlug, nombreTrim);
    const uniqueSlug = await resolveUniqueTeamSlug(supabase, baseSlug);

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        nombre: nombreTrim,
        ciudad: String(ciudad).trim(),
        created_by,
        slug: uniqueSlug,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
