const OFFERS = Object.freeze({
  "lead": {
    "name": "Lead Agent",
    "amount": 7900,
    "mode": "subscription"
  },
  "review": {
    "name": "Review Agent",
    "amount": 2900,
    "mode": "subscription"
  },
  "content": {
    "name": "Content Agent",
    "amount": 4900,
    "mode": "subscription"
  },
  "reactivation": {
    "name": "Reactivation Agent",
    "amount": 9900,
    "mode": "subscription"
  },
  "geo": {
    "name": "GEO Agent",
    "amount": 3900,
    "mode": "subscription"
  }
});

// Payments are paused by explicit owner instruction.
function isEnabled() { return false; }
module.exports = { OFFERS, isEnabled };
