const { OFFERS, isEnabled } = require('./_offers');

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const origin = 'https://agentsatwork.co';

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  const requestOrigin = event.headers.origin || event.headers.Origin;
  if (requestOrigin && requestOrigin !== origin) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) };
  let id;
  try { id = JSON.parse(event.body || '{}').offer; } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) }; }
  if (!OFFERS[id]) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown offer' }) };
  if (!isEnabled(id)) return { statusCode: 503, headers, body: JSON.stringify({ error: 'This offer is not available for purchase yet.' }) };

  const offer = OFFERS[id];
  const priceResponse = await fetch('https://api.stripe.com/v1/prices/' + encodeURIComponent(process.env[offer.priceEnv]), {
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY }
  });
  const price = await priceResponse.json();
  if (!priceResponse.ok || !price.active || price.currency !== 'gbp' || price.unit_amount !== offer.amount ||
    (offer.mode === 'subscription' && (price.type !== 'recurring' || price.recurring?.interval !== 'month')) ||
    (offer.mode === 'payment' && price.type !== 'one_time')) {
    console.error('Stripe price configuration mismatch', id);
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'This offer is temporarily unavailable.' }) };
  }
  const params = new URLSearchParams({
    mode: offer.mode,
    'line_items[0][price]': process.env[offer.priceEnv],
    'line_items[0][quantity]': '1',
    'metadata[offer]': id,
    'success_url': origin + '/onboarding.html?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url': origin + '/offers.html',
    'billing_address_collection': 'auto'
  });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  const data = await response.json();
  if (!response.ok || !/^https:\/\/checkout\.stripe\.com\//.test(data.url || '')) {
    console.error('Stripe Checkout failed', response.status, data.error?.code);
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Checkout is temporarily unavailable.' }) };
  }
  return { statusCode: 200, headers, body: JSON.stringify({ url: data.url }) };
};
