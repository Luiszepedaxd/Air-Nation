/**
 * Avisos de ARENA: email con Resend (mismo estilo que routes/admin-mail.js) y
 * push con lib/push.js. Ninguna notificación bloquea la operación: si falla,
 * se loguea y la reserva sigue su curso.
 */
const supabase = require("../supabase");
const { sendPushToUser } = require("../push");
const { arenaPublicUrl } = require("./config");
const { qrAdjuntoInline } = require("./qr");
const { scriptJsonLd } = require("./markup");

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
function plantilla({ titulo, cuerpo, ctaHref, ctaLabel, marcado = "" }) {
  return `${marcado}
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

// ─── Formatos ────────────────────────────────────────────────────────────────

/** Centavos → "$1,250 MXN". El dinero nunca viaja en pesos. */
function pesos(centavos) {
  const n = Number(centavos) || 0;
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: n % 100 === 0 ? 0 : 2,
  }).format(n / 100)} MXN`;
}

// Una fecha de calendario se formatea en UTC para que no se corra un día.
function fechaFmt(fecha, opciones) {
  const [y, m, d] = String(fecha).split("-").map(Number);
  if (!y || !m || !d) return String(fecha);
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...opciones }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

const fechaCorta = (fecha) => fechaFmt(fecha, { weekday: "short", day: "numeric", month: "short" });
const fechaLarga = (fecha) =>
  fechaFmt(fecha, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function horaMexico(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

/** Tabla de renglones con el total: el recibo del jugador. */
function recibo({ items, booking }, etiqueta = "Total pagado") {
  const filas = (items || [])
    .map(
      (i) => `<tr>
        <td style="padding:6px 0;color:#444444;">${escapeHtml(i.nombre)} × ${i.cantidad}</td>
        <td style="padding:6px 0;text-align:right;color:#111111;">${pesos(i.subtotal_centavos)}</td>
      </tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
      ${filas}
      <tr><td colspan="2" style="border-top:1px solid #EEEEEE;"></td></tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;color:#111111;">${escapeHtml(etiqueta)}</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;color:#CC4B37;">${pesos(booking.total_centavos)}</td>
      </tr>
    </table>`;
}

function linkReserva(booking) {
  return `${arenaPublicUrl()}/reservas/${booking.codigo}?t=${booking.access_token}`;
}

function datosReserva(detalle) {
  const { booking, field } = detalle;
  return `<table style="font-size:14px;color:#444444;">
      <tr><td style="padding:3px 12px 3px 0;">Código</td><td style="font-weight:bold;color:#111111;">${escapeHtml(booking.codigo)}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;">Campo</td><td>${escapeHtml(field?.nombre || "")}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;">Día</td><td>${escapeHtml(fechaLarga(booking.fecha))}</td></tr>
      <tr><td style="padding:3px 12px 3px 0;">Jugadores</td><td>${booking.num_jugadores}</td></tr>
    </table>`;
}

// ─── Eventos (sección 8 del doc) ─────────────────────────────────────────────

/**
 * Pago aprobado. Un pago puede cubrir varias reservas (carrito): el jugador
 * recibe **un** email con un QR por reserva (PNG adjunto por CID, porque Gmail
 * y Outlook no cargan data URLs) y cada campo recibe solo el aviso de su
 * reserva, nunca el carrito completo.
 * @param {object[]|object} detalles reservas ya leídas con `leerReserva`
 * @param {{ id: string, access_token?: string|null, monto_centavos?: number }|null} pago
 */
async function avisoPagoAprobado(detalles, pago = null) {
  const lista = (Array.isArray(detalles) ? detalles : [detalles]).filter(Boolean);
  if (lista.length === 0) return;
  const varias = lista.length > 1;

  const adjuntos = [];
  const bloques = [];
  for (const d of lista) {
    let qrHtml = `<p style="font-size:13px;color:#999999;">Abre tu reserva para ver el QR.</p>`;
    try {
      const { cid, adjunto } = await qrAdjuntoInline(d.booking.codigo, d.booking.qr_token, 600);
      adjuntos.push(adjunto);
      qrHtml = `<img src="cid:${cid}" alt="Código QR de la reserva ${escapeHtml(d.booking.codigo)}" width="200" height="200" style="display:block;margin:8px 0 4px;" />`;
    } catch (err) {
      console.error("[arena:mail] qr:", err.message);
    }
    bloques.push(
      `<div style="${varias ? "border-top:1px solid #EEEEEE;margin-top:20px;padding-top:16px;" : ""}">
        ${qrHtml}
        ${datosReserva(d)}
        ${recibo(d, varias ? "Total de esta reserva" : "Total pagado")}
      </div>`
    );
  }

  const total = pago?.monto_centavos ?? lista.reduce((s, d) => s + d.booking.total_centavos, 0);
  const href =
    pago?.access_token
      ? `${arenaPublicUrl()}/arena/confirmacion?p=${pago.id}&t=${pago.access_token}`
      : linkReserva(lista[0].booking);
  const politicas = Array.from(
    new Set(lista.map((d) => d.settings?.politica_cancelacion).filter(Boolean))
  );

  await Promise.allSettled([
    enviarEmail({
      to: lista[0].booking.contacto_email,
      subject: varias
        ? `${lista.length} reservas confirmadas — AirNation ARENA`
        : `Reserva confirmada ${lista[0].booking.codigo} — ${lista[0].field?.nombre || "ARENA"}`,
      html: plantilla({
        titulo: varias ? "Tus reservas están confirmadas" : "Tu reserva está confirmada",
        cuerpo: `<p>Listo, ${escapeHtml(lista[0].booking.contacto_nombre)}. ${
          varias
            ? `Muestra el QR de cada reserva en la entrada del campo. Pagaste ${pesos(total)}.`
            : "Muestra este QR en la entrada del campo."
        }</p>
          ${bloques.join("")}
          ${varias ? `<p style="font-size:15px;color:#111111;font-weight:bold;margin:16px 0 0;">Total pagado: ${pesos(total)}</p>` : ""}
          <p style="font-size:12px;color:#999999;">Si no se ven las imágenes, abre tus reservas con el botón de abajo.</p>
          ${politicas.map((t) => `<p style="font-size:13px;color:#666666;">${escapeHtml(t)}</p>`).join("")}`,
        ctaHref: href,
        ctaLabel: varias ? "VER MIS RESERVAS" : "VER MI RESERVA",
        marcado: scriptJsonLd(lista),
      }),
      attachments: adjuntos,
    }),
    ...lista.map((d) =>
      avisarAlCampo(d, {
        subject: `Nueva reserva pagada — ${fechaCorta(d.booking.fecha)}`,
        titulo: "Nueva reserva pagada",
        cuerpo: `<p><strong>${d.booking.num_jugadores}</strong> ${d.booking.num_jugadores === 1 ? "jugador" : "jugadores"} el ${escapeHtml(fechaLarga(d.booking.fecha))}.</p>
        ${datosReserva(d)}
        ${recibo(d, "Total de esta reserva")}
        <p style="font-size:13px;color:#666666;">Contacto: ${escapeHtml(d.booking.contacto_nombre)} · ${escapeHtml(d.booking.contacto_email)}${d.booking.contacto_telefono ? ` · ${escapeHtml(d.booking.contacto_telefono)}` : ""}</p>`,
        push: {
          title: "Nueva reserva pagada",
          body: `${d.booking.num_jugadores} ${d.booking.num_jugadores === 1 ? "jugador" : "jugadores"}, ${fechaCorta(d.booking.fecha)}`,
        },
      })
    ),
  ]);
}

/** Email con el link de pago de una reserva manual (vence en 2 h). */
async function avisoLinkPago(detalle, checkoutUrl) {
  const { booking, field } = detalle;
  await enviarEmail({
    to: booking.contacto_email,
    subject: `Tu link de pago — ${field?.nombre || "ARENA"}`,
    html: plantilla({
      titulo: "Termina tu reserva",
      cuerpo: `<p>${escapeHtml(field?.nombre || "El campo")} te apartó este lugar. Paga en línea para confirmarlo.</p>
        ${datosReserva(detalle)}
        ${recibo(detalle)}
        <p style="font-size:13px;color:#CC4B37;">El link vence el ${escapeHtml(horaMexico(booking.expires_at))} (hora del centro de México).</p>`,
      ctaHref: checkoutUrl || linkReserva(booking),
      ctaLabel: "PAGAR AHORA",
    }),
  });
}

/** Pago rechazado o reserva vencida: link para intentar de nuevo. */
async function avisoPagoFallido(detalle) {
  const { booking, field } = detalle;
  await enviarEmail({
    to: booking.contacto_email,
    subject: `No pudimos cobrar tu reserva ${booking.codigo}`,
    html: plantilla({
      titulo: "El pago no se completó",
      cuerpo: `<p>No pudimos cobrar tu reserva en ${escapeHtml(field?.nombre || "el campo")}. Puedes intentar de nuevo desde tu reserva.</p>
        ${datosReserva(detalle)}`,
      ctaHref: linkReserva(booking),
      ctaLabel: "INTENTAR DE NUEVO",
    }),
  });
}

/** Cancelada por el campo: email con motivo y monto, más push si tiene cuenta. */
async function avisoCanceladaPorCampo(detalle) {
  const { booking, field } = detalle;
  await Promise.allSettled([
    enviarEmail({
      to: booking.contacto_email,
      subject: `${field?.nombre || "El campo"} canceló tu reserva ${booking.codigo}`,
      html: plantilla({
        titulo: "El campo canceló tu reserva",
        cuerpo: `<p>${escapeHtml(field?.nombre || "El campo")} canceló tu reserva del ${escapeHtml(fechaLarga(booking.fecha))}.</p>
          ${booking.motivo_cancelacion ? `<p>Motivo: ${escapeHtml(booking.motivo_cancelacion)}</p>` : ""}
          <p>Te reembolsamos <strong>${pesos(booking.reembolso_centavos)}</strong>. El reembolso tarda unos días en reflejarse según tu banco.</p>
          ${datosReserva(detalle)}`,
        ctaHref: linkReserva(booking),
        ctaLabel: "VER DETALLE",
      }),
    }),
    booking.user_id
      ? sendPushToUser(booking.user_id, {
          title: "Tu reserva fue cancelada",
          body: `${field?.nombre || "El campo"} canceló el ${fechaCorta(booking.fecha)}. Te reembolsamos ${pesos(booking.reembolso_centavos)}.`,
          url: `/reservas/${booking.codigo}?t=${booking.access_token}`,
        })
      : Promise.resolve(),
  ]);
}

/** Cancelada por el jugador: email al jugador, push y email al campo. */
async function avisoCanceladaPorJugador(detalle) {
  const { booking, field } = detalle;
  await Promise.allSettled([
    enviarEmail({
      to: booking.contacto_email,
      subject: `Cancelamos tu reserva ${booking.codigo}`,
      html: plantilla({
        titulo: "Reserva cancelada",
        cuerpo: `<p>Cancelamos tu reserva del ${escapeHtml(fechaLarga(booking.fecha))} en ${escapeHtml(field?.nombre || "el campo")}.</p>
          <p>Monto reembolsado: <strong>${pesos(booking.reembolso_centavos)}</strong>.</p>
          ${datosReserva(detalle)}`,
      }),
    }),
    avisarAlCampo(detalle, {
      subject: `Reserva cancelada — ${fechaCorta(booking.fecha)}`,
      titulo: "Un jugador canceló",
      cuerpo: `<p>${escapeHtml(booking.contacto_nombre)} canceló su reserva de ${booking.num_jugadores} ${booking.num_jugadores === 1 ? "jugador" : "jugadores"} del ${escapeHtml(fechaLarga(booking.fecha))}.</p>
        ${datosReserva(detalle)}`,
      push: {
        title: "Reserva cancelada",
        body: `${booking.contacto_nombre} canceló el ${fechaCorta(booking.fecha)}.`,
      },
    }),
  ]);
}

/** Check-in registrado: push al jugador si tiene cuenta. */
async function avisoCheckin(detalle) {
  const { booking, field } = detalle;
  if (!booking.user_id) return;
  await sendPushToUser(booking.user_id, {
    title: "Llegada registrada",
    body: `${field?.nombre || "El campo"} registró tu entrada. Buen juego.`,
    url: `/reservas/${booking.codigo}?t=${booking.access_token}`,
  });
}

/** Liquidación transferida: email a los dueños del campo. */
async function avisoLiquidacion({ payout, fieldId }) {
  const { emails, campo } = await destinatariosCampo(fieldId);
  if (emails.length === 0) return;
  await enviarEmail({
    to: emails,
    subject: `Liquidación transferida — ${campo?.nombre || "tu campo"}`,
    html: plantilla({
      titulo: "Te transferimos tu liquidación",
      cuerpo: `<table style="font-size:14px;color:#444444;">
          <tr><td style="padding:3px 12px 3px 0;">Periodo</td><td>${escapeHtml(fechaLarga(payout.periodo_desde))} — ${escapeHtml(fechaLarga(payout.periodo_hasta))}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;">Reservas</td><td>${payout.reservas_count}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;">Vendido</td><td>${pesos(payout.bruto_centavos)}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;">Comisión AirNation</td><td>−${pesos(payout.comision_centavos)}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;">Reembolsos</td><td>−${pesos(payout.reembolsos_centavos)}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;font-weight:bold;color:#111111;">Transferido</td><td style="font-weight:bold;color:#CC4B37;">${pesos(payout.neto_centavos)}</td></tr>
          ${payout.referencia ? `<tr><td style="padding:3px 12px 3px 0;">Folio</td><td>${escapeHtml(payout.referencia)}</td></tr>` : ""}
        </table>`,
      ctaHref: `${arenaPublicUrl()}/mi-campo/${fieldId}/arena?tab=saldos`,
      ctaLabel: "VER MIS SALDOS",
    }),
  });
}

/**
 * Una reserva ya liquidada no se reembolsa sola: queda marcada y avisamos.
 * El contracargo se descuenta de la siguiente liquidación.
 */
async function avisoReembolsoManual({ booking, motivo }) {
  const to = process.env.ARENA_ADMIN_EMAIL || process.env.RESEND_FROM_EMAIL;
  console.warn("[arena] reembolso manual pendiente:", booking.codigo, motivo);
  if (!to) return;
  await enviarEmail({
    to,
    subject: `Reembolso manual pendiente — ${booking.codigo}`,
    html: plantilla({
      titulo: "Reembolso manual pendiente",
      cuerpo: `<p>La reserva <strong>${escapeHtml(booking.codigo)}</strong> ya estaba liquidada al campo, así que el reembolso de ${pesos(booking.total_centavos)} no se disparó solo.</p>
        <p>Motivo: ${escapeHtml(motivo || "cancelación")}. Hay que descontarlo de la siguiente liquidación.</p>`,
    }),
  });
}

/** Email a los correos del campo + push a sus cuentas. */
async function avisarAlCampo(detalle, { subject, titulo, cuerpo, push }) {
  const { emails, userIds } = await destinatariosCampo(detalle.booking.field_id);
  const href = `${arenaPublicUrl()}/mi-campo/${detalle.booking.field_id}/arena`;
  await Promise.allSettled([
    emails.length
      ? enviarEmail({
          to: emails,
          subject,
          html: plantilla({ titulo, cuerpo, ctaHref: href, ctaLabel: "ABRIR MI AGENDA" }),
        })
      : Promise.resolve(),
    ...(push
      ? userIds.map((id) =>
          sendPushToUser(id, { ...push, url: `/mi-campo/${detalle.booking.field_id}/arena` })
        )
      : []),
  ]);
}

module.exports = {
  escapeHtml,
  plantilla,
  enviarEmail,
  destinatariosCampo,
  pushACampo,
  pesos,
  fechaCorta,
  fechaLarga,
  horaMexico,
  avisoCuentaLigada,
  avisoPagoAprobado,
  avisoLinkPago,
  avisoPagoFallido,
  avisoCanceladaPorCampo,
  avisoCanceladaPorJugador,
  avisoCheckin,
  avisoLiquidacion,
  avisoReembolsoManual,
};
