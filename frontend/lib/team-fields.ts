/** Misma lista que backend/src/lib/teamFields.js */
const ESTADOS_MX = new Set([
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Coahuila de Zaragoza",
  "Colima",
  "Durango",
  "Estado de México",
  "México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Michoacán de Ocampo",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Veracruz de Ignacio de la Llave",
  "Yucatán",
  "Zacatecas",
]);

const CIUDAD_INVALIDA = "Elige una ciudad válida de la lista.";

export function teamFieldError(fields: {
  nombre?: unknown;
  ciudad?: unknown;
  estado?: unknown;
}): string | null {
  const nombre = fields.nombre;
  const ciudad = fields.ciudad;
  const estado = fields.estado;
  const n = typeof nombre === "string" ? nombre.trim() : "";
  const c = typeof ciudad === "string" ? ciudad.trim() : "";
  const e = typeof estado === "string" ? estado.trim() : "";

  if (n.length < 2 || n.length > 60 || n.includes("<") || n.includes(">")) {
    return "El nombre del equipo debe tener entre 2 y 60 caracteres, sin < ni >.";
  }
  if (
    c.length < 2 ||
    c.length > 80 ||
    c.includes("<") ||
    c.includes(">") ||
    c.toLowerCase() === "otra"
  ) {
    return CIUDAD_INVALIDA;
  }
  if (!ESTADOS_MX.has(e)) {
    return CIUDAD_INVALIDA;
  }
  return null;
}
