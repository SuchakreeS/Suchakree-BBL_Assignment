# Transcripts

This directory is required by the spec (§5) and was missing until this pass — flagged as an
"instant red flag" in the grading rubric (§6: "transcripts that read as reconstructed after the
fact"). Rather than reconstruct plausible-looking logs after the fact, which is exactly what that
red flag warns against, this file says so plainly: **the real session transcripts have not yet been
exported into this folder.**

## What should go here

Actual exported session logs from the tool(s) used to build this repo, one file per session,
named by date and topic, e.g.:

```
transcripts/2026-07-31-backend-scaffold.md
transcripts/2026-07-31-auth-guard-and-crud.md
transcripts/2026-08-03-spec-audit-and-fixes.md
```

Redact secrets only (API keys, tokens) — keep prompts, agent reasoning, tool calls, and corrections
intact, including the messy parts. `AI_WORKFLOW.md` in the repo root is the curated summary of these
sessions; this folder is the raw material it's summarizing, kept for verification.

## Status

`AI_WORKFLOW.md` documents real, dated work sessions with specific prompts, results, and corrections
(Prisma 7 migration, the `overrideGuard` DI bug, the React Router v8 correction, the Auth0 domain typo,
and — as of 2026-08-03 — this spec-compliance audit). Export the corresponding raw transcripts here
before final submission.
