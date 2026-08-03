# Spec audit and gap fixes (2026-08-03)

**Prompt:**
> Please re-read the `Full-Stack-Developer-Test.pdf` brief and perform a rigorous audit of the
> current repository: (1) Spec & Feature Check — cross-reference every requirement in §3 against our
> implementation; (2) Security & Data Isolation — verify the privacy invariant is strictly enforced;
> (3) Missing Deliverables Check — confirm everything required in §5 is accounted for; (4) Output: a
> concise summary checklist of what matches, what needs cleanup, and whether we're ready to ship.

Asked Claude to re-read the take-home brief and audit the whole repo against it — every endpoint,
the privacy rules, and all the required deliverable files.

It found the security logic was solid (every query properly scoped to `ownerId`), but a handful of
real gaps:

- No `PUT` endpoint anywhere, only `PATCH` — the brief asks for both.
- No `/me` endpoint.
- `GET /collections/:id/bookmarks` didn't really exist — the frontend was faking it by fetching
  everything and filtering in the browser.
- No server-side filtering on `/bookmarks` at all.
- `API_DESIGN.md` and `/transcripts/` were both missing entirely, despite being required.
- `DECISIONS.md` never addressed the optional "sharing" requirement from the brief.
- The `autho.com` typo in `CLAUDE.md` (see the integration transcript) was still there.

Asked Claude to fix all of it. It also caught its own mistake along the way — the `notes` field from
the spec had quietly been dropped from the Bookmark model back when it was first scaffolded, so it
added that too.
**Prompt:** "Fix that for me."

Claude fixed all of it. It also caught its own mistake along the way — the `notes` field from the
spec had quietly been dropped from the Bookmark model back when it was first scaffolded, so it added
that too.

Result: PUT/`/me`/nested-bookmarks/filtering all added, `API_DESIGN.md` written, `DECISIONS.md`
extended (sharing explicitly deferred with reasoning, not silently skipped), the typo fixed, and 8
new tests added — 20/20 passing.

One extra thing that came up: the test runner was silently failing to find any tests at all in this
environment. Turned out to be pre-existing (checked by stashing all changes and confirming it broke
the same way on the untouched repo) — not something the fixes caused. Swapped the Jest config format
and it started working.
