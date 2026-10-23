const QRCode = require("qrcode");
const { arenaPublicUrl } = require("./config");

/** El QR codifica la pantalla de check-in, para que la cámara normal del cel sirva. */
function checkinUrl(qrToken) {
  return `${arenaPublicUrl()}/checkin/${qrToken}`;
}

function qrPng(qrToken, width = 600) {
  return QRCode.toBuffer(checkinUrl(qrToken), {
    type: "png",
    width,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

/**
 * QR listo para pegarse en un correo. El PNG va como adjunto con Content-ID
 * (Gmail y Outlook no cargan data URLs) y el HTML lo referencia con `cid:`.
 * Las llaves van en camelCase porque el SDK de Resend solo mapea esas:
 * `content_id`/`content_type` se descartan en silencio y el correo llega con
 * la imagen roto.
 */
async function qrAdjuntoInline(codigo, qrToken, width = 600) {
  const cid = `qr-${codigo}`;
  const png = await qrPng(qrToken, width);
  return {
    cid,
    adjunto: {
      filename: `${codigo}.png`,
      content: png.toString("base64"),
      contentType: "image/png",
      contentId: cid,
    },
  };
}

module.exports = { checkinUrl, qrPng, qrAdjuntoInline };
