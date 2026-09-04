# FilmTrack Final RC — Mobile & Cloudflare QA

Issue: #114

## Acceptance gates

- [ ] No unintended horizontal overflow at 320px, 360px, 390px, 430px.
- [ ] Public routes render without hard failures.
- [ ] Auth-protected routes redirect cleanly to `/auth` when unauthenticated.
- [ ] Intentional horizontal media rails remain usable.
- [ ] Persian RTL typography remains readable.
- [ ] SEO metadata and crawlable public content remain intact.
- [ ] GEO signals remain intact: clear entity/topic semantics, structured public content, and useful answer-oriented page copy.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] Cloudflare preview passes independently of Vercel.
- [ ] Production filmtrack.ir and production DB remain untouched.
