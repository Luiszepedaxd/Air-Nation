const express = require("express");
const crypto = require("crypto");
const multer = require("multer");
const XLSX = require("xlsx");
const supabase = require("../lib/supabase");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function generateRefereeCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function generateSlug(name) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 50);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base}-${suffix}`;
}

function findExcelColumn(row, candidates) {
  for (const key of Object.keys(row)) {
    const k = key.toLowerCase().trim();
    if (candidates.includes(k)) return row[key];
  }
  return null;
}

async function isAppAdmin(userId) {
  const { data: user } = await supabase
    .from("users")
    .select("app_role")
    .eq("id", userId)
    .maybeSingle();
  return user?.app_role === "admin";
}

function computeExportStats(playerList, actionList) {
  const statsMap = {};
  for (const p of playerList) {
    statsMap[p.id] = {
      Jugador: p.name,
      Equipo: p.team_name || "",
      Kills: 0,
      Deaths: 0,
      "First Kills": 0,
      Objectives: 0,
      "Key Actions": 0,
      "Critical Actions": 0,
      "K/D": 0,
      "Performance Score": 0,
      "Impact Score": 0,
      "Total Score": 0,
    };
  }
  for (const a of actionList) {
    const s = statsMap[a.player_id];
    if (!s) continue;
    if (a.action_type === "kill") s.Kills++;
    else if (a.action_type === "death") s.Deaths++;
    else if (a.action_type === "first_kill") s["First Kills"]++;
    else if (a.action_type === "objective") s.Objectives++;
    else if (a.action_type === "key_action") s["Key Actions"]++;
    else if (a.action_type === "critical_action") s["Critical Actions"]++;
  }
  return Object.values(statsMap)
    .map((s) => {
      s["K/D"] =
        s.Deaths > 0 ? Math.round((s.Kills / s.Deaths) * 100) / 100 : s.Kills;
      s["Performance Score"] =
        s.Kills * 2 +
        s["First Kills"] * 3 +
        (s.Kills > 0 && s.Deaths === 0 ? 1 : 0) * 2 -
        s.Deaths * 1;
      s["Impact Score"] =
        s["Key Actions"] * 5 + s["Critical Actions"] * 10 + s.Objectives * 3;
      s["Total Score"] = s["Performance Score"] + s["Impact Score"];
      return s;
    })
    .sort((a, b) => b["Total Score"] - a["Total Score"]);
}

async function buildTournamentExportBuffer(tournamentId) {
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (!tournament) return null;

  const { data: rounds } = await supabase
    .from("tournament_rounds")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("round_number");

  const { data: players } = await supabase
    .from("tournament_players")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("created_at");

  const roundIds = (rounds || []).map((r) => r.id);
  let allActions = [];
  if (roundIds.length > 0) {
    const { data: acts } = await supabase
      .from("tournament_actions")
      .select("*")
      .in("round_id", roundIds);
    allActions = acts || [];
  }

  const wb = XLSX.utils.book_new();
  const colWidths = [
    { wch: 25 },
    { wch: 20 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ];

  const usedSheetNames = new Set();

  for (const round of (rounds || []).filter((r) => r.status !== "voided")) {
    const roundActions = allActions.filter((a) => a.round_id === round.id);
    const stats = computeExportStats(players || [], roundActions);
    const ws = XLSX.utils.json_to_sheet(stats);
    ws["!cols"] = colWidths;

    let sheetName = (round.name || `Ronda ${round.round_number}`).substring(0, 31);
    if (usedSheetNames.has(sheetName)) {
      sheetName = `${sheetName.substring(0, 28)}_${round.round_number}`;
    }
    usedSheetNames.add(sheetName);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const validRounds = (rounds || []).filter((r) => r.status !== "voided");
  if (validRounds.length > 0) {
    const validRoundIds = new Set(validRounds.map((r) => r.id));
    const validActions = allActions.filter((a) => validRoundIds.has(a.round_id));
    const allStats = computeExportStats(players || [], validActions);
    const summaryData = allStats.map((s, i) => ({
      "#": i + 1,
      ...s,
      Rondas: validRounds.length,
    }));

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary["!cols"] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 20 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 16 },
      { wch: 8 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 8 },
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen General");
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.json_to_sheet([{ Mensaje: "Sin rondas registradas" }]);
    XLSX.utils.book_append_sheet(wb, ws, "Info");
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const safeName = tournament.name
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-_]/g, "")
    .substring(0, 50)
    .trim();

  return { buffer, safeName };
}

function sendTournamentExcel(res, buffer, safeName) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeName}_scoreboard.xlsx"`
  );
  res.send(buffer);
}

