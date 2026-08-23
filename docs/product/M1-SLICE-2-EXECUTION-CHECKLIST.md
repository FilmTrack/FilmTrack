# M1 Slice 2 Execution Checklist

## Bulk Add Implementation

- [ ] Identify current watchlist write path
- [ ] Define bulk command contract
- [ ] Preserve canonical identity constraints from M0
- [ ] Add duplicate protection coverage
- [ ] Validate partial failure behavior

## Import Foundation

- [ ] Define provider adapter interface
- [ ] Add normalized import model
- [ ] Keep provider logic isolated
- [ ] Prepare TV Time adapter boundary
- [ ] Prepare Letterboxd adapter boundary
- [ ] Prepare Trakt adapter boundary

## Safety Gates

- [ ] No destructive database migration
- [ ] No RLS bypass
- [ ] CI required before merge
- [ ] Evidence recorded in GitHub PR
