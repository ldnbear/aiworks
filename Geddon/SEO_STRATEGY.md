# GEDDON SEO and editorial strategy

Implemented 30 October 2026. Owner: GEDDON.

## Commercial objective

Attract relevant freediving and spearfishing visitors and convert them into price-aware First Edition waitlist signups. The primary conversion is a completed signup in the private Google Sheet, not page views. The public offer remains 100 numbered suits, 001–100, from £449, with shipping planned for spring 2027; final specifications, pricing and availability are not yet confirmed.

The brand is UK-designed, with Devon as its origin and worldwide appeal. Avoid narrowing every page to UK waters. Keep ONE MORE DROP as the brand headline; make titles, supporting copy and article headings explicit about wetsuits and the questions each page answers.

## Search-intent map and live pages

| URL | Primary intent | Supporting topics | Conversion |
| --- | --- | --- | --- |
| /geddon/ | Freediving and spearfishing wetsuits | Open-cell neoprene; Prawle 5.5mm; Start 7.5mm; camouflage; men’s and women’s fits | Join the waitlist |
| /geddon/journal/ | GEDDON Field Notes journal | Wetsuit buying guides and, later, firsthand diving stories | Relevant guide, then waitlist |
| /geddon/guides/open-cell-wetsuits/ | What is an open-cell wetsuit? | Open cell versus lined; fit; putting on; care | Collection and waitlist |
| /geddon/guides/5-5mm-vs-7-5mm-wetsuits/ | 5.5mm versus 7.5mm wetsuits | Insulation; movement; buoyancy; Prawle versus Start | Thickness preference in waitlist |
| /geddon/guides/womens-freediving-wetsuits/ | Women’s freediving and spearfishing wetsuit fit | Measurements; dedicated cut; open cell; thickness | Women’s collection and waitlist |

These are editorial intent targets, not measured search-volume or ranking claims. Public search tools were unavailable during implementation. Official Google documentation and manufacturer pages were retrievable directly; no fabricated keyword volumes or claims of competitor ranking were used. Validate and refine this map using Search Console query data after indexing.

## Implemented technical work

- Distinct titles and descriptions for the homepage, journal and each article.
- Lowercase, self-referencing canonical URLs matching the deployed URL form; clean directory URLs for articles.
- Server-delivered HTML content, descriptive internal links and accessible headings. No dependence on client-side rendering for articles or FAQs.
- Homepage Organization, WebSite and WebPage JSON-LD; article and breadcrumb markup on guides; CollectionPage and ItemList on the journal.
- No fabricated reviews, ratings, experts, product availability or performance claims. No purchasable Offer or merchant feed while the product remains waitlist-only. Revisit product markup when final product pages and real offers exist.
- Visible homepage FAQs. Do not promise FAQ rich results; adding FAQ markup is not a commercial-site ranking tactic.
- Open Graph and Twitter metadata, a 1200×630 JPEG sharing image endpoint and a GEDDON favicon.
- Explicit image dimensions to reserve layout space; existing priority hero loading and lazy loading retained.
- Removed unused external Google Fonts requests. Subset local fonts, reducing the stylesheet from 273,739 to 148,643 bytes (about 46%). This is a byte reduction, not an unmeasured Core Web Vitals score claim.
- A crawlable robots.txt and canonical GEDDON URLs in the shared root sitemap, plus /geddon/sitemap.xml for a scoped Search Console submission. Other site URLs are preserved.
- Existing Google Sheet waitlist integration, fit/thickness selection links and consistent Join the waitlist labels preserved.

## Editorial plan: ten useful articles

Publish from evidence and firsthand experience, not a quota. The first three are implemented. Use the next seven as briefs for Rupert’s notes and photographs.

