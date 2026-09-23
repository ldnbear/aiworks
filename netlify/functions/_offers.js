const paypalLinks = require('../../paypal-links.json');
const OFFERS = Object.freeze({
  review: { name: 'AI Review', amount: 2900, mode: 'payment' },
  content: { name: 'Content Agent', amount: 4900, mode: 'subscription' },
  lead: { name: 'Lead Agent', amount: 7900, mode: 'subscription' },
  reactivation: { name: 'Reactivation Agent', amount: 9900, mode: 'subscription' },
  geo: { name: 'GEO Monitoring', amount: 3900, mode: 'subscription' }
});

function paypalUrl(id) {
  const link = Object.hasOwn(paypalLinks, id) ? paypalLinks[id] : null;
  if (!link?.enabled || typeof link.url !== 'string') return null;
  try {
    const url = new URL(link.url);
    if (url.protocol !== 'https:' || !['www.paypal.com', 'paypal.com'].includes(url.hostname) ||
      url.username || url.password || url.port) return null;
    return url.href;
  } catch { return null; }
}

function checkoutProvider() {
  return process.env.CHECKOUT_PROVIDER === 'stripe' ? 'stripe' : 'paypal';
}

function isEnabled(id) {
  if (!Object.hasOwn(OFFERS, id)) return false;
  if (checkoutProvider() === 'paypal') return Boolean(paypalUrl(id));
  const offer = OFFERS[id];
  return Boolean(offer && process.env.STRIPE_SECRET_KEY &&
    (process.env.REVENUE_PRODUCTS_ENABLED || '').split(',').map(s => s.trim()).includes(id));
}

module.exports = { OFFERS, isEnabled, paypalUrl, checkoutProvider };
