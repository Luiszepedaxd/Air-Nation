const assert = require("node:assert/strict");
const { describe, it, before } = require("node:test");

// bookings.js crea el cliente de Supabase al cargarse; con estas variables
// basta para poder probar sus funciones puras.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://ejemplo.supabase.co";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "llave-de-prueba";

const { sanearItems } = require("./bookings");

describe("sanearItems", () => {
  it("solo pasa item_id y cantidad a la función de la BD", () => {
    assert.deepEqual(
      sanearItems([{ item_id: "a", cantidad: 2, precio_centavos: 1, subtotal_centavos: 1 }]),
      [{ item_id: "a", cantidad: 2 }]
    );
  });

  it("descarta el precio aunque venga anidado o con otro nombre", () => {
    const salida = sanearItems([
      { item_id: "a", precio: 1, total_centavos: 1, descuento: 99, nombre: "Gratis" },
    ]);
    assert.deepEqual(salida, [{ item_id: "a" }]);
    assert.deepEqual(Object.keys(salida[0]), ["item_id"]);
  });

  it("omite la cantidad cuando no es un entero válido, para que la BD aplique su regla", () => {
    for (const cantidad of [undefined, null, 0, -3, 1.5, "muchos", NaN]) {
      assert.deepEqual(sanearItems([{ item_id: "a", cantidad }]), [{ item_id: "a" }]);
    }
  });

  it("no revienta con basura", () => {
    assert.deepEqual(sanearItems(null), []);
    assert.deepEqual(sanearItems("x"), []);
    assert.deepEqual(sanearItems([null]), [{ item_id: "" }]);
  });
});
