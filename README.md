# Bangkok Bank (BBL) Full-Stack Exam — Bookmark Manager

Tenant-isolated personal bookmark manager. `/backend` (NestJS + Prisma +
SQLite), `/frontend` (React + Vite + MUI + React Router).

## Running locally

```
cd backend && npm install && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
cd frontend && npm install && npm run dev
```

Backend: http://localhost:3001. Frontend: http://localhost:5173.

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
  (13 tests — unauthenticated, cross-tenant BOLA attempts, happy-path CRUD).
- See [DECISIONS.md](./DECISIONS.md) for the current gap: real browser-driven
  Auth0 login is not covered by automation in this environment and needs a
  manual pass.

## Workflow log

Prompt history and notable AI mistakes/corrections during development are in
[AI_WORKFLOW.md](./AI_WORKFLOW.md).
