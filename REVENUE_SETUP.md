# Revenue launch checklist

Each offer defaults to an interest form. Checkout requires an explicitly enabled and configured offer. PayPal hosted links are now the default; the Stripe integration remains optional.

## PayPal hosted checkout (default)

Use the existing PayPal Business account. Copy the public one-off payment link or monthly subscription link into its matching entry in `paypal-links.json`. No PayPal password or secret API key belongs in this file. Before setting `enabled` to true, verify the merchant, GBP price and billing interval in PayPal's actual checkout and verify that the advertised service is operational. The server accepts only HTTPS links on `paypal.com` or `www.paypal.com`, with no URL credentials.

The default PayPal route needs no Stripe configuration and no Netlify secret. Links remain empty and disabled until the actual merchant links are supplied. This route collects payments on PayPal; it does not automatically verify payments, grant access, save an onboarding brief, or deliver a service. The existing `/onboarding.html` endpoint is Stripe-specific and must not be used as proof of a PayPal payment. Automatic PayPal fulfillment requires a separate verified payment integration.

Official setup instructions:
- https://developer.paypal.com/payment-links-buttons/share-payment-link/
- https://www.paypal.com/uk/cshelp/article/how-do-i-create-a-subscription-button-help269

## Optional Stripe checkout

The checkout function creates the prices from server-controlled values: `review` is a **one-time £29** purchase; `content`, `lead`, `reactivation` and `geo` are **monthly** recurring purchases for £49, £79, £99 and £39 respectively. It does not use a customer-supplied price.

Configure these **secret Netlify environment variables** for the production Functions scope, never in Git or client-side HTML:

| Variable | Value |
| --- | --- |
| `CHECKOUT_PROVIDER` | `stripe` (omit for the default PayPal route) |
| `STRIPE_SECRET_KEY` | Stripe secret key for the intended mode (test or live) |
| `REVENUE_PRODUCTS_ENABLED` | Comma-separated IDs of **operationally deliverable** offers only |

The Stripe key alone never enables an offer. Add its ID to `REVENUE_PRODUCTS_ENABLED` only after the actual customer service, support and delivery have been verified. Redeploy after changing environment variables.

The existing `buy.stripe.com/test_...` URL in several tool and login pages is a **Stripe test-mode payment link for £297/month**, not a live key or a payment integration for the five offers. The current `?payment=success` browser flag is not payment verification.

Stripe Checkout returns to `/onboarding.html`, which checks the paid Checkout Session server-side and saves the customer's brief as session metadata in Stripe. This does **not** itself deliver a report, publish content, send outreach, or run monitoring. The customer-facing confirmation currently says that AIWorks will contact them. Do not enable any paid offer until its service delivery is implemented and tested.

## Still required for the original recommendation

- Implement actual fulfillment for each paid offer, including an accessible report for the one-time Review, approved content and lead workflows, consent-aware reactivation, and scheduled GEO checks with historical results.
- Replace the public, hard-coded passwords in `login.html` and browser-only session check in `dashboard.html` with real server-side customer authentication and access control before using that portal for customers.
- Connect a durable customer data store, transactional email provider, cancellation and billing management, and a verified Stripe webhook to keep access in sync with subscription status. Define privacy retention and support ownership.
- Arrange affiliate programme accounts and approved tracking links before claiming affiliate revenue. A curated tool list without such agreements does not earn commission.
- Test payment, cancellation, failed payment, onboarding, delivery and customer support in Stripe test mode, then repeat a controlled live purchase before enabling public checkout.

The original proposal described an automated revenue product. A checkout form alone does not meet that promise.
