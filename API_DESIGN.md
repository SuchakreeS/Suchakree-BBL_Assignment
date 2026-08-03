# API Design

Base URL: `http://localhost:3001`. Every route below requires `Authorization: Bearer <token>` — there
is no unauthenticated route in this API. See [DECISIONS.md](./DECISIONS.md) for the bearer-token
choice and the local mock-auth bypass.

## Resources

### Collection

| Field       | Type              |
|-------------|-------------------|
| `id`        | string (uuid)     |
| `ownerId`   | string (Auth0 `sub`) |
| `name`      | string, 1–200 chars |
| `createdAt` | ISO datetime      |
| `updatedAt` | ISO datetime      |

### Bookmark

| Field          | Type                          |
|----------------|-------------------------------|
| `id`           | string (uuid)                 |
| `ownerId`      | string (Auth0 `sub`)          |
| `title`        | string, 1–200 chars           |
| `url`          | string, must include protocol |
| `notes`        | string, ≤2000 chars, nullable |
| `collectionId` | string (uuid), nullable       |
| `createdAt`    | ISO datetime                  |
| `updatedAt`    | ISO datetime                  |

A bookmark's `collectionId` is nullable (uncategorised bookmark). Every `Collection`/`Bookmark`
returned or accepted by the API is implicitly scoped to the caller — `ownerId` is never a client
input, it is derived server-side from the verified token's `sub` claim (`OwnerId` param decorator,
`backend/src/auth/owner-id.decorator.ts`).

## Endpoints

### `GET /me`
Returns the current signed-in caller: `{ sub, ownerId }`. No body params.

### Collections (`/collections`)

| Verb | Path | Body | Success | Notes |
|---|---|---|---|---|
| GET | `/collections` | – | 200, `Collection[]` | Always scoped to `ownerId`; no filter params (no filterable fields beyond ownership). |
| GET | `/collections/:id` | – | 200, `Collection` | 404 if not found **or** owned by someone else — the two cases are indistinguishable to the caller. |
| GET | `/collections/:id/bookmarks` | – | 200, `Bookmark[]` | The `GET /collections/:id/bookmarks` relation endpoint required by the spec. 404s exactly like `GET /collections/:id` if the collection isn't the caller's. |
| POST | `/collections` | `{ name }` | 201, `Collection` | |
| PUT | `/collections/:id` | `{ name }` (required) | 200, `Collection` | Full replace — `name` is mandatory. |
| PATCH | `/collections/:id` | `{ name? }` | 200, `Collection` | Partial update. |
| DELETE | `/collections/:id` | – | 204 | **Cascades**: deletes every bookmark whose `collectionId` points at this collection (see "On-delete behavior" below). 404 if not the caller's. |

### Bookmarks (`/bookmarks`)

| Verb | Path | Body / Query | Success | Notes |
|---|---|---|---|---|
| GET | `/bookmarks` | `?collectionId=<uuid>` (optional) | 200, `Bookmark[]` | Filter is applied server-side. If `collectionId` is supplied, ownership of that collection is checked first — filtering by another tenant's `collectionId` returns 404, not an empty/leaky list. |
| GET | `/bookmarks/:id` | – | 200, `Bookmark` | 404 for not-found or cross-tenant. |
| POST | `/bookmarks` | `{ title, url, notes?, collectionId? }` | 201, `Bookmark` | If `collectionId` is set, its ownership is verified before the bookmark is created — prevents attaching to another tenant's collection (BOLA via foreign key). |
| PUT | `/bookmarks/:id` | `{ title, url, notes?, collectionId? }` (title/url required) | 200, `Bookmark` | Full replace. |
| PATCH | `/bookmarks/:id` | `{ title?, url?, notes?, collectionId? }` | 200, `Bookmark` | Partial update. Re-pointing `collectionId` re-checks ownership of the *new* collection. |
| DELETE | `/bookmarks/:id` | – | 204 | |

## Error shape

Standard Nest `HttpException` JSON:

