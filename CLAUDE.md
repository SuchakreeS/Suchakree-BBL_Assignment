# Bangkok Bank (BBL) Full-Stack Developer Exam System Prompt & Rules

## Project Stack & Structure
- **Monorepo Layout**: `/backend` (NestJS, Prisma ORM, PostgreSQL/SQLite) and `/frontend` (React, Vite, React Router v8, MUI v9).
- **Core Intent**: A completely secure, tenant-isolated personal bookmark manager.

## 🔴 CRITICAL INVARIANT: ABSOLUTE PRIVACY GUARDRAILS
- **Security Baseline**: Everything in this application is strictly private to its creator. There is no public or shared feed. 
- **The Failure State**: If User A can see, edit, delete, or learn of the existence of User B's data, the application is broken.
- **Prisma Enforcement Rule**: You are forbidden from querying data using target record `id` values alone. Every single query targeting `/collections` or `/bookmarks` must explicitly bind to the authenticated `ownerId` (e.g., `where: { id, ownerId: user.sub }`).
- **Input Validation**: Enforce strict class-validator DTO scopes on all payloads. Fail fast.

## 🔑 AUTH0 OIDC CONFIGURATION
- **Mandatory Flow**: Authorization Code Flow with PKCE (S256). Implicit flows are banned.
- **Tenant Values**:
  - Audience: `https://bbl-candidate-test-api`
  - Discovery: `https://dev-yg.us.autho.com/.well-known/openid-configuration`[cite: 1]
  - Client ID: `H9F6QG5SzTKMv0tbmgxLj9LjG1EKVllA`[cite: 1]
- **Verification Rule**: Guard every controller path via explicit Passport/JWT strategies. Extract `ownerId` dynamically from verified Bearer sub properties.

## 🛠️ VISUAL TEST VERIFICATION REQUIREMENTS
- Every single code change or claim regarding data privacy must be backed by a runnable automated test. 
- **Required Automated Test Scenarios**:
  1. Happy Path: Authenticated User A can successfully CRUD their own data.
  2. Cross-Tenant Attack (Adversarial): Authenticated User A tries to read/write User B's resource IDs. The API must return a secure 404 or 403.
  3. Unauthenticated Path: Missing or malformed Bearer tokens must return a 401.

## 🤖 COGNITIVE TUNING & TOKEN ECONOMY RULES
- **Response Style**: Be exceptionally terse. No pleasantries, no chatty preambles, and no long explanations. Output code patches immediately.
- **Command Control**: Always prefer running tightly targeted test suite flags over global scripts. Never dump multi-page terminal logs into context.
- **Error Remediation**: If a test compilation or database build fails, isolate the stack trace line, declare the root cause in exactly one sentence, and output the correct code replacement instantly.

## 📋 WORKFLOW & PROMPT LOGGING
- **Keep a Running Log**: As we build major features (Backend scaffolding, Auth/OIDC, Prisma queries, Frontend UI, Test harness), keep a mental or textual note of key prompts that worked well and any AI hallucinations/failures we encounter.
- **Transcript Hygiene**: When asked, format our session logs or prompt highlights so they can be easily pasted into `/transcripts/` and `AI_WORKFLOW.md`.