const express = require("express");
const { requireAdmin } = require("../middleware/requireAdmin");

const router = express.Router();

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

router.post("/send-onboarding-reminder", requireAdmin, async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: "users requerido" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY no configurada" });
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM_EMAIL || "AirNation <info@airnation.online>";

    const results = [];
    for (const user of users) {
      if (!user.email) continue;
      const { error } = await resend.emails.send({
        from,
        to: user.email,
        subject: "Completa tu perfil en AirNation",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;">
            <div style="margin-bottom:24px;">
              <span style="font-family:Arial,sans-serif;font-weight:900;font-size:20px;letter-spacing:3px;text-transform:uppercase;color:#111111;">
                AIR<span style="color:#CC4B37;">NATION</span>
              </span>
            </div>
            <h1 style="font-family:Arial,sans-serif;font-weight:800;font-size:22px;text-transform:uppercase;color:#111111;margin:0 0 16px;">
              Completa tu perfil
            </h1>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:#444444;line-height:1.6;margin:0 0 24px;">
              Te registraste en AirNation pero aún no completaste tu perfil.
              Sin perfil completo no puedes acceder a tu credencial digital
              ni aparecer en el directorio de jugadores.
            </p>
            <a href="https://airnation.online/onboarding"
               style="display:inline-block;background:#CC4B37;color:#ffffff;font-family:Arial,sans-serif;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;text-decoration:none;">
              COMPLETAR MI PERFIL
            </a>
            <p style="font-family:Arial,sans-serif;font-size:13px;color:#999999;margin:32px 0 0;line-height:1.5;">
              AirNation — La plataforma del airsoft en México<br/>
              <a href="https://airnation.online" style="color:#CC4B37;">airnation.online</a>
            </p>
          </div>
        `,
      });
      results.push({ email: user.email, ok: !error, error: error?.message });
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    res.json({ sent, failed, results });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error inesperado" });
  }
});

// POST /api/v1/admin/send-mailing
// Body: { asunto, html, users: [{ email, alias, nombre }] }
// Reemplaza {{alias}} y {{nombre}} en el HTML por los valores de cada user.
router.post("/send-mailing", requireAdmin, async (req, res) => {
  try {
    const { asunto, html, users } = req.body;

    if (!asunto || typeof asunto !== "string" || !asunto.trim()) {
      return res.status(400).json({ error: "asunto requerido" });
    }
    if (!html || typeof html !== "string" || !html.trim()) {
      return res.status(400).json({ error: "html requerido" });
    }
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ error: "users requerido (array no vacío)" });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RESEND_API_KEY no configurada" });
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);
    const from =
      process.env.RESEND_FROM_EMAIL || "AirNation <info@airnation.online>";

    const results = [];
    for (const user of users) {
      if (!user || !user.email) {
        results.push({ email: null, ok: false, error: "email faltante" });
        continue;
      }

      const personalHtml = html
        .replaceAll("{{alias}}", escapeHtml(user.alias || ""))
        .replaceAll("{{nombre}}", escapeHtml(user.nombre || ""));

      const personalAsunto = asunto
        .replaceAll("{{alias}}", user.alias || "")
        .replaceAll("{{nombre}}", user.nombre || "");

      const { error } = await resend.emails.send({
        from,
        to: user.email,
        subject: personalAsunto,
        html: personalHtml,
      });
      results.push({ email: user.email, ok: !error, error: error?.message });
    }

    const sent = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    res.json({ sent, failed, results });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error inesperado" });
  }
});

module.exports = router;
