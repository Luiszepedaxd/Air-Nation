require('dotenv').config({ path: require('path').join(__dirname, '.env.stress') });

module.exports = {
  // ─── Connection ───────────────────────────────────────────────────────────
  BASE_URL: process.env.STRESS_API_URL || 'http://localhost:4000/api/v1',

  // ─── Auth tokens ──────────────────────────────────────────────────────────
  // Get these from the app: open DevTools → Application → Local Storage →
  // find the key that starts with "sb-" and copy the "access_token" field.
  ORGANIZER_TOKEN: process.env.STRESS_ORGANIZER_TOKEN || null,
  REFEREE_TOKEN:   process.env.STRESS_REFEREE_TOKEN   || null,

  // Optional: if you already have a published tournament, provide its slug
  // to skip creating a throw-away one during setup.
  PUBLIC_SLUG: process.env.STRESS_PUBLIC_SLUG || null,

  // ─── Scenario parameters ──────────────────────────────────────────────────
  scenarios: {
    // S1 – Public results page storm (no auth)
    publicResults: {
      concurrency:   50,
      durationSecs:  30,
      description:   'Public /public/:slug storm – simulates viral sharing',
    },

    // S2 – Referee batch actions burst (HOT PATH)
    // Each virtual user submits a batch of N actions concurrently.
    actionsBurst: {
      concurrency:    25,
      totalRequests:  500,
      actionsPerBatch: 5,
      description:    'POST /actions burst – concurrent referees syncing data',
    },

    // S3 – Scoreboard concurrent polling
    scoreboard: {
      concurrency:  40,
      durationSecs: 30,
      description:  'GET /scoreboard storm – organizer + spectators polling',
    },

    // S4 – Sync-status polling (EXPENSIVE: 1 + 2·N Supabase calls per request)
    syncStatus: {
      concurrency:  20,
      durationSecs: 30,
      description:  'GET /sync-status storm – organizer waiting for confirmations',
    },

    // S5 – First-kill check polling
    firstKill: {
      concurrency:  30,
      durationSecs: 20,
      description:  'GET /first-kill storm – live display polling',
    },

    // S6 – Mixed read + write (simulates a real live round)
    mixed: {
      concurrency:      50,
      durationSecs:     60,
      writeRatio:       0.3,   // 30% writes (actions), 70% reads (scoreboard/sync/first-kill)
      actionsPerBatch:  3,
      description:      'Mixed read/write – simulates a full live tournament round',
    },
  },
};
