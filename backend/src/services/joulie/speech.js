/**
 * La única salida de voz de JOULIE: el texto justo antes de hablarse, con todas
 * sus cifras dichas como se dicen en México. Horas, rangos de horas, fechas,
 * dinero, porcentajes, unidades, ordinales y números sueltos pasan por aquí, y
 * solo por aquí. El chat de texto no: ahí «$1,299 MXN» y «11:00–20:00» se leen
 * bien tal cual.
 *
 * La hora la dice clockPhrase, de time.js: la misma función que arma el horario
 * de un campo y la fecha de un evento, así que la voz nunca puede decir una
 * hora distinta de la que dice DATOS.
 */
const { clockPhrase, spokenDate } = require("./time");

const UNITS = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];

const TENS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

const HUNDREDS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function under1000(n) {
  if (n < 30) return UNITS[n];
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)];
    return n % 10 ? `${tens} y ${UNITS[n % 10]}` : tens;
  }
  if (n === 100) return "cien";
  const rest = n % 100;
  const hundreds = HUNDREDS[Math.floor(n / 100)];
  return rest ? `${hundreds} ${under1000(rest)}` : hundreds;
}

// Delante de un sustantivo es «un», no «uno»: un peso, veintiún mil, ciento un pesos.
function apocope(words) {
  return words.replace(/veintiuno$/, "veintiún").replace(/\buno$/, "un");
}

function underMillion(n) {
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const parts = [];
  if (thousands === 1) parts.push("mil");
  else if (thousands) parts.push(`${apocope(under1000(thousands))} mil`);
  if (rest || !thousands) parts.push(under1000(rest));
  return parts.join(" ");
}

function numberWords(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 999999999) return "";
  if (n < 1000000) return underMillion(n);
  const millions = Math.floor(n / 1000000);
  const rest = n % 1000000;
  const head = millions === 1 ? "un millón" : `${apocope(underMillion(millions))} millones`;
  return rest ? `${head} ${underMillion(rest)}` : head;
}

function decimalWords(digits, frac) {
  const head = numberWords(digits);
  if (!head || !frac) return head;
  const decimals = frac
    .split("")
    .map((digit) => UNITS[Number(digit)])
    .join(" ");
  return `${head} punto ${decimals}`;
}

// «1,299» son miles; «1.5», un decimal.
function numberText(digits) {
  const plain = String(digits);
  if (/,\d{3}/.test(plain)) return numberWords(plain.replace(/,/g, ""));
  const [whole, frac] = plain.split(/[.,]/);
  return decimalWords(whole, frac);
}

// ".5" son cincuenta centavos; ".05", cinco.
function centsOf(frac) {
  if (!frac) return 0;
  return Number(frac.length === 1 ? `${frac}0` : frac.slice(0, 2));
}

function moneyWords(digits, frac, unit) {
  const n = Number(digits);
  const words = numberWords(n);
  if (!words) return "";
  const dolares = /usd|d[oó]lar/i.test(unit);
  const name = dolares ? (n === 1 ? "dólar" : "dólares") : n === 1 ? "peso" : "pesos";
  const cents = centsOf(frac);
  const centavos = cents ? `${apocope(numberWords(cents))} ${cents === 1 ? "centavo" : "centavos"}` : "";
  if (!n && centavos) return centavos;
  // Un millón de pesos lleva «de»; mil doscientos pesos, no.
  const head = n >= 1000000 && n % 1000000 === 0 ? `${words} de ${name}` : `${apocope(words)} ${name}`;
  return centavos ? `${head} con ${centavos}` : head;
}

const UNIT_NAMES = {
  km: ["kilómetro", "kilómetros"],
  cm: ["centímetro", "centímetros"],
  mm: ["milímetro", "milímetros"],
  m: ["metro", "metros"],
  j: ["julio", "julios"],
  julio: ["julio", "julios"],
  julios: ["julio", "julios"],
  // fps se dice por sus letras, como en el campo.
  fps: ["fps", "fps"],
};

