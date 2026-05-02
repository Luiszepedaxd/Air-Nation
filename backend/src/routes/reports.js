const express = require("express");
const router = express.Router();
const supabase = require("../lib/supabase");

const ALLOWED_TARGET_TYPES = new Set(["post", "comment", "user"]);
const ALLOWED_REASONS = new Set([
  "spam",
  "inappropriate",
  "harassment",
  "other",
]);

const REASON_LABELS = {
  spam: "Spam",
  inappropriate: "Contenido inapropiado",
  harassment: "Acoso",
  other: "Otro",
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * POST /api/v1/reports
 * Body: { reporter_id, target_type, target_id, reason, details? }
 * Guarda el reporte en Supabase y notifica por email al equipo.
 */
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    const reporterId =
      typeof body.reporter_id === "string" ? body.reporter_id.trim() : "";
    const targetType =
      typeof body.target_type === "string" ? body.target_type.trim() : "";
    const targetId =
      typeof body.target_id === "string" ? body.target_id.trim() : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";
    const detailsRaw =
      typeof body.details === "string" ? body.details.trim() : "";

    if (!reporterId || !UUID_RE.test(reporterId)) {
      return res.status(400).json({ error: "reporter_id inválido" });
    }
    if (!ALLOWED_TARGET_TYPES.has(targetType)) {
      return res.status(400).json({ error: "target_type inválido" });
    }
    if (!targetId) {
      return res.status(400).json({ error: "target_id requerido" });
    }
    if (!ALLOWED_REASONS.has(reason)) {
      return res.status(400).json({ error: "reason inválido" });
    }

    const details = detailsRaw.length > 0 ? detailsRaw.slice(0, 500) : null;

    // Insertar en Supabase
    const { data: inserted, error: insertErr } = await supabase
      .from("user_reports")
      .insert({
        reporter_id: reporterId,
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("[reports] insert error:", insertErr);
      return res
        .status(500)
        .json({ error: "No se pudo guardar el reporte" });
    }

    // Buscar info del reporter para el email
    const { data: reporterUser } = await supabase
      .from("users")
      .select("email, alias, nombre")
      .eq("id", reporterId)
      .maybeSingle();

    const reporterEmail =
      (reporterUser && reporterUser.email) || "Desconocido";
    const reporterAlias =
      (reporterUser && reporterUser.alias) || "";
    const reporterNombre =
      (reporterUser && reporterUser.nombre) || "";

    // Enviar email
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("[reports] RESEND_API_KEY no configurada");
      return res.json({ success: true, id: inserted.id, emailed: false });
    }

    const { Resend } = require("resend");
    const resend = new Resend(apiKey);

    const reasonLabel = REASON_LABELS[reason] || reason;
    const targetTypeLabel =
      targetType === "post"
        ? "Publicación"
        : targetType === "comment"
        ? "Comentario"
        : "Usuario/Perfil";

    const targetUrlHint =
      targetType === "user"
        ? `https://www.airnation.online/u/${targetId}`
        : "—";

    const html = `
<h2>Nuevo reporte de contenido en AirNation</h2>
<p><strong>Tipo:</strong> ${escapeHtml(targetTypeLabel)}</p>
<p><strong>Razón:</strong> ${escapeHtml(reasonLabel)}</p>
<p><strong>Target ID:</strong> <code>${escapeHtml(targetId)}</code></p>
<p><strong>Link (si aplica):</strong> ${escapeHtml(targetUrlHint)}</p>
<hr/>
<p><strong>Reportado por:</strong></p>
<ul>
  <li>Email: ${escapeHtml(reporterEmail)}</li>
  <li>Alias: ${escapeHtml(reporterAlias || "—")}</li>
  <li>Nombre: ${escapeHtml(reporterNombre || "—")}</li>
  <li>User ID: <code>${escapeHtml(reporterId)}</code></li>
</ul>
${
  details
    ? `<p><strong>Detalles del reporte:</strong></p><p>${escapeHtml(
        details
      ).replace(/\n/g, "<br/>")}</p>`
    : "<p><em>Sin detalles adicionales</em></p>"
}
<hr/>
<p><small>Report ID: ${escapeHtml(inserted.id)}</small></p>
<p><small>Fecha: ${escapeHtml(inserted.created_at)}</small></p>
`.trim();

    const fromAddr =
      process.env.RESEND_FROM_EMAIL || "AirNation <info@airnation.online>";

    const { error: mailErr } = await resend.emails.send({
      from: fromAddr,
      to: "info@airnation.online",
      subject: `[AirNation Reporte] ${targetTypeLabel} — ${reasonLabel}`,
      html,
    });

    if (mailErr) {
      console.error("[reports] Resend error:", mailErr);
      return res.json({
        success: true,
        id: inserted.id,
        emailed: false,
      });
    }

    res.json({ success: true, id: inserted.id, emailed: true });
  } catch (err) {
    console.error("[reports]", err);
    res
      .status(500)
      .json({ error: err.message || "Error inesperado al procesar el reporte" });
  }
});

module.exports = router;
