/**
 * Filtros y precio "desde" de la landing pública de ARENA (`GET /arena/fields`).
 * Puro: recibe las tarjetas ya leídas de la BD y devuelve las que pasan los
 * filtros, ordenadas. Los precios siempre vienen de la BD, en centavos.
 *
 * ponytail: todo se filtra en memoria porque la landing maneja decenas de
 * campos. Con cientos conviene una vista en Postgres y filtrar en el SELECT.
 */

const { dayHours } = require("./horario");

const TIPOS_ITEM = ["paquete", "derecho_campo", "renta", "extra"];

/** Precio base más bajo del campo. null si no tiene paquete ni derecho activo. */
function precioDesde(items) {
  const precios = (items || []).filter((i) => i.es_base).map((i) => i.precio_centavos);
  return precios.length ? Math.min(...precios) : null;
}

/** ¿Algún paquete o derecho activo admite ese número de jugadores? */
function admiteJugadores(items, n) {
  return (items || []).some(
    (i) =>
      i.es_base &&
      (i.min_jugadores == null || n >= i.min_jugadores) &&
      (i.max_jugadores == null || n <= i.max_jugadores)
  );
}

function normaliza(valor) {
  return String(valor ?? "").trim().toLowerCase();
}

/** Entero positivo o null (los filtros vacíos no filtran). */
function enteroOpcional(valor) {
  const n = Number(valor);
  return valor !== undefined && valor !== null && valor !== "" && Number.isInteger(n) && n > 0
    ? n
    : null;
}

/**
 * @param {Array<{ nombre: string, ciudad: string|null, estado: string|null,
 *   horarios_json: unknown, items: object[], precio_desde_centavos: number|null,
 *   destacado: boolean, orden_landing: number }>} tarjetas
 * @param {{ estado?: string, ciudad?: string, precio_max?: string|number,
 *   tipo?: string, dia?: string, jugadores?: string|number }} filtros
 */
function filtrarCampos(tarjetas, filtros = {}) {
  const estado = normaliza(filtros.estado);
  const ciudad = normaliza(filtros.ciudad);
  const tipo = TIPOS_ITEM.includes(normaliza(filtros.tipo)) ? normaliza(filtros.tipo) : "";
  const precioMax = enteroOpcional(filtros.precio_max);
  const jugadores = enteroOpcional(filtros.jugadores);
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(String(filtros.dia || "")) ? String(filtros.dia) : "";

  return (tarjetas || [])
    .filter((t) => {
      if (estado && normaliza(t.estado) !== estado) return false;
      if (ciudad && !normaliza(t.ciudad).includes(ciudad)) return false;
      if (tipo && !(t.items || []).some((i) => i.tipo === tipo)) return false;
      if (precioMax != null && (t.precio_desde_centavos == null || t.precio_desde_centavos > precioMax)) {
        return false;
      }
      if (jugadores != null && !admiteJugadores(t.items, jugadores)) return false;
      if (dia && !dayHours(t.horarios_json, dia)) return false;
      return true;
    })
    .sort(
      (a, b) =>
        Number(b.destacado) - Number(a.destacado) ||
        (a.orden_landing ?? 0) - (b.orden_landing ?? 0) ||
        String(a.nombre).localeCompare(String(b.nombre), "es")
    );
}

module.exports = { TIPOS_ITEM, precioDesde, admiteJugadores, filtrarCampos };
