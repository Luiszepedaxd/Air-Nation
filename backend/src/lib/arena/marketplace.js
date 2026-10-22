/**
 * Frontera de confianza del marketplace: traduce lo que manda el cliente a los
 * parámetros de `arena_marketplace` y al `p_reservas` de `arena_create_checkout`.
 * Puro, sin BD: el filtrado, los precios y los totales los hace Postgres.
 */

const DISCIPLINAS = ["airsoft", "gotcha", "gelsoft"];
const TERRENOS = ["bosque", "cqb", "urbano", "mixto", "desierto"];
const ORDENES = ["recomendados", "precio_asc", "precio_desc", "rating"];
const MAX_RESERVAS = 10;
const MAX_ITEMS = 20;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function entero(valor, min, max) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/**
 * Query de `GET /arena/marketplace` → parámetros de la función.
 * Un parámetro presente pero inválido es un error (400), no se ignora: así el
 * jugador no cree que filtró cuando no filtró.
 * @returns {{ params: object } | { error: string }}
 */
function parseMarketplaceQuery(query = {}) {
  const q = (k) => {
    const v = query[k];
    const raw = Array.isArray(v) ? v[0] : v;
    return raw === undefined || raw === null || String(raw).trim() === "" ? null : String(raw).trim();
  };
  const params = {
    p_fecha: null,
    p_estado: null,
    p_ciudad: null,
    p_jugadores: null,
    p_disciplina: null,
    p_terreno: null,
    p_precio_max_centavos: null,
    p_con_renta: null,
    p_rating_min: null,
    p_orden: "recomendados",
  };

  const fecha = q("fecha");
  if (fecha !== null) {
    if (!FECHA.test(fecha)) return { error: "La fecha debe venir como YYYY-MM-DD." };
    params.p_fecha = fecha;
  }

  const estado = q("estado");
  if (estado !== null) {
    if (estado.length > 80) return { error: "El estado no es válido." };
    params.p_estado = estado;
  }

  const ciudad = q("ciudad");
  if (ciudad !== null) {
    if (ciudad.length > 80) return { error: "La ciudad no es válida." };
    params.p_ciudad = ciudad;
  }

  const jugadores = q("jugadores");
  if (jugadores !== null) {
    const n = entero(jugadores, 1, 500);
    if (n === null) return { error: "El número de jugadores debe estar entre 1 y 500." };
    params.p_jugadores = n;
  }

  const disciplina = q("disciplina");
  if (disciplina !== null) {
    if (!DISCIPLINAS.includes(disciplina)) {
      return { error: `La disciplina debe ser ${DISCIPLINAS.join(", ")}.` };
    }
    params.p_disciplina = disciplina;
  }

  const terreno = q("terreno");
  if (terreno !== null) {
    if (!TERRENOS.includes(terreno)) {
      return { error: `El terreno debe ser ${TERRENOS.join(", ")}.` };
    }
    params.p_terreno = terreno;
  }

  const precio = q("precio_max");
  if (precio !== null) {
    const n = entero(precio, 1, 100000000);
    if (n === null) return { error: "El precio máximo debe venir en centavos." };
    params.p_precio_max_centavos = n;
  }

  const renta = q("con_renta");
  if (renta !== null) {
    if (!["true", "false", "1", "0"].includes(renta)) {
      return { error: "con_renta debe ser true o false." };
    }
    params.p_con_renta = renta === "true" || renta === "1";
  }

  const rating = q("rating_min");
  if (rating !== null) {
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 0 || n > 5) {
      return { error: "La calificación mínima debe estar entre 0 y 5." };
    }
    params.p_rating_min = n;
  }

  const orden = q("orden");
  if (orden !== null) {
    if (!ORDENES.includes(orden)) return { error: `El orden debe ser ${ORDENES.join(", ")}.` };
    params.p_orden = orden;
  }

  return { params };
}

/**
 * Body de `POST /arena/checkout` → `p_reservas` + contacto.
 * Del cliente solo viajan ids y cantidades: cualquier precio que mande se
 * descarta aquí, igual que en `sanearItems`.
 * @returns {{ reservas: object[], contacto: object } | { error: string, reserva_index?: number }}
 */
function parseCarrito(body = {}) {
  const reservas = Array.isArray(body.reservas) ? body.reservas : null;
  if (!reservas || reservas.length === 0) {
    return { error: "Tu carrito está vacío.", code: "carrito_vacio" };
  }
  if (reservas.length > MAX_RESERVAS) {
    return { error: `El carrito admite hasta ${MAX_RESERVAS} reservas.`, code: "carrito_demasiado_grande" };
  }

  const vistas = new Set();
  const limpias = [];
  for (let i = 0; i < reservas.length; i += 1) {
    const r = reservas[i] || {};
    const fieldId = String(r.field_id || "").trim();
    if (!UUID.test(fieldId)) return { error: "Uno de los campos del carrito no es válido.", reserva_index: i };
    if (!FECHA.test(String(r.fecha || ""))) {
      return { error: "La fecha debe venir como YYYY-MM-DD.", reserva_index: i };
    }
    const jugadores = entero(r.num_jugadores, 1, 500);
    if (jugadores === null) {
      return { error: "El número de jugadores no es válido.", reserva_index: i };
    }
    const items = Array.isArray(r.items) ? r.items : [];
    if (items.length === 0) {
      return { error: "Elige un paquete o un derecho de campo.", reserva_index: i };
    }
    if (items.length > MAX_ITEMS) return { error: "Demasiados conceptos.", reserva_index: i };

    const clave = `${fieldId}|${r.fecha}`;
    if (vistas.has(clave)) {
      return {
        error: "Ya tienes una reserva de ese campo para ese día.",
        code: "carrito_duplicado",
        reserva_index: i,
      };
    }
    vistas.add(clave);

    limpias.push({
      field_id: fieldId,
      fecha: String(r.fecha),
      num_jugadores: jugadores,
      items: items.map((it) => {
        const cantidad = Number(it?.cantidad);
        return Number.isInteger(cantidad) && cantidad >= 1
          ? { item_id: String(it?.item_id ?? ""), cantidad }
          : { item_id: String(it?.item_id ?? "") };
      }),
      ...(r.notas ? { notas: String(r.notas).slice(0, 500) } : {}),
    });
  }

  const c = body.contacto || {};
  const nombre = String(c.nombre || "").trim().slice(0, 120);
  const email = String(c.email || "").trim().slice(0, 200);
  if (!nombre) return { error: "Escribe el nombre de quien reserva." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Revisa el correo: ahí te llegan los QR." };
  }

  return {
    reservas: limpias,
    contacto: {
      nombre,
      email,
      telefono: c.telefono ? String(c.telefono).trim().slice(0, 40) : null,
    },
  };
}

module.exports = {
  DISCIPLINAS,
  TERRENOS,
  ORDENES,
  MAX_RESERVAS,
  parseMarketplaceQuery,
  parseCarrito,
};