// ═══════════════════════════════════════════════════════════
// Rutas estáticas (antes de /:id)
// ═══════════════════════════════════════════════════════════

// GET /public/:slug — Resultados públicos (sin autenticación)
router.get("/public/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("public_slug", slug)
      .eq("public_results", true)
      .maybeSingle();

    if (error || !tournament) {
      return res.status(404).json({ error: "Torneo no encontrado o no publicado" });
    }

    const { data: creator } = await supabase
      .from("users")
      .select("nombre, alias")
      .eq("id", tournament.created_by)
      .maybeSingle();

    const { data: rounds } = await supabase
      .from("tournament_rounds")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("round_number");

    const { data: players } = await supabase
      .from("tournament_players")
      .select("*")
      .eq("tournament_id", tournament.id)
      .order("created_at");

    const validRoundIds = (rounds || []).filter((r) => r.status !== "voided").map((r) => r.id);
    let allActions = [];
    if (validRoundIds.length > 0) {
      const { data: acts } = await supabase
        .from("tournament_actions")
        .select("*")
        .in("round_id", validRoundIds);
      allActions = acts || [];
    }

    const voidedRoundIds = (rounds || []).filter((r) => r.status === "voided").map((r) => r.id);
    let voidedActions = [];
    if (voidedRoundIds.length > 0) {
      const { data: acts } = await supabase
        .from("tournament_actions")
        .select("*")
        .in("round_id", voidedRoundIds);
      voidedActions = acts || [];
    }

    function computeStats(playerList, actionList) {
      const statsMap = {};
      for (const p of playerList) {
        statsMap[p.id] = {
          player_id: p.id,
          name: p.name,
          team_name: p.team_name,
          kills: 0,
          deaths: 0,
          first_kills: 0,
          objectives: 0,
          key_actions: 0,
          critical_actions: 0,
        };
      }
      for (const a of actionList) {
        const s = statsMap[a.player_id];
        if (!s) continue;
        if (a.action_type === "kill") s.kills++;
        else if (a.action_type === "death") s.deaths++;
        else if (a.action_type === "first_kill") s.first_kills++;
        else if (a.action_type === "objective") s.objectives++;
        else if (a.action_type === "key_action") s.key_actions++;
        else if (a.action_type === "critical_action") s.critical_actions++;
      }
      return Object.values(statsMap)
        .map((s) => {
          const kd =
            s.deaths > 0 ? Math.round((s.kills / s.deaths) * 100) / 100 : s.kills;
          const performance =
            s.kills * 2 +
            s.first_kills * 3 +
            (s.kills > 0 && s.deaths === 0 ? 1 : 0) * 2 -
            s.deaths * 1;
          const impact = s.key_actions * 5 + s.critical_actions * 10 + s.objectives * 3;
          return {
            ...s,
            kd,
            performance_score: performance,
            impact_score: impact,
            total_score: performance + impact,
          };
        })
        .sort((a, b) => b.total_score - a.total_score);
    }

    const allActionsIncludingVoided = [...allActions, ...voidedActions];

    const roundScoreboards = (rounds || []).map((r) => {
      const roundActions = allActionsIncludingVoided.filter((a) => a.round_id === r.id);
      return {
        round_id: r.id,
        round_number: r.round_number,
        name: r.name,
        status: r.status,
        voided_reason: r.voided_reason || null,
        scoreboard: computeStats(players || [], roundActions),
      };
    });

    const generalScoreboard = computeStats(players || [], allActions);

    res.json({
      tournament: {
        name: tournament.name,
        game_type: tournament.game_type,
        status: tournament.status,
        finalized_at: tournament.finalized_at,
        created_at: tournament.created_at,
      },
      creator_name: creator?.nombre || creator?.alias || null,
      total_players: (players || []).length,
      total_rounds: (rounds || []).length,
      general_scoreboard: generalScoreboard,
      round_scoreboards: roundScoreboards,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /join — Árbitro se une con código
router.post("/join", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { code, name } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "code es requerido" });
    }

    const { data: referee, error: findErr } = await supabase
      .from("tournament_referees")
      .select("*, tournaments(*)")
      .eq("code", code.trim().toUpperCase())
      .maybeSingle();

    if (findErr || !referee) {
      return res.status(404).json({ error: "Código no encontrado" });
    }
    if (referee.status === "active" && referee.user_id && referee.user_id !== userId) {
      return res.status(409).json({ error: "Este código ya fue usado por otro árbitro" });
    }
    if (referee.user_id === userId) {
      return res.json(referee);
    }

    if (referee.tournaments.created_by === userId) {
      return res.status(400).json({ error: "El creador del torneo no puede unirse como árbitro" });
    }

    const { data: updated, error: updateErr } = await supabase
      .from("tournament_referees")
      .update({
        user_id: userId,
        name: name?.trim() || null,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .eq("id", referee.id)
      .select("*, tournaments(*)")
      .single();

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /mine — Mis torneos (como creador)
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { data, error } = await supabase
      .from("tournaments")
      .select("*, tournament_rounds(count), tournament_players(count), tournament_referees(count)")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /referee/mine — Torneos donde soy árbitro
router.get("/referee/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { data, error } = await supabase
      .from("tournament_referees")
      .select("*, tournaments(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /referee/assignment/:roundId — Mi asignación como árbitro en esta ronda
router.get("/referee/assignment/:roundId", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { roundId } = req.params;

    const { data: round } = await supabase
      .from("tournament_rounds")
      .select("id, tournament_id, status, started_at, duration_seconds")
      .eq("id", roundId)
      .maybeSingle();

    if (!round) {
      return res.status(404).json({ error: "Ronda no encontrada" });
    }

    const { data: referee } = await supabase
      .from("tournament_referees")
      .select("id")
      .eq("tournament_id", round.tournament_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!referee) {
      return res.status(403).json({ error: "No eres árbitro" });
    }

    const { data: assignment } = await supabase
      .from("tournament_assignments")
      .select("*, tournament_players(id, name, team_name)")
      .eq("round_id", roundId)
      .eq("referee_id", referee.id)
      .maybeSingle();

    res.json({ round, referee, assignment: assignment || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ADMIN — requiere app_role: 'admin' en users table
// ═══════════════════════════════════════════════════════════

// GET /admin/all — Todos los torneos del sistema (solo admin)
router.get("/admin/all", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;

    if (!(await isAppAdmin(userId))) {
      return res.status(403).json({ error: "Solo administradores" });
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select(`
        *,
        users!tournaments_created_by_fkey(nombre, alias, email),
        tournament_rounds(count),
        tournament_players(count),
        tournament_referees(count)
      `)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/:id/export — Descargar Excel de cualquier torneo (solo admin)
router.get("/admin/:id/export", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    if (!(await isAppAdmin(userId))) {
      return res.status(403).json({ error: "Solo administradores" });
    }

    const result = await buildTournamentExportBuffer(id);
    if (!result) return res.status(404).json({ error: "Torneo no encontrado" });

    sendTournamentExcel(res, result.buffer, result.safeName);
  } catch (err) {
    console.error("Admin export error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/:id — Detalle completo de cualquier torneo (solo admin)
router.get("/admin/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    if (!(await isAppAdmin(userId))) {
      return res.status(403).json({ error: "Solo administradores" });
    }

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("*, users!tournaments_created_by_fkey(nombre, alias, email)")
      .eq("id", id)
      .single();

    if (error || !tournament) return res.status(404).json({ error: "Torneo no encontrado" });

    const [roundsRes, playersRes, refereesRes] = await Promise.all([
      supabase.from("tournament_rounds").select("*").eq("tournament_id", id).order("round_number"),
      supabase.from("tournament_players").select("*").eq("tournament_id", id).order("created_at"),
      supabase.from("tournament_referees").select("*").eq("tournament_id", id).order("created_at"),
    ]);

    res.json({
      ...tournament,
      rounds: roundsRes.data || [],
      players: playersRes.data || [],
      referees: refereesRes.data || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// TORNEO CRUD
// ═══════════════════════════════════════════════════════════

// POST / — Crear torneo
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { name, game_type, default_round_duration_seconds } = req.body;

    if (!name || !game_type) {
      return res.status(400).json({ error: "name y game_type son requeridos" });
    }
    if (!["speedsoft", "tactical_arena"].includes(game_type)) {
      return res.status(400).json({ error: "game_type inválido" });
    }

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        created_by: userId,
        name: name.trim(),
        game_type,
        default_round_duration_seconds: default_round_duration_seconds || 180,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — Detalle completo del torneo
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    const { data: tournament, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !tournament) {
      return res.status(404).json({ error: "Torneo no encontrado" });
    }

    const isCreator = tournament.created_by === userId;
    if (!isCreator) {
      const { data: ref } = await supabase
        .from("tournament_referees")
        .select("id")
        .eq("tournament_id", id)
        .eq("user_id", userId)
        .maybeSingle();
      if (!ref) {
        return res.status(403).json({ error: "Sin acceso a este torneo" });
      }
    }

    const [roundsRes, playersRes, refereesRes] = await Promise.all([
      supabase.from("tournament_rounds").select("*").eq("tournament_id", id).order("round_number"),
      supabase.from("tournament_players").select("*").eq("tournament_id", id).order("created_at"),
      supabase.from("tournament_referees").select("*").eq("tournament_id", id).order("created_at"),
    ]);

    res.json({
      ...tournament,
      is_creator: isCreator,
      rounds: roundsRes.data || [],
      players: playersRes.data || [],
      referees: refereesRes.data || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id — Eliminar torneo completo
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador puede eliminar el torneo" });
    }

    // Rondas, jugadores, árbitros, asignaciones y acciones caen por ON DELETE CASCADE.
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// JUGADORES
// ═══════════════════════════════════════════════════════════

// POST /:id/players/batch — Agregar múltiples jugadores
router.post("/:id/players/batch", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { players } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador puede agregar jugadores" });
    }

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: "players array requerido" });
    }

    const rows = players
      .filter((p) => p.name && p.name.trim())
      .map((p) => ({
        tournament_id: id,
        name: p.name.trim(),
        team_name: p.team_name?.trim() || null,
      }));

    const { data, error } = await supabase.from("tournament_players").insert(rows).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/players/import — Importar jugadores desde Excel
// Body: multipart/form-data con campo "file" (xlsx)
// El Excel debe tener columnas: NOMBRE (obligatoria), EQUIPO (opcional)
router.post("/:id/players/import", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) return res.status(403).json({ error: "Solo el creador" });

    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const nameCandidates = ["nombre", "name", "jugador", "player", "nombre del jugador"];
    const teamCandidates = ["equipo", "team", "team_name", "nombre del equipo"];

    const rows = rawRows
      .map((r) => ({
        tournament_id: id,
        name: (findExcelColumn(r, nameCandidates) || "").toString().trim(),
        team_name: (findExcelColumn(r, teamCandidates) || "").toString().trim() || null,
      }))
      .filter((r) => r.name.length > 0 && r.name.length <= 80);

    if (rows.length === 0) {
      return res.status(400).json({
        error:
          "No se encontraron jugadores válidos en el archivo. Verifica que la primera columna se llame NOMBRE.",
      });
    }

    const { data, error } = await supabase.from("tournament_players").insert(rows).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ imported: data.length, players: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/players — Agregar jugador
router.post("/:id/players", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { name, team_name } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador puede agregar jugadores" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name es requerido" });
    }

    const { data, error } = await supabase
      .from("tournament_players")
      .insert({
        tournament_id: id,
        name: name.trim(),
        team_name: team_name?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id/players/:playerId — Quitar jugador
router.delete("/:id/players/:playerId", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, playerId } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const { error } = await supabase
      .from("tournament_players")
      .delete()
      .eq("id", playerId)
      .eq("tournament_id", id);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ÁRBITROS
// ═══════════════════════════════════════════════════════════

// POST /:id/referees/generate — Generar códigos de árbitro (con nombres opcionales)
// Body: { count: number, names?: string[] }
// Si names viene, count se ignora y se usa names.length
router.post("/:id/referees/generate", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { count, names } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) return res.status(403).json({ error: "Solo el creador" });

    let rows = [];
    if (Array.isArray(names) && names.length > 0) {
      rows = names
        .filter((n) => typeof n === "string" && n.trim())
        .slice(0, 50)
        .map((n) => ({
          tournament_id: id,
          code: generateRefereeCode(),
          name: n.trim(),
        }));
    } else {
      const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), 50);
      for (let i = 0; i < n; i++) {
        rows.push({ tournament_id: id, code: generateRefereeCode() });
      }
    }

    if (rows.length === 0) return res.status(400).json({ error: "No hay datos válidos" });

    const { data, error } = await supabase.from("tournament_referees").insert(rows).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/referees/import — Importar árbitros desde Excel (genera código por cada uno)
router.post("/:id/referees/import", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) return res.status(403).json({ error: "Solo el creador" });

    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const nameCandidates = [
      "nombre",
      "name",
      "arbitro",
      "árbitro",
      "referee",
      "nombre del árbitro",
      "nombre del arbitro",
    ];

    const rows = rawRows
      .map((r) => {
        const name = (findExcelColumn(r, nameCandidates) || "").toString().trim();
        return name ? { tournament_id: id, code: generateRefereeCode(), name } : null;
      })
      .filter(Boolean)
      .slice(0, 50);

    if (rows.length === 0) {
      return res.status(400).json({
        error:
          "No se encontraron árbitros válidos. Verifica que la columna se llame NOMBRE DEL ÁRBITRO.",
      });
    }

    const { data, error } = await supabase.from("tournament_referees").insert(rows).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ imported: data.length, referees: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// RONDAS
// ═══════════════════════════════════════════════════════════

// POST /:id/rounds — Crear ronda
router.post("/:id/rounds", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { name, duration_seconds } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id, default_round_duration_seconds")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const { data: rounds } = await supabase
      .from("tournament_rounds")
      .select("round_number")
      .eq("tournament_id", id)
      .order("round_number", { ascending: false })
      .limit(1);

    const nextNumber = (rounds && rounds.length > 0 ? rounds[0].round_number : 0) + 1;

    const { data, error } = await supabase
      .from("tournament_rounds")
      .insert({
        tournament_id: id,
        round_number: nextNumber,
        name: name?.trim() || `Ronda ${nextNumber}`,
        duration_seconds: duration_seconds || t.default_round_duration_seconds,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/rounds/:roundId/assign — Asignar árbitro a jugador
router.post("/:id/rounds/:roundId/assign", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;
    const { referee_id, player_id } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const { data, error } = await supabase
      .from("tournament_assignments")
      .insert({ round_id: roundId, referee_id, player_id })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Árbitro o jugador ya asignado en esta ronda" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /:id/rounds/:roundId/assign/batch — Asignar múltiples árbitro↔jugador
// Body: { pairs: [{ referee_id, player_id }] }
router.post("/:id/rounds/:roundId/assign/batch", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;
    const { pairs } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) return res.status(403).json({ error: "Solo el creador" });

    if (!Array.isArray(pairs) || pairs.length === 0) {
      return res.status(400).json({ error: "pairs array requerido" });
    }

    const rows = pairs
      .filter((p) => p.referee_id && p.player_id)
      .map((p) => ({
        round_id: roundId,
        referee_id: p.referee_id,
        player_id: p.player_id,
      }));

    if (rows.length === 0) return res.status(400).json({ error: "No hay pares válidos" });

    const { data, error } = await supabase
      .from("tournament_assignments")
      .insert(rows)
      .select();

    if (error) {
      if (error.code === "23505") {
        return res
          .status(409)
          .json({ error: "Uno o más árbitros/jugadores ya están asignados en esta ronda" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id/rounds/:roundId/assign/:assignmentId — Quitar asignación
router.delete("/:id/rounds/:roundId/assign/:assignmentId", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, assignmentId } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const { error } = await supabase.from("tournament_assignments").delete().eq("id", assignmentId);
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/rounds/:roundId/start — Iniciar ronda
router.patch("/:id/rounds/:roundId/start", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const { data: assignments } = await supabase
      .from("tournament_assignments")
      .select("id")
      .eq("round_id", roundId);
    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ error: "No hay asignaciones en esta ronda" });
    }

    const { data, error } = await supabase
      .from("tournament_rounds")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", roundId)
      .eq("status", "setup")
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    await supabase.from("tournaments").update({ status: "active" }).eq("id", id).eq("status", "setup");

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/rounds/:roundId/end — Terminar ronda manualmente
router.patch("/:id/rounds/:roundId/end", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const { data: unconfirmed } = await supabase
      .from("tournament_assignments")
      .select("id")
      .eq("round_id", roundId)
      .is("sync_confirmed_at", null);

    if (unconfirmed && unconfirmed.length > 0) {
      return res.status(400).json({
        error: `${unconfirmed.length} árbitro(s) no han confirmado sincronización`,
        unconfirmed_count: unconfirmed.length,
      });
    }

    const { data, error } = await supabase
      .from("tournament_rounds")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", roundId)
      .eq("status", "active")
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/rounds/:roundId/void — Anular ronda (invalida resultados)
router.patch("/:id/rounds/:roundId/void", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;
    const { reason } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) return res.status(403).json({ error: "Solo el creador puede anular rondas" });

    if (!reason || !reason.trim()) return res.status(400).json({ error: "Motivo de anulación requerido" });

    const { data: round } = await supabase
      .from("tournament_rounds")
      .select("id, status")
      .eq("id", roundId)
      .eq("tournament_id", id)
      .maybeSingle();

    if (!round) return res.status(404).json({ error: "Ronda no encontrada" });
    if (round.status === "voided") return res.status(400).json({ error: "Esta ronda ya fue anulada" });

    const updatePayload = {
      status: "voided",
      voided_reason: reason.trim(),
      voided_at: new Date().toISOString(),
    };
    if (round.status === "active") {
      updatePayload.ended_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("tournament_rounds")
      .update(updatePayload)
      .eq("id", roundId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/finalize — Finalizar torneo
router.patch("/:id/finalize", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { publish } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id, name, status")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();

    if (!t) return res.status(403).json({ error: "Solo el creador puede finalizar" });
    if (t.status === "finalized") {
      return res.status(400).json({ error: "El torneo ya está finalizado" });
    }

    const { data: activeRounds } = await supabase
      .from("tournament_rounds")
      .select("id")
      .eq("tournament_id", id)
      .eq("status", "active");

    if (activeRounds && activeRounds.length > 0) {
      return res.status(400).json({
        error: "No puedes finalizar con rondas activas. Termina o anula las rondas pendientes.",
      });
    }

    const updateData = {
      status: "finalized",
      finalized_at: new Date().toISOString(),
      public_results: !!publish,
    };

    if (publish) {
      updateData.public_slug = generateSlug(t.name);
    }

    const { data, error } = await supabase
      .from("tournaments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Si publica, crear post en el feed
    if (publish && data.public_slug) {
      try {
        const { data: rounds } = await supabase
          .from("tournament_rounds")
          .select("id")
          .eq("tournament_id", id)
          .neq("status", "voided");

        const roundIdsForPost = (rounds || []).map((r) => r.id);
        let postActions = [];
        if (roundIdsForPost.length > 0) {
          const { data: acts } = await supabase
            .from("tournament_actions")
            .select("*")
            .in("round_id", roundIdsForPost);
          postActions = acts || [];
        }

        const { data: players } = await supabase
          .from("tournament_players")
          .select("*")
          .eq("tournament_id", id);

        const statsMap = {};
        for (const p of players || []) {
          statsMap[p.id] = {
            name: p.name,
            team_name: p.team_name,
            kills: 0,
            deaths: 0,
            first_kills: 0,
            objectives: 0,
            key_actions: 0,
            critical_actions: 0,
          };
        }
        for (const a of postActions) {
          const s = statsMap[a.player_id];
          if (!s) continue;
          if (a.action_type === "kill") s.kills++;
          else if (a.action_type === "death") s.deaths++;
          else if (a.action_type === "first_kill") s.first_kills++;
          else if (a.action_type === "objective") s.objectives++;
          else if (a.action_type === "key_action") s.key_actions++;
          else if (a.action_type === "critical_action") s.critical_actions++;
        }
        const sorted = Object.values(statsMap)
          .map((s) => {
            const perf =
              s.kills * 2 +
              s.first_kills * 3 +
              (s.kills > 0 && s.deaths === 0 ? 1 : 0) * 2 -
              s.deaths * 1;
            const impact = s.key_actions * 5 + s.critical_actions * 10 + s.objectives * 3;
            return { ...s, total: perf + impact };
          })
          .sort((a, b) => b.total - a.total);

        const top3 = sorted.slice(0, 3);
        const gameLabel = t.name;

        let content = `Resultados oficiales del torneo "${gameLabel}"\n\n`;
        if (top3.length >= 1) {
          content += `1. ${top3[0].name}${top3[0].team_name ? ` (${top3[0].team_name})` : ""} — ${top3[0].total} pts\n`;
        }
        if (top3.length >= 2) {
          content += `2. ${top3[1].name}${top3[1].team_name ? ` (${top3[1].team_name})` : ""} — ${top3[1].total} pts\n`;
        }
        if (top3.length >= 3) {
          content += `3. ${top3[2].name}${top3[2].team_name ? ` (${top3[2].team_name})` : ""} — ${top3[2].total} pts\n`;
        }
        content += `\n${(players || []).length} jugadores · ${(rounds || []).length} rondas\n`;
        content += `\nResultados completos: ${process.env.FRONTEND_URL || "https://www.airnation.online"}/torneos/${data.public_slug}`;

        await supabase.from("player_posts").insert({
          user_id: userId,
          content,
          fotos_urls: [],
          published: true,
        });
      } catch (postErr) {
        console.error("Error creating feed post:", postErr);
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/publish — Toggle publicar/despublicar resultados
router.patch("/:id/publish", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { publish } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id, name, status, created_by, public_slug")
      .eq("id", id)
      .maybeSingle();

    if (!t) return res.status(404).json({ error: "Torneo no encontrado" });

    const isCreator = t.created_by === userId;
    const { data: adminUser } = await supabase
      .from("users")
      .select("app_role")
      .eq("id", userId)
      .maybeSingle();
    const isAdmin = adminUser?.app_role === "admin";

    if (!isCreator && !isAdmin) return res.status(403).json({ error: "Sin permiso" });

    const updateData = { public_results: !!publish };

    if (publish && !t.public_slug) {
      updateData.public_slug = generateSlug(t.name);
    }

    const { data, error } = await supabase
      .from("tournaments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:id/rounds/:roundId/confirm-sync — Árbitro confirma sync completo
router.patch("/:id/rounds/:roundId/confirm-sync", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;

    const { data: referee } = await supabase
      .from("tournament_referees")
      .select("id")
      .eq("tournament_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!referee) return res.status(403).json({ error: "No eres árbitro de este torneo" });

    const { data: assignment } = await supabase
      .from("tournament_assignments")
      .select("id, sync_confirmed_at")
      .eq("round_id", roundId)
      .eq("referee_id", referee.id)
      .maybeSingle();

    if (!assignment) return res.status(404).json({ error: "No tienes asignación en esta ronda" });

    if (assignment.sync_confirmed_at) {
      return res.json({ already_confirmed: true, sync_confirmed_at: assignment.sync_confirmed_at });
    }

    const { data, error } = await supabase
      .from("tournament_assignments")
      .update({ sync_confirmed_at: new Date().toISOString() })
      .eq("id", assignment.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/rounds/:roundId/sync-status — Estado de sync de todos los árbitros
router.get("/:id/rounds/:roundId/sync-status", requireAuth, async (req, res) => {
  try {
    const { roundId } = req.params;

    const { data: assignments, error } = await supabase
      .from("tournament_assignments")
      .select(
        "id, sync_confirmed_at, tournament_referees(id, name, code, user_id), tournament_players(id, name, team_name)"
      )
      .eq("round_id", roundId);

    if (error) return res.status(500).json({ error: error.message });

    const result = await Promise.all(
      (assignments || []).map(async (a) => {
        const ref = Array.isArray(a.tournament_referees)
          ? a.tournament_referees[0]
          : a.tournament_referees;
        const player = Array.isArray(a.tournament_players)
          ? a.tournament_players[0]
          : a.tournament_players;

        const { data: lastAction } = await supabase
          .from("tournament_actions")
          .select("synced_at")
          .eq("assignment_id", a.id)
          .order("synced_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: totalActions } = await supabase
          .from("tournament_actions")
          .select("id", { count: "exact", head: true })
          .eq("assignment_id", a.id);

        return {
          assignment_id: a.id,
          referee_name: ref?.name || ref?.code || "?",
          referee_code: ref?.code,
          player_name: player?.name || "?",
          player_team: player?.team_name,
          sync_confirmed: !!a.sync_confirmed_at,
          sync_confirmed_at: a.sync_confirmed_at,
          last_sync: lastAction?.synced_at || null,
          total_actions: totalActions ?? 0,
        };
      })
    );

    const allConfirmed = result.length > 0 && result.every((r) => r.sync_confirmed);

    res.json({ assignments: result, all_confirmed: allConfirmed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// ACCIONES
// ═══════════════════════════════════════════════════════════

// POST /:id/rounds/:roundId/actions — Batch sync de acciones
router.post("/:id/rounds/:roundId/actions", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id, roundId } = req.params;
    const { actions } = req.body;

    if (!Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: "actions array requerido" });
    }

    const { data: round } = await supabase
      .from("tournament_rounds")
      .select("id, status, started_at, duration_seconds, tournament_id")
      .eq("id", roundId)
      .eq("tournament_id", id)
      .maybeSingle();

    if (!round) {
      return res.status(404).json({ error: "Ronda no encontrada" });
    }

    const { data: refereeRecord } = await supabase
      .from("tournament_referees")
      .select("id")
      .eq("tournament_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!refereeRecord) {
      return res.status(403).json({ error: "No eres árbitro de este torneo" });
    }

    const { data: assignment } = await supabase
      .from("tournament_assignments")
      .select("id, player_id")
      .eq("round_id", roundId)
      .eq("referee_id", refereeRecord.id)
      .maybeSingle();

    if (!assignment) {
      return res.status(403).json({ error: "No tienes asignación en esta ronda" });
    }

    let deadline = null;
    if (round.started_at) {
      deadline = new Date(new Date(round.started_at).getTime() + round.duration_seconds * 1000);
    }

    const validTypes = ["kill", "death", "first_kill", "objective", "key_action", "critical_action"];
    const now = new Date().toISOString();

    const hasFirstKillIncoming = actions.some((a) => a.action_type === "first_kill");
    let firstKillAlreadyExists = false;

    if (hasFirstKillIncoming) {
      const { data: existingFK } = await supabase
        .from("tournament_actions")
        .select("id")
        .eq("round_id", roundId)
        .eq("action_type", "first_kill")
        .limit(1);

      firstKillAlreadyExists = existingFK && existingFK.length > 0;
    }

    let firstKillSlotUsed = firstKillAlreadyExists;

    const rows = actions
      .filter((a) => validTypes.includes(a.action_type) && a.client_event_id && a.recorded_at)
      .filter((a) => {
        if (deadline && new Date(a.recorded_at) > deadline) return false;
        if (a.action_type === "first_kill") {
          if (firstKillSlotUsed) return false;
          firstKillSlotUsed = true;
        }
        return true;
      })
      .map((a) => ({
        round_id: roundId,
        assignment_id: assignment.id,
        referee_id: refereeRecord.id,
        player_id: assignment.player_id,
        action_type: a.action_type,
        recorded_at: a.recorded_at,
        synced_at: now,
        client_event_id: a.client_event_id,
      }));

    if (rows.length === 0) {
      return res.json({ inserted: 0, skipped: actions.length });
    }

    const { data, error } = await supabase
      .from("tournament_actions")
      .upsert(rows, { onConflict: "client_event_id", ignoreDuplicates: true })
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ inserted: data?.length || 0, skipped: actions.length - (data?.length || 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/rounds/:roundId/first-kill — ¿Ya existe first kill en esta ronda?
router.get("/:id/rounds/:roundId/first-kill", requireAuth, async (req, res) => {
  try {
    const { roundId } = req.params;

    const { data, error } = await supabase
      .from("tournament_actions")
      .select("id, player_id, tournament_players(name, team_name)")
      .eq("round_id", roundId)
      .eq("action_type", "first_kill")
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    res.json({
      exists: !!data,
      player_name: data?.tournament_players?.name || null,
      team_name: data?.tournament_players?.team_name || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/rounds/:roundId/scoreboard — Scoreboard de la ronda
router.get("/:id/rounds/:roundId/scoreboard", requireAuth, async (req, res) => {
  try {
    const { id, roundId } = req.params;

    const { data: actions, error } = await supabase
      .from("tournament_actions")
      .select("player_id, action_type")
      .eq("round_id", roundId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: players } = await supabase
      .from("tournament_players")
      .select("id, name, team_name")
      .eq("tournament_id", id);

    const statsMap = {};
    for (const p of players || []) {
      statsMap[p.id] = {
        player_id: p.id,
        name: p.name,
        team_name: p.team_name,
        kills: 0,
        deaths: 0,
        first_kills: 0,
        objectives: 0,
        key_actions: 0,
        critical_actions: 0,
      };
    }

    for (const a of actions || []) {
      const s = statsMap[a.player_id];
      if (!s) continue;
      if (a.action_type === "kill") s.kills++;
      else if (a.action_type === "death") s.deaths++;
      else if (a.action_type === "first_kill") s.first_kills++;
      else if (a.action_type === "objective") s.objectives++;
      else if (a.action_type === "key_action") s.key_actions++;
      else if (a.action_type === "critical_action") s.critical_actions++;
    }

    const scoreboard = Object.values(statsMap).map((s) => {
      const performance =
        s.kills * 2 +
        s.first_kills * 3 +
        (s.kills > 0 && s.deaths === 0 ? 1 : 0) * 2 -
        s.deaths * 1;
      const impact = s.key_actions * 5 + s.critical_actions * 10 + s.objectives * 3;
      return {
        ...s,
        performance_score: performance,
        impact_score: impact,
        total_score: performance + impact,
      };
    });

    scoreboard.sort((a, b) => b.total_score - a.total_score);

    const { data: round } = await supabase.from("tournament_rounds").select("*").eq("id", roundId).single();

    res.json({ round, scoreboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/export — Descargar Excel con todas las rondas y resumen
router.get("/:id/export", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;

    const { data: tournament } = await supabase
      .from("tournaments")
      .select("created_by")
      .eq("id", id)
      .single();

    if (!tournament) return res.status(404).json({ error: "Torneo no encontrado" });
    if (tournament.created_by !== userId) {
      return res.status(403).json({ error: "Solo el creador puede exportar" });
    }

    const result = await buildTournamentExportBuffer(id);
    if (!result) return res.status(404).json({ error: "Torneo no encontrado" });

    sendTournamentExcel(res, result.buffer, result.safeName);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /:id/rounds/:roundId/assignments — Asignaciones con detalle
router.get("/:id/rounds/:roundId/assignments", requireAuth, async (req, res) => {
  try {
    const { roundId } = req.params;
    const { data, error } = await supabase
      .from("tournament_assignments")
      .select(
        "*, tournament_referees(id, name, code, status, user_id), tournament_players(id, name, team_name)"
      )
      .eq("round_id", roundId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
