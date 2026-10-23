const { test } = require("node:test");
const assert = require("node:assert");
const { eventReservation, scriptJsonLd } = require("./markup");

const detalle = {
  booking: {
    codigo: "AR-123", access_token: "tok", qr_token: "qrt", fecha: "2026-10-24",
    num_jugadores: 6, contacto_nombre: "Ana </script>", contacto_email: "ana@example.com",
  },
  field: {
    nombre: "Campo X", direccion: "Calle 1", ciudad: "Zapopan", estado: "Jalisco",
    horarios_json: { sabado: { abierto: true, apertura: "9:00", cierre: "18:00" } },
  },
  items: [{ tipo: "paquete", nombre: "Gotcha" }],
};

test("EventReservation con fechas en -06:00 y datos de la reserva", () => {
  const r = eventReservation(detalle);
  assert.equal(r["@type"], "EventReservation");
  assert.equal(r.reservationNumber, "AR-123");
  assert.equal(r.reservationStatus, "https://schema.org/ReservationConfirmed");
  assert.equal(r.reservationFor.name, "Campo X – Gotcha");
  assert.equal(r.reservationFor.startDate, "2026-10-24T09:00:00-06:00");
  assert.equal(r.reservationFor.endDate, "2026-10-24T18:00:00-06:00");
  assert.equal(r.reservationFor.location.address.addressCountry, "MX");
  assert.equal(r.partySize, 6);
  assert.match(r.url, /\/reservas\/AR-123\?t=tok$/);
  assert.match(r.ticketToken, /^qrCode:.*\/checkin\/qrt$/);
});

test("sin horario el evento queda como fecha de día completo", () => {
  const r = eventReservation({ ...detalle, field: { nombre: "Y" }, items: [] });
  assert.equal(r.reservationFor.startDate, "2026-10-24");
  assert.equal(r.reservationFor.endDate, undefined);
  assert.equal(r.reservationFor.name, "Y");
});

test("el script no permite cerrar la etiqueta y varias reservas van en arreglo", () => {
  const html = scriptJsonLd([detalle, detalle]);
  assert.equal(html.match(/<\/script>/g).length, 1);
  const json = JSON.parse(html.replace(/^<script[^>]*>|<\/script>$/g, ""));
  assert.equal(json.length, 2);
  assert.equal(json[0].underName.name, "Ana </script>");
});
