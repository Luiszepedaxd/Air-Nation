// DATOS: cada fila pública convertida en ficha corta, etiquetada con su tipo
// y recortada hasta que cabe en el prompt.
const { scrubString } = require("./guards");
const { blogPage, eventPage, fieldPage } = require("./pages");
const { ENTITIES, listOf } = require("./schema");
const { plainText } = require("./text");
const { WEEKDAY_ES, hoursOf, mexicoParts, spokenClock, spokenDate, weekendWindow } = require("./time");

function embed(value) {
  const row = Array.isArray(value) ? value[0] : value;
  return row && typeof row === "object" ? row : null;
}

// Solo lo que la ficha pública pinta. La descripción cabe entera (tope 1000 en la tabla).
function presentEvent(row) {
  if (!row || typeof row !== "object") return null;
  const field = embed(row.fields);
  const org = embed(row.organizador) || embed(row.users);
  const card = {};
  const put = (key, value, max = 120) => {
    if (typeof value !== "string") return;
    const text = scrubString(value, max);
    if (text) card[key] = text;
  };
  put("title", row.title, 100);
  put(
    "descripcion",
    typeof row.descripcion === "string" ? row.descripcion.replace(/https?:\/\/\S+/gi, "").replace(/\bwww\.\S+/gi, "") : "",
    700
  );
  if (typeof row.fecha === "string" && /^\d{4}-\d{2}-\d{2}T/.test(row.fecha)) card.fecha = row.fecha;
  if (typeof row.fecha_fin === "string" && /^\d{4}-\d{2}-\d{2}T/.test(row.fecha_fin)) card.fecha_fin = row.fecha_fin;
  if (typeof row.cupo === "number" && Number.isFinite(row.cupo)) card.cupo = row.cupo;
  put("disciplina", row.disciplina, 40);
  put("sede", row.sede_nombre, 80);
  put("ciudad", row.sede_ciudad || (field && field.ciudad), 80);
  put("estado", field && field.estado, 60);
  put("campo", field && field.nombre, 80);
  const organizador = [org && org.nombre, org && org.alias]
    .map((part) => (typeof part === "string" ? scrubString(part, 40) : ""))
    .filter(Boolean)
    .join(" · ");
  if (organizador) card.organizador = organizador;
  const pagina = eventPage(row);
  if (pagina) card.pagina = pagina;
  return card.title || card.fecha ? card : null;
}

function sheetLine(parts, max) {
  return scrubString(parts.filter((part) => typeof part === "string" && part.trim()).join(" · "), max);
}

// Los bloques de la página de un evento guardan trama, horario, precios y sede.
// Todas las landings de AirNation usan los mismos slugs de bloque.
function presentEventSheet(blocks, pagina) {
  if (!Array.isArray(blocks) || !blocks.length || !pagina) return null;
  const by = {};
  for (const block of blocks) {
    if (!block || block.activo === false || typeof block.slug !== "string") continue;
    by[block.slug] = block.config && typeof block.config === "object" ? block.config : {};
  }
  const ficha = { pagina };
  const subtitulo = scrubString((by.hero && by.hero.subtitulo) || "", 280);
  if (subtitulo) ficha.subtitulo = subtitulo;
  const bloques = Array.isArray(by.narrativa && by.narrativa.bloques) ? by.narrativa.bloques : [];
  const trama = bloques
    .map((b) => sheetLine([b && b.titulo, b && b.texto], 420))
    .filter(Boolean)
    .slice(0, 6);
  if (trama.length) ficha.trama = trama;
  const sede = by.sede || {};
  const lugar = sheetLine([sede.titulo, sede.descripcion, sede.direccion], 500);
  if (lugar) ficha.lugar = lugar;
  const hitos = Array.isArray(by.cronograma && by.cronograma.hitos) ? by.cronograma.hitos : [];
  const horario = hitos
    .slice(0, 12)
    .map((h) => sheetLine([h && h.hora, h && h.titulo, h && h.descripcion], 180))
    .filter(Boolean);
  if (horario.length) ficha.horario = horario;
  const ins = by.inscripcion || {};
  const ventanas = Array.isArray(ins.ventanas) ? ins.ventanas : [];
  const precios = [];
  const nota = scrubString(ins.nota || "", 200);
  if (nota) precios.push(nota);
  for (const ventana of ventanas.slice(0, 6)) {
    const incluye = Array.isArray(ventana.incluye) ? ventana.incluye.slice(0, 4).join(", ") : "";
    const line = sheetLine([ventana.nombre, ventana.precio, ventana.estado, incluye], 200);
    if (line) precios.push(line);
  }
  if (precios.length) ficha.precios = precios.slice(0, 6);
  const facs = Array.isArray(by.facciones && by.facciones.facciones) ? by.facciones.facciones : [];
  const facciones = facs
    .slice(0, 4)
    .map((f) => sheetLine([f && f.nombre, f && f.descripcion, f && f.loadout, f && f.agotada ? "agotada" : ""], 200))
    .filter(Boolean);
  if (facciones.length) ficha.facciones = facciones;
  const items = Array.isArray(by.amenidades && by.amenidades.items) ? by.amenidades.items : [];
  const incluido = items
    .map((item) => scrubString(item, 80))
    .filter(Boolean)
    .slice(0, 8);
  if (incluido.length) ficha.incluido = incluido;
  if (!ficha.trama && !ficha.horario && !ficha.precios && !ficha.lugar && !ficha.subtitulo) return null;
  return ficha;
}

