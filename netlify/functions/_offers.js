const OFFERS = Object.freeze({
  review: { name: 'AI Review', amount: 2900, mode: 'payment', priceEnv: 'STRIPE_PRICE_REVIEW' },
  content: { name: 'Content Agent', amount: 4900, mode: 'subscription', priceEnv: 'STRIPE_PRICE_CONTENT' },
  lead: { name: 'Lead Agent', amount: 7900, mode: 'subscription', priceEnv: 'STRIPE_PRICE_LEAD' },
  reactivation: { name: 'Reactivation Agent', amount: 9900, mode: 'subscription', priceEnv: 'STRIPE_PRICE_REACTIVATION' },
  geo: { name: 'GEO Monitoring', amount: 3900, mode: 'subscription', priceEnv: 'STRIPE_PRICE_GEO' }
});

function isEnabled(id) {
  const offer = OFFERS[id];
  return Boolean(offer && process.env.STRIPE_SECRET_KEY &&
    process.env[offer.priceEnv] &&
    (process.env.REVENUE_PRODUCTS_ENABLED || '').split(',').map(s => s.trim()).includes(id));
}

module.exports = { OFFERS, isEnabled };
