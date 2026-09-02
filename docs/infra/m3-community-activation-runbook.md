# FilmTrack M3 Community Activation Runbook

Status: repository-only. Production activation requires an explicit separate approval.

## Scope

This runbook covers activation of the M3 Community Identity runtime implemented behind `NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED` and the migration `supabase/migrations/20260901143000_m3_community_identity_foundation.sql`.

The runtime provides username-based public profiles for authenticated viewers, Follow/Unfollow, participant-scoped relationship state, private owner network views, public-member discovery, and privacy-safe public activity.

## Invariants that must remain true

- Community is disabled unless `NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED=true` exactly.
- Profiles default to `private`.
- Public identity is based on normalized unique `username`, never auth email.
- Public routes use `/u/[username]`; UUIDs are not public routing identity.
- Follow writes use `follower_user_id` and `followed_user_id`.
- Self-follow is rejected by the database constraint.
- Follow reads remain participant-scoped; no full public follow graph exists.
- Anonymous profile reads remain disabled in this rollout.
- Ratings and diary entries remain owner-only and are not part of M3 public activity.
- No destructive rollback is permitted as a normal operational response.

## Required pre-activation gates

1. PR Strict Quality Gates must be green: lint, typecheck, tests, build.
2. Confirm the exact migration file to apply is `20260901143000_m3_community_identity_foundation.sql` from the reviewed release commit.
3. Confirm the migration still contains one transaction (`begin` / `commit`) and no destructive `drop table`, `truncate`, or data rewrite.
4. Confirm `community_profiles` has:
   - `user_id` primary key referencing `auth.users(id)` with cascade delete;
   - lowercase username format `^[a-z0-9_]{3,24}$`;
   - unique lowercase username index;
   - visibility default `private` and allowed values only `private/public`;
   - RLS enabled;
   - authenticated owner CRUD and authenticated public-profile select policy;
   - no anon grant.
5. Confirm `community_follows` has:
   - canonical columns `follower_user_id` and `followed_user_id`;
   - composite primary key on both columns;
   - no-self-follow constraint;
   - RLS enabled;
   - participant-only select policy;
   - outgoing-owner insert/delete policies;
   - no anon grant.
6. Keep the runtime feature flag OFF while applying and verifying the schema.

## Read-only post-migration verification

Run schema verification before enabling the runtime. These checks are read-only and should return the expected objects/policies.

```sql
select to_regclass('public.community_profiles') as community_profiles,
       to_regclass('public.community_follows') as community_follows;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('community_profiles', 'community_follows')
order by tablename, policyname;

select table_schema, table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('community_profiles', 'community_follows')
order by table_name, grantee, privilege_type;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('community_profiles', 'community_follows')
order by tablename, indexname;
```

Expected security posture: authenticated access is controlled by RLS; anon has no table privileges; profile visibility remains explicit; follow graph reads remain participant-scoped.

## Activation sequence

1. Keep `NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED` absent or not equal to `true`.
2. Apply only the reviewed M3 migration through the approved production database migration mechanism.
3. Run the read-only verification queries above.
4. Run an authenticated smoke test with two dedicated test accounts:
   - create profile A and B;
   - verify default visibility is private;
   - explicitly make B public;
   - verify A can discover B by username/display name;
   - verify A can follow and unfollow B;
   - verify B can see A as a participant in its own network;
   - verify neither account can enumerate an unrelated user's follow graph;
   - verify private profiles do not expose username through another user's network surface.
5. Only after schema and smoke checks pass, set `NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED=true` in the intended deployment environment and deploy that environment.
6. Verify `/dashboard`, `/dashboard/profile`, `/dashboard/community`, `/community`, and `/u/[username]` with authenticated test accounts.
7. Verify unrelated production surfaces (homepage, title pages, watchlist/dashboard tracking) still work.

## Stop conditions

Do not enable the flag, or disable it immediately, if any of these occur:

- migration does not complete atomically;
- expected RLS policies or grants differ;
- anon can read either M3 table;
- a private profile is discoverable by another user;
- a user can read follow edges where they are not a participant;
- Follow/Unfollow writes target anything other than the canonical two follow columns;
- UUID or email appears as public Community identity;
- Strict Quality Gates fail on the release commit;
- existing non-Community production behavior regresses.

## Operational rollback

The primary rollback is runtime isolation, not schema destruction:

1. Set `NEXT_PUBLIC_FILMTRACK_M3_COMMUNITY_ENABLED` to a value other than `true` or remove it.
2. Redeploy the application environment.
3. Verify Community entry points no longer query M3 tables and disabled states render safely.
4. Leave `community_profiles` and `community_follows` intact to preserve data and forensic evidence.
5. Investigate and ship a corrective migration or application patch through a new reviewed PR.

Do not drop M3 tables as an emergency rollback unless there is a separately reviewed, explicitly approved destructive data-removal plan.

## Activation evidence to record

Record in the GitHub issue/PR or release evidence:

- reviewed commit SHA;
- migration filename and checksum/SHA evidence;
- Strict Quality Gates run ID and result;
- migration execution result;
- read-only schema/RLS/grant verification result;
- smoke-test result;
- deployment identifier with flag enabled;
- rollback owner and decision point.

## Current state

As of this runbook's creation, the M3 migration has not been applied to Production and the production runtime flag has not been enabled by this PR.
