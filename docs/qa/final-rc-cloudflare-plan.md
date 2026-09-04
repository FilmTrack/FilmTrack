# Final RC Cloudflare Preview Plan

## Reason
Vercel deployment status is currently rate-limited for this repository. Cloudflare preview is the independent validation path.

## Rules
1. Never change `filmtrack.ir` DNS during preview work.
2. Never write to the production database during preview QA.
3. Keep Supabase public runtime configuration isolated to preview.
4. Validate public routes and unauthenticated redirects.
5. Validate SEO and GEO before release.
6. Promote only after all quality and visual gates are green.
