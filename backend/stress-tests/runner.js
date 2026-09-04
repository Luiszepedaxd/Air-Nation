#!/usr/bin/env node
/**
 * runner.js — AIR NATION Referee Tournament Stress Test Suite
 *
 * Usage:
 *   node stress-tests/runner.js [scenario] [--dry-run]
 *
 * Scenarios:
 *   all         Run every scenario (default)
 *   public      S1 – Public results page storm
 *   actions     S2 – Referee actions burst       (requires REFEREE_TOKEN)
 *   scoreboard  S3 – Scoreboard polling storm
 *   sync        S4 – Sync-status polling storm
 *   firstkill   S5 – First-kill polling storm
 *   mixed       S6 – Mixed read/write simulation (requires REFEREE_TOKEN)
 *
 * Prerequisites:
 *   1. Copy  stress-tests/.env.stress.example  →  stress-tests/.env.stress
 *   2. Fill in STRESS_ORGANIZER_TOKEN (and optionally STRESS_REFEREE_TOKEN)
 *   3. Make sure the backend is running: npm run dev
 *   4. Run: node stress-tests/runner.js
 */

const config  = require('./config');
const http    = require('./utils/http');
const logger  = require('./utils/logger');
const { setup }    = require('./setup');
const { teardown } = require('./teardown');

const { runPublicResults } = require('./scenarios/s1-public-results');
const { runActionsBurst }  = require('./scenarios/s2-actions-burst');
const { runScoreboard }    = require('./scenarios/s3-scoreboard');
const { runSyncStatus }    = require('./scenarios/s4-sync-status');
const { runFirstKill }     = require('./scenarios/s5-first-kill');
const { runMixedLoad }     = require('./scenarios/s6-mixed-load');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags   = process.argv.slice(2).filter(a => a.startsWith('--'));
const scenario = args[0] || 'all';
const dryRun   = flags.includes('--dry-run');

const VALID_SCENARIOS = ['all', 'public', 'actions', 'scoreboard', 'sync', 'firstkill', 'mixed'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function matchScenario(name) {
  return scenario === 'all' || scenario === name;
}

async function checkHealth() {
  const url = http.healthUrl();
  logger.progress(`Checking server health: ${url}`);
  const res = await http.get(url);
  if (!res.ok) {
    throw new Error(
      `Server not healthy (${res.status}). Is the backend running at ${config.BASE_URL}?`
    );
  }
  logger.success(`Server is up: ${JSON.stringify(res.data)}`);
}

function validateConfig() {
  if (!config.ORGANIZER_TOKEN) {
    logger.error('STRESS_ORGANIZER_TOKEN is required.');
    logger.info('Copy stress-tests/.env.stress.example → stress-tests/.env.stress and fill in the tokens.');
    process.exit(1);
  }
  if (!VALID_SCENARIOS.includes(scenario)) {
    logger.error(`Unknown scenario "${scenario}". Valid: ${VALID_SCENARIOS.join(', ')}`);
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const startedAt = Date.now();

  console.log('\n' +
    '\x1b[1m\x1b[36m' +
    '╔═══════════════════════════════════════════════════════════╗\n' +
    '║    AIR NATION — Referee Tournament Stress Test Suite      ║\n' +
    '╚═══════════════════════════════════════════════════════════╝' +
    '\x1b[0m\n'
  );

  logger.info(`API Base URL  : ${config.BASE_URL}`);
  logger.info(`Scenario      : ${scenario}`);
  logger.info(`Organizer     : ${config.ORGANIZER_TOKEN ? '✓ provided' : '✗ missing'}`);
  logger.info(`Referee token : ${config.REFEREE_TOKEN  ? '✓ provided' : '⚠ not provided (S2, S6 will be skipped)'}`);
  if (dryRun) logger.warn('DRY RUN mode — no actual load will be generated after connectivity check\n');

  // 1. Validate config
  validateConfig();

  // 2. Check connectivity
  try {
    await checkHealth();
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }

  if (dryRun) {
    logger.success('Dry run complete — configuration looks good.');
    process.exit(0);
  }

  // 3. Setup fixtures
  let fixtures;
  try {
    fixtures = await setup();
  } catch (err) {
    logger.error(`Setup failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Run scenarios
  const results = [];

  try {
    // S1 – Public results
    if (matchScenario('public')) {
      if (fixtures.publicSlug) {
        results.push(await runPublicResults(fixtures));
      } else {
        logger.warn('S1 skipped — no public slug available');
      }
    }

    // S2 – Actions burst
    if (matchScenario('actions')) {
      if (fixtures.hasActiveRound && config.REFEREE_TOKEN) {
        results.push(await runActionsBurst(fixtures));
      } else {
        logger.warn('S2 skipped — requires REFEREE_TOKEN and active round with assignment');
      }
    }

    // S3 – Scoreboard
    if (matchScenario('scoreboard')) {
      results.push(await runScoreboard(fixtures));
    }

    // S4 – Sync status
    if (matchScenario('sync')) {
      results.push(await runSyncStatus(fixtures));
    }

    // S5 – First-kill
    if (matchScenario('firstkill')) {
      results.push(await runFirstKill(fixtures));
    }

    // S6 – Mixed load
    if (matchScenario('mixed')) {
      results.push(await runMixedLoad(fixtures));
    }
  } catch (err) {
    logger.error(`Scenario error: ${err.message}`);
    console.error(err.stack);
  } finally {
    // 5. Teardown — always run
    await teardown(fixtures);
  }

  // 6. Final report
  if (results.length > 0) {
    logger.printFinalReport(results);
  } else {
    logger.warn('No scenario results to report.');
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  logger.info(`Total time: ${elapsed}s`);

  // Exit 1 if any scenario has error rate > 5%
  const hasHighErrors = results.some(r => r.errorRate > 5);
  process.exit(hasHighErrors ? 1 : 0);
}

main().catch((err) => {
  logger.error(`Unhandled error: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
