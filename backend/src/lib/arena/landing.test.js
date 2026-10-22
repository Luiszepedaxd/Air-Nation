const test = require("node:test");
const assert = require("node:assert/strict");
const { precioDesde, filtrarCampos } = require("./landing");

const abreSabado = { sabado: { abierto: true, apertura: "09:00", cierre: "18:00" } };

function tarjeta(extra) {
  return {
    nombre: "Campo",
    ciudad: "Guadalajara",
    estado: "Jalisco",
    horarios_json: abreSabado,
    destacado: false,
    orden_landing: 0,
    items: [
      { tipo: "paquete", es_base: true, precio_centavos: 35000, min_jugadores: 6, max_jugadores: 20 },
      { tipo: "renta", es_base: false, precio_centavos: 15000, min_jugadores: null, max_jugadores: null },
    ],
    precio_desde_centavos: 35000,
    ...extra,
  };
}

test("precioDesde toma el paquete base más barato y ignora extras", () => {
  assert.equal(
    precioDesde([
      { es_base: false, precio_centavos: 100 },
      { es_base: true, precio_centavos: 50000 },
      { es_base: true, precio_centavos: 35000 },
    ]),
    35000
  );
  assert.equal(precioDesde([{ es_base: false, precio_centavos: 100 }]), null);
});

test("filtra por estado, ciudad, precio, tipo, jugadores y día", () => {
  const campos = [tarjeta()];
  assert.equal(filtrarCampos(campos, { estado: "jalisco" }).length, 1);
  assert.equal(filtrarCampos(campos, { estado: "Nuevo León" }).length, 0);
  assert.equal(filtrarCampos(campos, { ciudad: "guadala" }).length, 1);
  assert.equal(filtrarCampos(campos, { precio_max: 30000 }).length, 0);
  assert.equal(filtrarCampos(campos, { precio_max: 35000 }).length, 1);
  assert.equal(filtrarCampos(campos, { tipo: "renta" }).length, 1);
  assert.equal(filtrarCampos(campos, { tipo: "extra" }).length, 0);
  assert.equal(filtrarCampos(campos, { jugadores: 4 }).length, 0);
  assert.equal(filtrarCampos(campos, { jugadores: 10 }).length, 1);
  // 2026-10-24 es sábado; 2026-10-26 es lunes y el campo cierra.
  assert.equal(filtrarCampos(campos, { dia: "2026-10-24" }).length, 1);
  assert.equal(filtrarCampos(campos, { dia: "2026-10-26" }).length, 0);
  // Un filtro vacío o basura no filtra.
  assert.equal(filtrarCampos(campos, { ciudad: "", precio_max: "", jugadores: "x" }).length, 1);
});

test("ordena destacados primero, luego por orden_landing y nombre", () => {
  const orden = filtrarCampos([
    tarjeta({ nombre: "Zeta" }),
    tarjeta({ nombre: "Alfa", orden_landing: 5 }),
    tarjeta({ nombre: "Beta", destacado: true, orden_landing: 2 }),
  ]).map((t) => t.nombre);
  assert.deepEqual(orden, ["Beta", "Zeta", "Alfa"]);
});