function unitWords(digits, unit) {
  const words = numberText(digits);
  if (!words) return "";
  const names = UNIT_NAMES[String(unit).toLowerCase()];
  if (!names) return words;
  const one = Number(String(digits).replace(/,/g, "")) === 1;
  return `${one ? apocope(words) : words} ${one ? names[0] : names[1]}`;
}

// ponytail: del primero al décimo, que es lo que se dice en una frase hablada.
// Más arriba, el ordinal se queda en cifras.
const ORDINAL_WORDS = [
  "",
  "primero",
  "segundo",
  "tercero",
  "cuarto",
  "quinto",
  "sexto",
  "séptimo",
  "octavo",
  "noveno",
  "décimo",
];

const say = (value) => numberWords(value) || String(value);
const clockSaid = (hour, minute) => clockPhrase(Number(hour), Number(minute) || 0, say);

// Una dirección no se dice ni se toca: sus dígitos son parte de la dirección.
const URL_RE = /(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:online|com|mx|net|org)\b(?:\/\S*)?/gi;

function replaceOutsideUrls(text, pattern, swap) {
  const spans = [];
  for (const found of text.matchAll(URL_RE)) spans.push([found.index, found.index + found[0].length]);
  return text.replace(pattern, (...args) => {
    const offset = args[args.length - 2];
    if (spans.some(([from, to]) => offset >= from && offset < to)) return args[0];
    return swap(...args);
  });
}

const CLOCK = "([01]?\\d|2[0-3]):([0-5]\\d)";
// «11:00–20:00», «11:00 - 20:00» y «de 11:00 a 20:00»: un rango se dice de corrido.
const CLOCK_RANGE_RE = new RegExp(`(?:\\bde\\s+)?\\b${CLOCK}(?:\\s*[\\u2013\\u2014-]\\s*|\\s+a\\s+)${CLOCK}\\b`, "g");
const AMPM_RE = /\b(\d{1,2})(?::([0-5]\d))?\s*([ap])\.?\s?m\.?(?![\wáéíóúñ])/gi;
const CLOCK_RE = new RegExp(`\\b${CLOCK}\\b`, "g");
// Fecha de México: primero el día.
const DATE_RE = /\b(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])(?:\/(\d{4}|\d{2}))?\b/g;
const PERCENT_RE = /\b(\d{1,3}(?:,\d{3})*|\d+)(?:[.,](\d+))?\s*%/g;
const NUM = "\\d{1,3}(?:,\\d{3})+|\\d+(?:[.,]\\d+)?";
const UNIT = "km|cm|mm|julios?|fps|m|j";
const UNIT_RANGE_RE = new RegExp(
  `(?:\\bde\\s+)?\\b(${NUM})(?:\\s*[\\u2013\\u2014-]\\s*|\\s+a\\s+)(${NUM})\\s*(${UNIT})\\b`,
  "gi"
);
const UNIT_RE = new RegExp(`\\b(${NUM})\\s*(${UNIT})\\b`, "gi");
// El espacio solo se consume si trae moneda: «1,299 personas» no pierde el suyo.
const MONEY_RE = /(\$\s*)?\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?(?:\s*(MXN|pesos?|usd|d[oó]lares?)\b)?/gi;
const ORDINAL_RE = /\b(\d{1,2})(?:º|ª|er|do|ro|to|mo|vo|no)\b/gi;
// Un número suelto: nunca uno pegado a letras, que ahí es un modelo (M4, HK416).
const NUMBER_RE = new RegExp(`\\b(${NUM})\\b`, "g");

/**
 * El texto listo para hablarse. Cada paso corre sobre lo que dejó el anterior,
 * de lo más específico a lo más general, y ninguno entra en una URL.
 */
