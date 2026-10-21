/**
 * Códigos que lanzan las funciones de la BD (`RAISE EXCEPTION '<codigo>'`)
 * traducidos a status HTTP + mensaje en español.
 * Cualquier código que no esté aquí es un error nuestro: 500 genérico, sin
 * filtrar el mensaje interno de Postgres al cliente.
 */

const ERRORES = {
  arena_inactivo: [409, "ARENA no está disponible en este campo."],
  campo_cerrado: [409, "El campo no abre ese día."],
  fecha_bloqueada: [409, "El campo está cerrado esa fecha."],
  fuera_de_anticipacion: [409, "Esa fecha ya no se puede reservar."],
  item_invalido: [400, "Uno de los conceptos elegidos no es válido."],
  falta_item_base: [400, "Elige un paquete o un derecho de campo."],
  jugadores_invalido: [400, "El número de jugadores no es válido."],
  contacto_invalido: [400, "Falta el nombre o el email de contacto."],
  origen_invalido: [400, "Origen de reserva inválido."],
  total_invalido: [400, "El total de la reserva no es válido."],
  rango_invalido: [400, "El rango de fechas no es válido."],
  reserva_no_encontrada: [404, "No encontramos esa reserva."],
  fuera_de_plazo_cancelacion: [409, "Ya pasó el plazo para cancelar con reembolso."],
  transicion_invalida: [409, "Esa reserva no permite ese cambio."],
  qr_invalido: [404, "Este QR no corresponde a ninguna reserva."],
  qr_otro_campo: [409, "Este QR es de otro campo."],
  qr_fecha_distinta: [409, "Esta reserva no es para hoy."],
  qr_ya_usado: [409, "Este QR ya se usó."],
  qr_no_confirmada: [409, "Esta reserva no está confirmada."],
  sin_permiso: [403, "No tienes permiso sobre este campo."],
  sin_reservas_por_liquidar: [409, "Este campo no tiene reservas por liquidar."],
};

/** @returns {{ status: number, body: { error: string, code?: string, detalle?: string } }} */
function arenaError(error) {
  const code = String(error?.message || "").trim();
  const hit = ERRORES[code];
  if (!hit) return { status: 500, body: { error: "Error interno del servidor" } };
  const detalle = typeof error?.details === "string" ? error.details.trim() : "";
  return {
    status: hit[0],
    body: { error: hit[1], code, ...(detalle ? { detalle } : {}) },
  };
}

/** Responde el error ya traducido. Solo loguea lo que no reconocemos. */
function sendArenaError(res, error, contexto) {
  const mapped = arenaError(error);
  if (mapped.status === 500) console.error(`[arena] ${contexto || "rpc"}:`, error?.message || error);
  return res.status(mapped.status).json(mapped.body);
}

module.exports = { ERRORES, arenaError, sendArenaError };
