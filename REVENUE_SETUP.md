# Revenue launch checklist

The product catalogue is safe to publish before payments are configured. Each offer defaults to an interest form. No checkout is shown unless all of its server-side settings are present.

## Stripe

Create five GBP prices in the business's Stripe account. `review` is a **one-time £29** price; `content`, `lead`, `reactivation` and `geo` are **monthly** recurring prices for £49, £79, £99 and £39 respectively. The checkout function verifies the price amount, currency and interval against these values before opening Stripe Checkout.

Configure these **secret Netlify environment variables** for the production Functions scope, never in Git or client-side HTML:

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key for the intended mode (test or live) |
| `STRIPE_PRICE_REVIEW` | £29 one-time Price ID |
| `STRIPE_PRICE_CONTENT` | £49/month Price ID |
| `STRIPE_PRICE_LEAD` | £79/month Price ID |
| `STRIPE_PRICE_REACTIVATION` | £99/month Price ID |
| `STRIPE_PRICE_GEO` | £39/month Price ID |
| `REVENUE_PRODUCTS_ENABLED` | Comma-separated IDs of **operationally deliverable** offers only |

The configured price alone never enables an offer. Add its ID to `REVENUE_PRODUCTS_ENABLED` only after the actual customer service, support and delivery have been verified. Redeploy after changing environment variables.

Stripe Checkout returns to `/onboarding.html`, which checks the paid Checkout Session server-side and saves the customer's brief as session metadata in Stripe. This does **not** itself deliver a report, publish content, send outreach, or run monitoring. The customer-facing confirmation currently says that AIWorks will contact them. Do not enable any paid offer until its service delivery is implemented and tested.

## Still required for the original recommendation

- Implement actual fulfillment for each paid offer, including an accessible report for the one-time Review, approved content and lead workflows, consent-aware reactivation, and scheduled GEO checks with historical results.
- Replace the public, hard-coded passwords in `login.html` and browser-only session check in `dashboard.html` with real server-side customer authentication and access control before using that portal for customers.
- Connect a durable customer data store, transactional email provider, cancellation and billing management, and a verified Stripe webhook to keep access in sync with subscription status. Define privacy retention and support ownership.
- Arrange affiliate programme accounts and approved tracking links before claiming affiliate revenue. A curated tool list without such agreements does not earn commission.
- Test payment, cancellation, failed payment, onboarding, delivery and customer support in Stripe test mode, then repeat a controlled live purchase before enabling public checkout.

The original proposal described an automated revenue product. A checkout form alone does not meet that promise.
