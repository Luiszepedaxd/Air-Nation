const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { ERRORES, arenaError } = require("./errors");

describe("arenaError", () => {
  it("traduce un código de la BD a status y mensaje en español", () => {
    const r = arenaError({ message: "campo_cerrado" });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, "campo_cerrado");
    assert.equal(r.body.error, "El campo no abre ese día.");
  });

  it("incluye el DETAIL de la excepción cuando viene", () => {
    const r = arenaError({ message: "qr_ya_usado", details: "2026-10-24 09:12" });
    assert.equal(r.body.detalle, "2026-10-24 09:12");
  });

  it("no filtra el error interno de Postgres si el código es desconocido", () => {
    const r = arenaError({
      message: 'relation "arena_bookings" does not exist',
      details: "contraseña en el log",
    });
    assert.equal(r.status, 500);
    assert.deepEqual(r.body, { error: "Error interno del servidor" });
  });

  it("también cae en 500 genérico si no hay error", () => {
    assert.equal(arenaError(null).status, 500);
    assert.equal(arenaError({}).status, 500);
  });

  it("tiene los 21 códigos documentados", () => {
    for (const code of [
      "campo_cerrado", "fecha_bloqueada", "fuera_de_anticipacion", "item_invalido",
      "falta_item_base", "arena_inactivo", "jugadores_invalido", "contacto_invalido",
      "origen_invalido", "total_invalido", "rango_invalido", "reserva_no_encontrada",
      "fuera_de_plazo_cancelacion", "transicion_invalida", "qr_invalido", "qr_otro_campo",
      "qr_fecha_distinta", "qr_ya_usado", "qr_no_confirmada", "sin_permiso",
      "sin_reservas_por_liquidar",
    ]) {
      assert.ok(ERRORES[code], `falta ${code}`);
      assert.equal(typeof ERRORES[code][0], "number");
      assert.ok(ERRORES[code][1].length > 0);
    }
  });
});
