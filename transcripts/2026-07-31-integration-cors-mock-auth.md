# Wiring frontend to backend, and the mock-auth fallback (2026-07-31)

**Prompt:**
> Connect the React frontend to the NestJS backend API: configure CORS with credentials, verify the
> OIDC login flow, test end-to-end CRUD from the UI for `/collections` and `/bookmarks`, and verify
> unauthorized/cross-tenant attempts fail cleanly in the UI.

Asked Claude to connect the frontend to the backend, set up CORS properly, and verify login +
cross-tenant behavior end to end.

Found a real bug along the way: the Auth0 domain in `CLAUDE.md` and both `.env` files was
`dev-yg.us.autho.com` — missing the "0". It didn't resolve. Fixed to `auth0.com` and confirmed the
discovery endpoint returned a real response. (The typo in `CLAUDE.md` itself survived this fix and
wasn't caught until an audit a few days later — see the 2026-08-03 transcripts.)

Then hit a real wall: no test-user credentials and no way to drive an actual browser login in this
session. Rather than fake it, Claude asked how to proceed.

**My reply:** asked for a mock-auth fallback instead of handing over credentials, since a headless
session can't click through Auth0's login screen anyway.

It built one that's opt-in only (`AUTH_MOCK_ENABLED=true`), logs a warning when active, and leaves
every other request going through real token verification.

Verified with curl against the mock endpoint: User A could CRUD their own stuff, User B got 404s
trying to touch User A's data, and no-token requests got 401. Real browser login and the PKCE flow
itself were still unverified at this point — noted honestly rather than assumed.
