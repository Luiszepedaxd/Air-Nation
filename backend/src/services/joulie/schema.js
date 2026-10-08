// El mapa de la base de AirNation y las columnas que nunca salen de ella.
const { scrubString } = require("./guards");

/**
 * El mapa de la base de AirNation que JOULIE puede leer: una entrada por lista
 * de DATOS, con su tabla, el tipo con el que se etiqueta cada registro, qué
 * significa ese tipo y las columnas públicas que se piden. Las consultas y el
 * ESQUEMA del prompt salen de aquí, así que sumar una tabla es sumar una
 * entrada y nada más.
 */
const ENTITIES = {
  eventos: {
    tabla: "events",
    tipo: "evento",
    que: "una partida, operación o torneo con fecha, que se juega en un campo o en una sede",
    claves: "title, descripcion, cuando, hasta, sede, campo, ciudad, estado, cupo, disciplina, organizador, pagina y ficha",
    select:
      "title, descripcion, fecha, fecha_fin, cupo, disciplina, tipo, sede_nombre, sede_ciudad, url_externa, fields(nombre, slug, ciudad, estado), organizador:users!organizador_id(nombre, alias)",
  },
  eventos_pasados: {
    tabla: "events",
    tipo: "evento pasado",
    que: "un evento que ya ocurrió; sirve para contar que ahí antes hubo algo así, nunca para confirmar que volverá a haberlo",
    claves: "title, cuando, sede, campo, ciudad y estado",
    select: "title, fecha, sede_nombre, sede_ciudad, disciplina, fields(nombre, ciudad, estado)",
  },
  campos: {
    tabla: "fields",
    tipo: "campo",
    que: "el lugar físico donde se juega",
    claves: "nombre, ciudad, estado, horario, acceso (publico o privado) y pagina",
    select: "nombre, slug, ciudad, estado, tipo, descripcion, horarios_json, instagram, promedio_rating",
  },
  equipos: {
    tabla: "teams",
    tipo: "equipo",
    que: "un grupo de operadores que juegan juntos; no es un lugar para jugar ni una tienda, y no tiene horario",
    claves: "nombre, ciudad, estado y su historia",
    select: "nombre, slug, ciudad, estado, anio_fundacion, descripcion, historia, instagram, facebook",
  },
  tienda: {
    tabla: "store_products",
    tipo: "producto",
    que: "algo que la tienda de AirNation vende, no un lugar ni un equipo",
    claves: "nombre, precio y condicion",
    // precio_costo y stock no salen: no están en la ficha pública que ella puede decir.
    select: "nombre, slug, precio, condicion, descripcion",
  },
  operadores: {
    tabla: "users",
    tipo: "operador",
    que: "una persona registrada, de la que solo sale su alias",
    claves: "alias",
    select: "alias",
  },
  replicas: {
    tabla: "arsenal",
    tipo: "recuento de réplicas",
    que: "cuántas veces se repite un sistema o un mecanismo en AirNation, nunca la réplica de alguien",
    claves: "sistema, mecanismo y cuántas veces se repite",
    select: "id, sistema, mecanismo, upgrades",
  },
  mejoras: {
    tipo: "recuento de mejoras",
    que: "cuántas veces se repite una mejora en AirNation",
    claves: "mejora y cuántas veces se repite",
  },
  tu_arsenal: {
    tabla: "arsenal",
    tipo: "replica propia",
    que: "una réplica de quien te escucha, la única clase que puedes llamar «tu réplica»",
    claves: "nombre, sistema, mecanismo y upgrades",
    select: "nombre, sistema, mecanismo, upgrades",
  },
  blog: {
    tabla: "posts",
    tipo: "post",
    que: "un artículo publicado en el blog de AirNation",
    claves: "title, extracto, categoria y enlace",
    // El blog no tiene columna de tags: la categoría pública hace de etiqueta.
    select: "title, slug, category, excerpt, content",
  },
};

const PRIVATE_KEYS = new Set([
  "email",
  "phone",
  "telefono",
  "whatsapp",
  "whatsapp_url",
  "direccion",
  "address",
  "fecha_nacimiento",
  "credencial_fecha_nacimiento",
  "credencial_nombre_completo",
  "foto_credencial_url",
  "curp",
  "ine",
  "documento",
  "numero_documento",
  "location_lat",
  "location_lng",
  "lat",
  "lng",
  "latitude",
  "longitude",
  "maps_url",
  "stripe_customer_id",
  "stripe_payment_intent_id",
  "stripe_status",
  "password",
  "token",
  "access_token",
  "app_role",
  "user_id",
  "organizador_id",
  "created_by",
  "guest_email",
  "serial",
]);

function scrub(value, depth = 0) {
  if (value == null || depth > 4) return null;
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((item) => scrub(item, depth + 1))
      .filter((item) => item != null && item !== "");
  }
  if (typeof value === "object") {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      const norm = key.toLowerCase();
      if (PRIVATE_KEYS.has(norm) || norm === "id" || norm.endsWith("_id") || norm.endsWith("_url")) {
        continue;
      }
      const next = scrub(inner, depth + 1);
      if (next == null || next === "") continue;
      out[key] = next;
    }
    return Object.keys(out).length ? out : null;
  }
  if (typeof value === "string") {
    const cleaned = scrubString(value);
    return cleaned || null;
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function listOf(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 12)
    .map((row) => scrub(row))
    .filter((row) => row && typeof row === "object");
}

module.exports = {
  ENTITIES,
  listOf,
};
