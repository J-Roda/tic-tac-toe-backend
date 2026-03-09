// Purge sessions older than 5 days on startup.
// This runs immediately after connect so any docs that survived a server
// downtime (where MongoDB's TTL background task couldn't reach them) are

const GameSession = require('../models/GameSession');

// cleaned up synchronously before the server starts accepting requests.
async function purgeExpiredSessions() {
  const TTL_MS = 3 * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - TTL_MS);
  try {
    const result = await GameSession.deleteMany({ createdAt: { $lt: cutoff } });
    if (result.deletedCount > 0) {
      console.log(`Startup cleanup: removed ${result.deletedCount} expired session(s).`);
    }
  } catch (err) {
    // Non-fatal — TTL index will catch stragglers on its next cycle
    console.warn('Startup cleanup warning:', err.message);
  }
}

module.exports = { purgeExpiredSessions };
