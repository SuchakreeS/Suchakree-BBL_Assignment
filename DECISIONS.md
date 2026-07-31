# Decisions

## Mock auth bypass for local UI/E2E verification

**Context:** The Auth0 Universal Login flow requires an interactive browser
redirect. This environment cannot drive that redirect (no headless/automated
login path available), which blocks UI-level CRUD and cross-tenant
verification against real signed JWTs.

**Decision:** Added a narrow, explicitly-gated bypass instead of weakening
real auth:

- **Backend** (`src/auth/hybrid-auth.guard.ts`): wraps the real `JwtAuthGuard`.
  Only when the env var `AUTH_MOCK_ENABLED=true` is set does it additionally
  accept `Authorization: Bearer mock:<sub>` and trust `<sub>` as `ownerId`
  directly, with **no signature verification**. Any other token — including
  a malformed or missing one — still goes through the unmodified Auth0 JWKS
  path. The guard logs a loud warning on boot whenever the flag is on.
- **Frontend** (`src/auth/AppAuthProvider.tsx`): selects between
  `OidcAppAuthProvider` (real Auth0 PKCE flow, default) and
  `MockAppAuthProvider` (a login picker for the two seeded users,
  `auth0|user-a` / `auth0|user-b`) based on `VITE_AUTH_MODE`. Mock mode is
  enabled only via `frontend/.env.local`, which is gitignored and never
  committed.

**Why this is safe:**
- The flag defaults to off/unset in both `.env.example`-style production
  config and any deployed environment. It must be explicitly set to the
  literal string `"true"`.
- The mock path only triggers on a token with an unambiguous `mock:` prefix
  — it cannot be confused with or accidentally accept a real Bearer JWT.
- All existing tenant-isolation guarantees (composite `{ id, ownerId }`
  queries, DTO validation, 401/404 semantics) are untouched — the guard only
  changes how `ownerId` gets attached to the request, not how it's used
  afterward. The automated e2e suite (`test/collections-bookmarks.e2e-spec.ts`)
  already exercises this same trust boundary via its own `FakeAuthGuard`.

**Trade-off accepted:** Real Auth0 login (token issuance, consent screen,
session persistence, token refresh) is NOT exercised by this bypass and
remains unverified by automation in this environment. That surface should be
verified manually in a browser, or via a scripted client-credentials/ROPC
grant against the real Auth0 tenant, before sign-off.
