/**
 * S5 – First-Kill Check Polling
 *
 * Hammers GET /:id/rounds/:roundId/first-kill.
 * This endpoint is hit by every referee's UI to display "first kill claimed"
 * notifications in real time. It's a lightweight query (single row lookup)
 * but polled very frequently and from many clients simultaneously.
 *
 * Pattern: sustained, high concurrency
 */

const { runSustained } = require('../utils/concurrency');
const { Metrics }      = require('../utils/metrics');
const { get }          = require('../utils/http');
const logger           = require('../utils/logger');
const config           = require('../config');

async function runFirstKill(fixtures) {
  const { tournamentId, roundId } = fixtures;
  const cfg  = config.scenarios.firstKill;
  const path = `/tournaments/${tournamentId}/rounds/${roundId}/first-kill`;
  const token = config.ORGANIZER_TOKEN;

  logger.section('S5 – First-Kill Check Polling');
  logger.info(cfg.description);
  logger.info(`concurrency: ${cfg.concurrency} | duration: ${cfg.durationSecs}s`);

  const metrics = new Metrics('S5 – First-Kill Poll');

  await runSustained({
    fn:           () => get(path, token),
    concurrency:  cfg.concurrency,
    durationSecs: cfg.durationSecs,
    metrics,
  });

  const summary = metrics.summary();
  logger.printSummary(summary);

  if (summary.errorRate > 0.5) {
    logger.warn('⚠  Error rate on a lightweight endpoint — investigate');
  }
  if (summary.latency.p95 > 800) {
    logger.warn('⚠  p95 > 800ms — first-kill check is slow. Consider a materialized column.');
  }

  return summary;
}

module.exports = { runFirstKill };
