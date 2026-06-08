const cron = require('node-cron');
const authService = require('../services/authService');

// Expired refresh tokens are rejected at use time, but they still pile up in the
// table. This job clears them out on a schedule so the table stays small.
// Runs every day at 03:00 server time.
const scheduleTokenCleanup = () => {
    cron.schedule('0 3 * * *', async () => {
        try {
            await authService.deleteExpiredRefreshTokens();
            console.log('[cron] Expired refresh tokens purged');
        } catch (err) {
            console.error('[cron] Token cleanup failed:', err.message);
        }
    });
};

module.exports = { scheduleTokenCleanup };
