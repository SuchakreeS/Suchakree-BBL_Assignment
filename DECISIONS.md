# Decisions

## §3.3: "A user may want to share a collection with someone else"

**Context:** The spec deliberately leaves this open — "you do not have to implement all of it, but
you do have to decide, justify, and back up whatever you ship."

**Decision:** Not implemented in this submission. Explicitly deferred, not silently dropped.

**Why:** Sharing is a second privacy boundary layered on top of the first one (§3's core invariant —
"nobody else can see any of it"). Implementing it well requires: a `CollectionShare` join table
(`collectionId`, `granteeOwnerId`, permission level), rewriting every read-path query from
`where: { id, ownerId }` to `where: { id, OR: [{ ownerId }, { shares: { some: { granteeOwnerId } } }] }`,
deciding whether a grantee can see the owner's other collections' existence via any list/aggregate
endpoint, and its own adversarial test suite (a shared-with user must not gain write/delete access, a
revoked grant must take effect immediately, a grantee must not be able to re-share). Given the time
budget and that §3.1's core CRUD + isolation work is worth more of the rubric (§6-C, §6-D) than this
bonus-adjacent item, building it partially — e.g. a `sharedWith: string[]` field with no enforcement
anywhere — would be worse than not building it: it would look implemented while silently violating the
absolute-privacy invariant the whole app is graded on.

**What I'd ship next:** read-only sharing via a `CollectionShare(collectionId, granteeOwnerId)` table;
`GET /collections` and `GET /collections/:id` (and the nested `/bookmarks` route) extended to also
match shared grants; no write/delete/re-share capability for a grantee. `POST /collections/:id/shares`
would itself need an ownership check identical to the existing delete/update pattern.

## On-delete behavior: deleting a collection deletes its bookmarks

**Context:** `Bookmark.collectionId` is nullable — the spec calls out that "a bookmark can be
uncategorised." That leaves two reasonable choices for what happens to a collection's bookmarks when
the collection is deleted: cascade-delete them, or set `collectionId` to `null` (orphan them into the
uncategorised pool).

**Decision:** Cascade delete (`onDelete: Cascade` in `schema.prisma`).

**Why:** "A user can delete a collection" (§3.3) reads as a genuine delete of that organizational unit
and its contents, not an unbundling operation — orphaning would silently turn "delete my private
research collection" into "detach and keep 40 bookmarks I no longer have a name for," which is a
surprising outcome for a destructive action the UI presents as final. Cascade also avoids a subtler
correctness trap: `SET NULL` on delete requires the FK column to be nullable at the DB level and,
combined with per-tenant filtering, makes it easy to accidentally leak an orphaned bookmark's
`collectionId` reference to a since-deleted (and possibly since-reused-by-a-different-tenant, though
UUIDs make that practically impossible here) id if any code path forgets to re-check.

**Trade-off accepted:** no "undo" or "detach instead of delete" UX. If a future ticket wants
orphan-on-delete, it's a one-line schema change (`onDelete: SetNull`) plus a UI copy change to warn
the user which behavior they're getting — but it needs to be a conscious choice, not the Prisma
default.

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
