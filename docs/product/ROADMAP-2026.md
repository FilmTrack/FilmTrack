# FilmTrack Product Roadmap — 2026/2027

Status: Public Beta / Stabilize & Retain
Product: FilmTrack — Persian-first movie & TV tracking network
Baseline reviewed: `91e7e919949f4987caa2254e25250b544fd13219`
Roadmap date: 2026-08-19

## Product thesis

FilmTrack should not try to become another video-streaming catalog. Its strongest position is the independent Persian-first companion layer around all movies and TV shows:

**Track what you watch → know what is next → discover what fits you → talk without spoilers → share your taste.**

The immediate market window is unusually strong because TV Time ended service on July 15, 2026. Migration, episode-level tracking, reminders, and social continuity should therefore be prioritized before aggressive monetization.

## North Star

**Weekly Active Trackers (WAT)**
Unique authenticated users who perform at least one meaningful tracking action in a rolling week.

Supporting metrics:

- Signup → first tracked title conversion.
- Percentage of new users who add at least 3 titles within 24 hours.
- Median time from signup to first tracked title.
- D1 / D7 / D30 retained trackers.
- Tracking actions per weekly active tracker.
- Search → title detail → add-to-list conversion.
- Import start → import completion conversion.
- Episode progress adoption.
- Reminder opt-in and reminder click-through.
- Public-list/profile share rate.
- Comments/reactions per active community user.
- Reports per 1,000 community contributions and moderation resolution time.

Targets must be set after the first clean analytics baseline. Do not optimize vanity metrics before instrumentation is trustworthy.

---

## M0 — Trust, Security & Product Truth
**Window:** 2026-08-19 → 2026-09-07
**Priority:** P0

### Goals

- Make production data rules reproducible in GitHub.
- Eliminate movie/TV identity collisions.
- Align authentication, RLS, privacy copy, and actual product behavior.
- Remove misleading homepage/community metrics.
- Protect `main` with required checks.
- Establish observability and analytics foundations before growth work.

### Scope

- Read-only live Supabase schema/RLS audit first.
- Version-controlled `supabase/migrations`.
- Canonical media key includes `title_type`.
- Fix `user_lists` conflict key.
- Scope title comments by both `title_id` and `title_type`.
- Explicit dashboard ownership filter in addition to RLS.
- Explicit public/private profile and list model.
- Stop using raw email as public display identity.
- Replace server-side auth authorization decisions based on `getSession()` with verified identity flow.
- Rate-limit/cache public search.
- Add production error monitoring and structured logs.
- GitHub `main` branch protection + required quality gates.
- Correct homepage labels:
  - TMDB popular is not FilmTrack "Binged".
  - TMDB top-rated is not FilmTrack "Most added".
- Replace unsupported “largest Persian-speaking community” claim until real community metrics support it.

### Exit gate

- Security/data-integrity migration reviewed before production execution.
- Relevant RLS tests pass.
- Movie/TV same numeric ID regression tests pass.
- Privacy behavior and privacy page match.
- `main` protected.
- No known P0 data-boundary issue remains open.

---

## M1 — Activation & Migration
**Window:** 2026-09-08 → 2026-09-28
**Priority:** P1

### Goal

A new user should reach value in minutes, not days.

### Scope

- First-run onboarding.
- “Pick at least 3 titles” activation flow.
- List states:
  - Plan to watch
  - Watching
  - Completed
  - On hold
  - Dropped
- Fast bulk add.
- Import path for former TV Time users.
- Import from common export formats where legally/technically feasible:
  - TV Time export
  - Letterboxd
  - Trakt
- Import preview, duplicate resolution, and rollback-safe processing.
- Funnel analytics for signup/onboarding/search/add/import.

### Exit gate

- Full activation funnel visible in analytics.
- Import is idempotent and duplicate-safe.
- At least one migration source is production-ready.
- Product team has a real D1/D7 baseline.

---

## M2 — Retention Core: Episode Tracking
**Window:** 2026-09-29 → 2026-10-26
**Priority:** P1

### Goal

Give users a reason to return every week.

### Scope

- Season/episode-level watched state.
- “Next episode” as a first-class object.
- Continue Watching.
- One-tap episode check-in.
- Personalized calendar derived from the user's tracked shows.
- Upcoming episode/release reminders.
- PWA/email notifications first; optional additional channels later.
- Weekly “what is next” digest.
- Timezone-aware release dates.
- History and undo.
- Progress statistics.

