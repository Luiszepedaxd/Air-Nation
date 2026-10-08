// Las URLs públicas de airnation.online y la página propia de un evento.

function eventPage(row) {
  const raw = typeof row.url_externa === "string" ? row.url_externa.trim() : "";
  const match = raw.match(/^https:\/\/(?:www\.)?airnation\.online(\/[a-z0-9/_-]{1,80})?$/i);
  return match ? `https://www.airnation.online${match[1] || ""}` : "";
}

/**
 * Un evento con página propia en AirNation vive en /<pagina> y sus bloques en
 * la tabla <pagina>_blocks. Devuelve esa pagina a partir de url_externa, así
 * que la ficha de cualquier evento con landing se encuentra sin saber su
 * nombre. Solo una ruta de un tramo: nada de /campos/algo.
 */
function eventPageSlug(row) {
  const raw = row && typeof row.url_externa === "string" ? row.url_externa.trim() : "";
  const match = raw.match(/^https:\/\/(?:www\.)?airnation\.online\/([a-z0-9]{1,40})\/?$/i);
  return match ? match[1].toLowerCase() : "";
}

function fieldPage(slug) {
  return `https://www.airnation.online/campos/${slug}`;
}

function landingPage(slug) {
  return `https://www.airnation.online/${slug}`;
}

function blogPage(slug) {
  return `https://www.airnation.online/blog/${slug}`;
}

module.exports = {
  blogPage,
  eventPage,
  eventPageSlug,
  fieldPage,
  landingPage,
};
