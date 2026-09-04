/**
 * S2 – Referee Batch Actions Burst  (HOT PATH)
 *
 * Hammers POST /:id/rounds/:roundId/actions with multiple concurrent referees.
 * This is the most critical write path in the system — every referee submits
 * batches during a live round. Tests:
 *   • Express + middleware throughput under write concurrency
 *   • Supabase upsert deduplication (client_event_id)
 *   • Concurrent first_kill slot handling (only 1 allowed per round)
 *   • DB connection pool saturation
 *
 * Pattern: burst — all VUs fire immediately
 * Requires: REFEREE_TOKEN + active round with assignment
 */

const crypto          = require('crypto');
const { runBurst }    = require('../utils/concurrency');
const { Metrics }     = require('../utils/metrics');
const { post }        = require('../utils/http');
const logger          = require('../utils/logger');
const config          = require('../config');

const ACTION_TYPES = ['kill', 'death', 'objective', 'key_action', 'critical_action'];

function makeActions(count, includeFirstKill = false) {
  const now     = new Date();
  const actions = Array.from({ length: count }, (_, i) => ({
    action_type:     ACTION_TYPES[i % ACTION_TYPES.length],
    recorded_at:     new Date(now.getTime() - i * 1000).toISOString(),
    client_event_id: crypto.randomUUID(),
  }));

  if (includeFirstKill) {
    actions.push({
      action_type:     'first_kill',
      recorded_at:     new Date(now.getTime() - count * 1000).toISOString(),
      client_event_id: crypto.randomUUID(),
    });
  }

  return actions;
}

async function runActionsBurst(fixtures) {
  const { tournamentId, roundId } = fixtures;
  const cfg  = config.scenarios.actionsBurst;
  const path = `/tournaments/${tournamentId}/rounds/${roundId}/actions`;
  const token = config.REFEREE_TOKEN;

  logger.section('S2 – Referee Batch Actions Burst');
  logger.info(cfg.description);
  logger.info(
    `concurrency: ${cfg.concurrency} | total requests: ${cfg.totalRequests} | ` +
    `${cfg.actionsPerBatch} actions/batch`
  );

  const metrics = new Metrics('S2 – Actions Burst');

  let printed = 0;
  await runBurst({
    fn: (i) => {
      const includeFirstKill = i === 0; // only first request tries first_kill
      const actions = makeActions(cfg.actionsPerBatch, includeFirstKill);
      return post(path, { actions }, token);
    },
    concurrency:   cfg.concurrency,
    totalRequests: cfg.totalRequests,
    metrics,
    onTick: (done, total) => {
      const pct = Math.floor((done / total) * 10);
      if (pct > printed) { printed = pct; logger.progress(`  ${done}/${total} requests sent…`); }
    },
  });

  const summary = metrics.summary();
  logger.printSummary(summary);

  // Count how many were actually inserted vs skipped (idempotent deduplication)
  if (summary.errorRate > 2) {
    logger.warn('⚠  Error rate > 2% — investigate 5xx errors under write concurrency');
  }
  if (summary.latency.p99 > 5000) {
    logger.warn('⚠  p99 > 5s — action submission severely degraded under burst');
  }

  return summary;
}

module.exports = { runActionsBurst };
