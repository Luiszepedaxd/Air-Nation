/**
 * Run `fn` using a worker-pool pattern.
 *
 * burst mode   – fire exactly `totalRequests` calls with up to `concurrency` in flight
 * sustained    – run workers continuously for `duration` seconds
 * ramp         – linearly increase workers from 1 → concurrency over `rampSecs` then sustain
 */

async function runBurst({ fn, concurrency, totalRequests, metrics, onTick }) {
  let idx = 0;

  async function worker() {
    while (idx < totalRequests) {
      const i = idx++;
      const result = await fn(i);
      metrics.record(result);
      if (onTick) onTick(metrics.total, totalRequests);
    }
  }

  metrics.start();
  await Promise.all(Array.from({ length: Math.min(concurrency, totalRequests) }, worker));
  metrics.end();
}

async function runSustained({ fn, concurrency, durationSecs, metrics, onTick }) {
  const deadline = Date.now() + durationSecs * 1000;
  let count = 0;

  async function worker() {
    while (Date.now() < deadline) {
      const result = await fn(count++);
      metrics.record(result);
      if (onTick) onTick(metrics.total);
    }
  }

  metrics.start();
  await Promise.all(Array.from({ length: concurrency }, worker));
  metrics.end();
}

async function runRamp({ fn, maxConcurrency, rampSecs, sustainSecs, metrics }) {
  // Spawn workers gradually during rampSecs, then sustain for sustainSecs
  const workers = [];
  const deadline = Date.now() + (rampSecs + sustainSecs) * 1000;
  const spawnInterval = (rampSecs * 1000) / maxConcurrency;

  metrics.start();

  // Gradually spawn workers
  for (let i = 0; i < maxConcurrency; i++) {
    await sleep(spawnInterval);
    workers.push(
      (async () => {
        while (Date.now() < deadline) {
          const result = await fn(i);
          metrics.record(result);
        }
      })()
    );
  }

  await Promise.all(workers);
  metrics.end();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = { runBurst, runSustained, runRamp, sleep };
