# FilmTrack Live Product Review — 2026-08-19

Baseline GitHub main: `91e7e919949f4987caa2254e25250b544fd13219`

## Live-site observations

`https://www.filmtrack.ir/` is live and renders:

- Persian hero/CTA.
- Weekly trending TV.
- Weekly trending movies.
- Genre discovery.
- “Binged” section.
- “Most added” section.
- Calendar link.
- Auth entry.
- Privacy/about/community navigation.
- GitHub and founder links.

## Confirmed strengths

- Clear Persian-first product direction.
- Strong visual movie/TV discovery surface.
- Existing watchlist/dashboard foundation.
- Supabase authentication/data layer.
- Spoiler-aware comments.
- PWA + Android path.
- Signed Android CI has been restored and verified.
- Public development on GitHub.

## Product/technical gaps found

### 1. Unsupported market claim

Homepage says FilmTrack is the “largest Persian-speaking community” but the repository does not currently expose evidence/analytics supporting that claim.

Action: use differentiated positioning until community metrics prove leadership.

### 2. Homepage metric labels are semantically incorrect

Current homepage maps:

- `/tv/popular` → “Binged”
- `/tv/top_rated` → “Most added”

Those are TMDB metrics, not FilmTrack behavioral metrics.

Action: rename honestly now; later replace with real FilmTrack analytics.

### 3. Persian-first promise is incomplete on discovery cards

Homepage TMDB requests use `language=en-US`, therefore many visible titles are English even though the product is Persian-first.

Action: Persian-first title metadata with controlled fallback.

### 4. Calendar is not personalized yet

The current calendar uses TMDB discover for global upcoming movie/TV dates. It does not derive releases from the authenticated user's tracked series.

Action: M2 personalized calendar after episode tracking data model exists.

### 5. Watchlist identity collision risk

`user_lists` writes include `title_type`, but upsert conflict currently uses only `(user_id,title_id)`.

Action: live schema audit, then canonical uniqueness including title type.

### 6. Comment identity collision risk

Comments are inserted with `title_type`, but title-page reads currently filter only by `title_id`.

Action: query and index by both title ID and type.

### 7. Dashboard ownership relies on RLS alone

Dashboard reads all rows visible through RLS with no explicit `user_id` filter.

Action: keep RLS as enforcement and add explicit query ownership filtering for defense-in-depth/performance.

### 8. Public profile/privacy mismatch

Public profile queries a user's watchlist by user ID, while current privacy copy implies stronger list privacy.

Action: explicit profile/list visibility model enforced by RLS and accurately documented.

### 9. Public identity derives from email

Comments persist `user_email` and show the local part of email as a public username.

Action: introduce profile identity; remove email from public display path.

### 10. Supabase state is not reproducible

There is no repository-visible Supabase migration/policy directory.

Action: capture live state read-only first, then version migrations.

### 11. Server authorization verification should be hardened

Server pages use Supabase `getSession()` for identity decisions. Current Supabase SSR guidance recommends verified claims/user identity for protecting pages/data.

Action: migrate authorization decisions to a verified server identity flow.

### 12. Search endpoint lacks abuse controls

Public search proxies TMDB and currently has no repository-visible rate limit.

Action: add cache/timeout/rate controls and instrumentation.

### 13. GitHub main is not protected

Current GitHub branch metadata reports `main` as unprotected with required status checks not enforced.

Action: enable branch protection after validating the exact required checks.

## Strategic opportunity

TV Time ended service on July 15, 2026. A high-priority migration path can make FilmTrack immediately useful to displaced Persian-speaking tracker users.

The correct product strategy is:

**independent tracker + episode memory + reminders + spoiler-safe Persian community**

—not another streaming service.