function speakText(value) {
  const text = String(value == null ? "" : value);
  if (!/[\d%$]|\bMXN\b/i.test(text)) return text;
  let out = text;
  out = replaceOutsideUrls(out, CLOCK_RANGE_RE, (full, fromHour, fromMin, toHour, toMin) => {
    const from = clockSaid(fromHour, fromMin);
    const to = clockSaid(toHour, toMin);
    return from && to ? `de ${from} a ${to}` : full;
  });
  out = replaceOutsideUrls(out, AMPM_RE, (full, hour, minute, half) => {
    const h = (Number(hour) % 12) + (/p/i.test(half) ? 12 : 0);
    // «8 pm.» al final de la frase: el punto de la abreviatura también cierra la frase.
    const said = clockSaid(h, minute);
    return said ? `${said}${full.endsWith(".") ? "." : ""}` : full;
  });
  out = replaceOutsideUrls(out, CLOCK_RE, (full, hour, minute) => clockSaid(hour, minute) || full);
  out = replaceOutsideUrls(out, DATE_RE, (full, day, month, year) => {
    const full4 = year && year.length === 2 ? `20${year}` : year;
    const said = spokenDate(`${full4 || 2000}-${month}-${day}`);
    return year ? said : said.replace(/ de \d{4}$/, "");
  });
  out = replaceOutsideUrls(out, PERCENT_RE, (full, digits, frac) => {
    const words = decimalWords(digits.replace(/,/g, ""), frac);
    return words ? `${words} por ciento` : full;
  });
  out = replaceOutsideUrls(out, UNIT_RANGE_RE, (full, from, to, unit) => {
    const low = numberText(from);
    const high = unitWords(to, unit);
    return low && high ? `de ${low} a ${high}` : full;
  });
  out = replaceOutsideUrls(out, UNIT_RE, (full, digits, unit) => unitWords(digits, unit) || full);
  out = replaceOutsideUrls(out, MONEY_RE, (full, sign, digits, frac, unit) => {
    const plain = digits.replace(/,/g, "");
    if (sign || unit) return moneyWords(plain, frac, unit || "") || full;
    if (!digits.includes(",")) return full;
    return decimalWords(plain, frac) || full;
  });
  out = replaceOutsideUrls(out, ORDINAL_RE, (full, digits) => {
    const word = ORDINAL_WORDS[Number(digits)] || "";
    if (!word) return full;
    return /er\b|ro\b/i.test(full) ? word.replace(/o$/, "") : word;
  });
  out = replaceOutsideUrls(out, NUMBER_RE, (full) => numberText(full) || full);
  // «1 de la tarde» ya en cifras (el horario de un campo): la una es femenina.
  out = out.replace(/\buno(?=(?: y [a-záéíóú]+)? de la (?:mañana|tarde|noche)\b)/g, "una");
  return out.replace(/\bMXN\b/gi, "pesos");
}

// Una cifra puede llegar partida entre dos deltas: «$1,2» y «99 MXN», «11:» y
// «00–20:00», «10/» y «10». Decir el primer trozo diría otra cosa.
// Un «de» justo antes también espera: el rango lo dice él mismo («de once a ocho»).
const TAIL_RE = /(?:\bde\s+)?(?:\$|\d)[\d.,:%/–—\s-]*[A-Za-zÁÉÍÓÚáéíóúñÑºª.]{0,7}$/;

/**
 * Hasta dónde se puede hablar de lo que va llegando: lo que toca el final y
 * todavía puede crecer se guarda para el siguiente delta, y lo que quede se
 * dice al cerrar el stream.
 */
function speakableCut(buffer) {
  const text = String(buffer == null ? "" : buffer);
  const match = TAIL_RE.exec(text);
  if (match) return match.index;
  // Una palabra a medias tampoco se dice: cortar entre la «S» y el «75» de «S75»
  // diría «Ssetenta y cinco», porque el siguiente trozo empieza en cifra.
  const word = /[\p{L}\p{N}]+$/u.exec(text);
  return word ? word.index : text.length;
}

module.exports = {
  numberWords,
  speakText,
  speakableCut,
};
