const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");
const supabase = require("../lib/supabase");
const { loadReplicaAdminStats } = require("../lib/replicaAdminStats");

const router = express.Router();

// GET /api/v1/admin/replicas/stats
// Totales de la tabla arsenal y transferencias. Solo app_role = admin.
router.get("/replicas/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await loadReplicaAdminStats(supabase);
    res.json(stats);
  } catch (err) {
    console.error("[admin/replicas/stats]", err);
    res.status(500).json({ error: "No se pudieron cargar las réplicas registradas" });
  }
});

module.exports = router;
