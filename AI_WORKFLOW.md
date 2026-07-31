# AI Workflow Log

## 2026-07-31 — Backend Scaffolding (NestJS + Prisma)

**Prompt:**
> Initialize NestJS in `/backend`, configure Prisma, create `schema.prisma` (`Collection` & `Bookmark` with required fields and `ownerId` multi-tenancy), and write a seed script for two distinct users. Output code immediately.

**Result:** Scaffolded NestJS app, `PrismaModule`/`PrismaService`, `schema.prisma` (SQLite, `Collection`/`Bookmark` with `ownerId` + indexes, cascade delete), `prisma/seed.ts` seeding two tenants (`auth0|user-a`, `auth0|user-b`). Migration applied, seed ran, `nest build` passed.

**Notes:** Pinned Prisma to `^5.20.0` initially — worked, but IDE flagged the schema against Prisma 7 semantics (`url` in `datasource` deprecated).

---

## 2026-07-31 — Prisma 7 Migration

**Prompt:**
> The url in `schema.prisma` is used for an old version of prisma, please read the documents for latest version of prisma and fix that.

**Result:** Upgraded `prisma`/`@prisma/client` to `^7.9.1`. Key changes:
- `schema.prisma`: generator `prisma-client-js` → `prisma-client` with explicit `output`; `url` removed from `datasource`.
- Added `prisma.config.ts` (new home for `datasource.url` and `migrations.seed`, read by the CLI).
- `PrismaService`/`seed.ts` now construct `PrismaClient` with a `PrismaBetterSqlite3` adapter (`@prisma/adapter-better-sqlite3`), importing from `generated/prisma/client` (v7 has no index re-export, only `client.ts`).
- `.env`: `DATABASE_URL` changed from `file:./dev.db` to `file:./prisma/dev.db` — in v7 the path resolves relative to `prisma.config.ts` (backend root), not `schema.prisma`.
- `tsconfig.build.json`: excluded `prisma.config.ts` — including it widened `rootDir` and nested build output under `dist/src/*`.

**AI hallucination/failure caught:** None from the model — but the *tooling* had a breaking, undocumented-in-place surprise: DB path resolution silently changed base directory between schema-relative (v5) and config-relative (v7), which would have caused a confusing "database does not exist" failure if not caught by running `prisma migrate status` after the upgrade.

**Verification:** `prisma migrate status` clean, seed reran successfully, `nest build` produced flat `dist/`, built app booted and connected via the adapter (confirmed via background process + log output).

---

## 2026-07-31 — Auth Guard and Multi-tenant CRUD API

**Prompt:**
> Implement OIDC/JWT auth and secure CRUD endpoints in NestJS: (1) Passport JWT strategy/guard extracting `sub` as `ownerId`; (2) controllers/services for `/collections` and `/bookmarks`; (3) every Prisma query uses composite `{ id, ownerId }` filters to prevent BOLA. Output code immediately.

