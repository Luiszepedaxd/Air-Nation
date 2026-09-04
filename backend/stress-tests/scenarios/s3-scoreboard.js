/**
 * S3 – Scoreboard Concurrent Polling
 *
 * Hammers GET /:id/rounds/:roundId/scoreboard.
 * This endpoint does 2 Supabase queries (actions + players) and runs compute
 * on the server for every request. Tests read throughput for the "live
 * scoreboard" use-case where the organizer and spectators poll repeatedly.
 *
 * Pattern: sustained load
 */

const { runSustained } = require('../utils/concurrency');
const { Metrics }      = require('../utils/metrics');
const { get }          = require('../utils/http');
const logger           = require('../utils/logger');
const config           = require('../config');

async function runScoreboard(fixtures) {
  const { tournamentId, roundId } = fixtures;
  const cfg  = config.scenarios.scoreboard;
  const path = `/tournaments/${tournamentId}/rounds/${roundId}/scoreboard`;
  const token = config.ORGANIZER_TOKEN;

  logger.section('S3 – Scoreboard Concurrent Polling');
  logger.info(cfg.description);
  logger.info(`concurrency: ${cfg.concurrency} | duration: ${cfg.durationSecs}s`);

  const metrics = new Metrics('S3 – Scoreboard Poll');

  await runSustained({
    fn:           () => get(path, token),
    concurrency:  cfg.concurrency,
    durationSecs: cfg.durationSecs,
    metrics,
  });

  const summary = metrics.summary();
  logger.printSummary(summary);

  if (summary.errorRate > 1) {
    logger.warn('⚠  Error rate > 1% on read-only endpoint — check DB connection pool');
  }
  if (summary.latency.p95 > 1500) {
    logger.warn('⚠  p95 > 1.5s — scoreboard response time degrading under polling load');
  }
  if (summary.rps < 10) {
    logger.warn('⚠  Throughput < 10 req/s — scoreboard endpoint may be a bottleneck');
  }

  return summary;
}

module.exports = { runScoreboard };
