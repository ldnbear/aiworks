const OFFERS = Object.freeze({
  review: { name: 'AI Review', amount: 2900, mode: 'payment' },
  content: { name: 'Content Agent', amount: 4900, mode: 'subscription' },
  lead: { name: 'Lead Agent', amount: 7900, mode: 'subscription' },
  reactivation: { name: 'Reactivation Agent', amount: 9900, mode: 'subscription' },
  geo: { name: 'GEO Monitoring', amount: 3900, mode: 'subscription' }
});

function isEnabled(id) {
  const offer = OFFERS[id];
  return Boolean(offer && process.env.STRIPE_SECRET_KEY &&
    (process.env.REVENUE_PRODUCTS_ENABLED || '').split(',').map(s => s.trim()).includes(id));
}

module.exports = { OFFERS, isEnabled };