function shrinkSheet(ficha) {
  for (const key of ["capsulas", "facciones", "horario", "precios", "trama", "incluido"]) {
    if (Array.isArray(ficha[key]) && ficha[key].length > 1) {
      ficha[key].pop();
      return true;
    }
  }
  if (typeof ficha.lugar === "string" && ficha.lugar.length > 180) {
    ficha.lugar = ficha.lugar.slice(0, 180).trim();
    return true;
  }
  return false;
}

// Una sola réplica no entra: alcanzaría para describir la de alguien.
function arsenalReference(rows) {
  const groups = new Map();
  const mejoras = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const sistema = typeof row.sistema === "string" ? row.sistema.trim() : "";
    const mecanismo = typeof row.mecanismo === "string" ? row.mecanismo.trim() : "";
    if (!sistema && !mecanismo) continue;
    const key = `${sistema}\n${mecanismo}`;
    const group = groups.get(key) || { sistema, mecanismo, n: 0 };
    group.n += 1;
    groups.set(key, group);
    const seen = new Set();
    for (const part of String(row.upgrades || "").split(/[,;\n|/]+/)) {
      const mejora = part.trim().slice(0, 40);
      const norm = mejora.toLowerCase();
      if (mejora.length < 3 || seen.has(norm)) continue;
      seen.add(norm);
      const prev = mejoras.get(norm) || { mejora, n: 0 };
      prev.n += 1;
      mejoras.set(norm, prev);
    }
  }
  const repeated = (map) =>
    [...map.values()]
      .filter((item) => item.n >= 2)
      .sort((a, b) => b.n - a.n)
      .slice(0, 6);
  return { replicas: repeated(groups), mejoras: repeated(mejoras) };
}

function presentField(row) {
  if (!row || typeof row !== "object") return null;
  const card = {};
  const put = (key, value, max) => {
    if (typeof value !== "string") return;
    const text = scrubString(value, max);
    if (text) card[key] = text;
  };
  put("nombre", row.nombre, 80);
  put("ciudad", row.ciudad, 60);
  put("estado", row.estado, 40);
  // fields.tipo es el acceso (publico o privado), no el tipo de entidad: no choca con «es».
  put("acceso", row.tipo, 20);
  put(
    "descripcion",
    typeof row.descripcion === "string" ? row.descripcion.replace(/https?:\/\/\S+/gi, "").replace(/\bwww\.\S+/gi, "") : "",
    80
  );
  const horario = hoursOf(row.horarios_json);
  if (horario) card.horario = horario;
  if (typeof row.slug === "string" && /^[a-z0-9-]{1,80}$/.test(row.slug)) {
    card.pagina = fieldPage(row.slug);
  }
  return card.nombre ? card : null;
}

// Lo que la ficha pública del producto pinta. precio_costo y stock no se piden.
function presentStore(row) {
  if (!row || typeof row !== "object") return null;
  const card = {};
  const put = (key, value, max) => {
    if (typeof value !== "string") return;
    const text = scrubString(value, max);
    if (text) card[key] = text;
  };
  put("nombre", row.nombre, 80);
  put("condicion", row.condicion, 20);
  put(
    "descripcion",
    typeof row.descripcion === "string" ? row.descripcion.replace(/https?:\/\/\S+/gi, "").replace(/\bwww\.\S+/gi, "") : "",
    80
  );
  const precio = typeof row.precio === "number" ? row.precio : Number(row.precio);
  if (Number.isFinite(precio) && precio > 0) card.precio = precio;
  return card.nombre ? card : null;
}

function presentOwn(row) {
  if (!row || typeof row !== "object") return null;
  const card = {};
  const put = (key, value, max) => {
    if (typeof value !== "string") return;
    const text = scrubString(value, max);
    if (text) card[key] = text;
  };
  put("nombre", row.nombre, 60);
  put("sistema", row.sistema, 40);
  put("mecanismo", row.mecanismo, 40);
  put("upgrades", row.upgrades, 80);
  return card.nombre || card.sistema ? card : null;
}

function blogCard(row) {
  if (!row || typeof row.title !== "string" || typeof row.slug !== "string") return null;
  const extracto = plainText(row.excerpt || row.content).slice(0, 180);
  const card = {
    title: row.title,
    extracto,
    enlace: blogPage(row.slug),
  };
  if (typeof row.category === "string" && row.category.trim()) card.categoria = row.category.trim();
  return card;
}

const RIVALES = { campos: "equipos", equipos: "campos" };

