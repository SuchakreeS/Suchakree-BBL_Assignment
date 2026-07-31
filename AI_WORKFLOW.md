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
