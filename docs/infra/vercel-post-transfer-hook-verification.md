# Vercel post-transfer hook verification

Tracking: #26

This document records the zero-downtime verification probe after transferring the canonical repository from `AmirMotefaker/FilmTrack` to `FilmTrack/FilmTrack` and reconnecting the existing Vercel project.

## Purpose

Trigger one documentation-only commit through the canonical GitHub organization so the existing Vercel project can prove that Git push / pull-request / main-branch deployment hooks still work after the repository ownership transfer.

## Safety boundary

- No runtime application code changes.
- No database or Supabase changes.
- No authentication changes.
- No payment changes.
- No domain changes.
- No new Vercel project.
- Existing `filmtrack.ir` and `www.filmtrack.ir` production domains must remain attached to the current project.

## Acceptance evidence

- PR preview event is received by the existing Vercel project.
- Merge to `main` triggers a new production deployment from `FilmTrack/FilmTrack`.
- Production deployment becomes READY.
- `filmtrack.ir` continues redirecting to `www.filmtrack.ir`.
- `www.filmtrack.ir` returns HTTP 200.
- GitHub integration metadata reflects the canonical organization path on the new deployment.

## Reauthorization probe

A second documentation-only commit was emitted after the Vercel GitHub App was explicitly granted access to all repositories in the `FilmTrack` organization. This commit exists only to generate a fresh GitHub push / pull-request event and verify post-transfer event delivery without changing production behavior.

Rebind verification event: 1405-06-05T10:17:21+03:30
