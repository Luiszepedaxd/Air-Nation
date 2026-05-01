const express = require("express");

const router = express.Router();

router.post("/delete-request", async (req, res) => {
  try {
    const body = req.body || {};
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    const reasonRaw =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (!emailRaw || emailRaw.length > 254) {
      return res.status(400).json({ error: "Email inválido" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRaw)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    const safeReason = reasonRaw
      .slice(0, 500)
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const safeEmail = emailRaw.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[account/delete-request] RESEND_API_KEY no configurada");
      return res.status(500).json({ error: "Servicio no disponible" });
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);

    const timestamp = new Date().toISOString();
    const html = `
<h2>Solicitud de eliminación de cuenta</h2>
<p><strong>Email solicitante:</strong> ${safeEmail}</p>
<p><strong>Motivo:</strong></p>
<p>${safeReason ? safeReason.replace(/\n/g, "<br/>") : "(no especificado)"}</p>
<p><strong>Fecha:</strong> ${timestamp}</p>
<hr/>
<p>Procesa esta solicitud en un plazo máximo de 30 días naturales (LFPDPPP).</p>
`.trim();

    const { error: sendErr } = await resend.emails.send({
      from: "AirNation <info@airnation.online>",
      to: "info@airnation.online",
      subject: `[AirNation] Solicitud eliminación de cuenta — ${safeEmail}`,
      html,
    });

    if (sendErr) {
      console.error("[account/delete-request]", sendErr);
      return res.status(500).json({ error: "Error al enviar" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[account/delete-request]", err);
    res.status(500).json({ error: "Error inesperado" });
  }
});

module.exports = router;
