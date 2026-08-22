# FilmTrack Monetization Strategy

Status: Foundation only — no active checkout
Owner: FilmTrack
Related roadmap milestone: M6 / Issue #12

## Product rule

FilmTrack must not monetize by weakening the core tracking experience. The free product should remain useful for discovering titles, tracking movies and series, and continuing a user's viewing journey.

Monetization activates only after the retention and privacy gates in the product roadmap are satisfied.

## Revenue architecture

### 1. FilmTrack Plus — primary recurring revenue

FilmTrack Plus is the default consumer revenue engine. It should sell depth, control, and customization rather than access to the basic tracker.

Candidate Plus benefits:

- Advanced personal viewing statistics.
- Advanced list customization.
- Enhanced recommendation controls.
- Premium profile customization.
- Early access to validated advanced features.

Do not place the following behind Plus:

- Basic movie/series tracking.
- Core watch-state management.
- Core search and discovery.
- Essential account privacy controls.
- Data export or deletion.

### 2. Ethical editorial sponsorship — secondary revenue

Curated lists and editorial collections may be sponsored when the sponsorship is clearly labeled and does not secretly modify organic rankings.

Rules:

- Sponsorship must be visually disclosed.
- Sponsored placement must not impersonate an organic recommendation.
- Editorial ownership and safety standards remain with FilmTrack.
- Sponsorship must not require sharing personal user data with the sponsor.

### 3. Affiliate/referral partnerships — contextual revenue

FilmTrack may receive referral revenue when directing users to legitimate destinations where a title can legally be watched or purchased.

Rules:

- Commercial relationships must be disclosed.
- Relevance and availability come before commission rate.
- Affiliate status must not alter a title's rating or community score.
- The destination must be legal and reasonably trustworthy.

### 4. Privacy-safe aggregated trend products — later-stage B2B

Aggregated market insights may become a B2B revenue line only after FilmTrack has sufficient scale, privacy review, and strong minimum aggregation thresholds.

Never sell:

- Individual viewing histories.
- Private lists.
- Direct messages or private community content.
- Personal profiles assembled for ad targeting.
- Raw user-level behavioral exports.

Any B2B trend product must use aggregated outputs, minimum cohort thresholds, and documented privacy review.

## Business model order

1. Improve retention and tracking frequency.
2. Build Plus value around advanced features.
3. Validate willingness to pay with a small pilot.
4. Add annual plans only after monthly conversion and churn are understood.
5. Add sponsorship/affiliate inventory without degrading trust.
6. Explore aggregated B2B insights only after scale and privacy maturity justify it.

## Pricing strategy

Do not hard-code a public price before the M6 gate and payment economics are validated.

The pilot should test:

- A simple monthly Plus plan.
- An annual plan with a meaningful but sustainable discount.
- Founder/early-adopter pricing only when it is genuinely limited and clearly explained.
- Local payment friction, refund rate, failed payment rate, and support cost.

Avoid complicated multi-tier pricing during the first pilot. One paid consumer tier is easier to understand and produces cleaner willingness-to-pay data.

## Activation gate

Checkout must remain disabled until all of the following are true:

- WAT is stable or improving for four consecutive weeks.
- A reliable D30 retention baseline exists.
- The free tracker remains independently useful.
- Export and deletion flows are production-ready.
- Privacy controls match actual product behavior.
- Payment support, refunds, and failure handling are documented and tested.

## Pilot metrics

Track at minimum:

- Free-to-Plus conversion.
- Trial-to-paid conversion if a trial is introduced.
- Monthly paid churn.
- Annual renewal rate when annual plans exist.
- ARPPU and net revenue after payment costs/refunds.
- Refund rate.
- Failed-payment recovery rate.
- Plus feature adoption.
- Retention difference between paid and free cohorts.
- Sponsorship revenue per editorial placement.
- Affiliate click-through and revenue per qualified outbound click.

Do not use paid conversion alone as success. A monetization experiment that materially damages WAT, D30 retention, trust, or core engagement is a failed experiment.

## Guardrails

- No sale of personal data.
- No dark patterns around cancellation.
- No fake urgency.
- No hidden sponsored ranking.
- No paywall on export/delete/privacy controls.
- No forced subscription to preserve basic tracking history.
- No monetization experiment without measurement and rollback capability.

## Foundation shipped by this change

- Public `/plus` page.
- Clear free-vs-Plus product boundary.
- Explicit statement that checkout is not yet active.
- Primary and footer navigation to Plus.
- Sitemap inclusion.
- Regression test protecting the monetization contract.

## Next implementation after the M6 gate

When the gate is passed, implement payment architecture behind a feature flag, including checkout, webhook verification, entitlement storage, cancellation/refund handling, observability, analytics events, and an explicit rollback path before enabling the first real payment cohort.
