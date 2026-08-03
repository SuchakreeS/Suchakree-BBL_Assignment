# Auth guard, CRUD API, isolation tests (2026-07-31)

**Prompt:**
> Implement OIDC/JWT auth and secure CRUD endpoints in NestJS: (1) Passport JWT strategy/guard
> extracting `sub` as `ownerId`; (2) controllers/services for `/collections` and `/bookmarks`; (3)
> every Prisma query uses composite `{ id, ownerId }` filters to prevent BOLA. Output code
> immediately.

Asked Claude to build the JWT auth guard (Auth0 JWKS, RS256) and the `/collections` + `/bookmarks`
CRUD endpoints, with every query scoped to `{ id, ownerId }` so one user can never touch another's
data. It also made sure a cross-tenant request and a "doesn't exist" request both return the same
404 — no way to tell the difference from the outside.

**Prompt:**
> Write a Jest e2e test suite verifying multi-tenant isolation for two users (`user_alpha`,
> `user_beta`): cross-tenant reads/updates/deletes must return 403/404, and a user's own CRUD must
> succeed. Output test files immediately.

Then asked for a Jest e2e suite proving that isolation actually holds for two users. First attempt
looked fine but wasn't: it tried to swap in a fake auth guard for the tests using `overrideGuard`,
and that silently didn't work — 11 of 13 tests were still hitting real auth and failing. Root cause
was how the guard was registered globally; fixed by switching to `useGlobalGuards` instead, and
double-checked the real app still behaved the same (401 with no token) before trusting it.

13/13 tests passed after the fix.

Also left this note in the log at the time, in Thai, which is honestly a decent summary of the whole
day: *"some libraries Claude was using an old version of — needs to check the latest docs before it
fixes them properly."*
