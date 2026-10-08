// Normalizar y partir en palabras lo que dijo quien habla. Sin acentos, sin relleno.

const STOP = new Set(
  "que,cual,como,donde,cuando,para,por,los,las,una,uno,del,con,hay,son,esta,este,sobre,airsoft,airnation,joulie,evento,eventos,campo,campos,equipo,equipos,replica,replicas,partida,partidas,tiene,tienen,desde,hasta,pero,tambien,todo,todos,estan,onda,sabes,sabe,dime,decir,info,algo,hola,buenas,puedes,puede,ayuda,quiero,necesito,eres,soy,esta,estas,nos,orale,perdon,mmm,gracias,visto,habia,buscar,yoli,seria,hoy,hacer,interrumpiendo,fin,semana,finde".split(
    ","
  )
);

const BLOG_KEEP = new Set(["replica", "replicas", "aeg", "gbb", "gbbr", "fps", "mantenimiento"]);

function plain(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function plainText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function keywords(message) {
  return String(message || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && word.length <= 30 && !STOP.has(word))
    .slice(0, 6);
}

function nameTokens(message) {
  return keywords(message);
}

function blogTokens(message) {
  return plain(message)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && word.length <= 30 && (BLOG_KEEP.has(word) || !STOP.has(word)))
    .filter((word, index, all) => all.indexOf(word) === index)
    .slice(0, 6);
}

function expandName(word) {
  const forms = [word];
  const split = String(word).match(/^([a-z]{3,})(\d{1,4})$/);
  if (split) forms.push(`${split[1]} ${split[2]}`, split[1]);
  // La pregunta suele venir en plural y el registro está en singular. El
  // singular es subcadena del plural, así que buscar por él encuentra los dos.
  const singular = String(word).match(/^(.{4,}?)(?:es|s)$/);
  if (singular) forms.push(singular[1]);
  return forms;
}

function takeSentence(buffer) {
  const match = /[.!?](?:\s|$)/.exec(buffer);
  if (!match) return null;
  const end = match.index + 1;
  const sentence = buffer.slice(0, end).trim();
  if (sentence.length < 2) return null;
  return { sentence, rest: buffer.slice(end).trimStart() };
}

module.exports = {
  blogTokens,
  expandName,
  nameTokens,
  plain,
  plainText,
  takeSentence,
};
