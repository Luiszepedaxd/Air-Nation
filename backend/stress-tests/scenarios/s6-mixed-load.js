/**
 * S6 – Mixed Read/Write Load  (Full Live Round Simulation)
 *
 * Simulates a real tournament round in progress:
 *   • 70% reads  → GET scoreboard, first-kill, sync-status (round-robin)
 *   • 30% writes → POST actions batches (requires REFEREE_TOKEN)
 *
 * This is the most realistic stress scenario: it mimics N referees syncing
 * data while the organizer and spectators are polling at the same time.
 *
 * Pattern: sustained load for full duration
 * Requires: REFEREE_TOKEN + active round with assignment for write workers
 */

const crypto           = require('crypto');
const { runSustained } = require('../utils/concurrency');
const { Metrics }      = require('../utils/metrics');
const { get, post }    = require('../utils/http');
const logger           = require('../utils/logger');
const config           = require('../config');

const ACTION_TYPES = ['kill', 'death', 'objective', 'key_action', 'critical_action'];

function makeActions(count) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    action_type:     ACTION_TYPES[i % ACTION_TYPES.length],
    recorded_at:     new Date(now.getTime() - i * 1000).toISOString(),
    client_event_id: crypto.randomUUID(),
  }));
}

async function runMixedLoad(fixtures) {
  const { tournamentId, roundId, hasActiveRound } = fixtures;
  const cfg         = config.scenarios.mixed;
  const orgToken    = config.ORGANIZER_TOKEN;
  const refToken    = config.REFEREE_TOKEN;

  logger.section('S6 – Mixed Read/Write Load (Live Round Simulation)');
  logger.info(cfg.description);

  const totalWorkers  = cfg.concurrency;
  const writeWorkers  = hasActiveRound && refToken
    ? Math.floor(totalWorkers * cfg.writeRatio)
    : 0;
  const readWorkers   = totalWorkers - writeWorkers;

  logger.info(
    `Total workers: ${totalWorkers} | read: ${readWorkers} | write: ${writeWorkers} | ` +
    `duration: ${cfg.durationSecs}s`
  );

  if (writeWorkers === 0) {
    logger.warn('No write workers (REFEREE_TOKEN not set or no active round). Running read-only.');
  }

  const readMetrics  = new Metrics('S6 – Mixed (reads)');
  const writeMetrics = new Metrics('S6 – Mixed (writes)');

  const readPaths = [
    `/tournaments/${tournamentId}/rounds/${roundId}/scoreboard`,
    `/tournaments/${tournamentId}/rounds/${roundId}/first-kill`,
    `/tournaments/${tournamentId}/rounds/${roundId}/sync-status`,
  ];
  let readIdx = 0;

  const actionsPath = `/tournaments/${tournamentId}/rounds/${roundId}/actions`;

  const deadline = Date.now() + cfg.durationSecs * 1000;

  const readWorkerFn = async () => {
    while (Date.now() < deadline) {
      const path   = readPaths[readIdx++ % readPaths.length];
      const result = await get(path, orgToken);
      readMetrics.record(result);
    }
  };

  const writeWorkerFn = async () => {
    while (Date.now() < deadline) {
      const result = await post(
        actionsPath,
        { actions: makeActions(cfg.actionsPerBatch) },
        refToken
      );
      writeMetrics.record(result);
    }
  };

  readMetrics.start();
  writeMetrics.start();

  const allWorkers = [
    ...Array.from({ length: readWorkers },  () => readWorkerFn()),
    ...Array.from({ length: writeWorkers }, () => writeWorkerFn()),
  ];

  await Promise.all(allWorkers);

  readMetrics.end();
  writeMetrics.end();

  const readSummary  = readMetrics.summary();
  const writeSummary = writeMetrics.summary();

  logger.printSummary(readSummary);
  if (writeWorkers > 0) logger.printSummary(writeSummary);

  // Combined summary for the final report
  const totalReqs    = readSummary.total + writeSummary.total;
  const totalFails   = readSummary.failures + writeSummary.failures;
  const combined = {
    scenario:    'S6 – Mixed Load (combined)',
    total:       totalReqs,
    successes:   readSummary.successes + writeSummary.successes,
    failures:    totalFails,
    errorRate:   totalReqs > 0 ? +((totalFails / totalReqs) * 100).toFixed(2) : 0,
    rps:         +(readSummary.rps + writeSummary.rps).toFixed(2),
    latency: {
      // Take the worse of the two (reads vs writes)
      min: Math.min(readSummary.latency.min, writeSummary.latency.min || Infinity),
      p50: Math.max(readSummary.latency.p50, writeSummary.latency.p50),
      p90: Math.max(readSummary.latency.p90, writeSummary.latency.p90),
      p95: Math.max(readSummary.latency.p95, writeSummary.latency.p95),
      p99: Math.max(readSummary.latency.p99, writeSummary.latency.p99),
      max: Math.max(readSummary.latency.max, writeSummary.latency.max),
    },
    statusCodes:  { ...readSummary.statusCodes },
    sampleErrors: [...readSummary.sampleErrors, ...writeSummary.sampleErrors].slice(0, 5),
  };

  if (combined.errorRate > 5) {
    logger.warn('⚠  Combined error rate > 5% under mixed load — system struggles under real conditions');
  }
  if (combined.latency.p95 > 4000) {
    logger.warn('⚠  p95 > 4s under mixed load — user experience will degrade significantly during live rounds');
  }

  return combined;
}

module.exports = { runMixedLoad };
