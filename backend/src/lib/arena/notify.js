/**
 * Avisos de ARENA: email con Resend (mismo estilo que routes/admin-mail.js) y
 * push con lib/push.js. Ninguna notificación bloquea la operación: si falla,
 * se loguea y la reserva sigue su curso.
 */
const supabase = require("../supabase");
const { sendPushToUser } = require("../push");
const { arenaPublicUrl } = require("./config");

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Marco común de los correos de ARENA. `cuerpo` ya viene escapado. */
function plantilla({ titulo, cuerpo, ctaHref, ctaLabel }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#ffffff;">
      <div style="margin-bottom:24px;">
        <span style="font-weight:900;font-size:20px;letter-spacing:3px;text-transform:uppercase;color:#111111;">
          AIR<span style="color:#CC4B37;">NATION</span>
        </span>
        <span style="font-weight:900;font-size:12px;letter-spacing:3px;color:#666666;"> ARENA</span>
      </div>
      <h1 style="font-weight:800;font-size:21px;text-transform:uppercase;color:#111111;margin:0 0 16px;">
        ${escapeHtml(titulo)}
      </h1>
      <div style="font-size:15px;color:#444444;line-height:1.6;margin:0 0 24px;">${cuerpo}</div>
      ${
        ctaHref
          ? `<a href="${escapeHtml(ctaHref)}" style="display:inline-block;background:#CC4B37;color:#ffffff;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;text-decoration:none;">${escapeHtml(ctaLabel || "VER")}</a>`
          : ""
      }
      <p style="font-size:13px;color:#999999;margin:32px 0 0;line-height:1.5;">
        AirNation ARENA — reservas de campos de airsoft<br/>
        <a href="https://www.airnation.online" style="color:#CC4B37;">airnation.online</a>
      </p>
    </div>
  `;
}

async function enviarEmail({ to, subject, html, attachments }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[arena:mail] RESEND_API_KEY no configurada — email omitido:", subject);
    return false;
  }
  if (!to) return false;
  try {
    const { Resend } = require("resend");
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || "AirNation <info@airnation.online>";
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(attachments && attachments.length ? { attachments } : {}),
    });
    if (error) {
      console.error("[arena:mail]", subject, error.message || error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[arena:mail]", subject, err.message);
    return false;
  }
}

/** Emails y user_ids de quién recibe los avisos de un campo. */
async function destinatariosCampo(fieldId) {
  const [settingsRes, membersRes, fieldRes] = await Promise.all([
    supabase.from("arena_field_settings").select("email_avisos").eq("field_id", fieldId).maybeSingle(),
    supabase
      .from("arena_field_members")
      .select("user_id")
      .eq("field_id", fieldId)
      .eq("status", "activo"),
    supabase.from("fields").select("nombre, slug").eq("id", fieldId).maybeSingle(),
  ]);

  const userIds = (membersRes.data || []).map((m) => m.user_id).filter(Boolean);
  let emails = [];
  const avisos = settingsRes.data?.email_avisos?.trim();
  if (avisos) emails.push(avisos);
  if (userIds.length) {
    const { data } = await supabase.from("users").select("email").in("id", userIds);
    emails.push(...(data || []).map((u) => u.email).filter(Boolean));
  }
  emails = Array.from(new Set(emails.map((e) => e.toLowerCase())));
  return { emails, userIds, campo: fieldRes.data || null };
}

async function pushACampo(fieldId, payload) {
  const { userIds } = await destinatariosCampo(fieldId);
  await Promise.allSettled(userIds.map((id) => sendPushToUser(id, payload)));
}

/** "Ya administras [campo] en ARENA" — al ligar una cuenta a un campo. */
async function avisoCuentaLigada({ email, userId, fieldId, fieldNombre }) {
  const href = `${arenaPublicUrl()}/mi-campo/${fieldId}/arena`;
  await Promise.allSettled([
    enviarEmail({
      to: email,
      subject: `Ya administras ${fieldNombre} en ARENA`,
      html: plantilla({
        titulo: "Ya administras tu campo en ARENA",
        cuerpo: `<p>Tu cuenta de AirNation quedó ligada a <strong>${escapeHtml(fieldNombre)}</strong>.</p>
          <p>Desde el panel ARENA puedes cargar tu catálogo, marcar días cerrados, ver tu agenda del día,
          escanear los QR de los jugadores y revisar tus saldos.</p>`,
        ctaHref: href,
        ctaLabel: "ABRIR MI PANEL",
      }),
    }),
    userId
      ? sendPushToUser(userId, {
          title: "Ya administras tu campo en ARENA",
          body: `${fieldNombre} está ligado a tu cuenta.`,
          url: `/mi-campo/${fieldId}/arena`,
        })
      : Promise.resolve(),
  ]);
}

module.exports = {
  escapeHtml,
  plantilla,
  enviarEmail,
  destinatariosCampo,
  pushACampo,
  avisoCuentaLigada,
};
