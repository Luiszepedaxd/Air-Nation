const express = require("express");
const { router: paymentsRouter } = require("./payments");

const router = express.Router();

router.use("/admin", require("./admin"));
router.use("/owner", require("./owner"));
router.use("/payments", paymentsRouter);
// Público al final: sus rutas viven en la raíz de /arena.
router.use("/", require("./public"));

module.exports = router;
