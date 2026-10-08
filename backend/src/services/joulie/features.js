/**
 * Lo que alguien puede hacer por su cuenta en AirNation: una línea por página
 * pública de la app, con su ruta. Es la única fuente de verdad de lo que
 * JOULIE puede ofrecer; si una función no está aquí, para ella no existe.
 *
 * Cada ruta es una página real de la app (frontend/app/<ruta>/page.tsx) y todas
 * piden sesión. La prueba de joulie.test.js las verifica contra el frontend, así
 * que una ruta que se mueva o se borre rompe el test, no la conversación.
 */
const FEATURES = [
  { que: "crear un evento, público o privado", ruta: "/eventos/nuevo" },
  { que: "registrar un campo", ruta: "/campos/nuevo" },
  { que: "crear un equipo", ruta: "/equipos/nuevo" },
  { que: "registrar tus réplicas en tu arsenal", ruta: "/dashboard/arsenal" },
  { que: "tramitar tu credencial de operador", ruta: "/dashboard/credencial" },
];

function featureLine() {
  return FEATURES.map((feature) => `${feature.que}: ${feature.ruta}`).join("; ");
}

module.exports = {
  FEATURES,
  featureLine,
};