function shapeContext(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const arsenal = arsenalReference(src.replicas);
  const eventos = (Array.isArray(src.eventos) ? src.eventos : [])
    .slice(0, 8)
    .map(presentEvent)
    .filter(Boolean);
  // La ficha es de la página de la que salieron los bloques: la pega al evento
  // que apunta a esa misma página, sin mirar su nombre.
  const ficha = presentEventSheet(src.ficha, src.pagina);
  if (ficha) {
    const host = eventos.find((row) => row.pagina === ficha.pagina);
    if (host) host.ficha = ficha;
  }
  const datos = {
    eventos,
    // Lo que ya pasó va en su propia lista: así nunca se lee como lo que viene.
    eventos_pasados: (Array.isArray(src.eventos_pasados) ? src.eventos_pasados : []).slice(0, 3).map(presentEvent).filter(Boolean),
    campos: (Array.isArray(src.campos) ? src.campos : []).slice(0, 16).map(presentField).filter(Boolean),
    equipos: listOf(src.equipos),
    tienda: (Array.isArray(src.tienda) ? src.tienda : []).slice(0, 4).map(presentStore).filter(Boolean),
    replicas: arsenal.replicas,
    mejoras: arsenal.mejoras,
    operadores: listOf(src.operadores),
    blog: listOf(src.blog),
    tu_arsenal: (Array.isArray(src.tu_arsenal) ? src.tu_arsenal : []).slice(0, 6).map(presentOwn).filter(Boolean),
  };
  // Campos y equipos son lo único que choca por nombre: si la pregunta pide uno,
  // el otro no entra, venga de donde venga. Los demás tipos no compiten.
  if (RIVALES[src.foco]) datos[RIVALES[src.foco]] = [];
  // El tipo viaja en cada registro, no solo en el nombre de la lista: así un
  // equipo no se puede leer como un campo aunque la pregunta pida campos.
  for (const [key, entity] of Object.entries(ENTITIES)) {
    if (Array.isArray(datos[key])) datos[key] = datos[key].map((row) => ({ es: entity.tipo, ...row }));
  }
  const cap = eventos.some((row) => row.ficha) ? 5200 : src.foco ? 4200 : 2200;
  // Lo que pidió la pregunta se recorta al final, justo antes del arsenal propio.
  const base = ["blog", "tienda", "mejoras", "replicas", "operadores", "equipos", "campos", "eventos_pasados", "eventos", "tu_arsenal"];
  const dropOrder = ENTITIES[src.foco]
    ? [...base.filter((key) => key !== src.foco && key !== "tu_arsenal"), src.foco, "tu_arsenal"]
    : base;
  let guard = 0;
  while (JSON.stringify(datos).length > cap && guard < 40) {
    guard += 1;
    const key = dropOrder.find((name) => Array.isArray(datos[name]) && datos[name].length);
    if (!key) break;
    if (key === "eventos" && datos.eventos.some((row) => row.ficha)) {
      const extra = datos.eventos.findIndex((row) => !row.ficha);
      if (extra >= 0) {
        datos.eventos.splice(extra, 1);
        continue;
      }
      const hosted = datos.eventos.find((row) => row.ficha);
      if (hosted && shrinkSheet(hosted.ficha)) continue;
    }
    datos[key].pop();
  }
  return datos;
}

// Una lista por entidad: si se suma una tabla al esquema, también cuenta aquí.
function isEmptyContext(datos) {
  return Object.keys(ENTITIES).every((key) => !(datos[key] || []).length);
}

function stampContext(datos, now) {
  const window = weekendWindow(now);
  const hoy = `hoy es ${WEEKDAY_ES[window.today.weekday]} ${spokenDate(window.today.date)}; mañana es ${spokenDate(window.tomorrow)}; este fin de semana es el sábado ${spokenDate(window.saturday)} y el domingo ${spokenDate(window.sunday)}, y el viernes ${spokenDate(window.friday)} desde las 18:00`;
  const stamp = (row) => {
    if (!row || typeof row.fecha !== "string" || !row.fecha) return row;
    const local = mexicoParts(row.fecha);
    const fridayNight = local.date === window.friday && local.hour >= 18;
    const end = typeof row.fecha_fin === "string" && row.fecha_fin ? mexicoParts(row.fecha_fin) : null;
    const rest = { ...row };
    delete rest.fecha;
    delete rest.fecha_fin;
    const stamped = {
      ...rest,
      cuando: `${WEEKDAY_ES[local.weekday]} ${spokenDate(local.date)}, ${spokenClock(local.hour, Number(local.minute))}`,
      es_hoy: local.date === window.today.date,
      es_manana: local.date === window.tomorrow,
      este_fin_de_semana: local.date === window.saturday || local.date === window.sunday || fridayNight,
    };
    if (end && WEEKDAY_ES[end.weekday]) {
      stamped.hasta = `${WEEKDAY_ES[end.weekday]} ${spokenDate(end.date)}, ${spokenClock(end.hour, Number(end.minute))}`;
    }
    return stamped;
  };
  return {
    ...datos,
    eventos: datos.eventos.map(stamp),
    eventos_pasados: (datos.eventos_pasados || []).map(stamp),
    hoy,
  };
}

module.exports = {
  blogCard,
  isEmptyContext,
  shapeContext,
  stampContext,
};
