require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const teamsRouter = require("./routes/teams");
const usersRouter = require("./routes/users");
const replicasRouter = require("./routes/replicas");
const docsRouter = require("./routes/docs");
const uploadRouter = require("./routes/upload");
const assetsRouter = require("./routes/assets");
const generateImageRouter = require("./routes/generate-image");
const imageModelsRouter = require("./routes/image-models");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// ─── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "AirNation API", version: "0.1.0" });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
// All routes prefixed with /api/v1 for future versioning (mobile clients need this)
app.use("/api/v1/teams", teamsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/replicas", replicasRouter);
app.use("/api/v1/docs", docsRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/assets", assetsRouter);
app.use("/api/v1/generate-image", generateImageRouter);
app.use("/api/v1/image-models", imageModelsRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`AirNation API corriendo en http://localhost:${PORT}`);
});
