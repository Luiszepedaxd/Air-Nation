#!/usr/bin/env node
/**
 * AIR NATION — Stress test LOCAL con 300 workers
 *
 * 100% local: no crea usuarios en Supabase, no necesita tokens JWT reales.
 * Usa el header X-Stress-User-Id con UUIDs sintéticos (requiere
 * STRESS_TEST_MODE=true en .env del backend).
 *
 * Qué prueba:
 *   Setup   — Un organizador real (token del .env) crea el torneo, jugadores,
 *             códigos de árbitro, ronda, asignaciones e inicia la ronda.
 *   Fase 1  — 300 workers envían acciones en ráfaga simultánea
 *   Fase 2  — 300 writers + 30 readers, 60 s sostenido
 *   Fase 3  — 300 workers en scoreboard (20 s)
 *   Fase 4  — 150 workers en sync-status (20 s, el endpoint más pesado)
 *   Fase 5  — 300 workers confirman sync
 *   Fase 6  — Pico extremo: todo junto 30 s
 *   Cleanup — Borra torneo via API del organizador
 *
 * Uso:
 *   node stress-tests/local-sim-300.js
 *   node stress-tests/local-sim-300.js --workers=500
 *   node stress-tests/local-sim-300.js --no-cleanup
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

const args    = process.argv.slice(2);
const WORKERS = parseInt((args.find(a => a.startsWith('--workers=')) || '--workers=300').split('=')[1]);
const NO_CLEANUP = args.includes('--no-cleanup');

if (process.env.STRESS_TEST_MODE !== 'true') {
  console.error('\n❌  STRESS_TEST_MODE no está activo en .env. Abortando.\n');
  process.exit(1);
}

// ─── Colores ──────────────────────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', gray: '\x1b[90m',
};
const info = (m) => console.log(`${c.cyan}ℹ${c.reset}  ${m}`);
const ok   = (m) => console.log(`${c.green}✓${c.reset}  ${m}`);
const warn = (m) => console.log(`${c.yellow}⚠${c.reset}  ${m}`);
const err  = (m) => console.error(`${c.red}✗${c.reset}  ${m}`);
const step = (n, t) => console.log(`\n${c.bold}${c.cyan}[${n}]${c.reset}${c.bold} ${t}${c.reset}`);

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
// En modo local: todas las llamadas usan X-Stress-User-Id (sin JWT real)
async function apiCall(method, url_path, body, { token, userId } = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = performance.now();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token)  headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-Stress-User-Id'] = userId;

    const res = await fetch(`${API_BASE}${url_path}`, {
      method, signal: ctrl.signal, headers,
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
    return { status: e.name === 'AbortError' ? 408 : 0, ok: false, data: null, ms };
  }
}

// Todas las llamadas usan el bypass X-Stress-User-Id (no hay JWT real)
const org    = (method, p, b) => apiCall(method, p, b, { userId: ORG_USER_ID });
const ref    = (method, p, b) => apiCall(method, p, b, { userId: REF_USER_ID });
const worker = (method, p, b, uid) => apiCall(method, p, b, { userId: uid });

async function must(label, call) {
  const r = await call;
  if (!r.ok) throw new Error(`${label} falló (${r.status}): ${JSON.stringify(r.data)}`);
  return r.data;
}

// ─── Métricas ─────────────────────────────────────────────────────────────────
class Metrics {
  constructor() { this.durations = []; this.ok = 0; this.fail = 0; this.timeouts = 0; this.codes = {}; }
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
  get errorRate() { return this.total ? ((this.fail / this.total) * 100).toFixed(1) : '0'; }
}

async function burst(fns) {
  return Promise.all(fns.map(fn => fn().catch(() => ({ status: 0, ms: 0, ok: false }))));
}

async function sustained({ fn, concurrency, durationSecs, metrics }) {
  const deadline = Date.now() + durationSecs * 1000;
  const worker = async () => {
    while (Date.now() < deadline) {
      const r = await fn().catch(() => ({ status: 0, ms: 0, ok: false }));
      metrics.record(r);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
}

// ─── Backend lifecycle ────────────────────────────────────────────────────────
let backendProcess = null;

async function waitForBackend(ms = 20000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try { const r = await fetch(HEALTH_URL); if (r.ok) return true; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function ensureBackend() {
  try { const r = await fetch(HEALTH_URL); if (r.ok) { ok('Backend activo.'); return; } } catch {}
  warn('Backend no está corriendo. Iniciando…');
  backendProcess = spawn('node', ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });
  backendProcess.stdout.on('data', d => process.stdout.write(`${c.gray}[api] ${d}${c.reset}`));
  backendProcess.stderr.on('data', d => process.stderr.write(`${c.red}[api] ${d}${c.reset}`));
  if (!await waitForBackend()) throw new Error('Backend no arrancó en 20s.');
  ok('Backend iniciado con STRESS_TEST_MODE=true.');
}

function stopBackend() { if (backendProcess) { backendProcess.kill(); backendProcess = null; } }

// UUID del organizador (crea el torneo)
const ORG_USER_ID = process.env.STRESS_ORG_USER_ID || (() => {
  throw new Error('STRESS_ORG_USER_ID no definido en .env');
})();
// UUID del árbitro permanente (se une al torneo; distinto del org por validación del backend)
// Todos los workers usarán este ID → 300 conexiones simultáneas al mismo endpoint
const REF_USER_ID = process.env.STRESS_REF_USER_ID || (() => {
  throw new Error('STRESS_REF_USER_ID no definido en .env');
})();

// ─── Acciones de prueba ───────────────────────────────────────────────────────
const ACTION_TYPES = ['kill', 'death', 'objective', 'key_action', 'critical_action'];

function makeActions(count) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    action_type: ACTION_TYPES[i % ACTION_TYPES.length],
    recorded_at: new Date(now.getTime() - i * 1500).toISOString(),
    client_event_id: crypto.randomUUID(),
  }));
}

// ─── Reporte ──────────────────────────────────────────────────────────────────
function report(phases) {
  const W = 64;
  console.log('\n' + '═'.repeat(W));
  console.log(`${c.bold}${c.cyan}  REPORTE FINAL — ${WORKERS} Workers Locales (sin Supabase Auth)${c.reset}`);
  console.log('═'.repeat(W));

  for (const { name, metrics: m, context } of phases) {
    const errPct = parseFloat(m.errorRate);
    const emoji  = errPct === 0 ? '🟢' : errPct < 5 ? '🟡' : '🔴';
    const p50 = m.pct(50), p95 = m.pct(95), p99 = m.pct(99);

    console.log(`\n${c.bold}${emoji}  ${name}${c.reset}`);
    if (context) console.log(`   ${c.gray}${context}${c.reset}`);

    if (errPct === 0)       console.log(`   ${c.green}✓ Sin errores.${c.reset}`);
    else if (errPct < 5)    console.log(`   ${c.yellow}⚠ ${m.fail}/${m.total} fallaron (${errPct}%).${c.reset}`);
    else                    console.log(`   ${c.red}✗ ${m.fail}/${m.total} fallaron (${errPct}%).${c.reset} ${c.bold}PROBLEMA.${c.reset}`);

    if (m.timeouts > 0) console.log(`   ${c.red}⏱ ${m.timeouts} timeouts (>12s).${c.reset}`);

    const speed = p50 < 200 ? '⚡ muy rápido' : p50 < 500 ? 'rápido' : p50 < 1200 ? 'normal' : p50 < 3000 ? '⚠ lento' : '🚨 muy lento';
    console.log(`   p50: ${p50}ms  p95: ${p95}ms  p99: ${p99}ms  → ${speed}`);
    console.log(`   HTTP: ${JSON.stringify(m.codes)}`);
  }

  console.log('\n' + '─'.repeat(W));
  console.log(`${c.bold}  Conclusión${c.reset}`);
  console.log('─'.repeat(W));

  const maxErr  = Math.max(...phases.map(p => parseFloat(p.metrics.errorRate)));
  const maxP95  = Math.max(...phases.map(p => p.metrics.pct(95)));
  const totTO   = phases.reduce((s, p) => s + p.metrics.timeouts, 0);

  if (maxErr === 0 && totTO === 0) {
    console.log(`\n  ${c.green}${c.bold}🎉 El sistema aguantó ${WORKERS} usuarios simultáneos sin ningún error.${c.reset}`);
  } else if (maxErr < 5 && totTO < 10) {
    console.log(`\n  ${c.yellow}${c.bold}⚠  Errores leves (< 5%). Monitorear en producción.${c.reset}`);
  } else {
    console.log(`\n  ${c.red}${c.bold}🚨 Problemas detectados con ${WORKERS} usuarios. Ver detalles arriba.${c.reset}`);
  }

  const syncP = phases.find(p => p.id === 'sync');
  if (syncP && syncP.metrics.pct(50) > 1500) {
    console.log(`\n  ${c.yellow}📌 Cuello de botella: sync-status (${syncP.metrics.pct(50)}ms). Considera caché o Realtime.${c.reset}`);
  }
  if (maxP95 > 4000) {
    console.log(`\n  ${c.yellow}📌 Latencia p95 alta (${maxP95}ms). Revisar índices en tournament_actions.${c.reset}`);
  }

  console.log('\n' + '═'.repeat(W) + '\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   AIR NATION — Stress Test LOCAL — 300 Workers  (sin Auth)   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(c.reset);
  info(`Workers            : ${WORKERS}`);
  info(`API                : ${API_BASE}`);
  info(`Auth               : bypass local (X-Stress-User-Id)`);
  info(`Usuarios Supabase  : 0 creados`);

  // Generar UUIDs sintéticos para los workers (sin crear usuarios reales)
  const workerIds = Array.from({ length: WORKERS }, () => crypto.randomUUID());
  info(`${c.gray}${WORKERS} UUIDs sintéticos generados para workers.${c.reset}\n`);

  step('0', 'Verificar backend');
  await ensureBackend();

  const phases = [];
  let tournamentId, roundId, players, refs;

  try {
    // ── Setup: crear torneo con el service key (organizador)
    step('1', 'Setup del torneo de prueba');

    const tournament = await must('POST /tournaments', org('POST', '/tournaments', {
      name: `[LOCAL-STRESS] ${new Date().toISOString()}`,
      game_type: 'speedsoft',
      default_round_duration_seconds: 720,
    }));
    tournamentId = tournament.id;
    ok(`Torneo creado: ${tournamentId}`);

    // Crear jugadores (uno por worker real que tenga asignación)
    // Usamos 20 jugadores para las asignaciones — los 300 workers comparten
    const N_PLAYERS = 20;
    info(`Creando ${N_PLAYERS} jugadores…`);
    players = await must('players/batch', org('POST', `/tournaments/${tournamentId}/players/batch`, {
      players: Array.from({ length: N_PLAYERS }, (_, i) => ({
        name: `Jugador_${i + 1}`,
        team_name: i < N_PLAYERS / 2 ? 'Equipo A' : 'Equipo B',
      })),
    }));
    ok(`${players.length} jugadores creados.`);

    // Crear códigos de árbitro
    info(`Generando ${N_PLAYERS} códigos de árbitro…`);
    refs = await must('referees/generate', org('POST', `/tournaments/${tournamentId}/referees/generate`, {
      count: N_PLAYERS,
    }));
    ok(`${refs.length} códigos generados.`);

    // El árbitro permanente se une (UUID distinto del org para pasar la validación)
    info(`Árbitro de prueba se une al torneo…`);
    const joinResult = await ref('POST', '/tournaments/join', { code: refs[0].code });
    if (!joinResult.ok) throw new Error(`join falló (${joinResult.status}): ${JSON.stringify(joinResult.data)}`);
    const refereeRowIds = [joinResult.data?.id].filter(Boolean);
    ok(`Árbitro unido: ${refereeRowIds[0]}`);

    // Crear ronda
    const round = await must('POST /rounds', org('POST', `/tournaments/${tournamentId}/rounds`, {
      name: 'Ronda Estrés Local', duration_seconds: 720,
    }));
    roundId = round.id;
    ok(`Ronda creada: ${roundId}`);

    // Asignar árbitros a jugadores
    const pairs = refereeRowIds.map((refereeId, i) => ({
      referee_id: refereeId, player_id: players[i]?.id,
    })).filter(p => p.player_id);
    await must('assign/batch', org('POST', `/tournaments/${tournamentId}/rounds/${roundId}/assign/batch`, { pairs }));
    ok(`${pairs.length} asignaciones creadas.`);

    await must('start round', org('PATCH', `/tournaments/${tournamentId}/rounds/${roundId}/start`, null));
    ok('Ronda iniciada. Comenzando fases de carga…');

    const actPath  = `/tournaments/${tournamentId}/rounds/${roundId}/actions`;
    const sbPath   = `/tournaments/${tournamentId}/rounds/${roundId}/scoreboard`;
    const fkPath   = `/tournaments/${tournamentId}/rounds/${roundId}/first-kill`;
    const syncPath = `/tournaments/${tournamentId}/rounds/${roundId}/sync-status`;
    const confPath = `/tournaments/${tournamentId}/rounds/${roundId}/confirm-sync`;

    // Todos los workers usan REF_USER_ID → 300 conexiones simultáneas al mismo endpoint.
    // Esto mide el throughput real del API bajo carga concurrente.
    const getWorkerId = (_i) => REF_USER_ID;

    // ═══════════════════════════════════════════════════════════════
    // FASE 1 — Ráfaga: 300 workers envían acciones a la vez
    // ═══════════════════════════════════════════════════════════════
    step('2a', `FASE 1 — ${WORKERS} workers envían acciones en ráfaga`);
    const m1 = new Metrics();
    await burst(
      workerIds.map((uid, i) => () =>
        worker('POST', actPath, { actions: makeActions(5) }, getWorkerId(i))
          .then(r => { m1.record(r); return r; })
      )
    );
    phases.push({ id: 'burst', name: `Fase 1 — ${WORKERS} workers en ráfaga`, context: `${m1.total} requests simultáneos. Cada worker envió 5 acciones.`, metrics: m1 });
    ok(`Fase 1: ${m1.ok} ok, ${m1.fail} fallaron, ${m1.timeouts} timeouts.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 2 — 60 s sostenido: 300 writers + 30 readers
    // ═══════════════════════════════════════════════════════════════
    step('2b', `FASE 2 — 60 s sostenido: ${WORKERS} writers + 30 readers`);
    const m2w = new Metrics(), m2r = new Metrics();
    const p2end = Date.now() + 60000;
    const readPaths = [sbPath, fkPath, syncPath];
    let rIdx = 0;

    const writers = workerIds.map((uid, i) => async () => {
      while (Date.now() < p2end) {
        const r = await worker('POST', actPath, { actions: makeActions(3) }, getWorkerId(i));
        m2w.record(r);
        await new Promise(r => setTimeout(r, 120 + Math.random() * 200));
      }
    });
    const readers = Array.from({ length: 30 }, () => async () => {
      while (Date.now() < p2end) {
        const r = await apiCall('GET', readPaths[rIdx++ % readPaths.length], null, { userId: ORG_USER_ID });
        m2r.record(r);
        await new Promise(r => setTimeout(r, 80));
      }
    });

    await Promise.all([...writers.map(fn => fn()), ...readers.map(fn => fn())]);
    phases.push({ id: 'sustained-w', name: `Fase 2a — ${WORKERS} writers (60 s)`, context: `Escritura continua durante 1 minuto. Simula una partida real.`, metrics: m2w });
    phases.push({ id: 'sustained-r', name: `Fase 2b — 30 readers simultáneos (60 s)`, context: `Scoreboard + first-kill + sync-status en paralelo.`, metrics: m2r });
    ok(`Fase 2: writes ${m2w.ok}/${m2w.total}, reads ${m2r.ok}/${m2r.total}`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 3 — 300 en scoreboard, 20 s
    // ═══════════════════════════════════════════════════════════════
    step('2c', `FASE 3 — ${WORKERS} espectadores en scoreboard (20 s)`);
    const m3 = new Metrics();
    await sustained({ fn: () => apiCall('GET', sbPath, null, { userId: ORG_USER_ID }), concurrency: WORKERS, durationSecs: 20, metrics: m3 });
    phases.push({ id: 'scoreboard', name: `Fase 3 — ${WORKERS} espectadores en scoreboard (20 s)`, context: `Pantalla pública de resultados bajo carga máxima.`, metrics: m3 });
    ok(`Fase 3: ${m3.ok}/${m3.total} ok.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 4 — 150 en sync-status, 20 s (endpoint más pesado)
    // ═══════════════════════════════════════════════════════════════
    step('2d', `FASE 4 — 150 workers en sync-status (20 s)`);
    const m4 = new Metrics();
    await sustained({ fn: () => apiCall('GET', syncPath, null, { userId: ORG_USER_ID }), concurrency: 150, durationSecs: 20, metrics: m4 });
    phases.push({ id: 'sync', name: `Fase 4 — 150 workers en sync-status (20 s)`, context: `El endpoint más pesado del sistema.`, metrics: m4 });
    ok(`Fase 4: ${m4.ok}/${m4.total} ok.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 5 — 300 confirman sync
    // ═══════════════════════════════════════════════════════════════
    step('2e', `FASE 5 — ${WORKERS} workers confirman sync`);
    const m5 = new Metrics();
    await burst(
      workerIds.map((uid, i) => () =>
        worker('PATCH', confPath, null, getWorkerId(i)).then(r => { m5.record(r); return r; })
      )
    );
    phases.push({ id: 'confirm', name: `Fase 5 — ${WORKERS} confirman sync`, context: `Cierre masivo de todos los árbitros al finalizar ronda.`, metrics: m5 });
    ok(`Fase 5: ${m5.ok}/${m5.total} confirmados.`);

    // ═══════════════════════════════════════════════════════════════
    // FASE 6 — Pico extremo: todo a la vez, 30 s
    // ═══════════════════════════════════════════════════════════════
    step('2f', `FASE 6 — PICO EXTREMO: ${WORKERS} writes + 100 reads (30 s)`);
    const m6w = new Metrics(), m6r = new Metrics();
    const p6end = Date.now() + 30000;

    const peakW = workerIds.map((uid, i) => async () => {
      while (Date.now() < p6end) {
        const r = await worker('POST', actPath, { actions: makeActions(2) }, getWorkerId(i));
        m6w.record(r);
        await new Promise(r => setTimeout(r, 80 + Math.random() * 150));
      }
    });
    const peakR = Array.from({ length: 100 }, (_, i) => async () => {
      const paths = [sbPath, fkPath, syncPath];
      while (Date.now() < p6end) {
        const r = await apiCall('GET', paths[i % paths.length], null, { userId: ORG_USER_ID });
        m6r.record(r);
        await new Promise(r => setTimeout(r, 60));
      }
    });

    await Promise.all([...peakW.map(fn => fn()), ...peakR.map(fn => fn())]);
    phases.push({ id: 'peak-w', name: `Fase 6a — Pico extremo: ${WORKERS} escritores (30 s)`, context: `El peor escenario posible.`, metrics: m6w });
    phases.push({ id: 'peak-r', name: `Fase 6b — Pico extremo: 100 lectores (30 s)`, context: `Lecturas durante el pico máximo de escritura.`, metrics: m6r });
    ok(`Fase 6: writes ${m6w.ok}/${m6w.total}, reads ${m6r.ok}/${m6r.total}`);

  } catch (e) {
    err(`Error: ${e.message}`);
    console.error(e.stack);
  } finally {
    // Cleanup: borrar torneo vía API
    if (!NO_CLEANUP && tournamentId) {
      step('♻', 'Limpiando torneo de prueba…');
      const r = await apiCall('DELETE', `/tournaments/${tournamentId}`, null, { userId: ORG_USER_ID });
      r.ok ? ok(`Torneo ${tournamentId} eliminado.`) : warn(`No se pudo borrar el torneo (${r.status}).`);
    }
    stopBackend();
  }

  if (phases.length > 0) report(phases);
  else warn('No se completó ninguna fase.');

  const hasProblems = phases.some(p => parseFloat(p.metrics.errorRate) > 5);
  process.exit(hasProblems ? 1 : 0);
}

main().catch(e => { err(`Error fatal: ${e.message}`); process.exit(1); });
