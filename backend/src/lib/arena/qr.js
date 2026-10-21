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

module.exports = { checkinUrl, qrPng };
