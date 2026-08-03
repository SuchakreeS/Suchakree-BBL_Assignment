# Bangkok Bank (BBL) Full-Stack Exam — Bookmark Manager

Tenant-isolated personal bookmark manager. `/backend` (NestJS + Prisma +
SQLite), `/frontend` (React + Vite + MUI + React Router).

## Running locally

```
cd backend && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
cd frontend && npm install && npm run dev
```

Backend: http://localhost:3001. Frontend: http://localhost:5173.

## Bearer token choice

The API accepts the Auth0 **access token** (not the ID token) as the Bearer credential.

**Rationale:** an ID token is proof-of-authentication for *this client*, scoped to `client_id`,
and isn't meant to be presented to a resource server — Auth0's own guidance is explicit that ID
tokens must never be sent as an API Authorization header. An access token is proof-of-authorization
for a specific `audience`; the frontend requests one for `https://bbl-candidate-test-api` via
`extraQueryParams: { audience }` in `frontend/src/auth/authConfig.ts`, and the backend's
`JwtStrategy` (`backend/src/auth/jwt.strategy.ts`) validates `aud` against that same audience plus
`iss` against the tenant, over RS256 via the tenant's JWKS. Verified against the tenant's discovery
document (`/.well-known/openid-configuration`) before committing to this: `id_token_signing_alg_values_supported`
and `response_types_supported` both list `code` + RS256, and the audience is only meaningful on the
access token — the ID token's audience is always the `client_id`, not an API identifier.

**Trade-off:** the standard Auth0 SPA + custom-API-audience setup issues an opaque *or* JWT access
token depending on tenant configuration; this API assumes/requires a JWT access token (so it can be
verified statelessly via JWKS, no round-trip to Auth0's `/userinfo` per request). If the tenant were
reconfigured to issue opaque tokens, `JwtStrategy` would need to switch to token introspection.

## Auth modes

The frontend ships two auth providers, selected by `VITE_AUTH_MODE`
(`frontend/.env`):

- **`oidc` (default):** real Auth0 Authorization Code + PKCE flow against
  the tenant in `frontend/.env` / `backend/.env`.
- **`mock`:** a local login picker (User A / User B) with no real token —
  see [DECISIONS.md](./DECISIONS.md) for why this exists and how it's
  scoped. Enabled via `frontend/.env.local` (gitignored, not committed) plus
  `AUTH_MOCK_ENABLED=true` in `backend/.env`. **Never set the backend flag
  to `true` in a deployed environment.**

## Testing

- Backend tenant-isolation e2e suite: `cd backend && npm run test:e2e`
  (20 tests — unauthenticated, cross-tenant BOLA attempts across all verbs
  including PUT/PATCH/DELETE and the `?collectionId=` filter and nested
  `/collections/:id/bookmarks` route, plus happy-path CRUD).
- See [DECISIONS.md](./DECISIONS.md) for the current gap: real browser-driven
  Auth0 login is not covered by automation in this environment and needs a
  manual pass. The e2e suite also runs against `FakeAuthGuard`
  (`backend/test/fake-auth.guard.ts`), which trusts a bearer value directly as
  `ownerId` — it exercises the tenant-isolation logic exhaustively but not the
  real Auth0 JWKS/RS256 verification path itself; that path is exercised
  manually (curl against a live token) and via `AUTH_MOCK_ENABLED`, see
  DECISIONS.md.

## What's done vs. skipped

**Done:** all of §3.1 (`/collections`, `/bookmarks`, `/me`, GET/list/create/PUT/PATCH/DELETE on both
resources, server-side `?collectionId=` filtering, `GET /collections/:id/bookmarks`), §3.2 (both
required frontend pages), Prisma + SQL persistence, two-tenant seed data, and the full privacy-invariant
test suite (§3, §5). Auth is Authorization Code + PKCE against the real tenant, with a narrow
explicitly-gated local mock (see DECISIONS.md).

**Skipped:** §3.3 collection sharing (deferred — see DECISIONS.md for why and what a follow-up would
look like), the `/all` bonus page, Docker, CI/CD, and full-text search (all explicitly bonuses per
§3.4).

## Workflow log

Prompt history and notable AI mistakes/corrections during development are in
[AI_WORKFLOW.md](./AI_WORKFLOW.md).
