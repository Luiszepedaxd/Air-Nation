const express = require("express");

const router = express.Router();

const ALLOWED_CATEGORIAS = new Set([
  "General",
  "Bug o error",
  "Sugerencia de función",
  "Diseño",
  "Otro",
]);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * POST /api/v1/feedback
 * Body: { categoria, mensaje, email?, user_id? }
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const mensajeRaw =
      typeof body.mensaje === "string" ? body.mensaje.trim() : "";
    if (!mensajeRaw) {
      return res
        .status(400)
        .json({ success: false, error: "El mensaje es obligatorio" });
    }
    if (mensajeRaw.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "El mensaje no puede superar 1000 caracteres",
      });
    }

    let categoria =
      typeof body.categoria === "string" ? body.categoria.trim() : "General";
    if (!ALLOWED_CATEGORIAS.has(categoria)) {
      categoria = "General";
    }

    const emailRaw =
      body.email === null || body.email === undefined
        ? ""
        : String(body.email).trim();
    const emailDisplay =
      emailRaw.length > 0 ? emailRaw : "No proporcionado";

    const userIdRaw =
      body.user_id === null || body.user_id === undefined
        ? ""
        : String(body.user_id).trim();
    const userIdDisplay =
      userIdRaw.length > 0 ? userIdRaw : "No logueado";

    const timestamp = new Date().toISOString();

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("[feedback] RESEND_API_KEY no configurada");
      return res.json({
        success: false,
        error: "No se pudo enviar el feedback en este momento",
      });
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);

    const safeMensaje = escapeHtml(mensajeRaw);
    const safeCat = escapeHtml(categoria);
    const safeEmail = escapeHtml(emailDisplay);
    const safeUid = escapeHtml(userIdDisplay);

    const html = `
<h2>Nuevo feedback de AirNation Alpha</h2>
<p><strong>Categoría:</strong> ${safeCat}</p>
<p><strong>Mensaje:</strong></p>
<p>${safeMensaje.replace(/\n/g, "<br/>")}</p>
<p><strong>Email:</strong> ${safeEmail}</p>
<p><strong>User ID:</strong> ${safeUid}</p>
<p><strong>Fecha:</strong> ${escapeHtml(timestamp)}</p>
`.trim();

    const { error: sendErr } = await resend.emails.send({
      from: "AirNation <info@airnation.online>",
      to: "info@airnation.online",
      subject: `[AirNation Feedback] [${categoria}]`,
      html,
    });

    if (sendErr) {
      console.error("[feedback] Resend error:", sendErr);
      return res.json({
        success: false,
        error: sendErr.message || "Error al enviar el email",
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[feedback]", err);
    res.json({
      success: false,
      error: err.message || "Error inesperado",
    });
  }
});

module.exports = router;
