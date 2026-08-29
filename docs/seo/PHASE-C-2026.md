# FilmTrack SEO & AI Visibility 2026 — Phase C

Tracking: #45

## Purpose

Phase C strengthens FilmTrack's public discovery graph without introducing synthetic landing pages, hidden AI-only copy, or unsupported structured data.

## Internal-link contract

- Public title pages are the canonical entity surface for a movie or TV title.
- Genre pages are stable discovery hubs and should link to canonical title URLs.
- Title pages should expose useful contextual links back to stable genre discovery surfaces where genre data is visible.
- Internal links must help users navigate; link stuffing and generated keyword blocks are prohibited.
- Paginated discovery variants remain subordinate to their stable canonical surface.

## Image and poster contract

- Posters that identify a title use descriptive alt text derived from the visible title identity.
- Decorative backdrops must not duplicate SEO-oriented text unnecessarily.
- Cast/profile imagery uses the visible person's name when it conveys identity.
- Image changes must preserve responsive sizing and must not knowingly regress Core Web Vitals.

## AI citation-readiness contract

- Public pages should state factual title identity and purpose in visible content.
- Structured data must agree with visible content and canonical URLs.
- FilmTrack must not publish fabricated reviews, ratings, availability, people, offers, or other unsupported facts for search/AI consumption.
- No hidden crawler-only or LLM-only claims.
- Private, authenticated, dashboard, and API surfaces remain outside public discovery.

## Measurement baseline

After release, record in Search Console when available:

1. indexed/crawled canonical public pages;
2. sitemap processing state;
3. impressions, clicks and CTR by public page class;
4. query/page changes for title and genre surfaces;
5. Core Web Vitals/mobile usability regressions.

Search Console observations are measurement evidence, not a deployment prerequisite.

## Mobile release gate

Priority public surfaces must remain usable at common phone widths. Review navigation, poster/card layout, typography, tap targets, horizontal overflow, footer behavior and content hierarchy before production acceptance.

## Production verification

The existing deterministic production SEO verifier remains mandatory after merge. Homepage, robots and sitemap must return successfully, and canonical/structured-data contracts must remain covered by repository tests.

## Safety

Phase C requires no database migration and no changes to Supabase, authentication, payment, production domains or replacement infrastructure.
