const express = require("express");
const supabase = require("../lib/supabase");

const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PUBLIC_SELECT =
  "id, nombre, sistema, mecanismo, serial, foto_url, verificada, ciudad, estado, user_id, created_at";

async function loadReplicaById(id) {
  const { data, error } = await supabase
    .from("arsenal")
    .select("id, user_id, serial, nombre")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// GET /api/v1/replicas/:serial — buscar por número de serie
router.get("/:serial", async (req, res) => {
  try {
    const serial = String(req.params.serial || "").trim();
    if (!serial) {
      return res.status(400).json({ error: "Número de serie requerido" });
    }

    const { data, error } = await supabase
      .from("arsenal")
      .select(PUBLIC_SELECT)
      .eq("serial", serial)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (!data) {
      return res.status(404).json({ error: "Réplica no encontrada", serial });
    }

    return res.json({ replica: data, serial });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/replicas — registrar réplica (propietario = sesión)
router.post("/", async (req, res) => {
  try {
    const owner_id = req.authUser.id;
    const { model, serial_number, photo_url } = req.body || {};
    const nombre = typeof model === "string" ? model.trim() : "";
    const serial =
      typeof serial_number === "string" ? serial_number.trim() : "";

    if (!nombre || !serial) {
      return res.status(400).json({
        error: "Modelo y número de serie son requeridos",
      });
    }

    const { data, error } = await supabase
      .from("arsenal")
      .insert({
        user_id: owner_id,
        nombre,
        serial,
        foto_url: typeof photo_url === "string" ? photo_url.trim() : null,
        verificada: true,
      })
      .select(PUBLIC_SELECT)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ message: "Réplica registrada", replica: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/replicas/:id/transfer
router.patch("/:id/transfer", async (req, res) => {
  try {
    const replicaId = req.params.id;
    const { new_owner_id } = req.body || {};
    if (!UUID_RE.test(String(replicaId))) {
      return res.status(400).json({ error: "id de réplica inválido" });
    }
    if (!new_owner_id || !UUID_RE.test(String(new_owner_id))) {
      return res.status(400).json({ error: "new_owner_id requerido" });
    }

    const replica = await loadReplicaById(replicaId);
    if (!replica) {
      return res.status(404).json({ error: "Réplica no encontrada" });
    }
    if (replica.user_id !== req.authUser.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { data: newOwner, error: ownerErr } = await supabase
      .from("users")
      .select("id")
      .eq("id", new_owner_id)
      .maybeSingle();
    if (ownerErr) {
      return res.status(500).json({ error: ownerErr.message });
    }
    if (!newOwner) {
      return res.status(404).json({ error: "Nuevo propietario no encontrado" });
    }

    const { error: updateErr } = await supabase
      .from("arsenal")
      .update({ user_id: new_owner_id })
      .eq("id", replicaId);
    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    return res.json({
      message: "Réplica transferida",
      replica_id: replicaId,
      new_owner_id,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/v1/replicas/:id/report — marcar como robada (solo el dueño)
router.patch("/:id/report", async (req, res) => {
  try {
    const replicaId = req.params.id;
    if (!UUID_RE.test(String(replicaId))) {
      return res.status(400).json({ error: "id de réplica inválido" });
    }

    const replica = await loadReplicaById(replicaId);
    if (!replica) {
      return res.status(404).json({ error: "Réplica no encontrada" });
    }
    if (replica.user_id !== req.authUser.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { error: reportErr } = await supabase.from("user_reports").insert({
      reporter_id: req.authUser.id,
      target_type: "user",
      target_id: replica.user_id,
      reason: "other",
      details: `Réplica reportada como robada (arsenal_id=${replicaId})`,
    });
    if (reportErr) {
      return res.status(500).json({ error: reportErr.message });
    }

    return res.json({
      message: "Réplica reportada como robada",
      replica_id: replicaId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