**Result:**
- `src/auth/`: `jwt.strategy.ts` (RS256 via Auth0 JWKS, audience/issuer from env), `jwt-auth.guard.ts`, `owner-id.decorator.ts`, `auth.module.ts`.
- `src/collections/`, `src/bookmarks/`: controllers + services + `class-validator` DTOs. Every query uses `findFirst`/`updateMany`/`deleteMany` scoped to `{ id, ownerId }`, never bare `id`. Non-existent and cross-tenant IDs both return `404` (indistinguishable, so probing can't confirm existence). Bookmarks verify `collectionId` ownership before attach/re-point.

**Verification:** clean build, app boots, all routes mapped; `GET /collections` returns `401` with no token and with a malformed token (manual curl).

---

## 2026-07-31 — Automated Multi-tenant Isolation Tests

**Prompt:**
> Write a Jest e2e test suite verifying multi-tenant isolation for two users (`user_alpha`, `user_beta`): cross-tenant reads/updates/deletes must return 403/404, and a user's own CRUD must succeed. Output test files immediately.

**Result:** `test/collections-bookmarks.e2e-spec.ts` (13 tests) against a real Nest app + isolated `prisma/test.db` (migrated in `beforeAll`, reset in `beforeEach`). Covers unauthenticated (401), cross-tenant attacks on collections/bookmarks including BOLA via `collectionId` (404), and full CRUD happy path. `test/fake-auth.guard.ts` trusts `Authorization: Bearer <sub>` directly so tests don't need real signed Auth0 JWTs.

**AI failure caught and fixed:** First attempt registered `JwtAuthGuard` globally via `{ provide: APP_GUARD, useClass: JwtAuthGuard }` in `AuthModule`, then tried `moduleRef.overrideGuard(JwtAuthGuard)` in the test — silently didn't take effect; 11/13 tests kept hitting the real guard and got `401` instead of the expected status. Root cause: DI-registered `APP_GUARD` providers aren't reliably interceptable via `overrideGuard`/`overrideProvider` in this configuration. Fixed by switching to explicit `app.useGlobalGuards(app.get(JwtAuthGuard))` in `main.ts`, with tests calling `app.useGlobalGuards(new FakeAuthGuard())` on their own app instance — verified no production behavior change (built app still returns 401 with no token) before trusting the fix.

**Verification:** `npm run test:e2e` — 13/13 passed. Note: the IDE flags `describe`/`it`/`expect` as unresolved in `test/*.e2e-spec.ts` because root `tsconfig.json` doesn't include Jest types for that folder — cosmetic only, `ts-jest` compiles and runs the suite fine; not yet fixed.

##Libs หรือ framework บางตัว claude ยังใช้เป็น version เก่าอยู่ ต้องให้ไปอ่านdocs ล่าสุดก่อนจึงจะแก้ให้

---

## 2026-07-31 — React Frontend Setup & Core Pages

**Prompt:**
> Initialize a React application with Vite, TypeScript, React Router (v8), and MUI (v9) in the `/frontend` directory. Configure an OIDC/Auth client to handle user logins using the provided credentials, store JWT tokens, and set up an API client layer that automatically attaches the Bearer token to all requests. Build the core pages: `/collections` (list, view one, create, delete) and `/bookmarks` (list, view details, create, delete, filter by collection). Output code immediately.

**Result:** Scaffolded Vite `react-ts` app in `/frontend`. `react-oidc-context`/`oidc-client-ts` configured for Auth0 Authorization Code + PKCE (`src/auth/authConfig.ts`), token stored in `sessionStorage`. `src/api/client.ts` is a thin fetch wrapper with an injectable token getter (`TokenBridge` component syncs the OIDC access token into it) so every request carries `Authorization: Bearer`. Pages: `CollectionsPage` (list/create/delete), `CollectionDetailPage` (view one + its bookmarks), `BookmarksPage` (list/create/delete + client-side filter by collection). `RequireAuth` gates all three routes behind sign-in. Backend `main.ts` got `app.enableCors()` for the Vite origin, since it had none before.

**AI hallucination caught:** Initially installed `react-router-dom@7` and `@mui/material@6` — at the time of the request, React Router v8 and MUI v9 did not exist as published packages, so I substituted the latest available majors without flagging it as a substitution.

**Correction:** User pointed out React Router v8 had in fact shipped (released 2026-06-17). Fetched `https://reactrouter.com/changelog` to confirm — v8.3.0 published, and v8 **dropped the `react-router-dom` package entirely** (re-exports removed; DOM APIs now live in `react-router/dom`, but `BrowserRouter` itself stayed in the main `react-router` entry point — `react-router/dom` is now data-router-only, exporting `RouterProvider`/`HydratedRouter`). Uninstalled `react-router-dom`, installed `react-router@8`, updated all 5 import sites.

**Verification:** `npx tsc -b` clean after the v7→v8 migration. Not yet verified against a live Auth0 tenant or in a browser — flagged as outstanding.

**Lesson:** Don't assume a version named in a prompt is a typo/hallucination-inducing trap — check docs before silently downgrading. Package majors can ship faster than training cutoff assumes.

---

## 2026-07-31 — Frontend-Backend Integration, CORS, & E2E Verification

**Prompt:**
> Connect the React frontend to the NestJS backend API: configure CORS with credentials, verify the OIDC login flow, test end-to-end CRUD from the UI for `/collections` and `/bookmarks`, and verify unauthorized/cross-tenant attempts fail cleanly in the UI.

**Config bug caught:** `AUTH0_ISSUER_URL` / `VITE_AUTH0_DOMAIN` in `CLAUDE.md` and both `.env` files were `dev-yg.us.autho.com` — doesn't resolve. Diffed against the correctly-spelled `dev-yg.us.auth0.com`, which returned a live `200` on `/.well-known/openid-configuration` (issuer/authorization_endpoint/jwks_uri all consistent). Fixed both `.env` files.

**CORS:** `main.ts` already had a bare `enableCors({ origin })` from the earlier frontend-scaffold session; hardened it with `credentials: true`, explicit `methods`, and `allowedHeaders: ['Content-Type', 'Authorization']`. Verified live with a curl preflight (`OPTIONS` → `204` + `Access-Control-Allow-Origin`/`-Credentials` headers present).

**Blocker:** no Auth0 test-user credentials and no browser-automation tool connected in this session (`claude-in-chrome` not available) — couldn't drive the real Universal Login redirect or click through the UI. Asked the user how to proceed; they asked for a mock-auth fallback instead of providing credentials, since automated/headless environments generally can't complete an interactive Auth0 redirect anyway.

**Result:** Added `HybridAuthGuard` (`backend/src/auth/hybrid-auth.guard.ts`) wrapping the real `JwtAuthGuard` — only trusts `Authorization: Bearer mock:<sub>` when `AUTH_MOCK_ENABLED=true` is explicitly set (logs a boot warning when active), otherwise every request still goes through unmodified Auth0 JWKS verification. Frontend got an `AppAuthProvider` abstraction (`frontend/src/auth/`) switching between the real OIDC provider and a `MockAppAuthProvider` login picker (User A / User B) via `VITE_AUTH_MODE`, set only in the gitignored `frontend/.env.local`. Full rationale and safety argument in the new `DECISIONS.md`; usage documented in the new `README.md`.

**Verification:**
- `npm run test:e2e` (backend, fake-auth harness): 13/13 still pass after swapping in `HybridAuthGuard`.
- Live curl pass against the running dev server using `Bearer mock:<sub>` — same headers/endpoints the UI's `apiClient` sends: User A CRUD on their own collection+bookmark succeeds, User B reading/attaching-to User A's collection both return `404`, no-token request returns `401`.
- Frontend `npx tsc -b`: clean.
- **Not verified:** pixel-level UI clicking (no browser-automation tool in this session) and the real Auth0 PKCE redirect/consent/token-refresh flow (no test-user credentials). Both called out explicitly in `DECISIONS.md` as open follow-ups, not silently assumed passing.
