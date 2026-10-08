// Cómo se filtran y se ordenan las filas contra las palabras de la pregunta.
const { plain } = require("./text");

function likeOr(columns, forms) {
  const parts = [];
  for (const form of forms) {
    const safe = String(form).replace(/[%_,().]/g, "").trim();
    if (!safe) continue;
    const value = safe.includes(" ") ? `"%${safe}%"` : `%${safe}%`;
    for (const col of columns) parts.push(`${col}.ilike.${value}`);
  }
  return parts.join(",");
}

function rowBlob(row) {
  const nested = row && row.fields;
  const fields = Array.isArray(nested) ? nested : nested ? [nested] : [];
  return plain(
    [
      row.title,
      row.nombre,
      row.sede_nombre,
      row.sede_ciudad,
      row.ciudad,
      row.estado,
      row.slug,
      ...fields.flatMap((field) => [field && field.nombre, field && field.ciudad, field && field.estado]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function matchesForms(row, forms) {
  const blob = rowBlob(row);
  return forms.some((form) => blob.includes(plain(form)));
}

function rankByTokens(rows, tokens, blobFn) {
  const words = tokens.map((token) => plain(token)).filter((token) => token.length >= 3);
  if (!words.length || rows.length < 2) return rows;
  const scored = rows.map((row) => {
    const blob = plain(blobFn(row));
    return { row, hits: words.filter((word) => blob.includes(word)).length };
  });
  const best = Math.max(...scored.map((item) => item.hits));
  if (best < 1) return rows;
  return scored.filter((item) => item.hits === best).map((item) => item.row);
}

function dedupe(rows, keyFn) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const key = keyFn(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

module.exports = {
  dedupe,
  likeOr,
  matchesForms,
  rankByTokens,
};