### Exit gate

- Calendar is actually personalized, not global TMDB discover.
- Episode progress survives device/session changes.
- Reminder delivery and click analytics are measurable.
- D7 retention trend is improving against M1 baseline.

---

## M3 — Community, Identity & Safety
**Window:** 2026-10-27 → 2026-11-23
**Priority:** P1

### Goal

Turn tracking into a Persian-language network without creating a moderation/privacy liability.

### Scope

- Usernames and display names independent of email.
- Avatar/bio.
- Public/private profile.
- Public/private/custom lists.
- Follow/friend graph.
- Activity feed.
- Ratings, reviews, reactions.
- Episode-scoped discussion.
- Spoiler controls at title/season/episode level.
- Report, mute, block.
- Moderation queue and audit trail.
- Spam/rate limits.
- Community guidelines and enforcement workflow.

### Exit gate

- No public email-derived identity.
- Privacy settings are explicit and enforced by RLS.
- Report/block flows tested.
- Moderation ownership/SLA defined.
- Community events instrumented.

---

## M4 — Persian Discovery & Personalization
**Window:** 2026-11-24 → 2026-12-21
**Priority:** P2

### Goal

Make FilmTrack the best Persian-language answer to “چی ببینم؟”

### Scope

- Persian-first title display with safe fallback.
- Better Persian synopsis quality and caching.
- Personalized recommendation feed.
- “Because you watched …”
- Taste profile by genre/cast/creator/era.
- Similar users / collaborative signals only after sufficient data.
- Curated Persian editorial lists.
- Search quality improvements and Persian transliteration.
- Legally sourced “where to watch” data where reliable.
- Separate platform-wide metrics from TMDB popularity.

### Exit gate

- Recommendation CTR is measured.
- Search-to-add conversion improves.
- Persian metadata coverage is measured rather than assumed.

---

## M5 — Mobile Distribution & Re-engagement
**Window:** 2026-12-22 → 2027-01-31
**Priority:** P2

### Goal

Put FilmTrack where Iranian users already spend time: mobile.

### Scope

- Harden PWA install flow.
- Production Android release process built on the restored signing pipeline.
- Deep links into title/episode pages.
- Push notifications.
- Offline-tolerant tracking queue.
- Crash monitoring.
- App-store assets, privacy disclosures, screenshots, release notes.
- Evaluate Iranian Android distribution channels and automate release where practical.
- Preserve web/PWA as a first-class product, not a fallback.

### Exit gate

- Signed Android build reproducible from `main`.
- Crash-free sessions and notification delivery measurable.
- Release checklist automated.

---

## M6 — Monetization Pilot
**Window:** 2027-02-01 → 2027-02-28
**Priority:** P3 / conditional

### Rule

Do not paywall the core tracking loop before retention is proven.

### Candidate models

- Optional FilmTrack Plus:
  - advanced statistics
  - advanced list customization
  - enhanced recommendation controls
  - premium profile customization
- Ethical sponsorship of editorial lists.
- Affiliate/referral relationships for legal viewing destinations where available.
- B2B aggregated trend insights only if privacy-safe and never based on selling personal conversation/profile data.

### Gate before launch

- Four consecutive weeks of stable or improving WAT.
- Reliable D30 retention baseline.
- Core free tracker remains useful.
- Clear privacy and deletion/export flows.
- Payment support and refund policy ready.

---

## What we deliberately do NOT prioritize yet

- Large AI features before clean behavioral data.
- Heavy monetization before retention.
- User-generated community scale before moderation.
- “Biggest community” claims without evidence.
- Complex recommendation ML before simple rules/content-based ranking has measurable value.
- New database features before schema/RLS is version-controlled.

## Immediate execution order

1. M0 live Supabase read-only audit.
2. M0 database/auth/privacy hardening design.
3. M0 homepage truth + analytics instrumentation.
4. M1 onboarding and migration.
5. M2 episode tracking and personalized calendar.
6. M3 community.
7. M4 discovery.
8. M5 mobile distribution.
9. M6 monetization only after retention gate.

## GitHub milestone tracking

| Milestone | Issue |
|---|---|
| Master roadmap | #5 |
| M0 Trust/Foundation | #6 |
| M1 Activation/Migration | #7 |
| M2 Retention/Episodes | #8 |
| M3 Community/Safety | #9 |
| M4 Discovery/Personalization | #10 |
| M5 Mobile/Re-engagement | #11 |
| M6 Monetization | #12 |
