/** Rutas públicas bajo /api/v1 (req.path tras el mount). */
const PUBLIC_ROUTES = [
  { method: "GET", re: /^\/teams\/search$/ },
  { method: "GET", re: /^\/teams$/ },
  { method: "GET", re: /^\/teams\/[0-9a-f-]{36}$/i },
  { method: "GET", re: /^\/replicas\/[^/]+$/ },
  { method: "GET", re: /^\/users\/[0-9a-f-]{36}$/i },
  { method: "POST", re: /^\/users\/register$/ },
  { method: "GET", re: /^\/docs$/ },
  { method: "POST", re: /^\/feedback$/ },
  { method: "POST", re: /^\/ranking\/solicitudes$/ },
  { method: "POST", re: /^\/account\/delete-request$/ },
  { method: "GET", re: /^\/search$/ },
  { method: "POST", re: /^\/stripe\/create-payment-intent$/ },
  { method: "POST", re: /^\/stripe\/webhook$/ },
  { method: "POST", re: /^\/joulie\/llm\/chat\/completions$/ },
  { method: "GET", re: /^\/upload\/video\/health$/ },
  { method: "GET", re: /^\/tournaments\/public\/[^/]+$/ },
  { method: "GET", re: /^\/tournaments\/templates\/(players|referees)$/ },
  { method: "GET", re: /^\/arena\/landing-media$/ },
  { method: "GET", re: /^\/arena\/marketplace$/ },
  { method: "GET", re: /^\/arena\/fields\/[^/]+$/ },
  { method: "GET", re: /^\/arena\/fields\/[^/]+\/open-days$/ },
  { method: "POST", re: /^\/arena\/bookings$/ },
  { method: "POST", re: /^\/arena\/checkout$/ },
  { method: "GET", re: /^\/arena\/checkout\/[^/]+$/ },
  { method: "GET", re: /^\/arena\/bookings\/[^/]+$/ },
  { method: "POST", re: /^\/arena\/bookings\/[^/]+\/pay$/ },
  { method: "POST", re: /^\/arena\/bookings\/[^/]+\/cancel$/ },
  { method: "GET", re: /^\/arena\/bookings\/[^/]+\/qr\.png$/ },
  { method: "POST", re: /^\/arena\/payments\/webhook\/[^/]+$/ },
  { method: "POST", re: /^\/arena\/payments\/mock\/[^/]+\/complete$/ },
];

function isPublicApiRoute(method, path) {
  const m = String(method || "GET").toUpperCase();
  const p = path.split("?")[0] || "/";
  return PUBLIC_ROUTES.some((rule) => rule.method === m && rule.re.test(p));
}

module.exports = { isPublicApiRoute, PUBLIC_ROUTES };
