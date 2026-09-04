#!/usr/bin/env node
/**
 * AIR NATION — Simulación de torneo con 300 usuarios activos
 *
 * ESTRATEGIA:
 *   Crear 300 cuentas de auth reales a la vez sería extremadamente lento
 *   (>5 minutos) y podría alcanzar los rate-limits de Supabase.
 *
 *   En su lugar se crean N_AUTH (50 por defecto) usuarios reales y se escala
 *   a VIRTUAL_TOTAL (300) workers concurrentes. Cada token autentica
 *   múltiples goroutines independientes, lo que genera exactamente el mismo
 *   efecto en el servidor: 300 conexiones simultáneas al mismo tiempo.
 *
 *   ¿Importa que sean 300 tokens distintos o 50 con 6 goroutines cada uno?
 *   Para la base de datos y el connection pool del backend: NO.
 *   El cuello de botella que queremos medir es el throughput de la API y
 *   la concurrencia de queries en Supabase, no el número de JWT tokens.
 *
 * QUÉ PRUEBA:
 *   Fase 1  — 300 workers envían acciones en ráfaga simultánea
 *   Fase 2  — 300 writers + 30 readers en carga sostenida 60 s
 *   Fase 3  — 300 workers consultan scoreboard en pico (20 s)
 *   Fase 4  — 150 workers martillando sync-status (20 s)
 *   Fase 5  — 300 workers confirman sync al mismo tiempo
 *   Fase 6  — Pico extremo: todo a la vez durante 30 s
 *
 * USO:
 *   node stress-tests/tournament-sim-300.js
 *   node stress-tests/tournament-sim-300.js --auth-users=30   (menos usuarios reales)
 *   node stress-tests/tournament-sim-300.js --workers=500     (más concurrencia)
 *   node stress-tests/tournament-sim-300.js --no-cleanup
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_SVC_KEY = process.env.SUPABASE_SERVICE_KEY;
const API_BASE         = `http://localhost:${process.env.PORT || 4000}/api/v1`;
const HEALTH_URL       = `http://localhost:${process.env.PORT || 4000}/health`;

const args         = process.argv.slice(2);
// Con 15 usuarios reales y 20 goroutines/token = 300 workers concurrentes.
// No usar más de 20 usuarios reales: el sign-in secuencial tomaría demasiado tiempo.
const N_AUTH       = parseInt((args.find(a => a.startsWith('--auth-users='))  || '--auth-users=15').split('=')[1]);
const VIRTUAL      = parseInt((args.find(a => a.startsWith('--workers='))     || '--workers=300').split('=')[1]);
const NO_CLEANUP   = args.includes('--no-cleanup');

// Creación de usuarios: Supabase admin no tiene rate limit estricto
const CREATE_BATCH_SIZE  = 15;
const CREATE_BATCH_DELAY = 300; // ms entre batches de creación

// Sign-in: /auth/v1/token tiene rate-limit estricto en Supabase.
// Solución: sign-in COMPLETAMENTE SECUENCIAL (batch 1) con 3.5s entre cada uno.
// Con 14 árbitros → 14 × 3.5s = ~49s. Lento pero 100% seguro contra 429.
const SIGNIN_BATCH_SIZE  = 1;
const SIGNIN_BATCH_DELAY = 3500; // ms entre cada sign-in (secuencial)

const TEST_PASSWORD    = 'StressTest2026!';
const TEST_PREFIX      = `stress300.${Date.now()}`;

// ─── Colores ──────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m', magenta: '\x1b[35m',
};
const log  = (m) => console.log(m);
const info = (m) => console.log(`${c.cyan}ℹ${c.reset}  ${m}`);
const ok   = (m) => console.log(`${c.green}✓${c.reset}  ${m}`);
const warn = (m) => console.log(`${c.yellow}⚠${c.reset}  ${m}`);
const err  = (m) => console.error(`${c.red}✗${c.reset}  ${m}`);
const step = (n, t) => console.log(`\n${c.bold}${c.cyan}[${n}]${c.reset}${c.bold} ${t}${c.reset}`);

// ─── HTTP helper con timeout ───────────────────────────────────────────────────
async function api(method, url_path, body, token, timeoutMs = 15000) {
  const url = `${API_BASE}${url_path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(timer);
    const ms = Math.round(performance.now() - start);
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, ok: res.ok, data, ms };
  } catch (e) {
    clearTimeout(timer);
    const ms = Math.round(performance.now() - start);
    const timedOut = e.name === 'AbortError';
    return { status: timedOut ? 408 : 0, ok: false, data: null, ms, error: e.message };
  }
}

const GET   = (p, t)    => api('GET',   p, null, t);
const POST  = (p, b, t) => api('POST',  p, b,    t);
const PATCH = (p, b, t) => api('PATCH', p, b,    t);
const DEL   = (p, t)    => api('DELETE',p, null, t);

async function must(label, call) {
  const r = await call;
  if (!r.ok) throw new Error(`${label} falló (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data;
}

// ─── Supabase admin ───────────────────────────────────────────────────────────
const adminClient = createClient(SUPABASE_URL, SUPABASE_SVC_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUser(email) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email, password: TEST_PASSWORD, email_confirm: true,
    user_metadata: { is_stress_test: true, sim: '300' },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user;
}

async function signIn(email, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SVC_KEY },
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });
    const json = await res.json();
    if (json.access_token) return json.access_token;

    // 429 rate limit → esperar backoff exponencial
    if (res.status === 429 && attempt < retries) {
      const wait = Math.min(1000 * Math.pow(2, attempt), 30000); // 2s, 4s, 8s, 16s…
      warn(`Rate limit en sign-in (${email}), reintento ${attempt}/${retries} en ${wait}ms…`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    throw new Error(`signIn(${email}): ${JSON.stringify(json)}`);
  }
}

async function deleteUser(uid) {
  const { error } = await adminClient.auth.admin.deleteUser(uid);
  if (error) warn(`No se pudo eliminar ${uid}: ${error.message}`);
}

// ─── Batch paralela con throttle ──────────────────────────────────────────────
async function batchRun(items, fn, batchSize, delayMs = 0) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    process.stdout.write(`\r   ${c.gray}${results.length}/${items.length}${c.reset}   `);
    if (delayMs > 0 && i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.log();
  return results;
}

// ─── Métricas ─────────────────────────────────────────────────────────────────
class Metrics {
  constructor(label) {
    this.label = label;
    this.durations = [];
    this.ok = 0; this.fail = 0; this.timeouts = 0;
    this.codes = {};
  }
  record(r) {
    this.durations.push(r.ms);
    this.codes[r.status] = (this.codes[r.status] || 0) + 1;
    if (r.status === 408) this.timeouts++;
    if (r.ok) this.ok++; else this.fail++;
  }
  pct(p) {
    if (!this.durations.length) return 0;
    const s = [...this.durations].sort((a, b) => a - b);
    return s[Math.min(Math.ceil((p / 100) * s.length) - 1, s.length - 1)];
  }
  get total() { return this.durations.length; }
  get rps() { return this._durationSecs ? (this.total / this._durationSecs).toFixed(1) : '—'; }
  get errorRate() { return this.total ? ((this.fail / this.total) * 100).toFixed(1) : '0'; }
}

// ─── Concurrencia: burst y sustained ─────────────────────────────────────────
async function burst(fns) {
  return Promise.all(fns.map(fn => fn().catch(e => ({ status: 0, ms: 0, ok: false }))));
}

async function sustained({ fn, concurrency, durationSecs, metrics }) {
  metrics._durationSecs = durationSecs;
  const deadline = Date.now() + durationSecs * 1000;
  async function worker() {
    while (Date.now() < deadline) {
      const r = await fn().catch(() => ({ status: 0, ms: 0, ok: false }));
      metrics.record(r);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ─── Backend lifecycle ────────────────────────────────────────────────────────
let backendProcess = null;

async function waitForBackend(timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { const r = await fetch(HEALTH_URL); if (r.ok) return true; } catch {}
    await new Promise(r => setTimeout(r, 600));
  }
  return false;
}

async function startFreshBackend() {
  warn('Iniciando backend fresco…');
  backendProcess = spawn('node', ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  backendProcess.stdout.on('data', d => process.stdout.write(`${c.gray}[api] ${d}${c.reset}`));
  backendProcess.stderr.on('data', d => process.stderr.write(`${c.red}[api] ${d}${c.reset}`));
  const up = await waitForBackend(25000);
  if (!up) throw new Error('El backend no arrancó en 25 segundos.');
  ok('Backend iniciado.');
}

async function ensureBackend() {
  info(`Verificando backend en ${HEALTH_URL}…`);
  try { const r = await fetch(HEALTH_URL); if (r.ok) { ok('Backend activo (ya estaba corriendo).'); return; } } catch {}
  await startFreshBackend();
}

// Verifica que el backend sigue vivo; lo reinicia si cayó.
async function reconfirmBackend() {
  try { const r = await fetch(HEALTH_URL); if (r.ok) return; } catch {}
  warn('El backend dejó de responder. Reiniciando antes de continuar…');
  stopBackend();
  await startFreshBackend();
}

function stopBackend() { if (backendProcess) { backendProcess.kill(); backendProcess = null; } }

// ─── Cleanup ──────────────────────────────────────────────────────────────────
const registry = { tournamentIds: [], userIds: [], orgToken: null };

async function runCleanup() {
  if (NO_CLEANUP) { warn('--no-cleanup activo: datos NO eliminados.'); return; }
  step('♻', 'Limpiando datos de prueba…');
  for (const tid of registry.tournamentIds) {
    const r = await DEL(`/tournaments/${tid}`, registry.orgToken);
    r.ok ? ok(`Torneo ${tid} eliminado`) : warn(`Torneo ${tid} no eliminado (${r.status})`);
  }
  info(`Eliminando ${registry.userIds.length} usuarios de prueba (batches de ${CREATE_BATCH_SIZE})…`);
  await batchRun(registry.userIds, deleteUser, CREATE_BATCH_SIZE, CREATE_BATCH_DELAY);
  ok(`Cleanup completado.`);
}

// ─── Reporte ──────────────────────────────────────────────────────────────────
function report(phases) {
  const W = 62;
  console.log('\n' + '═'.repeat(W));
  console.log(`${c.bold}${c.cyan}  REPORTE FINAL — ${VIRTUAL} Workers Concurrentes${c.reset}`);
  console.log(`${c.gray}  (${N_AUTH} usuarios reales × ${Math.ceil(VIRTUAL / N_AUTH)} goroutines/token)${c.reset}`);
  console.log('═'.repeat(W));

  for (const { id, name, metrics: m, context } of phases) {
    const errPct = parseFloat(m.errorRate);
    const p50 = m.pct(50), p95 = m.pct(95), p99 = m.pct(99);
    const emoji = errPct === 0 ? '🟢' : errPct < 5 ? '🟡' : '🔴';
    console.log(`\n${c.bold}${emoji}  ${name}${c.reset}`);
    if (context) console.log(`   ${c.gray}${context}${c.reset}`);

    if (errPct === 0) {
      console.log(`   ${c.green}✓ Sin errores.${c.reset} El servidor aguantó la carga.`);
    } else if (errPct < 5) {
      console.log(`   ${c.yellow}⚠ ${m.fail}/${m.total} fallaron (${errPct}%).${c.reset} Dentro de márgenes aceptables.`);
    } else {
      console.log(`   ${c.red}✗ ${m.fail}/${m.total} fallaron (${errPct}%).${c.reset} ${c.bold}PROBLEMA DETECTADO.${c.reset}`);
    }
    if (m.timeouts > 0) {
      console.log(`   ${c.red}⏱ ${m.timeouts} timeouts (>15s).${c.reset} Señal de saturación del servidor.`);
    }

    const speedLabel = p50 < 200 ? 'muy rápido ⚡' : p50 < 500 ? 'rápido' : p50 < 1200 ? 'normal' : p50 < 3000 ? 'lento ⚠' : 'muy lento 🚨';
    console.log(`   p50:${p50}ms  p95:${p95}ms  p99:${p99}ms  → ${speedLabel}`);
    if (m.rps !== '—') console.log(`   Throughput: ${m.rps} req/s`);
    console.log(`   Códigos HTTP: ${JSON.stringify(m.codes)}`);
  }

  console.log('\n' + '─'.repeat(W));
  console.log(`${c.bold}  Conclusiones${c.reset}`);
  console.log('─'.repeat(W));

  const maxErr   = Math.max(...phases.map(p => parseFloat(p.metrics.errorRate)));
  const maxP95   = Math.max(...phases.map(p => p.metrics.pct(95)));
  const maxP99   = Math.max(...phases.map(p => p.metrics.pct(99)));
  const totTO    = phases.reduce((s, p) => s + (p.metrics.timeouts || 0), 0);

  if (maxErr === 0 && totTO === 0) {
    console.log(`\n  ${c.green}${c.bold}🎉 El sistema aguantó ${VIRTUAL} usuarios simultáneos sin errores.${c.reset}`);
    console.log(`  ${c.green}Estás listo para un torneo grande.${c.reset}`);
  } else if (maxErr < 5 && totTO < 10) {
    console.log(`\n  ${c.yellow}${c.bold}⚠  Errores leves bajo ${VIRTUAL} usuarios. Monitorear en producción.${c.reset}`);
  } else {
    console.log(`\n  ${c.red}${c.bold}🚨 El sistema tiene problemas serios con ${VIRTUAL} usuarios simultáneos.${c.reset}`);
    console.log(`  ${c.red}NO está listo para un torneo de esta escala sin optimizaciones.${c.reset}`);
  }

  // Recomendaciones específicas
  const syncPhase = phases.find(p => p.id === 'sync-status');
  if (syncPhase && syncPhase.metrics.pct(50) > 1500) {
    console.log(`\n  ${c.yellow}📌 CUELLO DE BOTELLA: sync-status (${syncPhase.metrics.pct(50)}ms p50)`);
    console.log(`     Añade caché de 2s o migra a Supabase Realtime.${c.reset}`);
  }

  const actPhase = phases.find(p => p.id === 'actions-burst');
  if (actPhase && parseFloat(actPhase.metrics.errorRate) > 2) {
    console.log(`\n  ${c.red}📌 PROBLEMA CRÍTICO: los árbitros no pueden guardar acciones (${actPhase.metrics.errorRate}% errores)`);
    console.log(`     Revisa el pool de conexiones Supabase en el backend.${c.reset}`);
  }

  if (totTO > 0) {
    console.log(`\n  ${c.red}📌 ${totTO} TIMEOUTS detectados (>15s).${c.reset}`);
    console.log(`  El backend se saturó bajo ${VIRTUAL} conexiones simultáneas.`);
    console.log(`  Recomendación: node clustering (pm2 -i max) o aumentar pool de DB.`);
  }

  if (maxP99 > 5000) {
    console.log(`\n  ${c.yellow}📌 LATENCIA ALTA: p99 = ${maxP99}ms.`);
    console.log(`     El 1% más lento tardó más de 5 segundos. Añade índices en:`);
    console.log(`     tournament_actions(round_id, action_type) y tournament_assignments(round_id).${c.reset}`);
  }

  if (maxErr === 0 && maxP95 < 2000 && totTO === 0) {
    console.log(`\n  ${c.green}✓ Tiempos de respuesta buenos bajo ${VIRTUAL} usuarios. Sin cuellos de botella críticos.${c.reset}`);
  }

  console.log('\n' + '═'.repeat(W) + '\n');
}

// ─── Helper para generar acciones aleatorias ──────────────────────────────────
const ACTION_TYPES = ['kill', 'death', 'objective', 'key_action', 'critical_action'];
function makeActions(count) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    action_type:     ACTION_TYPES[i % ACTION_TYPES.length],
    recorded_at:     new Date(now.getTime() - i * 1500).toISOString(),
    client_event_id: crypto.randomUUID(),
  }));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   AIR NATION — Simulación de Torneo con 300 Usuarios       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(c.reset);

  info(`Workers concurrentes  : ${VIRTUAL}`);
  info(`Usuarios auth reales  : ${N_AUTH}`);
  info(`Goroutines / token    : ${Math.ceil(VIRTUAL / (N_AUTH - 1))}`);
  info(`API target            : ${API_BASE}`);
  info(`Supabase URL          : ${SUPABASE_URL?.slice(0, 40)}…`);
  if (NO_CLEANUP) warn('Modo --no-cleanup activo');

  // ── 0. Backend
  step('0', 'Verificar backend');
  await ensureBackend();

  const phases = [];

  try {
    // ── 1. Crear N_AUTH usuarios en batches paralelas
    step('1', `Crear ${N_AUTH} usuarios de auth en batches de ${CREATE_BATCH_SIZE}…`);
    const orgEmail  = `${TEST_PREFIX}.org@stress.test`;
    const refEmails = Array.from({ length: N_AUTH - 1 }, (_, i) =>
      `${TEST_PREFIX}.r${i + 1}@stress.test`
    );

    info('Creando organizador…');
    const orgUser = await createUser(orgEmail);
    registry.userIds.push(orgUser.id);

    info(`Creando ${N_AUTH - 1} árbitros en batches paralelas (batch ${CREATE_BATCH_SIZE})…`);
    const refUsers = await batchRun(
      refEmails,
      async (email) => {
        const u = await createUser(email);
        registry.userIds.push(u.id);
        return u;
      },
      CREATE_BATCH_SIZE,
      CREATE_BATCH_DELAY
    );
    ok(`${N_AUTH} usuarios creados.`);

    // ── 2. Sign-in en batches pequeñas (rate-limit Supabase auth)
    step('2', `Obtener ${N_AUTH} tokens JWT — batches de ${SIGNIN_BATCH_SIZE} con ${SIGNIN_BATCH_DELAY}ms entre batch…`);
    const estimatedSigninSecs = (N_AUTH - 1) * (SIGNIN_BATCH_DELAY / 1000);
    info(`${c.gray}Sign-in secuencial: ~${Math.round(estimatedSigninSecs)}s total para evitar el rate-limit de Supabase.${c.reset}`);
    let orgToken = await signIn(orgEmail);
    registry.orgToken = orgToken;

    const refTokensRaw = await batchRun(
      refEmails,
      (email) => signIn(email),
      SIGNIN_BATCH_SIZE,
      SIGNIN_BATCH_DELAY
    );
    ok(`${N_AUTH} tokens obtenidos.`);

    // El sign-in tardó ~50s; verificar que el backend siga vivo
    await reconfirmBackend();

    // Expandir tokens reales a VIRTUAL workers (round-robin)
    const workerTokens = Array.from(
      { length: VIRTUAL },
      (_, i) => refTokensRaw[i % refTokensRaw.length]
    );
    info(`${c.gray}${VIRTUAL} workers usando ${refTokensRaw.length} tokens únicos (≈ ${Math.ceil(VIRTUAL / refTokensRaw.length)} workers/token)${c.reset}`);

    // ── 3. Crear torneo
    step('3', 'Configurar torneo de prueba');
    const tournament = await must('POST /tournaments', POST('/tournaments', {
      name: `[STRESS-300] ${new Date().toISOString()}`,
      game_type: 'speedsoft',
      default_round_duration_seconds: 720,
    }, orgToken));
    registry.tournamentIds.push(tournament.id);
    ok(`Torneo creado: ${tournament.id}`);

    // Crear N_AUTH-1 jugadores (uno por árbitro real)
    const N_PLAYERS = N_AUTH - 1;
    info(`Agregando ${N_PLAYERS} jugadores…`);
    const players = await must('players/batch', POST(
      `/tournaments/${tournament.id}/players/batch`,
      {
        players: Array.from({ length: N_PLAYERS }, (_, i) => ({
          name: `Jugador_${i + 1}`,
          team_name: i < N_PLAYERS / 2 ? 'Equipo A' : 'Equipo B',
        })),
      },
      orgToken
    ));
    ok(`${players.length} jugadores creados.`);

    info(`Generando ${N_PLAYERS} códigos de árbitro…`);
    const refs = await must('referees/generate', POST(
      `/tournaments/${tournament.id}/referees/generate`,
      { count: N_PLAYERS },
      orgToken
    ));
    ok(`${refs.length} códigos generados.`);

    // ── 4. Todos los árbitros reales se unen simultáneamente
    step('4', `${N_AUTH - 1} árbitros reales se unen al torneo (burst)…`);
    const joinResults = await burst(
      refs.map((ref, i) => () => POST('/tournaments/join', { code: ref.code }, refTokensRaw[i]))
    );
    const joinOk   = joinResults.filter(r => r.ok).length;
    const joinFail = joinResults.filter(r => !r.ok).length;
    ok(`${joinOk} árbitros unidos${joinFail ? `, ${joinFail} fallaron` : ''}.`);

    const refereeRowIds = joinResults.filter(r => r.ok).map(r => r.data?.id).filter(Boolean);

    // ── 5. Crear ronda y asignaciones batch
    step('5', 'Crear ronda y asignar árbitros a jugadores');
    const round = await must('POST /rounds', POST(
      `/tournaments/${tournament.id}/rounds`,
      { name: 'Ronda Estrés 300', duration_seconds: 720 },
      orgToken
    ));
    ok(`Ronda creada: ${round.id}`);

    const pairs = refereeRowIds
      .map((refereeId, i) => ({ referee_id: refereeId, player_id: players[i]?.id }))
      .filter(p => p.player_id);

    await must('assign/batch', POST(
      `/tournaments/${tournament.id}/rounds/${round.id}/assign/batch`,
      { pairs },
      orgToken
    ));
    ok(`${pairs.length} asignaciones creadas.`);

    await must('start round', PATCH(
      `/tournaments/${tournament.id}/rounds/${round.id}/start`,
      null, orgToken
    ));
    ok('Ronda iniciada.');

    const actionsPath = `/tournaments/${tournament.id}/rounds/${round.id}/actions`;
    const sbPath      = `/tournaments/${tournament.id}/rounds/${round.id}/scoreboard`;
    const fkPath      = `/tournaments/${tournament.id}/rounds/${round.id}/first-kill`;
    const syncPath    = `/tournaments/${tournament.id}/rounds/${round.id}/sync-status`;
    const confirmPath = `/tournaments/${tournament.id}/rounds/${round.id}/confirm-sync`;

    // ═══════════════════════════════════════════════════════════════
    // FASE 1 — 300 workers envían acciones en ráfaga simultánea
    // ═══════════════════════════════════════════════════════════════
    step('6a', `FASE 1 — ${VIRTUAL} workers envían acciones en ráfaga`);
    const m1 = new Metrics('actions-burst');

    await burst(
      workerTokens.map(token => () =>
        POST(actionsPath, { actions: makeActions(5) }, token).then(r => { m1.record(r); return r; })
      )
    );

    phases.push({
      id: 'actions-burst',
      name: `Fase 1 — ${VIRTUAL} workers enviando acciones en ráfaga`,
      context: `Cada worker envió 5 acciones a la vez. Total: ${m1.total} requests.`,
      metrics: m1,
    });
    ok(`Fase 1: ${m1.ok} ok, ${m1.fail} fallaron, ${m1.timeouts} timeouts.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2 — 300 writers + 30 readers, 60 s
    // ═══════════════════════════════════════════════════════════════
    step('6b', `FASE 2 — Carga sostenida 60 s: ${VIRTUAL} writers + 30 readers`);
    const m2w = new Metrics('actions-sustained');
    const m2r = new Metrics('reads-sustained');
    const PHASE2_SECS = 60;
    const readPaths = [sbPath, fkPath, syncPath];
    let readIdx = 0;
    const p2deadline = Date.now() + PHASE2_SECS * 1000;

    const writeWorkers = workerTokens.map(token => async () => {
      while (Date.now() < p2deadline) {
        const r = await POST(actionsPath, { actions: makeActions(3) }, token);
        m2w.record(r);
        await new Promise(r => setTimeout(r, 150 + Math.random() * 250));
      }
    });
    const readWorkers = Array.from({ length: 30 }, () => async () => {
      while (Date.now() < p2deadline) {
        const p = readPaths[readIdx++ % readPaths.length];
        const r = await GET(p, orgToken);
        m2r.record(r);
        await new Promise(r => setTimeout(r, 80));
      }
    });

    await Promise.all([...writeWorkers.map(fn => fn()), ...readWorkers.map(fn => fn())]);

    phases.push({
      id: 'actions-sustained',
      name: `Fase 2a — ${VIRTUAL} workers enviando acciones (60 s)`,
      context: `Escritura continua. Simula una partida de 1 minuto con 300 árbitros.`,
      metrics: m2w,
    });
    phases.push({
      id: 'reads-sustained',
      name: `Fase 2b — 30 lectores concurrentes (60 s)`,
      context: `Scoreboard + first-kill + sync-status en paralelo.`,
      metrics: m2r,
    });
    ok(`Fase 2: writes ${m2w.ok}/${m2w.total}, reads ${m2r.ok}/${m2r.total}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 3 — 300 workers en scoreboard durante 20 s (espectadores)
    // ═══════════════════════════════════════════════════════════════
    step('6c', `FASE 3 — ${VIRTUAL} espectadores en scoreboard (20 s)`);
    const m3 = new Metrics('scoreboard');
    await sustained({ fn: () => GET(sbPath, orgToken), concurrency: VIRTUAL, durationSecs: 20, metrics: m3 });
    phases.push({
      id: 'scoreboard',
      name: `Fase 3 — ${VIRTUAL} espectadores viendo scoreboard en vivo (20 s)`,
      context: `Simula la pantalla pública de resultados durante la partida.`,
      metrics: m3,
    });
    ok(`Fase 3: ${m3.ok}/${m3.total} ok.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 4 — 150 workers en sync-status (el endpoint más pesado)
    // ═══════════════════════════════════════════════════════════════
    step('6d', `FASE 4 — 150 workers en sync-status (endpoint más pesado, 20 s)`);
    const m4 = new Metrics('sync-status');
    await sustained({ fn: () => GET(syncPath, orgToken), concurrency: 150, durationSecs: 20, metrics: m4 });
    phases.push({
      id: 'sync-status',
      name: `Fase 4 — 150 workers consultando sync-status (20 s)`,
      context: `El endpoint más caro. Valida el límite real del servidor.`,
      metrics: m4,
    });
    ok(`Fase 4: ${m4.ok}/${m4.total} ok.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 5 — Todos confirman sync simultáneamente
    // ═══════════════════════════════════════════════════════════════
    step('6e', `FASE 5 — ${VIRTUAL} workers confirman sync al mismo tiempo`);
    const m5 = new Metrics('confirm');
    await burst(
      workerTokens.map(token => () =>
        PATCH(confirmPath, null, token).then(r => { m5.record(r); return r; })
      )
    );
    phases.push({
      id: 'confirm',
      name: `Fase 5 — ${VIRTUAL} workers confirman sync a la vez`,
      context: `Simula el cierre masivo de todos los árbitros al acabar la ronda.`,
      metrics: m5,
    });
    ok(`Fase 5: ${m5.ok}/${m5.total} confirmados.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 6 — Pico extremo: writes + reads + scoreboard, todo junto 30 s
    // ═══════════════════════════════════════════════════════════════
    step('6f', `FASE 6 — PICO EXTREMO: todo a la vez (${VIRTUAL} writes + 100 reads, 30 s)`);
    const m6w = new Metrics('peak-writes');
    const m6r = new Metrics('peak-reads');
    const PHASE6_SECS = 30;
    const p6deadline = Date.now() + PHASE6_SECS * 1000;

    const peakWriters = workerTokens.map(token => async () => {
      while (Date.now() < p6deadline) {
        const r = await POST(actionsPath, { actions: makeActions(2) }, token);
        m6w.record(r);
        await new Promise(r => setTimeout(r, 100 + Math.random() * 200));
      }
    });
    const peakReaders = Array.from({ length: 100 }, (_, i) => async () => {
      const paths = [sbPath, fkPath, syncPath];
      while (Date.now() < p6deadline) {
        const r = await GET(paths[i % paths.length], orgToken);
        m6r.record(r);
        await new Promise(r => setTimeout(r, 60));
      }
    });

    await Promise.all([
      ...peakWriters.map(fn => fn()),
      ...peakReaders.map(fn => fn()),
    ]);

    phases.push({
      id: 'peak-writes',
      name: `Fase 6a — Pico extremo: ${VIRTUAL} escritores (30 s)`,
      context: `Máxima presión: writes + reads simultáneos. El peor escenario posible.`,
      metrics: m6w,
    });
    phases.push({
      id: 'peak-reads',
      name: `Fase 6b — Pico extremo: 100 lectores (30 s)`,
      context: `Consultas de resultados durante el pico máximo de escritura.`,
      metrics: m6r,
    });
    ok(`Fase 6: writes ${m6w.ok}/${m6w.total}, reads ${m6r.ok}/${m6r.total}`);

  } catch (e) {
    err(`Error durante la simulación: ${e.message}`);
    console.error(e.stack);
  } finally {
    await runCleanup();
    stopBackend();
  }

  if (phases.length > 0) {
    report(phases);
  } else {
    warn('No se completó ninguna fase de prueba.');
  }

  const hasProblems = phases.some(p => parseFloat(p.metrics.errorRate) > 5);
  process.exit(hasProblems ? 1 : 0);
}

main().catch(e => {
  err(`Error fatal: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});
