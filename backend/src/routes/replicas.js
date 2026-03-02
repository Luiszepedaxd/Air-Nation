const express = require("express");
const router = express.Router();

// GET /api/v1/replicas/:serial — buscar réplica por número de serie (tipo REPUVE)
router.get("/:serial", (req, res) => {
  res.json({ replica: null, serial: req.params.serial });
});

// POST /api/v1/replicas — registrar réplica
router.post("/", (req, res) => {
  const { model, serial_number, owner_id, photo_url } = req.body;
  if (!model || !serial_number || !owner_id) {
    return res.status(400).json({ error: "Modelo, número de serie y propietario son requeridos" });
  }
  // TODO: insertar en Supabase
  res.status(201).json({ message: "Réplica registrada", replica: { model, serial_number, owner_id } });
});

// PATCH /api/v1/replicas/:id/transfer — transferir réplica a otro usuario
router.patch("/:id/transfer", (req, res) => {
  const { new_owner_id } = req.body;
  if (!new_owner_id) return res.status(400).json({ error: "new_owner_id requerido" });
  // TODO: actualizar propietario en Supabase + registrar historial
  res.json({ message: "Réplica transferida", replica_id: req.params.id, new_owner_id });
});

// PATCH /api/v1/replicas/:id/report — reportar como robada
router.patch("/:id/report", (req, res) => {
  // TODO: marcar como robada en Supabase
  res.json({ message: "Réplica reportada como robada", replica_id: req.params.id });
});

module.exports = router;
