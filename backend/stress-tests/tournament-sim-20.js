#!/usr/bin/env node
/**
 * AIR NATION — Simulación de torneo con 20 árbitros simultáneos
 *
 * Qué hace este script:
 *   1.  Arranca el backend si no está corriendo
 *   2.  Crea 21 usuarios de prueba en Supabase (1 organizador + 20 árbitros)
 *   3.  Inicia sesión con cada uno para obtener sus tokens JWT
 *   4.  Crea un torneo de prueba con 20 jugadores y 20 códigos de árbitro
 *   5.  Cada árbitro se une al torneo, crea una ronda y se asigna 1 árbitro por jugador
 *   6.  Inicia la ronda
 *   7.  FASE 1 – Los 20 árbitros envían acciones simultáneamente (ráfaga)
 *   8.  FASE 2 – Carga sostenida: árbitros enviando + organizador consultando
 *   9.  FASE 3 – Los 20 árbitros confirman sync al mismo tiempo
 *  10.  Imprime reporte en lenguaje simple
 *  11.  Limpia TODOS los datos de prueba (torneo + usuarios)
 *
 * Uso:
 *   node stress-tests/tournament-sim-20.js
 *   node stress-tests/tournament-sim-20.js --referees=10   (cambiar número)
 *   node stress-tests/tournament-sim-20.js --no-cleanup    (conservar datos para inspección)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const { spawn } = require('child_process');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_SVC_KEY  = process.env.SUPABASE_SERVICE_KEY;
const API_BASE          = `http://localhost:${process.env.PORT || 4000}/api/v1`;
const HEALTH_URL        = `http://localhost:${process.env.PORT || 4000}/health`;

const args         = process.argv.slice(2);
const N_REFEREES   = parseInt((args.find(a => a.startsWith('--referees=')) || '--referees=20').split('=')[1]);
const NO_CLEANUP   = args.includes('--no-cleanup');

const TEST_PASSWORD = 'StressTest2026!';
const TEST_EMAIL_PREFIX = `airnation.stress.${Date.now()}`;

// ─── Colores ──────────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  magenta: '\x1b[35m',
};
const log  = (m) => console.log(m);
const info = (m) => console.log(`${c.cyan}ℹ${c.reset}  ${m}`);
const ok   = (m) => console.log(`${c.green}✓${c.reset}  ${m}`);
const warn = (m) => console.log(`${c.yellow}⚠${c.reset}  ${m}`);
const err  = (m) => console.error(`${c.red}✗${c.reset}  ${m}`);
const step = (n, t) => console.log(`\n${c.bold}${c.cyan}[${n}]${c.reset}${c.bold} ${t}${c.reset}`);

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function api(method, path, body, token) {
  const url = `${API_BASE}${path}`;
  const start = performance.now();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const ms = Math.round(performance.now() - start);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, ok: res.ok, data, ms };
}

const GET    = (p, t)    => api('GET',    p, null, t);
const POST   = (p, b, t) => api('POST',   p, b, t);
const PATCH  = (p, b, t) => api('PATCH',  p, b, t);
const DELETE = (p, t)    => api('DELETE', p, null, t);

async function must(label, call) {
  const r = await call;
  if (!r.ok) throw new Error(`${label} falló (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data;
}

// ─── Supabase admin ───────────────────────────────────────────────────────────
const adminClient = createClient(SUPABASE_URL, SUPABASE_SVC_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createTestUser(email) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { is_stress_test: true },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user;
}

async function signInUser(email) {
  // Calls the Supabase Auth REST endpoint directly (service key as apikey)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SVC_KEY,
    },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`signIn(${email}) falló: ${JSON.stringify(json)}`);
  return json.access_token;
}

async function deleteTestUser(userId) {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) warn(`No se pudo eliminar usuario ${userId}: ${error.message}`);
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
class Metrics {
  constructor() { this.durations = []; this.ok = 0; this.fail = 0; this.codes = {}; }
  record({ status, ms }) {
    this.durations.push(ms);
    this.codes[status] = (this.codes[status] || 0) + 1;
    if (status >= 200 && status < 400) this.ok++;
    else this.fail++;
  }
  pct(p) {
    if (!this.durations.length) return 0;
    const s = [...this.durations].sort((a, b) => a - b);
    return s[Math.min(Math.ceil((p / 100) * s.length) - 1, s.length - 1)];
  }
  get total() { return this.durations.length; }
  get errorRate() { return this.total ? ((this.fail / this.total) * 100).toFixed(1) : '0'; }
}

// ─── Worker pool ──────────────────────────────────────────────────────────────
async function burst(tasks) {
  // Run all tasks concurrently, return results array
  return Promise.all(tasks.map(fn => fn().catch(e => ({ status: 0, ms: 0, error: e.message }))));
}

async function sustained({ fn, concurrency, durationSecs, metrics }) {
  const deadline = Date.now() + durationSecs * 1000;
  async function worker() {
    while (Date.now() < deadline) {
      const r = await fn().catch(e => ({ status: 0, ms: 0 }));
      metrics.record(r);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ─── Backend lifecycle ────────────────────────────────────────────────────────
let backendProcess = null;

async function waitForBackend(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(HEALTH_URL);
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function ensureBackend() {
  info(`Verificando si el backend está activo en ${HEALTH_URL}…`);
  try {
    const r = await fetch(HEALTH_URL);
    if (r.ok) { ok('Backend ya está corriendo.'); return; }
  } catch { /* not running */ }

  warn('Backend no está corriendo. Iniciando…');
  backendProcess = spawn('node', ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  backendProcess.stdout.on('data', d => process.stdout.write(`${c.gray}[api] ${d}${c.reset}`));
  backendProcess.stderr.on('data', d => process.stderr.write(`${c.red}[api] ${d}${c.reset}`));

  const up = await waitForBackend(20000);
  if (!up) throw new Error('El backend no arrancó en 20 segundos.');
  ok('Backend iniciado correctamente.');
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// ─── Cleanup registry ─────────────────────────────────────────────────────────
const cleanupItems = { tournamentIds: [], userIds: [] };

async function runCleanup() {
  if (NO_CLEANUP) { warn('--no-cleanup activo: datos de prueba NO eliminados.'); return; }
  step('♻', 'Limpiando datos de prueba…');

  for (const tid of cleanupItems.tournamentIds) {
    const r = await DELETE(`/tournaments/${tid}`, cleanupItems.orgToken);
    r.ok ? ok(`Torneo ${tid} eliminado`) : warn(`Torneo ${tid} no eliminado (${r.status})`);
  }
  for (const uid of cleanupItems.userIds) {
    await deleteTestUser(uid);
  }
  ok(`${cleanupItems.userIds.length} usuarios de prueba eliminados.`);
}

// ─── Report en lenguaje simple ────────────────────────────────────────────────
function simpleReport(phases) {
  console.log('\n' + '═'.repeat(60));
  console.log(`${c.bold}${c.cyan}  REPORTE FINAL — 20 Árbitros Simultáneos${c.reset}`);
  console.log('═'.repeat(60));

  for (const phase of phases) {
    const { name, metrics, context } = phase;
    const m = metrics;
    const errPct = parseFloat(m.errorRate);
    const p50 = m.pct(50);
    const p95 = m.pct(95);

    const emoji = errPct === 0 ? '🟢' : errPct < 5 ? '🟡' : '🔴';
    console.log(`\n${c.bold}${emoji}  ${name}${c.reset}`);
    console.log(`   ${context || ''}`);

    // ── Interpretación para no técnicos
    if (errPct === 0) {
      console.log(`   ${c.green}✓ Ningún request falló.${c.reset} El servidor aguantó la carga perfectamente.`);
    } else if (errPct < 5) {
      console.log(`   ${c.yellow}⚠ ${m.fail} de ${m.total} requests fallaron (${errPct}%).${c.reset} Dentro de márgenes aceptables.`);
    } else {
      console.log(`   ${c.red}✗ ${m.fail} de ${m.total} requests fallaron (${errPct}%).${c.reset} ${c.bold}PROBLEMA DETECTADO.${c.reset}`);
    }

    // Latencia en palabras simples
    const speed = p50 < 300 ? 'muy rápido' : p50 < 800 ? 'normal' : p50 < 2000 ? 'lento' : 'muy lento';
    console.log(`   Tiempo de respuesta: ${c.bold}${p50}ms${c.reset} (${speed})`);
    if (p95 > p50 * 2) {
      console.log(`   ${c.yellow}Algunos requests tardaron mucho más: hasta ${p95}ms (el 5% más lento)${c.reset}`);
    }
    console.log(`   Códigos de respuesta: ${JSON.stringify(m.codes)}`);
  }

  // ── Resumen general + recomendaciones
  console.log('\n' + '─'.repeat(60));
  console.log(`${c.bold}  Conclusiones y recomendaciones${c.reset}`);
  console.log('─'.repeat(60));

  const allPhases  = phases;
  const maxErrRate = Math.max(...allPhases.map(p => parseFloat(p.metrics.errorRate)));
  const maxP95     = Math.max(...allPhases.map(p => p.metrics.pct(95)));
  const syncPhase  = allPhases.find(p => p.id === 'sync-status');
  const actPhase   = allPhases.find(p => p.id === 'actions');
  const confPhase  = allPhases.find(p => p.id === 'confirm');

  if (maxErrRate === 0) {
    console.log(`\n  ${c.green}${c.bold}🎉 El sistema aguantó los 20 árbitros sin ningún error.${c.reset}`);
  } else if (maxErrRate < 5) {
    console.log(`\n  ${c.yellow}${c.bold}⚠  El sistema tuvo errores leves (< 5%). Monitorear en producción.${c.reset}`);
  } else {
    console.log(`\n  ${c.red}${c.bold}🚨 El sistema tiene problemas serios con 20 árbitros simultáneos.${c.reset}`);
  }

  if (syncPhase && syncPhase.metrics.pct(50) > 1000) {
    console.log(`\n  ${c.yellow}📌 CUELLO DE BOTELLA: consulta de "estado de sync"${c.reset}`);
    console.log(`     Esta pantalla hace muchas consultas a la base de datos a la vez.`);
    console.log(`     ${c.bold}Recomendación:${c.reset} agregar un caché de 1-2 segundos o usar tiempo real (Supabase Realtime).`);
  }

  if (actPhase && parseFloat(actPhase.metrics.errorRate) > 2) {
    console.log(`\n  ${c.red}📌 PROBLEMA: los árbitros no pudieron guardar sus acciones${c.reset}`);
    console.log(`     ${c.bold}Recomendación:${c.reset} revisar el pool de conexiones a Supabase en el backend.`);
  }

  if (maxP95 > 3000) {
    console.log(`\n  ${c.yellow}📌 LENTITUD: el 5% de requests tardó más de 3 segundos.${c.reset}`);
    console.log(`     En un torneo real, eso se siente como lag.`);
    console.log(`     ${c.bold}Recomendación:${c.reset} agregar índices en las tablas tournament_actions y tournament_assignments.`);
  }

  if (maxErrRate === 0 && maxP95 < 1500) {
    console.log(`\n  ${c.green}✓ Tiempo de respuesta bueno. Con 20 árbitros simultáneos no hay lag perceptible.${c.reset}`);
  }

  console.log('\n' + '═'.repeat(60) + '\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   AIR NATION — Simulación de Torneo con 20 Árbitros     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(c.reset);

  info(`Árbitros simulados : ${N_REFEREES}`);
  info(`API target         : ${API_BASE}`);
  info(`Supabase project   : ${SUPABASE_URL}`);
  if (NO_CLEANUP) warn('Modo --no-cleanup activo');

  // ── 0. Backend
  step('0', 'Verificar backend');
  await ensureBackend();

  const phases = [];
  let orgToken, orgUserId;

  try {
    // ── 1. Crear usuarios de prueba
    step('1', `Crear ${N_REFEREES + 1} usuarios de prueba en Supabase…`);
    const orgEmail = `${TEST_EMAIL_PREFIX}.org@stress.dev`;
    const refEmails = Array.from({ length: N_REFEREES }, (_, i) =>
      `${TEST_EMAIL_PREFIX}.ref${i + 1}@stress.dev`
    );

    info('Creando usuario organizador…');
    const orgUser = await createTestUser(orgEmail);
    orgUserId = orgUser.id;
    cleanupItems.userIds.push(orgUser.id);

    info(`Creando ${N_REFEREES} usuarios árbitro…`);
    const refUsers = [];
    for (let i = 0; i < N_REFEREES; i++) {
      const u = await createTestUser(refEmails[i]);
      cleanupItems.userIds.push(u.id);
      refUsers.push(u);
      process.stdout.write(`\r   ${c.gray}Progreso: ${i + 1}/${N_REFEREES}${c.reset}   `);
    }
    console.log();
    ok(`${N_REFEREES + 1} usuarios creados.`);

    // ── 2. Sign-in y obtener tokens
    step('2', 'Iniciando sesión para obtener tokens JWT…');
    orgToken = await signInUser(orgEmail);
    cleanupItems.orgToken = orgToken;

    const refTokens = [];
    for (let i = 0; i < N_REFEREES; i++) {
      refTokens.push(await signInUser(refEmails[i]));
      process.stdout.write(`\r   ${c.gray}Tokens: ${i + 1}/${N_REFEREES}${c.reset}   `);
    }
    console.log();
    ok('Todos los tokens obtenidos.');

    // ── 3. Crear torneo
    step('3', 'Configurar torneo de prueba');
    info('Creando torneo…');
    const tournament = await must('POST /tournaments', POST('/tournaments', {
      name: `[STRESS-20] ${new Date().toISOString()}`,
      game_type: 'speedsoft',
      default_round_duration_seconds: 600,
    }, orgToken));
    cleanupItems.tournamentIds.push(tournament.id);
    ok(`Torneo creado: ${tournament.id}`);

    info(`Agregando ${N_REFEREES} jugadores…`);
    const players = await must('players/batch', POST(
      `/tournaments/${tournament.id}/players/batch`,
      { players: Array.from({ length: N_REFEREES }, (_, i) => ({ name: `Jugador_${i + 1}`, team_name: i < N_REFEREES / 2 ? 'Equipo A' : 'Equipo B' })) },
      orgToken
    ));
    ok(`${players.length} jugadores agregados.`);

    info(`Generando ${N_REFEREES} códigos de árbitro…`);
    const refs = await must('referees/generate', POST(
      `/tournaments/${tournament.id}/referees/generate`,
      { count: N_REFEREES },
      orgToken
    ));
    ok(`${refs.length} códigos generados.`);

    // ── 4. Cada árbitro se une al torneo
    step('4', 'Cada árbitro se une al torneo simultáneamente…');
    const joinResults = await burst(
      refs.map((ref, i) => () => POST('/tournaments/join', { code: ref.code }, refTokens[i]))
    );
    const joinOk = joinResults.filter(r => r.ok || r.status === 200).length;
    const joinFail = joinResults.filter(r => !r.ok && r.status !== 200).length;
    ok(`${joinOk} árbitros unidos${joinFail ? `, ${joinFail} fallaron` : ''}.`);
    if (joinFail > 0) warn(`Árbitros que fallaron al unirse: ${joinFail}. Revisa los logs.`);

    // Obtener IDs de árbitros después del join
    const refereeRowIds = joinResults
      .filter(r => r.ok || r.status === 200)
      .map(r => r.data?.id)
      .filter(Boolean);

    // ── 5. Crear ronda y asignaciones
    step('5', 'Crear ronda y asignar árbitros a jugadores');
    const round = await must('POST /rounds', POST(
      `/tournaments/${tournament.id}/rounds`,
      { name: 'Ronda de Estrés', duration_seconds: 600 },
      orgToken
    ));
    ok(`Ronda creada: ${round.id}`);

    const pairs = refereeRowIds.map((refereeId, i) => ({
      referee_id: refereeId,
      player_id:  players[i]?.id,
    })).filter(p => p.player_id);

    info(`Asignando ${pairs.length} árbitros a jugadores (batch)…`);
    await must('assign/batch', POST(
      `/tournaments/${tournament.id}/rounds/${round.id}/assign/batch`,
      { pairs },
      orgToken
    ));
    ok(`${pairs.length} asignaciones creadas.`);

    info('Iniciando ronda…');
    await must('start round', PATCH(
      `/tournaments/${tournament.id}/rounds/${round.id}/start`,
      null,
      orgToken
    ));
    ok('Ronda iniciada. ¡La competencia comienza!');

    // ─────────────────────────────────────────────────────────
    // FASE 1 — Todos los árbitros envían acciones simultáneamente (ráfaga)
    // ─────────────────────────────────────────────────────────
    step('6a', `FASE 1 — ${N_REFEREES} árbitros envían acciones al MISMO TIEMPO (ráfaga)`);
    const actionTypes = ['kill', 'death', 'objective', 'key_action', 'critical_action'];

    function makeActions(count) {
      const now = new Date();
      return Array.from({ length: count }, (_, i) => ({
        action_type:     actionTypes[i % actionTypes.length],
        recorded_at:     new Date(now.getTime() - i * 2000).toISOString(),
        client_event_id: crypto.randomUUID(),
      }));
    }

    const actionsPath = `/tournaments/${tournament.id}/rounds/${round.id}/actions`;
    const burstMetrics = new Metrics();

    const burstResults = await burst(
      refTokens.map(token => () =>
        POST(actionsPath, { actions: makeActions(5) }, token).then(r => { burstMetrics.record(r); return r; })
      )
    );
    phases.push({
      id: 'actions',
      name: `Fase 1 — ${N_REFEREES} árbitros enviando acciones a la vez`,
      context: `Cada árbitro envió 5 acciones simultáneamente. Total: ${burstMetrics.total} requests.`,
      metrics: burstMetrics,
    });
    ok(`Fase 1 completada. ${burstMetrics.ok} exitosos, ${burstMetrics.fail} fallidos.`);

    // ─────────────────────────────────────────────────────────
    // FASE 2 — Carga sostenida 30s: árbitros + organizador consultando
    // ─────────────────────────────────────────────────────────
    step('6b', 'FASE 2 — Carga sostenida 30 segundos (árbitros + organizador consultando)');
    info('Árbitros siguen enviando acciones mientras el organizador consulta el scoreboard y sync-status…');

    const sustainedActions  = new Metrics();
    const sustainedReads    = new Metrics();
    const DURATION = 30;

    const readPaths = [
      `/tournaments/${tournament.id}/rounds/${round.id}/scoreboard`,
      `/tournaments/${tournament.id}/rounds/${round.id}/first-kill`,
      `/tournaments/${tournament.id}/rounds/${round.id}/sync-status`,
    ];

    let readIdx = 0;
    const deadline = Date.now() + DURATION * 1000;

    // Write workers (1 per referee)
    const writeWorkers = refTokens.map(token => async () => {
      while (Date.now() < deadline) {
        const r = await POST(actionsPath, { actions: makeActions(3) }, token);
        sustainedActions.record(r);
        await new Promise(res => setTimeout(res, 200 + Math.random() * 300)); // throttle a poco
      }
    });

    // Read workers (5 workers rotando endpoints)
    const readWorkers = Array.from({ length: 5 }, () => async () => {
      while (Date.now() < deadline) {
        const p = readPaths[readIdx++ % readPaths.length];
        const r = await GET(p, orgToken);
        sustainedReads.record(r);
        await new Promise(res => setTimeout(res, 100));
      }
    });

    sustainedActions.durations; // activate
    await Promise.all([...writeWorkers.map(fn => fn()), ...readWorkers.map(fn => fn())]);

    phases.push({
      id: 'sustained-actions',
      name: `Fase 2a — Árbitros enviando acciones (30s continuo)`,
      context: `${N_REFEREES} árbitros enviando acciones en paralelo durante 30 segundos.`,
      metrics: sustainedActions,
    });
    phases.push({
      id: 'sustained-reads',
      name: `Fase 2b — Organizador consultando resultados (30s continuo)`,
      context: `Scoreboard, first-kill y sync-status consultados simultáneamente.`,
      metrics: sustainedReads,
    });
    ok(`Fase 2 completada. Acciones: ${sustainedActions.total}, Lecturas: ${sustainedReads.total}`);

    // ─────────────────────────────────────────────────────────
    // FASE 3 — Todos confirman sync al mismo tiempo
    // ─────────────────────────────────────────────────────────
    step('6c', `FASE 3 — Los ${N_REFEREES} árbitros confirman sync simultáneamente`);
    const confirmPath = `/tournaments/${tournament.id}/rounds/${round.id}/confirm-sync`;
    const confirmMetrics = new Metrics();

    await burst(
      refTokens.map(token => () =>
        PATCH(confirmPath, null, token).then(r => { confirmMetrics.record(r); return r; })
      )
    );

    phases.push({
      id: 'confirm',
      name: `Fase 3 — ${N_REFEREES} árbitros confirman sync a la vez`,
      context: `Todos confirman que sus datos están completos antes de cerrar la ronda.`,
      metrics: confirmMetrics,
    });
    ok(`Fase 3 completada. ${confirmMetrics.ok} confirmados, ${confirmMetrics.fail} fallidos.`);

    // ─────────────────────────────────────────────────────────
    // FASE 4 — Scoreboard polling concentrado (espectadores)
    // ─────────────────────────────────────────────────────────
    step('6d', 'FASE 4 — 30 espectadores consultando el scoreboard al mismo tiempo (15s)');
    const sbMetrics = new Metrics();
    const sbPath = `/tournaments/${tournament.id}/rounds/${round.id}/scoreboard`;

    await sustained({
      fn: () => GET(sbPath, orgToken),
      concurrency: 30,
      durationSecs: 15,
      metrics: sbMetrics,
    });

    phases.push({
      id: 'scoreboard',
      name: 'Fase 4 — 30 espectadores viendo scoreboard en vivo (15s)',
      context: `Simula la pantalla de resultados con muchos usuarios viendo al mismo tiempo.`,
      metrics: sbMetrics,
    });
    ok(`Fase 4 completada. ${sbMetrics.total} requests. ${sbMetrics.ok} exitosos.`);

    // ─────────────────────────────────────────────────────────
    // FASE 5 — Sync-status bajo presión (el endpoint más caro)
    // ─────────────────────────────────────────────────────────
    step('6e', 'FASE 5 — Sync-status bajo presión (el endpoint más caro del sistema, 15s)');
    const syncMetrics = new Metrics();
    const syncPath = `/tournaments/${tournament.id}/rounds/${round.id}/sync-status`;

    await sustained({
      fn: () => GET(syncPath, orgToken),
      concurrency: 15,
      durationSecs: 15,
      metrics: syncMetrics,
    });

    phases.push({
      id: 'sync-status',
      name: 'Fase 5 — Sync-status bajo presión (15s)',
      context: `Este endpoint hace muchas consultas a la DB por request. Prueba el límite.`,
      metrics: syncMetrics,
    });
    ok(`Fase 5 completada. ${syncMetrics.total} requests.`);

  } catch (e) {
    err(`Error durante la simulación: ${e.message}`);
    console.error(e.stack);
  } finally {
    // Siempre limpiar
    await runCleanup();
    stopBackend();
  }

  // ── Reporte final
  if (phases.length > 0) {
    simpleReport(phases);
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
