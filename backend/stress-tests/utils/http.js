const config = require('../config');

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${config.BASE_URL}${path}`;
  const start = performance.now();
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const duration = performance.now() - start;
    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch { /* ignore */ }
    } else {
      await res.text();
    }
    return { status: res.status, duration, data, error: null, ok: res.ok };
  } catch (err) {
    const duration = performance.now() - start;
    return { status: 0, duration, data: null, error: err.message, ok: false };
  }
}

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const get  = (path, token)       => request(path, { method: 'GET',    headers: authHeader(token) });
const post = (path, body, token) => request(path, { method: 'POST',   headers: authHeader(token), body: JSON.stringify(body) });
const patch = (path, body, token) => request(path, { method: 'PATCH', headers: authHeader(token), body: body != null ? JSON.stringify(body) : undefined });
const del  = (path, token)       => request(path, { method: 'DELETE', headers: authHeader(token) });

const healthUrl = () => config.BASE_URL.replace(/\/api\/v1\/?$/, '') + '/health';

module.exports = { request, get, post, patch, del, healthUrl };
