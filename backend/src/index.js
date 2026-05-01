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
const feedbackRouter = require("./routes/feedback");
const accountRouter = require("./routes/account");
const adminMailRouter = require("./routes/admin-mail");
const pushRouter = require("./routes/push");
const stripeRouter = require("./routes/stripe");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Subidas multipart: montar ANTES de express.json (límite por defecto ~100kb) para no
// interferir con cuerpos grandes en /upload/video. Ver también BODY_PARSER_LIMIT.
app.use("/api/v1/upload", uploadRouter);

// Stripe webhook necesita raw body para verificar firma. DEBE ir antes de express.json().
app.post(
  "/api/v1/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    // Delegar al handler dentro del router de stripe
    req.url = "/webhook";
    stripeRouter.handle(req, res, next);
  }
);

// Por defecto 100mb (Railway: puedes fijar BODY_PARSER_LIMIT=100mb en variables)
const bodyParserLimit = process.env.BODY_PARSER_LIMIT || "100mb";
app.use(express.json({ limit: bodyParserLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyParserLimit }));

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
app.use("/api/v1/assets", assetsRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/api/v1/account", accountRouter);
app.use("/api/v1/admin", adminMailRouter);
app.use("/api/v1/push", pushRouter);
app.use("/api/v1/stripe", stripeRouter);

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