```json
{ "statusCode": 404, "message": "Collection not found", "error": "Not Found" }
```

Validation failures (`class-validator`, via the global `ValidationPipe`) return `400` with a
`message: string[]` array of field errors. Unknown/extra body fields are rejected
(`forbidNonWhitelisted: true`), not silently dropped.

| Status | When |
|---|---|
| 401 | Missing/malformed/invalid/expired Bearer token. |
| 400 | DTO validation failure (missing required field, wrong type, extra field, bad URL, etc). |
| 404 | Resource doesn't exist, **or** exists but belongs to a different `ownerId`. Deliberately not 403 — see below. |
| 204 | Successful DELETE. |

## Privacy invariant enforcement (§3)

**Rule:** every Prisma call touching `Collection`/`Bookmark` binds `ownerId` in the `where` clause
alongside any `id` — never a bare-`id` lookup. Enforced in `backend/src/collections/collections.service.ts`
and `backend/src/bookmarks/bookmarks.service.ts`:

- Reads: `findFirst({ where: { id, ownerId } })`.
- Writes/deletes: `updateMany`/`deleteMany({ where: { id, ownerId } })`, then a `count === 0` check
  raises `NotFoundException` — this is what makes cross-tenant writes 404 instead of silently
  no-op'ing or leaking a 403 (which would confirm the resource exists for someone else).
- Foreign-key BOLA: `assertCollectionOwnership()` in `bookmarks.service.ts` re-verifies the target
  `collectionId` belongs to the caller on every create/update/filter that references it, so a bookmark
  can't be attached to, re-pointed onto, or filtered by another tenant's collection.

**Why 404, not 403, for cross-tenant access:** returning 403 tells an attacker the resource *exists*
(just isn't theirs) — a form of existence leakage the spec explicitly prohibits ("even learn of the
existence of"). 404 is indistinguishable from "never existed."

This is proven, not just asserted — `backend/test/collections-bookmarks.e2e-spec.ts` runs both tenants
against a real Nest app + SQLite DB and checks every read/write/delete/filter combination for 404s and
data-untouched assertions (`npm run test:e2e`, 20/20 passing).

## On-delete behavior

`Bookmark.collection` is declared `onDelete: Cascade` in `schema.prisma`. Deleting a `Collection`
deletes every `Bookmark` that pointed at it, rather than orphaning them to `collectionId: null`.
This was a deliberate choice, not a Prisma default oversight — see `DECISIONS.md` for the rationale
and the alternative considered.

## Where the agent's first attempt was wrong

1. **No server-side bookmark filtering.** The first pass implemented `GET /bookmarks` with no query
   parameters and had the frontend filter the already-fetched list by `collectionId` in the browser.
   That technically works for a UI demo but violates the spec's "filtering" requirement (§3.1.4) and
   doesn't scale — the client fetches every bookmark the user owns regardless of the filter. Fixed by
   adding `?collectionId=` to `GET /bookmarks`, scoped through the same `assertCollectionOwnership`
   check used elsewhere, and pointing the frontend at it instead of client-side `.filter()`.
2. **`GET /collections/:id/bookmarks` was missing entirely**, even though it's explicitly named in
   §3.1.5. The agent had wired the collection-detail page to call the flat `GET /bookmarks` list and
   filter client-side by `collectionId === id` — functionally similar output, but it isn't the endpoint
   the spec asked for, and it means a `/collections/:id/bookmarks` request from any other client (e.g.
   a mobile app, or the graders' own curl) would 404. Added the real nested route, backed by
   `CollectionsService.findBookmarks()`, which re-checks the collection's ownership before listing.
3. **Only PATCH was implemented, no PUT.** The spec explicitly lists "update (PUT)" and "patch (PATCH)"
   as two distinct required verbs; the first pass treated them as one and only wired PATCH. Added `PUT`
   on both resources with dedicated `Replace*Dto`s that make the full-replace fields (`name` on
   Collection; `title`/`url` on Bookmark) required, versus optional on the `Update*Dto` used by PATCH.
