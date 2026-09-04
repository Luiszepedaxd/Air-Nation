/**
 * teardown.js
 *
 * Deletes all test fixtures created by setup.js.
 * Cascades through rounds, players, referees, assignments, and actions automatically
 * because the DB has ON DELETE CASCADE on the foreign keys.
 */

const http   = require('./utils/http');
const logger = require('./utils/logger');
const config = require('./config');

async function teardown(fixtures) {
  logger.section('Teardown — removing test fixtures');

  const token = config.ORGANIZER_TOKEN;
  let errors = 0;

  // Delete tournament A (cascades everything)
  if (fixtures.tournamentId) {
    const res = await http.del(`/tournaments/${fixtures.tournamentId}`, token);
    if (res.ok) {
      logger.success(`Tournament A deleted: ${fixtures.tournamentId}`);
    } else {
      logger.warn(`Could not delete tournament A (${res.status}): ${JSON.stringify(res.data)}`);
      errors++;
    }
  }

  // Delete tournament B (published one), only if we created it (not user-provided slug)
  if (fixtures.pubTournamentId) {
    const res = await http.del(`/tournaments/${fixtures.pubTournamentId}`, token);
    if (res.ok) {
      logger.success(`Tournament B deleted: ${fixtures.pubTournamentId}`);
    } else {
      logger.warn(`Could not delete tournament B (${res.status}): ${JSON.stringify(res.data)}`);
      errors++;
    }
  }

  if (errors > 0) {
    logger.warn(`Teardown completed with ${errors} error(s). You may need to manually delete leftover test data.`);
  } else {
    logger.success('Teardown complete — no leftover test data.');
  }
}

module.exports = { teardown };
