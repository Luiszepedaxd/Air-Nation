const test = require("node:test");
const assert = require("node:assert/strict");
// refunds.js carga el cliente de Supabase al requerirse; con estas variables
// basta para probar sus funciones puras (igual que items.test.js).
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://ejemplo.supabase.co";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "llave-de-prueba";

const { parseMarketplaceQuery, parseCarrito } = require("./marketplace");
const { arenaError } = require("./errors");
const { pagoTotalmenteReembolsado, montoAReembolsar } = require("./refunds");

const CAMPO = "11111111-2222-3333-4444-555555555555";
const OTRO = "99999999-2222-3333-4444-555555555555";
const ITEM = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

test("query vacía no filtra nada y ordena por recomendados", () => {
  const { params } = parseMarketplaceQuery({});
  assert.equal(params.p_fecha, null);
  assert.equal(params.p_con_renta, null);
  assert.equal(params.p_orden, "recomendados");
});

test("query válida se traduce a los parámetros de arena_marketplace", () => {
  const { params } = parseMarketplaceQuery({
    fecha: "2026-10-24",
    estado: "Jalisco",
    ciudad: "Zapopan",
    jugadores: "6",
    disciplina: "gotcha",
    terreno: "bosque",
    precio_max: "35000",
    con_renta: "true",
    rating_min: "4.5",
    orden: "precio_asc",
  });
  assert.deepEqual(params, {
    p_fecha: "2026-10-24",
    p_estado: "Jalisco",
    p_ciudad: "Zapopan",
    p_jugadores: 6,
    p_disciplina: "gotcha",
    p_terreno: "bosque",
    p_precio_max_centavos: 35000,
    p_con_renta: true,
    p_rating_min: 4.5,
    p_orden: "precio_asc",
  });
});

test("un parámetro inválido es error, no se ignora", () => {
  for (const q of [
    { fecha: "24/10/2026" },
    { jugadores: "0" },
    { jugadores: "mil" },
    { disciplina: "paintball" },
    { terreno: "selva" },
    { precio_max: "-1" },
    { con_renta: "quizá" },
    { rating_min: "6" },
    { orden: "barato" },
  ]) {
    assert.ok(parseMarketplaceQuery(q).error, `debería fallar: ${JSON.stringify(q)}`);
  }
  // Un filtro vacío sí se ignora: así se limpia un filtro desde la URL.
  assert.ok(parseMarketplaceQuery({ disciplina: "", fecha: "  " }).params);
});

test("el carrito se arma con ids y cantidades, sin precios del cliente", () => {
  const r = parseCarrito({
    reservas: [
      {
        field_id: CAMPO,
        fecha: "2026-10-24",
        num_jugadores: 6,
        notas: "Llegamos temprano",
        items: [
          { item_id: ITEM, precio_centavos: 1 },
          { item_id: ITEM, cantidad: 2, subtotal_centavos: 999 },
        ],
      },
    ],
    contacto: { nombre: "  Luis  ", email: "luis@example.com", telefono: " 3310000000 " },
  });
  assert.deepEqual(r.reservas, [
    {
      field_id: CAMPO,
      fecha: "2026-10-24",
      num_jugadores: 6,
      items: [{ item_id: ITEM }, { item_id: ITEM, cantidad: 2 }],
      notas: "Llegamos temprano",
    },
  ]);
  assert.deepEqual(r.contacto, { nombre: "Luis", email: "luis@example.com", telefono: "3310000000" });
});

test("el carrito rechaza vacío, 11 reservas, duplicados y datos faltantes", () => {
  const una = { field_id: CAMPO, fecha: "2026-10-24", num_jugadores: 4, items: [{ item_id: ITEM }] };
  const contacto = { nombre: "Luis", email: "luis@example.com" };

  assert.equal(parseCarrito({ reservas: [], contacto }).code, "carrito_vacio");
  assert.equal(
    parseCarrito({
      reservas: Array.from({ length: 11 }, (_, i) => ({ ...una, field_id: CAMPO, fecha: `2026-11-0${i % 10}` })),
      contacto,
    }).code,
    "carrito_demasiado_grande"
  );

  const dup = parseCarrito({ reservas: [una, { ...una }], contacto });
  assert.equal(dup.code, "carrito_duplicado");
  assert.equal(dup.reserva_index, 1);

  // Mismo campo en otro día y otro campo el mismo día sí pasan.
  assert.ok(parseCarrito({ reservas: [una, { ...una, fecha: "2026-10-25" }], contacto }).reservas);
  assert.ok(parseCarrito({ reservas: [una, { ...una, field_id: OTRO }], contacto }).reservas);

  assert.equal(parseCarrito({ reservas: [una, { ...una, fecha: "ayer" }], contacto }).reserva_index, 1);
  assert.equal(parseCarrito({ reservas: [{ ...una, items: [] }], contacto }).reserva_index, 0);
  assert.ok(parseCarrito({ reservas: [una], contacto: { nombre: "", email: "x@y.z" } }).error);
  assert.ok(parseCarrito({ reservas: [una], contacto: { nombre: "Luis", email: "no-es-mail" } }).error);
});

test("el error de la BD trae reserva_index para que el front marque cuál falló", () => {
  const { status, body } = arenaError(
    Object.assign(new Error("campo_cerrado"), { details: "reserva_index=2" })
  );
  assert.equal(status, 409);
  assert.equal(body.code, "campo_cerrado");
  assert.equal(body.reserva_index, 2);
  // Un error sin DETAIL no inventa índice.
  assert.equal(arenaError(new Error("campo_cerrado")).body.reserva_index, undefined);
});

test("reembolso parcial: solo el total de esa reserva y el pago espera a las demás", () => {
  const a = { total_centavos: 50000, reembolso_centavos: 0 };
  const b = { total_centavos: 30000, reembolso_centavos: 30000 };
  assert.equal(montoAReembolsar(a), 50000);
  assert.equal(montoAReembolsar(b), 0);
  assert.equal(montoAReembolsar({ total_centavos: 50000, reembolso_centavos: 20000 }), 30000);

  // El pago solo queda reembolsado cuando TODAS sus reservas lo están.
  assert.equal(pagoTotalmenteReembolsado([a, b]), false);
  assert.equal(pagoTotalmenteReembolsado([{ ...a, reembolso_centavos: 50000 }, b]), true);
  assert.equal(pagoTotalmenteReembolsado([]), false);
});
