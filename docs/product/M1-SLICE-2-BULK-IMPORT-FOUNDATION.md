# M1 Slice 2 — Bulk Add & Import Foundation

## Goal
Build the retention layer after Activation Loop by introducing scalable watchlist expansion and external tracker migration foundations.

## Bulk Add

### Principles
- Multiple titles can be added in one user action.
- Watchlist writes remain idempotent.
- Canonical title identity from M0 remains the source of truth.
- Duplicate entries must be prevented at application and database boundaries.

## Import Foundation

Create an importer abstraction independent from providers.

Initial provider targets:

- TV Time
- Letterboxd
- Trakt

Each provider should map external data into the FilmTrack canonical model.

## Retention Goals

- Reduce empty-state friction.
- Improve returning-user activation.
- Prepare analytics events for activation and retention funnels.

## Acceptance Criteria

- No duplicate watchlist records.
- Provider-specific parsing is isolated.
- Existing privacy and RLS guarantees remain unchanged.
- Changes pass CI and review gates.