1. **Open-cell wetsuits explained** — published buying guide; explain the interior, donning, fit and care.
2. **5.5mm or 7.5mm for freediving and spearfishing?** — published comparison; do not invent universal water-temperature limits.
3. **Women’s freediving wetsuit fit: what to measure** — published guide; add tested GEDDON size information once available.
4. **Bluefin tuna off South Devon: observations from the water** — verify dates and sightings with primary sources. Distinguish Rupert’s observations about bass behaviour from evidence of causation. Do not imply camouflage neutralises predators or guarantees fish approach.
5. **What a South Devon spearo needs from a wetsuit** — firsthand discussion of loading-pad placement, knife access, line-cutter storage, reinforcement and fit. Describe the GEDDON build as proposed until tested; verify relevant rules if discussed.
6. **Choosing camouflage for kelp-bed spearfishing** — original underwater photographs showing light, background and colour. Explain why Kelp was designed this way; do not claim proven catch-rate improvements without testing.
7. **Rock, shadow and kelp: a diver’s view of concealment** — firsthand observations and visual examples; connect to Moor, Kelp and Night without presenting untested performance as fact.
8. **Does camouflage matter for spearfishing?** — separate colour/pattern design, background, movement and actual evidence. Do not simply duplicate article 6; merge if the evidence cannot support a distinct useful page.
9. **Why the reflective hood crown is part of GEDDON’s design** — position, materials and development photographs. Describe intended surface visibility without guarantees or untested safety claims.
10. **How to care for an open-cell wetsuit after a dive** — model-specific instructions after samples are available; expand beyond the existing overview with original process photographs.

For every article: one distinct question, an accurate headline, real author or interviewer attribution, original observations/photos where available, dates tied to actual changes, clear references for factual claims, and two or three relevant internal links. Avoid padding for word count, repetitive location pages, generic AI filler and mass publication of near-duplicates.

## Authority and distribution

- Use Rupert’s real diving notes, sample-testing photographs and documented product development to build material competitors cannot reproduce from a keyword list.
- Once samples are ready, seek genuine testing and editorial coverage from freediving instructors, women divers, spearfishing clubs and relevant publications. Let reviewers describe their experience independently.
- Invite useful contributions from local Devon divers while commissioning a mix of international conditions and perspectives. Do not invent contributors or testimonials.
- Share each finished article through GEDDON’s own channels when accounts and distribution are authorised. No outreach, email, social posting or paid link purchase has been performed as part of this implementation.
- Do not buy link packages, scrape competitor articles or create doorway pages for cities where GEDDON has no distinct content.

## Measurement and next steps

### Before assessing search performance

1. Verify a Google Search Console URL-prefix property for https://agentsatwork.co/geddon/ (or use an existing verified domain property). Verification requires the owner’s Search Console access; no verification token or property was available to this implementation.
2. Submit https://agentsatwork.co/geddon/sitemap.xml and inspect the five canonical pages. A successful deployment or sitemap request is not proof of Google indexing.
3. Check Page indexing, Google-selected canonicals and live URL inspection. Repair exclusions or crawl problems before adding more content.
4. Capture a PageSpeed Insights baseline and, when traffic is sufficient, assess real-user LCP, INP and CLS. No Lighthouse, PSI or field-performance score is claimed here.

### Weekly for the first 90 days

Track indexed canonical pages; non-brand impressions and clicks; queries by page; click-through rate at comparable positions; and completed waitlist signups. Compare brand queries (GEDDON and One More Drop) with non-brand discovery. Review the three topic clusters separately rather than judging by total traffic alone.

The Google Sheet currently records preferences and consent, not acquisition attribution. No analytics account, tracking ID, cookie consent platform or attribution fields have been added. Until suitable measurement is configured, do not report an organic-to-waitlist conversion rate that cannot be observed. Total signups alone do not identify organic signups.

Days 1–30: establish index coverage and a baseline; collect actual query data. Days 31–60: publish two or three evidence-backed field notes and improve snippets/content where impressions reveal a real opportunity. Days 61–90: consolidate overlapping pages, expand topics with actual reader demand, and arrange genuine product testing when samples exist. Search results can take weeks or months and are not guaranteed.

## Domain and launch decisions

Agentsatwork.co/geddon/ is a workable launch location, but an established GEDDON-owned domain would give the brand a clearer independent identity. Do not change domains casually: choose one primary domain, retain equivalent paths, redirect old URLs permanently, update canonicals/sitemaps/internal links and verify both properties. No domain was purchased or migrated in this task.

When deposits open, create substantive individual product pages with final price, photographs, specifications, fit guidance, actual shipping/returns terms and purchase functionality. Then add accurate Product/ProductGroup and Offer markup and evaluate Merchant Center eligibility. Do not mark the current waitlist as in-stock or claim spring 2027 as a guaranteed delivery date.

## References used

- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/appearance/structured-data/product
- https://waihana.com/products/mens-tropicam-black-5-5mm-wetsuit
- https://waihana.com/products/mens-black-tropicam-7-5mm-wetsuit
- https://waihana.com/collections/womens-wetsuits

No search-volume subscription, Search Console verification, indexing request, external outreach, backlinks or traffic outcome is implied by these implementation notes.
