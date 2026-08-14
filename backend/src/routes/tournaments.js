const express = require("express");
const crypto = require("crypto");
const supabase = require("../lib/supabase");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

function generateRefereeCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// ═══════════════════════════════════════════════════════════
// Rutas estáticas (antes de /:id)
// ═══════════════════════════════════════════════════════════

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

// POST /:id/referees/generate — Generar N códigos de árbitro
router.post("/:id/referees/generate", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;
    const { id } = req.params;
    const { count } = req.body;

    const { data: t } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", id)
      .eq("created_by", userId)
      .maybeSingle();
    if (!t) {
      return res.status(403).json({ error: "Solo el creador" });
    }

    const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), 50);
    const rows = [];
    for (let i = 0; i < n; i++) {
      rows.push({ tournament_id: id, code: generateRefereeCode() });
    }

    const { data, error } = await supabase.from("tournament_referees").insert(rows).select();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
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

    const rows = actions
      .filter((a) => validTypes.includes(a.action_type) && a.client_event_id && a.recorded_at)
      .filter((a) => {
        if (deadline && new Date(a.recorded_at) > deadline) return false;
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
