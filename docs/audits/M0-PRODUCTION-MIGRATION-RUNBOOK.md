# FilmTrack M0 Production Migration Runbook

## Purpose

Close the final M0 production blocker through a controlled Supabase migration deployment and read-only post-deploy verification.

This runbook does not embed credentials and must not be used to bypass Supabase migration history.

## Production safety rules

1. Do not paste migrations ad hoc into the SQL Editor.
2. Use the approved Supabase project and migration tooling associated with FilmTrack production.
3. Confirm the current deployed application is healthy before schema changes.
4. Apply migrations in repository order from `supabase/migrations/`.
5. Stop immediately on any migration error; do not retry with modified SQL against production.
6. Run the verification queries below in a read-only transaction after deployment.
7. Record the migration command/output, UTC timestamp, operator, and verification results in Issue #6.

## Migrations in M0 scope

- `20260819094500_m0_data_boundary_foundation.sql`
- `20260822093000_m0_privacy_visibility.sql`

Both files are version-controlled and reviewed. Existing watchlist visibility must remain default-private after rollout.

## Pre-deploy verification

Confirm:

- Production site is healthy.
- A recent backup / point-in-time recovery capability is available according to the current Supabase project plan.
- The target project reference is the FilmTrack production project, not staging/local.
- Local migration history is clean and ordered.
- No unexpected schema drift is reported before applying the migrations.

## Approved deployment path

From an authenticated environment linked to the FilmTrack production Supabase project, use the Supabase migration workflow for the repository. Review the pending migration list before confirming any database push.

Do not use `--include-all`, repair migration history, reset the production database, or force destructive reconciliation during this M0 closure.

## Post-deploy read-only verification

Run inside an explicitly read-only transaction:

```sql
begin transaction read only;

-- Required columns and safe default.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_lists'
  and column_name in ('user_id', 'title_id', 'title_type', 'status', 'is_public')
order by column_name;

-- Existing/new list rows must not become public implicitly.
select
  count(*) as total_rows,
  count(*) filter (where is_public is true) as public_rows,
  count(*) filter (where is_public is null) as null_visibility_rows
from public.user_lists;

-- Canonical media identity duplicates must remain zero.
select user_id, title_id, title_type, count(*)
from public.user_lists
group by user_id, title_id, title_type
having count(*) > 1;

-- Invalid domains must remain zero.
select count(*) as invalid_title_types
from public.user_lists
where title_type not in ('movie', 'tv');

select count(*) as invalid_statuses
from public.user_lists
where status is null
   or status not in ('plan_to_watch', 'watching', 'completed', 'on_hold', 'dropped');

-- Raw public comment email identity must no longer exist.
select count(*) as user_email_column_count
from information_schema.columns
where table_schema = 'public'
  and table_name = 'comments'
  and column_name = 'user_email';

-- RLS must remain enabled.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('user_lists', 'comments')
order by relname;

-- Expected policies and roles.
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('user_lists', 'comments')
order by tablename, policyname;

rollback;
```

## Acceptance criteria

M0 production closure is complete only when all of the following are recorded in Issue #6:

- Both M0 migrations are present in production migration history.
- Deployment completed without error.
- `is_public` exists and defaults to `false`.
- No `NULL` visibility rows exist.
- No canonical watchlist duplicates exist.
- No invalid title types/statuses exist.
- `comments.user_email` is absent.
- RLS remains enabled on both user-owned tables.
- Public profile behavior is verified to expose only explicitly public list rows.
- Production web health remains normal after migration.

Only then should Issue #6 be closed and M1 execution formally begin.
