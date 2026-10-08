// Todo lo que se le pregunta a Supabase por datos públicos, tabla por tabla.
const { blogCard } = require("./context");
const { focusOf, placeTokens, titleMentioned, wantsEventSheet, wantsUpcoming } = require("./intent");
const { dedupe, likeOr, matchesForms, rankByTokens } = require("./match");
const { eventPageSlug, landingPage } = require("./pages");
const { ENTITIES } = require("./schema");
const { blogTokens, expandName, nameTokens } = require("./text");

async function safeQuery(query) {
  try {
    const { data, error } = await query;
    if (error || !Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function upcomingQuery(supabase, now) {
  return supabase
    .from(ENTITIES.eventos.tabla)
    .select("title, fecha, sede_nombre, sede_ciudad, disciplina, url_externa, fields(nombre, ciudad, estado)")
    .eq("published", true)
    .eq("status", "publicado")
    .gte("fecha", now)
    .order("fecha", { ascending: true })
    .limit(4);
}

// ponytail: un año de historia y tres registros alcanzan para decir «antes ha
// habido algo así»; si hace falta más memoria, los dos topes viven aquí.
const PAST_DAYS = 365;
const PAST_LIMIT = 3;

// Lo que ya pasó y coincide con la pregunta. Solo entra a DATOS cuando no hay
// nada próximo que coincida, y nunca sirve para prometer que se repetirá.
function pastQuery(supabase, now, filter) {
  const since = new Date(Date.parse(now) - PAST_DAYS * 86400000).toISOString();
  return supabase
    .from(ENTITIES.eventos_pasados.tabla)
    .select(ENTITIES.eventos_pasados.select)
    .eq("published", true)
    .eq("status", "publicado")
    .lt("fecha", now)
    .gte("fecha", since)
    .or(filter)
    .order("fecha", { ascending: false })
    .limit(PAST_LIMIT);
}

async function loadOwnArsenal(supabase, ownerId) {
  const id = String(ownerId || "").trim();
  if (!id || id.length > 80 || /\s/.test(id)) return [];
  return safeQuery(
    supabase
      .from(ENTITIES.tu_arsenal.tabla)
      .select(ENTITIES.tu_arsenal.select)
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(6)
  );
}

// Dónde queda un lugar que no es nombre de campo: lo dicen las otras tablas que
// guardan ciudad y estado. Solo sirve para acotar los campos a ese estado.
async function statesOf(supabase, places) {
  const filtroCiudad = likeOr(["ciudad", "estado"], places);
  if (!filtroCiudad) return [];
  const [equipos, eventos] = await Promise.all([
    safeQuery(
      supabase.from(ENTITIES.equipos.tabla).select("ciudad, estado").eq("status", "activo").or(filtroCiudad).limit(4)
    ),
    safeQuery(
      supabase
        .from(ENTITIES.eventos.tabla)
        .select("sede_ciudad, fields(estado)")
        .eq("published", true)
        .or(likeOr(["sede_ciudad"], places))
        .limit(4)
    ),
  ]);
  const nested = (row) => {
    const field = row && (Array.isArray(row.fields) ? row.fields[0] : row.fields);
    return field && typeof field.estado === "string" ? field.estado : "";
  };
  const estados = [...equipos.map((row) => (row && typeof row.estado === "string" ? row.estado : "")), ...eventos.map(nested)]
    .map((estado) => estado.trim())
    .filter(Boolean);
  return [...new Set(estados)].slice(0, 3);
}

async function fieldCatalog(supabase, message) {
  const places = placeTokens(message);
  const listed = (filter) => {
    let query = supabase.from(ENTITIES.campos.tabla).select(ENTITIES.campos.select).eq("status", "aprobado");
    if (filter) query = query.or(filter);
    else query = query.order("nombre");
    return safeQuery(query.limit(16));
  };
  if (!places.length) return listed("");
  const matched = await listed(likeOr(["nombre", "slug", "ciudad", "estado"], places));
  if (matched.length) {
    return rankByTokens(matched, places, (row) => `${row.nombre || ""} ${row.slug || ""} ${row.ciudad || ""} ${row.estado || ""}`);
  }
  // Ningún campo se llama ni está en eso. No significa que no haya campos: la
  // ciudad del campo es el municipio, y la palabra puede no ser un lugar. Si
  // otra tabla ubica el lugar, los campos de ese estado; si no, el catálogo.
  // El prompt ya obliga a decir la ciudad que trae cada campo.
  const estados = await statesOf(supabase, places);
  if (estados.length) {
    const inState = await listed(likeOr(["estado"], estados));
    if (inState.length) return inState;
  }
  return listed("");
}

async function loadPublicContext(supabase, message) {
  const forms = [...new Set(nameTokens(message).flatMap(expandName))];
  const now = new Date().toISOString();
  const calendar = wantsUpcoming(message);
  const foco = focusOf(message);
  // Sin foco se consulta todo. Con foco, solo esa tabla: las demás no hacen falta
  // y traerlas es lo que deja un equipo a mano cuando preguntaron por campos.
  const wants = (key) => !foco || foco === key;
  if (forms.length) {
    const words = forms.filter((form) => !form.includes(" "));
    const spaced = forms.filter((form) => form.includes(" "));
    const filter = (columns) => likeOr(columns, words);
    const tagged = [];
    const pushJob = (kind, query) => tagged.push(safeQuery(query).then((rows) => ({ kind, rows })));
    if (words.length) {
      if (wants("eventos")) {
        pushJob(
          "eventos",
          supabase
            .from(ENTITIES.eventos.tabla)
            .select(ENTITIES.eventos.select)
            .eq("published", true)
            .eq("status", "publicado")
            .gte("fecha", now)
            .or(filter(["title", "sede_nombre", "sede_ciudad"]))
            .limit(4)
        );
      }
      if (wants("campos")) {
        pushJob(
          "campos",
          supabase
            .from(ENTITIES.campos.tabla)
            .select(ENTITIES.campos.select)
            .eq("status", "aprobado")
            .or(filter(["nombre", "slug", "ciudad", "estado"]))
            .limit(16)
        );
      }
      if (wants("equipos")) {
        pushJob(
          "equipos",
          supabase
            .from(ENTITIES.equipos.tabla)
            .select(ENTITIES.equipos.select)
            .eq("status", "activo")
            .or(filter(["nombre", "slug", "ciudad", "estado"]))
            .limit(4)
        );
      }
      if (wants("tienda")) {
        pushJob(
          "tienda",
          supabase
            .from(ENTITIES.tienda.tabla)
            .select(ENTITIES.tienda.select)
            .eq("activo", true)
            .or(filter(["nombre", "slug"]))
            .limit(4)
        );
      }
      if (wants("replicas")) {
        pushJob(
          "replicas",
          supabase.from(ENTITIES.replicas.tabla).select(ENTITIES.replicas.select).or(filter(["sistema", "mecanismo"])).limit(40)
        );
        pushJob("operadores", supabase.from(ENTITIES.operadores.tabla).select(ENTITIES.operadores.select).or(filter(["alias"])).limit(3));
      }
    }
    for (const form of spaced) {
      const pattern = `%${form}%`;
      if (wants("eventos")) {
        pushJob(
          "eventos",
          supabase
            .from(ENTITIES.eventos.tabla)
            .select(ENTITIES.eventos.select)
            .eq("published", true)
            .eq("status", "publicado")
            .gte("fecha", now)
            .ilike("title", pattern)
            .limit(4)
        );
      }
      if (wants("campos")) {
        pushJob(
          "campos",
          supabase.from(ENTITIES.campos.tabla).select(ENTITIES.campos.select).eq("status", "aprobado").ilike("nombre", pattern).limit(4)
        );
      }
      if (wants("equipos")) {
        pushJob(
          "equipos",
          supabase.from(ENTITIES.equipos.tabla).select(ENTITIES.equipos.select).eq("status", "activo").ilike("nombre", pattern).limit(4)
        );
      }
      if (wants("tienda")) {
        pushJob(
          "tienda",
          supabase.from(ENTITIES.tienda.tabla).select(ENTITIES.tienda.select).eq("activo", true).ilike("nombre", pattern).limit(4)
        );
      }
      if (wants("replicas")) {
        pushJob(
          "replicas",
          supabase.from(ENTITIES.replicas.tabla).select(ENTITIES.replicas.select).or(likeOr(["sistema", "mecanismo"], [form])).limit(40)
        );
      }
    }
    const topics = wants("blog") ? blogTokens(message) : [];
    if (topics.length) {
      pushJob(
        "blog",
        supabase
          .from(ENTITIES.blog.tabla)
          .select(ENTITIES.blog.select)
          .eq("published", true)
          .or(likeOr(["title", "category", "excerpt", "content"], topics))
          .limit(2)
      );
    }
    if (wants("eventos")) {
      pushJob("proximos", upcomingQuery(supabase, now));
      if (words.length) pushJob("pasados", pastQuery(supabase, now, filter(["title", "sede_nombre", "sede_ciudad"])));
    }
    const found = await Promise.all(tagged);
    const bucket = { eventos: [], campos: [], equipos: [], tienda: [], replicas: [], operadores: [], proximos: [], pasados: [], blog: [] };
    for (const item of found) bucket[item.kind].push(...item.rows);
    const agenda = calendar ? bucket.proximos : bucket.proximos.filter((row) => matchesForms(row, forms));
    const events = dedupe([...bucket.eventos, ...agenda], (row) => `${row.title}|${row.fecha}`);
    const fields = rankByTokens(
      dedupe(bucket.campos, (row) => row.slug || row.nombre),
      forms,
      (row) => `${row.nombre || ""} ${row.slug || ""} ${row.ciudad || ""} ${row.estado || ""}`
    );
    const teams = dedupe(bucket.equipos, (row) => row.slug || row.nombre);
    const tienda = dedupe(bucket.tienda, (row) => row.slug || row.nombre);
    const replicas = dedupe(bucket.replicas, (row) => row.id || `${row.sistema}|${row.mecanismo}|${row.upgrades}`);
    const operadores = dedupe(
      bucket.operadores.map((row) => (row && row.alias ? { alias: row.alias } : null)).filter(Boolean),
      (row) => row.alias
    );
    const blog = dedupe(bucket.blog.map(blogCard).filter(Boolean), (row) => row.enlace).slice(0, 2);
    // Si lo que preguntaron no está por venir, lo que ya pasó es la única pista.
    // Cuenta lo que coincide con la pregunta, no la agenda completa: pedir «los
    // próximos en tal ciudad» trae la agenda aunque ahí no haya nada.
    const hayProximo = bucket.eventos.length > 0 || agenda.some((row) => matchesForms(row, forms));
    const pasados = hayProximo
      ? []
      : rankByTokens(
          dedupe(bucket.pasados, (row) => `${row.title}|${row.fecha}`),
          forms,
          (row) => `${row.title || ""} ${row.sede_nombre || ""} ${row.sede_ciudad || ""}`
        ).slice(0, PAST_LIMIT);
    if (
      events.length ||
      pasados.length ||
      fields.length ||
      teams.length ||
      tienda.length ||
      replicas.length ||
      operadores.length ||
      blog.length ||
      foco
    ) {
      const packed = wants("eventos") ? await packEvents(supabase, events, message, now) : { eventos: [] };
      // Con foco en campos el catálogo manda: él decide qué campos salen.
      const catalog = foco === "campos" ? await fieldCatalog(supabase, message) : null;
      return {
        eventos: packed.eventos,
        eventos_pasados: pasados,
        campos: catalog || fields,
        equipos: teams,
        tienda,
        replicas,
        operadores,
        blog,
        ficha: packed.ficha,
        pagina: packed.pagina,
        foco,
      };
    }
  }

  const camposJob = () => {
    if (foco === "campos") return fieldCatalog(supabase, message);
    if (!wants("campos")) return [];
    return safeQuery(
      supabase
        .from(ENTITIES.campos.tabla)
        .select("nombre, slug, ciudad, estado")
        .eq("status", "aprobado")
        .order("nombre")
        .limit(4)
    );
  };
  const [upcoming, fields, teams] = await Promise.all([
    wants("eventos") ? safeQuery(upcomingQuery(supabase, now)) : [],
    camposJob(),
    wants("equipos")
      ? safeQuery(
          supabase.from(ENTITIES.equipos.tabla).select("nombre, slug, ciudad, estado").eq("status", "activo").order("nombre").limit(4)
        )
      : [],
  ]);
  const packed = wants("eventos") ? await packEvents(supabase, upcoming, message, now) : { eventos: [] };
  return {
    eventos: packed.eventos,
    campos: fields,
    equipos: teams,
    tienda: [],
    replicas: [],
    operadores: [],
    blog: [],
    ficha: packed.ficha,
    pagina: packed.pagina,
    foco,
  };
}

async function packEvents(supabase, events, message, now) {
  let rows = events;
  const thin = !rows.some((row) => row && typeof row.descripcion === "string" && row.descripcion.trim());
  if (wantsEventSheet(message) && thin) {
    const rich = await safeQuery(
      supabase
        .from(ENTITIES.eventos.tabla)
        .select(ENTITIES.eventos.select)
        .eq("published", true)
        .eq("status", "publicado")
        .gte("fecha", now)
        .order("fecha", { ascending: true })
        .limit(3)
    );
    rows = dedupe([...rich, ...rows], (row) => `${row.title}|${row.fecha}`);
  }
  // La ficha es de un evento con página propia: el que nombra la pregunta, y si
  // piden detalle y no nombran ninguno, el más cercano de los que tienen página.
  const withPage = rows.filter((row) => eventPageSlug(row));
  const host =
    withPage.find((row) => titleMentioned(message, row.title)) || (wantsEventSheet(message) ? withPage[0] : null);
  if (!host) return { eventos: rows, ficha: null };
  const slug = eventPageSlug(host);
  const ficha = await safeQuery(
    supabase.from(`${slug}_blocks`).select("slug, config, activo").eq("activo", true).order("orden", { ascending: true })
  );
  return { eventos: rows, ficha, pagina: landingPage(slug) };
}

module.exports = {
  loadOwnArsenal,
  loadPublicContext,
};
