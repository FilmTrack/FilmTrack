# FilmTrack M2 — Rating & Diary Migration Runbook

Status: **source-only / not authorized for production execution**

Tracking: #49 → #50 → #51

## Purpose

This runbook governs the future rollout of `20260830115500_m2_rating_diary_foundation.sql`.
The migration introduces first-party fan preference primitives while preserving FilmTrack's canonical movie/TV identity and privacy-by-default posture.

## Non-negotiable gate

Merging the migration source into GitHub does **not** authorize applying it to production.
Production execution requires a separate explicit approval after all items below are evidenced.

## Preflight — read only

1. Confirm canonical production project and environment.
2. Confirm current `main` and release SHA.
3. Inspect whether `public.user_ratings` or `public.diary_entries` already exist.
4. If either table exists, stop and compare schema/policies before any write.
5. Confirm no conflicting migration timestamp has been applied.
6. Capture current RLS/grants posture for adjacent `user_lists` and comments tables.
7. Confirm rollback/forward-fix owner and maintenance window; no downtime is expected.

## CI / Preview gate

Before production migration approval:

- ESLint PASS
- TypeScript PASS
- deterministic M2 schema/privacy tests PASS
- full repository tests PASS
- Next.js production build PASS
- Draft PR reviewed
- Preview performs **zero writes** to the new production tables
- no auth/payment/domain/Vercel configuration change is bundled with the migration

## Expected schema contracts

### `public.user_ratings`

- owner identity: `user_id -> auth.users(id)`
- canonical title identity: `(title_id, title_type)`
- exactly one current rating per `(user_id, title_id, title_type)`
- `title_type ∈ {movie,tv}`
- `rating_10 ∈ [1,10]`
- authenticated owner-only CRUD via RLS
- no anonymous grants

### `public.diary_entries`

- owner identity: `user_id -> auth.users(id)`
- multiple rows for the same `(user_id, title_id, title_type)` are allowed
- repeated rows derive rewatch behavior rather than duplicating canonical media identity
- `watched_on` is explicit and indexed with owner/title identity
- authenticated owner-only CRUD via RLS
- no anonymous grants
- no email or other raw PII column

## Production execution — future approval only

When separately approved:

1. Re-run read-only preflight immediately before migration.
2. Apply the exact reviewed migration SHA without editing in the production console.
3. Verify tables, constraints, indexes, RLS policies and grants.
4. Run owner/other-user/anonymous authorization probes.
5. Verify existing tracking (`user_lists`) remains unaffected.
6. Record migration evidence in the tracking issue and release notes.
7. Only after database verification may runtime rating/diary writers be enabled.

## Stop conditions

Abort before any production write if:

- the project/environment is ambiguous;
- unexpected existing tables/columns/policies are present;
- branch/commit differs from reviewed SHA;
- CI/build is not green;
- a destructive statement appears in the reviewed migration;
- production availability or existing tracking behavior is at risk.

## Rollout principle

FilmTrack prefers additive, owner-scoped schema evolution with a forward-fix path. No production table replacement, destructive migration, auth mutation, payment mutation or domain/infrastructure change belongs in this rollout.
