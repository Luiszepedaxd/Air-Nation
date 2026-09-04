/**
 * S4 – Sync-Status Polling Storm  (EXPENSIVE ENDPOINT)
 *
 * Hammers GET /:id/rounds/:roundId/sync-status.
 * This is the most DB-intensive read endpoint in the module:
 *   1 query  → fetch all assignments
 *   2 × N queries per assignment → last_action + total_actions count
 * Total: 1 + 2·N Supabase calls per request, serialized inside Promise.all.
 * With N=5 assignments → 11 DB calls per HTTP request.
 * This endpoint is the #1 candidate for causing DB connection pool exhaustion.
 *
 * Pattern: sustained load — focus on saturation
 */

const { runSustained } = require('../utils/concurrency');
const { Metrics }      = require('../utils/metrics');
const { get }          = require('../utils/http');
const logger           = require('../utils/logger');
const config           = require('../config');

async function runSyncStatus(fixtures) {
  const { tournamentId, roundId } = fixtures;
  const cfg  = config.scenarios.syncStatus;
  const path = `/tournaments/${tournamentId}/rounds/${roundId}/sync-status`;
  const token = config.ORGANIZER_TOKEN;

  logger.section('S4 – Sync-Status Polling Storm');
  logger.info(cfg.description);
  logger.warn('⚠  This endpoint issues 1 + 2·N DB calls per request (expensive!)');
  logger.info(`concurrency: ${cfg.concurrency} | duration: ${cfg.durationSecs}s`);

  const metrics = new Metrics('S4 – Sync-Status Poll');

  await runSustained({
    fn:           () => get(path, token),
    concurrency:  cfg.concurrency,
    durationSecs: cfg.durationSecs,
    metrics,
  });

  const summary = metrics.summary();
  logger.printSummary(summary);

  if (summary.errorRate > 1) {
    logger.warn('⚠  Error rate > 1% — likely DB connection pool exhaustion');
    logger.warn('   Recommendation: cache sync-status with a short TTL (500ms) or use Supabase Realtime');
  }
  if (summary.latency.p95 > 3000) {
    logger.warn('⚠  p95 > 3s — sync-status is severely degraded. Needs caching or query optimization.');
  }
  if (summary.latency.p50 > 1000) {
    logger.warn('⚠  Median latency > 1s — N+1 query pattern hurting performance even at p50');
  }

  return summary;
}

module.exports = { runSyncStatus };
