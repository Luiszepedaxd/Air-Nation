/**
 * Campos DEMO (`fields.es_prueba = true`): lo que el admin puede apagar,
 * limpiar o borrar sin riesgo. Todo lo de aquí es puro para que la regla
 * —"nunca tocar un campo real"— se pueda probar sin BD.
 */

/**
 * Portero de los endpoints demo. Devuelve `null` si el campo se puede tocar,
 * o `{ status, error }` con la respuesta que toca.
 *
 * 404 cuando el campo no existe; 409 cuando existe pero NO es de prueba: son
 * dos cosas distintas y el admin merece saber cuál.
 */
function revisarCampoDemo(field) {
  if (!field) return { status: 404, error: "Campo no encontrado" };
  if (field.es_prueba !== true) {
    return {
      status: 409,
      error:
        "Este campo no está marcado como de prueba. Las acciones demo solo tocan campos con es_prueba = true.",
    };
  }
  return null;
}

/**
 * De un montón de reservas (`{ payment_id, es_prueba }`, una por reserva de
 * cada pago candidato), los pagos que se pueden borrar: aquellos en los que
 * **todas** sus reservas son de campos de prueba. Un pago de carrito que
 * mezcla un campo demo con uno real se queda, siempre.
 */
function pagosBorrables(reservas) {
  const todasDemo = new Map();
  for (const r of reservas || []) {
    if (!r || !r.payment_id) continue;
    const previo = todasDemo.get(r.payment_id);
    todasDemo.set(r.payment_id, (previo === undefined ? true : previo) && r.es_prueba === true);
  }
  return [...todasDemo.entries()].filter(([, ok]) => ok).map(([id]) => id);
}

module.exports = { revisarCampoDemo, pagosBorrables };
