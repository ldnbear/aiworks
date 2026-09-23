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
  const params = new URLSearchParams({
    mode: offer.mode,
    'line_items[0][price_data][currency]': 'gbp',
    'line_items[0][price_data][unit_amount]': String(offer.amount),
    'line_items[0][price_data][product_data][name]': offer.name,
    'line_items[0][quantity]': '1',
    'metadata[offer]': id,
    'success_url': origin + '/onboarding.html?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url': origin + '/offers.html',
    'billing_address_collection': 'auto'
  });
  if (offer.mode === 'subscription') params.set('line_items[0][price_data][recurring][interval]', 'month');
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
