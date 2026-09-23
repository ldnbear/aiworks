const { OFFERS, isEnabled } = require('./_offers');

exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify({ offers: Object.fromEntries(Object.entries(OFFERS).map(([id, offer]) =>
    [id, { name: offer.name, amount: offer.amount, mode: offer.mode, available: isEnabled(id) }])) })
});
