class Metrics {
  constructor(name) {
    this.name = name;
    this.durations = [];
    this.successes = 0;
    this.failures = 0;
    this.statusCodes = {};
    this.errors = [];
    this._start = null;
    this._end = null;
  }

  start() { this._start = Date.now(); return this; }
  end()   { this._end   = Date.now(); return this; }

  record({ status, duration, error }) {
    this.durations.push(duration);
    this.statusCodes[status] = (this.statusCodes[status] || 0) + 1;

    const isNetError  = !status || status === 0;
    const isServerErr = status >= 500;
    const isClientErr = status >= 400 && status < 500;

    if (isNetError || isServerErr) {
      this.failures++;
      if (error) this.errors.push(error);
    } else if (isClientErr) {
      // 4xx are counted as failures for stress purposes
      this.failures++;
    } else {
      this.successes++;
    }
  }

  _pct(p) {
    if (this.durations.length === 0) return 0;
    const sorted = [...this.durations].sort((a, b) => a - b);
    const idx    = Math.min(Math.ceil((p / 100) * sorted.length) - 1, sorted.length - 1);
    return Math.round(sorted[Math.max(0, idx)]);
  }

  get total()     { return this.durations.length; }
  get elapsedMs() { return ((this._end || Date.now()) - (this._start || Date.now())); }

  summary() {
    const { total, successes, failures, elapsedMs, statusCodes, errors, name } = this;
    return {
      scenario:    name,
      total,
      successes,
      failures,
      errorRate:   total > 0 ? +((failures / total) * 100).toFixed(2) : 0,
      rps:         elapsedMs > 0 ? +(total / (elapsedMs / 1000)).toFixed(2) : 0,
      latency: {
        min: this._pct(1),
        p50: this._pct(50),
        p90: this._pct(90),
        p95: this._pct(95),
        p99: this._pct(99),
        max: this._pct(100),
      },
      statusCodes,
      sampleErrors: [...new Set(errors)].slice(0, 5),
    };
  }
}

module.exports = { Metrics };
