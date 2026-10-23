/**
 * Marcado de Gmail (schema.org EventReservation) para el correo de reserva
 * confirmada. México no tiene horario de verano desde 2022: siempre -06:00.
 */
const { arenaPublicUrl } = require("./config");
const { dayHours } = require("./horario");
const { checkinUrl } = require("./qr");

const OFFSET = "-06:00";

function instante(fecha, hhmm) {
  const [h, m] = hhmm.split(":");
  return `${fecha}T${h.padStart(2, "0")}:${m}:00${OFFSET}`;
}

/** Un EventReservation por reserva (`detalle` = salida de `leerReserva`). */
function eventReservation({ booking, field, items = [] }) {
  const paquete = items.find((i) => i.tipo === "paquete")?.nombre;
  const horas = dayHours(field?.horarios_json, booking.fecha);
  const url = `${arenaPublicUrl()}/reservas/${booking.codigo}?t=${booking.access_token}`;
  const reserva = {
    "@context": "https://schema.org",
    "@type": "EventReservation",
    reservationNumber: booking.codigo,
    reservationStatus: "https://schema.org/ReservationConfirmed",
    underName: { "@type": "Person", name: booking.contacto_nombre, email: booking.contacto_email },
    reservationFor: {
      "@type": "Event",
      name: [field?.nombre || "AirNation ARENA", paquete].filter(Boolean).join(" – "),
      startDate: horas ? instante(booking.fecha, horas.apertura) : booking.fecha,
      ...(horas && { endDate: instante(booking.fecha, horas.cierre) }),
      location: {
        "@type": "Place",
        name: field?.nombre || "AirNation ARENA",
        address: {
          "@type": "PostalAddress",
          streetAddress: field?.direccion || "",
          addressLocality: field?.ciudad || "",
          addressRegion: field?.estado || "",
          addressCountry: "MX",
        },
      },
    },
    url,
    modifyReservationUrl: url,
  };
  if (booking.num_jugadores) reserva.partySize = booking.num_jugadores;
  if (booking.qr_token) reserva.ticketToken = `qrCode:${checkinUrl(booking.qr_token)}`;
  return reserva;
}

/** `<script type="application/ld+json">` seguro: `<`, `>`, `&` y U+2028/9 escapados. */
function scriptJsonLd(detalles) {
  const datos = detalles.map(eventReservation);
  const json = JSON.stringify(datos.length === 1 ? datos[0] : datos).replace(
    /[<>&\u2028\u2029]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
  return `<script type="application/ld+json">${json}</script>`;
}

module.exports = { eventReservation, scriptJsonLd };
