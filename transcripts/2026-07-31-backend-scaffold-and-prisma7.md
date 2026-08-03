# Backend scaffold + Prisma 7 upgrade (2026-07-31)

**Prompt:**
> Initialize NestJS in `/backend`, configure Prisma, create `schema.prisma` (`Collection` &
> `Bookmark` with required fields and `ownerId` multi-tenancy), and write a seed script for two
> distinct users. Output code immediately.

Asked Claude to scaffold NestJS + Prisma: `Collection`/`Bookmark` models with `ownerId`, plus a seed
script for two users. It came together fine, but the schema used syntax Prisma later flagged as
outdated.

**Prompt:**
> The url in `schema.prisma` is used for an old version of prisma, please read the documents for
> latest version of prisma and fix that.

Turned out Prisma had a new major version out, so I asked Claude to upgrade to it. That was more
involved than a version bump: the config format changed (new `prisma.config.ts` file), the generated
client's import path changed, and — the part that would've bitten us — where the SQLite file lives
relative to changed too. If we hadn't run `prisma migrate status` right after, we'd have hit a
confusing "database does not exist" error on the next run instead of catching it immediately.

Checked: migrations clean, seed reran, app booted and connected to the DB.
