# Public site launch — payments paused

Owner instruction (23 September 2026): publish the site updates with payment buttons present but inactive until a payment provider is chosen.

## Public site

- Homepage: free audit, five agent plans, DIY directory and managed build route.
- Plans: Lead £79/month, Review £29/month, Content £49/month, Reactivation £99/month, GEO £39/month.
- Review Agent means customer review requests, follow-ups and feedback alerts. It is not a one-time business audit.
- Audit results link to relevant plans and the DIY directory, with a custom build route from £1,500.
- GEO results link to the GEO Agent plan and retain the interest form.
- Payment controls are native disabled “Coming soon” buttons, paired with “Sign up for notifications” links. Links from individual plans preselect the matching plan; general links allow all agent launch updates. No checkout links or checkout click handlers are active.
- `/api/offers` always returns all plans unavailable. `/api/checkout` and `/api/onboarding` always return 503, regardless of environment variables.
- Old Stripe test links and the `?payment=success` access-grant path have been removed. The legacy login with publicly embedded passwords has been replaced by a coming-soon page; no password values are published in it.
- Launch notification registration uses the existing Airtable-backed `/api/waitlist`, tags the selected plan as `Launch notification: <id>` and only reports success after confirmation. This stores the opted-in list; launch emails are not sent automatically by this change.
- DIY directory uses direct vendor URLs, with no affiliate commission claimed.

## Deferred launch work

Choosing a provider and adding a payment link will not by itself deliver the services. Before subscriptions are opened:
1. Implement and verify fulfillment for each plan, including review workflows, content approvals, lead workflows, reactivation and recurring GEO checks.
2. Agree included usage, delivery timing, cancellation terms, extra tool costs and support ownership.
3. Replace legacy browser session checks with server-side customer authentication and entitlement verification.
4. Implement durable customer records, onboarding, transactional email and verified billing events.
5. Verify payment, cancellation, failed-payment and fulfillment behaviour.
6. Add approved affiliate links and appropriate disclosure only after programme approval.

Payment-provider scaffolding from the earlier draft remains in Git history. This version intentionally makes no calls to Stripe or PayPal.
