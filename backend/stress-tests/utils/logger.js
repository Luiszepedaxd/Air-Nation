const R = '\x1b[0m';
const B = '\x1b[1m';
const red    = '\x1b[31m';
const green  = '\x1b[32m';
const yellow = '\x1b[33m';
const cyan   = '\x1b[36m';
const gray   = '\x1b[90m';
const magenta = '\x1b[35m';

const log      = (msg) => console.log(msg);
const info     = (msg) => console.log(`${cyan}ℹ${R}  ${msg}`);
const success  = (msg) => console.log(`${green}✓${R}  ${msg}`);
const warn     = (msg) => console.log(`${yellow}⚠${R}  ${msg}`);
const error    = (msg) => console.error(`${red}✗${R}  ${msg}`);
const progress = (msg) => console.log(`${gray}   ${msg}${R}`);

function section(title) {
  const line = '━'.repeat(Math.max(0, 50 - title.length));
  console.log(`\n${B}${cyan}━━━ ${title} ${line}${R}`);
}

function subSection(title) {
  console.log(`\n${gray}  ── ${title} ──${R}`);
}

function printSummary(s) {
  const { scenario, total, successes, failures, errorRate, rps, latency, statusCodes, sampleErrors } = s;

  section(`Results: ${scenario}`);

  const errColor = errorRate > 10 ? red : errorRate > 5 ? yellow : errorRate > 0 ? magenta : green;
  const rpsLabel = rps >= 100 ? green : rps >= 20 ? yellow : red;

  console.log(`  ${B}Requests :${R}  ${total} total · ${green}${successes} ok${R} · ${errColor}${failures} failed${R}`);
  console.log(`  ${B}Error    :${R}  ${errColor}${errorRate}%${R}`);
  console.log(`  ${B}RPS      :${R}  ${rpsLabel}${rps}${R} req/s`);
  console.log(`  ${B}Latency  :${R}`);
  console.log(`    min  ${latency.min}ms`);
  console.log(`    p50  ${latency.p50}ms`);
  console.log(`    p90  ${latency.p90}ms`);
  console.log(`    p95  ${latency.p95}ms`);
  console.log(`    p99  ${latency.p99}ms`);
  console.log(`    max  ${latency.max}ms`);
  console.log(`  ${B}Codes    :${R}  ${JSON.stringify(statusCodes)}`);

  if (sampleErrors.length > 0) {
    console.log(`  ${B}Errors   :${R}  ${red}${sampleErrors.join(' | ')}${R}`);
  }
}

function printFinalReport(results) {
  section('FINAL REPORT');
  const pad = (s, n) => String(s).padEnd(n);
  const rpad = (s, n) => String(s).padStart(n);

  const header = `  ${'Scenario'.padEnd(28)} ${'Total'.padStart(6)} ${'Err%'.padStart(6)} ${'p50'.padStart(7)} ${'p95'.padStart(7)} ${'RPS'.padStart(7)}`;
  console.log(`\n${gray}${header}${R}`);
  console.log(`${gray}  ${'─'.repeat(65)}${R}`);

  for (const s of results) {
    const errColor = s.errorRate > 5 ? red : s.errorRate > 0 ? yellow : green;
    console.log(
      `  ${pad(s.scenario, 28)} ` +
      `${rpad(s.total, 6)} ` +
      `${errColor}${rpad(s.errorRate + '%', 6)}${R} ` +
      `${rpad(s.latency.p50 + 'ms', 7)} ` +
      `${rpad(s.latency.p95 + 'ms', 7)} ` +
      `${rpad(s.rps, 7)}`
    );
  }

  const totalReq    = results.reduce((a, r) => a + r.total, 0);
  const totalFail   = results.reduce((a, r) => a + r.failures, 0);
  const overallErr  = totalReq > 0 ? +((totalFail / totalReq) * 100).toFixed(2) : 0;
  const overallColor = overallErr > 5 ? red : overallErr > 0 ? yellow : green;

  console.log(`\n  ${B}Overall: ${totalReq} requests · ${overallColor}${overallErr}% error rate${R}\n`);
}

module.exports = { log, info, success, warn, error, progress, section, subSection, printSummary, printFinalReport };
