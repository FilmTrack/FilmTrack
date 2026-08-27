# FilmTrack Mobile App Roadmap

Tracking: #32

FilmTrack already carries a Capacitor-based mobile foundation (`@capacitor/core`, `@capacitor/android`, and `@capacitor/cli`). This document keeps the native/mobile workstream active without blocking web delivery.

## Product principle

The responsive web application remains the canonical product surface and must provide excellent mobile UX independently of native app delivery.

The mobile app should reuse FilmTrack domain contracts and authenticated APIs rather than fork product logic.

## Phase 1 — Web/mobile parity foundation

- Responsive navigation, search, cards, title details, onboarding, dashboard and footer.
- Touch targets and safe-area behavior.
- PWA/manifest verification.
- Canonical watchlist persistence shared with web.
- Authentication/session behavior verified in mobile containers.

## Phase 2 — Android development track

- Maintain Capacitor Android shell.
- Define environment/config separation for development and production.
- Verify deep links into title pages.
- Verify authenticated watchlist and onboarding flows.
- Establish mobile release signing and CI as a separately reviewed infrastructure change.

## Phase 3 — Native-value features

Only after parity and retention evidence:

- Push notification architecture for release/calendar reminders.
- Native share/deep-link flows.
- Offline-friendly saved state where privacy and consistency guarantees remain intact.

## Safety boundary

- No mobile-only fork of FilmTrack title identity or user-list rules.
- No direct database writes outside canonical authenticated persistence boundaries.
- No production signing, store publishing or secret mutation without a dedicated issue and review.
