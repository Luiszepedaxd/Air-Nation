const express = require("express");

const router = express.Router();

router.use("/admin", require("./admin"));
router.use("/owner", require("./owner"));

module.exports = router;
