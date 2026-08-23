# M1 Slice 2 Implementation Contract

## Goal

Define the technical contract for Bulk Add and Import Foundation without changing production behavior outside the approved M1 scope.

## Bulk Add Contract

### Input

- Multiple TMDB title identifiers
- User-owned watchlist action
- Optional initial status

### Rules

- Writes must be idempotent.
- Existing canonical identity rules from M0 remain authoritative.
- Duplicate entries must not be created for the same user/title/type tuple.
- Privacy boundaries and RLS policies remain unchanged.

## Import Foundation Contract

The importer layer must be provider-agnostic.

Initial providers:

- TV Time
- Letterboxd
- Trakt

Each provider adapter must normalize external data into FilmTrack canonical entities before persistence.

## Migration Safety

No direct provider-specific persistence.
No bypass of existing security policies.
No destructive migrations.

## Acceptance Checks

- Duplicate protection tests pass.
- Import adapters are isolated.
- Existing M0 verification remains valid.
- CI gates remain required before merge.
