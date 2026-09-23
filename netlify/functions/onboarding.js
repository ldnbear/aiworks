const { OFFERS } = require('./_offers');
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

async function stripe(path, options = {}) {
  const response = await fetch('https://api.stripe.com/v1/' + path, {
    ...options,
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
      ...(options.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error('Stripe ' + response.status);
  return data;
}

exports.handler = async event => {
  if (!['GET', 'POST'].includes(event.httpMethod)) return { statusCode: 405, headers, body: '{}' };
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 503, headers, body: JSON.stringify({ error: 'Onboarding is unavailable.' }) };
  const requestOrigin = event.headers.origin || event.headers.Origin;
  if (requestOrigin && requestOrigin !== 'https://agentsatwork.co') return { statusCode: 403, headers, body: '{}' };
  try {
    const input = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : (event.queryStringParameters || {});
    const sessionId = input.session_id;
    if (!/^cs_(test_|live_)[A-Za-z0-9]+$/.test(sessionId || '')) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid session.' }) };
    const session = await stripe('checkout/sessions/' + sessionId);
    const offer = session.metadata?.offer;
    if (!OFFERS[offer] || session.payment_status !== 'paid') return { statusCode: 403, headers, body: JSON.stringify({ error: 'Payment has not been confirmed.' }) };
    if (event.httpMethod === 'GET') return { statusCode: 200, headers, body: JSON.stringify({ offer: OFFERS[offer].name, submitted: session.metadata?.onboarded === 'yes' }) };
    if (session.metadata?.onboarded === 'yes') return { statusCode: 409, headers, body: JSON.stringify({ error: 'Onboarding has already been submitted.' }) };
    const fields = ['name', 'business', 'website', 'goal', 'audience', 'notes'];
    const details = Object.fromEntries(fields.map(key => [key, String(input[key] || '').trim().slice(0, 450)]));
    if (!details.name || !details.business || !details.goal) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name, business, and goal are required.' }) };
    const params = new URLSearchParams({ 'metadata[onboarded]': 'yes' });
    for (const [key, value] of Object.entries(details)) params.set('metadata[' + key + ']', value);
    await stripe('checkout/sessions/' + sessionId, { method: 'POST', body: params.toString() });
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Onboarding failed', error.message);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Could not save your details. Please retry.' }) };
  }
};
