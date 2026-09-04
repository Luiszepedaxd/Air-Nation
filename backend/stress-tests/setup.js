/**
 * setup.js
 *
 * Creates all the test fixtures needed for the stress scenarios via real API calls.
 * Returns a `fixtures` object that every scenario receives.
 *
 * What it creates
 * ───────────────
 * Tournament A  (active)  → used by S2 actions, S3 scoreboard, S4 sync-status, S5 first-kill, S6 mixed
 *   ├─ 10 players
 *   ├─ 5 referee codes
 *   ├─ 1 round  (status: active if REFEREE_TOKEN provided)
 *   └─ 1 assignment referee ↔ player[0]   (only if REFEREE_TOKEN)
 *
 * Tournament B  (published)  → used by S1 public-results
 *   ├─ 5 players
 *   └─ finalized + public_results = true  → public_slug
 */

const http    = require('./utils/http');
const logger  = require('./utils/logger');
const config  = require('./config');

const ORG_TOKEN = () => config.ORGANIZER_TOKEN;
const REF_TOKEN = () => config.REFEREE_TOKEN;

async function must(label, call) {
  const res = await call;
  if (!res.ok) {
    throw new Error(`${label} → HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  }
  return res.data;
}

async function setup() {
  logger.section('Setup — creating test fixtures');

  const fixtures = {
    tournamentId:   null,
    roundId:        null,
    refereeId:      null,   // row ID in tournament_referees
    playerId:       null,
    assignmentId:   null,
    publicSlug:     config.PUBLIC_SLUG || null,
    pubTournamentId: null,
    hasActiveRound: false,
    hasReferee:     !!REF_TOKEN(),
  };

  // ── Tournament A ──────────────────────────────────────────────────────────
  logger.progress('Creating tournament A (active)…');
  const tA = await must('POST /tournaments', http.post('/tournaments', {
    name: `[STRESS-TEST] ${Date.now()}`,
    game_type: 'speedsoft',
    default_round_duration_seconds: 300,
  }, ORG_TOKEN()));
  fixtures.tournamentId = tA.id;
  logger.success(`Tournament A created: ${tA.id}`);

  // Players
  logger.progress('Adding 10 players to tournament A…');
  const players = await must('POST /players/batch', http.post(
    `/tournaments/${tA.id}/players/batch`,
    {
      players: Array.from({ length: 10 }, (_, i) => ({
        name: `StressPlayer_${i + 1}`,
        team_name: i < 5 ? 'Team Alpha' : 'Team Beta',
      })),
    },
    ORG_TOKEN()
  ));
  fixtures.playerId = players[0].id;
  logger.success(`${players.length} players added.`);

  // Referee codes
  logger.progress('Generating 5 referee codes…');
  const referees = await must('POST /referees/generate', http.post(
    `/tournaments/${tA.id}/referees/generate`,
    { count: 5 },
    ORG_TOKEN()
  ));
  const firstCode = referees[0].code;
  logger.success(`5 referee codes generated. First code: ${firstCode}`);

  // Round
  logger.progress('Creating round 1…');
  const round = await must('POST /rounds', http.post(
    `/tournaments/${tA.id}/rounds`,
    { name: 'Stress Round 1', duration_seconds: 300 },
    ORG_TOKEN()
  ));
  fixtures.roundId = round.id;
  logger.success(`Round created: ${round.id}`);

  // Referee join + assignment (only if REFEREE_TOKEN is provided)
  if (REF_TOKEN()) {
    logger.progress(`Joining tournament as referee (code ${firstCode})…`);
    const refRow = await must('POST /join', http.post('/tournaments/join', { code: firstCode }, REF_TOKEN()));
    fixtures.refereeId = refRow.id;
    logger.success(`Referee joined: rowId=${refRow.id}`);

    logger.progress('Assigning referee → player[0]…');
    const assignment = await must('POST /assign', http.post(
      `/tournaments/${tA.id}/rounds/${round.id}/assign`,
      { referee_id: refRow.id, player_id: fixtures.playerId },
      ORG_TOKEN()
    ));
    fixtures.assignmentId = assignment.id;
    logger.success(`Assignment created: ${assignment.id}`);

    logger.progress('Starting round 1…');
    await must('PATCH /start', http.patch(
      `/tournaments/${tA.id}/rounds/${round.id}/start`,
      null,
      ORG_TOKEN()
    ));
    fixtures.hasActiveRound = true;
    logger.success('Round 1 is now ACTIVE.');
  } else {
    logger.warn('STRESS_REFEREE_TOKEN not set → skipping join/assign/start (S2, S6 will be skipped).');
  }

  // ── Tournament B (published) ──────────────────────────────────────────────
  if (!fixtures.publicSlug) {
    logger.progress('Creating tournament B (published, for public-results test)…');
    const tB = await must('POST /tournaments (B)', http.post('/tournaments', {
      name: `[STRESS-PUB] ${Date.now()}`,
      game_type: 'tactical_arena',
      default_round_duration_seconds: 180,
    }, ORG_TOKEN()));
    fixtures.pubTournamentId = tB.id;

    await must('POST /players/batch (B)', http.post(
      `/tournaments/${tB.id}/players/batch`,
      { players: Array.from({ length: 5 }, (_, i) => ({ name: `PubPlayer_${i + 1}` })) },
      ORG_TOKEN()
    ));

    const fin = await must('PATCH /finalize (B)', http.patch(
      `/tournaments/${tB.id}/finalize`,
      { publish: true },
      ORG_TOKEN()
    ));
    fixtures.publicSlug = fin.public_slug;
    logger.success(`Tournament B published. Slug: ${fin.public_slug}`);
  } else {
    logger.info(`Using pre-existing public slug: ${fixtures.publicSlug}`);
  }

  logger.section('Setup complete');
  logger.info(`Tournament A  : ${fixtures.tournamentId}`);
  logger.info(`Round         : ${fixtures.roundId}`);
  logger.info(`Active round  : ${fixtures.hasActiveRound}`);
  logger.info(`Public slug   : ${fixtures.publicSlug}`);

  return fixtures;
}

module.exports = { setup };
