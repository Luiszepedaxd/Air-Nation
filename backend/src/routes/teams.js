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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/v1/teams/:teamId/notify-join-request
 * Notifica por email al founder del equipo (Resend).
 */
router.post("/:teamId/notify-join-request", async (req, res) => {
  try {
    const teamId = req.params.teamId;
    if (!UUID_RE.test(teamId)) {
      return res.status(400).json({ error: "teamId inválido" });
    }

    const { solicitante_nombre, solicitante_alias, team_nombre } = req.body || {};
    const nombreStr =
      typeof solicitante_nombre === "string" ? solicitante_nombre.trim() : "";
    const teamNombreStr =
      typeof team_nombre === "string" ? team_nombre.trim() : "tu equipo";
    const aliasStr =
      solicitante_alias === null || solicitante_alias === undefined
        ? ""
        : String(solicitante_alias).trim();

    const { data: teamRow, error: teamErr } = await supabase
      .from("teams")
      .select("id, slug, nombre")
      .eq("id", teamId)
      .maybeSingle();

    if (teamErr || !teamRow) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    const slug = teamRow.slug ? String(teamRow.slug) : "";

    const { data: founderMember, error: fmErr } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)
      .eq("rol_plataforma", "founder")
      .eq("status", "activo")
      .maybeSingle();

    if (fmErr || !founderMember?.user_id) {
      return res.json({ ok: true, skipped: true, reason: "no_founder" });
    }

    const { data: founderUser, error: fuErr } = await supabase
      .from("users")
      .select("email")
      .eq("id", founderMember.user_id)
      .maybeSingle();

    const toEmail =
      founderUser && typeof founderUser.email === "string"
        ? founderUser.email.trim()
        : "";

    if (fuErr || !toEmail) {
      return res.json({ ok: true, skipped: true, reason: "no_email" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromAddr =
      process.env.RESEND_FROM_EMAIL || "AirNation <onboarding@resend.dev>";

    if (!apiKey) {
      console.warn("[notify-join-request] RESEND_API_KEY no configurada");
      return res.json({ ok: true, skipped: true, reason: "no_resend" });
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);

    const aliasPart = aliasStr ? ` (@${aliasStr})` : "";
    const adminPath = slug
      ? `https://airnation.online/equipos/${encodeURIComponent(slug)}/admin`
      : `https://airnation.online/equipos/${encodeURIComponent(teamId)}/admin`;

    const textBody = `${nombreStr || "Alguien"}${aliasPart} quiere unirse a tu equipo.\n\nRevisa las solicitudes en: ${adminPath}\n`;

    const subject = `Nueva solicitud para unirse a ${teamNombreStr} — AirNation`;

    const { error: sendErr } = await resend.emails.send({
      from: fromAddr,
      to: [toEmail],
      subject,
      text: textBody,
    });

    if (sendErr) {
      console.error("[notify-join-request] Resend error:", sendErr);
      return res.status(500).json({ error: sendErr.message || "Error al enviar email" });
    }

    res.json({ ok: true });
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
        status: "activo",
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /teams] teams INSERT error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return res.status(500).json({ error: error.message });
    }

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: created_by,
      rol_plataforma: "founder",
      rango_militar: "fundador",
      status: "activo",
    });

    if (memberError) {
      console.error("[POST /teams] team_members INSERT error:", {
        message: memberError.message,
        code: memberError.code,
        details: memberError.details,
        hint: memberError.hint,
        team_id: team.id,
        user_id: created_by,
      });
    }

    res.status(201).json({ team });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
