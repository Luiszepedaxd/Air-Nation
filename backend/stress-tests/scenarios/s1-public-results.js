/**
 * S1 – Public Results Storm
 *
 * Hammers GET /public/:slug with no auth.
 * This endpoint does 5+ Supabase queries per request (tournament, creator, rounds,
 * players, actions). Tests how the server handles viral traffic on published results.
 *
 * Pattern: sustained load with ramp-up
 */

const { runRamp }    = require('../utils/concurrency');
const { Metrics }    = require('../utils/metrics');
const { get }        = require('../utils/http');
const logger         = require('../utils/logger');
const config         = require('../config');

async function runPublicResults(fixtures) {
  const { publicSlug } = fixtures;
  const cfg = config.scenarios.publicResults;

  logger.section('S1 – Public Results Storm');
  logger.info(cfg.description);
  logger.info(`Slug: ${publicSlug} | concurrency: ${cfg.concurrency} | duration: ${cfg.durationSecs}s`);

  const metrics = new Metrics('S1 – Public Results');
  const path    = `/tournaments/public/${publicSlug}`;

  // Use a ramp pattern: 10s to reach full concurrency, then sustain
  const rampSecs    = Math.floor(cfg.durationSecs * 0.3);
  const sustainSecs = cfg.durationSecs - rampSecs;

  await runRamp({
    fn:             () => get(path),
    maxConcurrency: cfg.concurrency,
    rampSecs,
    sustainSecs,
    metrics,
  });

  const summary = metrics.summary();
  logger.printSummary(summary);

  if (summary.errorRate > 5) {
    logger.warn('⚠  Error rate exceeds 5% — public results endpoint under stress');
  }
  if (summary.latency.p95 > 3000) {
    logger.warn('⚠  p95 latency > 3s — response time degrading under load');
  }

  return summary;
}

module.exports = { runPublicResults };
