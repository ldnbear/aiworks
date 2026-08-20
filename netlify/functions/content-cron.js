// Content loop — scheduled trigger.
// Runs Mon & Thu 08:00 UTC (see netlify.toml). Does no work itself:
// fires the background worker (15-min limit) and returns immediately.

exports.handler = async function () {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { statusCode: 500, body: 'CRON_SECRET not set' };

  const url = (process.env.URL || 'https://agentsatwork.co') +
    '/.netlify/functions/content-worker-background';

  try {
    // Background functions return 202 immediately; the work continues server-side.
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'x-cron-secret': secret, 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'cron' }),
    });
    return { statusCode: 200, body: 'worker triggered: ' + resp.status };
  } catch (e) {
    return { statusCode: 500, body: 'trigger failed: ' + e.message };
  }
};
