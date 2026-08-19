# FilmTrack M0 Supabase Read-Only Audit — 2026-08-19

Baseline application SHA: `90878905a1be731166272f18573e8fccb219a0f0`

## Safety

Both production audit queries were executed inside read-only transactions and rolled back.
No production schema/data mutation was performed during discovery.

## Production schema

Public tables:

- `comments`
- `user_lists`

RLS is enabled on both.

## Data-integrity snapshot

- `user_lists`: 5 rows
  - movie: 3
  - tv: 2
  - watching: 1
  - completed: 4
- `comments`: 0 rows
- invalid `title_type`: 0
- null `user_lists.status`: 0
- duplicate `(user_id,title_id,title_type)` groups: 0
- existing same `(user_id,title_id)` across multiple title types: 0

This is a clean migration window: there is no current collision data to repair.

## Confirmed P0 findings

### 1. Incorrect watchlist uniqueness

Current production uniqueness is:

`UNIQUE (user_id, title_id)`

but the table separately stores `title_type`.

Application upsert also uses:

`onConflict: 'user_id,title_id'`

Canonical FilmTrack media identity must include type:

`(user_id,title_id,title_type)`

### 2. Comment movie/TV scope mismatch

`comments` stores both `title_id` and `title_type`, while the current title page reads comments using only `title_id`.

### 3. Public email-derived identity

`comments.user_email` exists and the client inserts `session.user.email`.
The UI derives a public display name from the local part of that email.

The comments SELECT policy is public.

Production currently has zero comment rows, so there is no current comment-email data requiring preservation.

### 4. Server authorization posture

Server pages use `auth.getSession()` for identity decisions.
M0 moves protected server data access to verified claims.

### 5. Dashboard defense in depth

Dashboard relies on RLS and does not explicitly filter `user_lists.user_id`.
M0 adds an explicit ownership filter while retaining RLS as enforcement.

### 6. Policy role scope

Owner policies use role `public`.
M0 narrows user-owned writes/reads to `authenticated`.

### 7. Grants are broader than required

`anon` and `authenticated` currently hold broad table privileges, including privileges that application flows do not need.
M0 replaces these with explicit least-privilege grants.

### 8. Missing supporting indexes

Current indexes:

- comments primary key
- user_lists primary key
- unique `(user_id,title_id)`

M0 adds indexes for:

- `user_lists(user_id, created_at desc)`
- `comments(user_id)`
- `comments(title_id,title_type,created_at desc)`

## M0-A deployment rule

The migration in this branch is **not** applied by the bootstrap.

Required order:

1. review branch diff
2. run strict quality gates
3. initialize/test a local Supabase stack
4. apply/reset migrations locally
5. run DB regression checks
6. review PR
7. merge application + migration source
8. deploy the tested migration through Supabase migration tooling
9. run post-deploy read-only verification

Do not paste the migration directly into the production SQL Editor as an ad-hoc schema change.
