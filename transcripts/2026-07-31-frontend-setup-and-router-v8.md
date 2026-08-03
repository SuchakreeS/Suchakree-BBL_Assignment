# Frontend scaffold + the React Router v8 mix-up (2026-07-31)

**Prompt:**
> Initialize a React application with Vite, TypeScript, React Router (v8), and MUI (v9) in the
> `/frontend` directory. Configure an OIDC/Auth client to handle user logins using the provided
> credentials, store JWT tokens, and set up an API client layer that automatically attaches the
> Bearer token to all requests. Build the core pages: `/collections` (list, view one, create,
> delete) and `/bookmarks` (list, view details, create, delete, filter by collection). Output code
> immediately.

Asked Claude to scaffold the React/Vite frontend with React Router v8 and MUI v9, wire up Auth0
login, and build the `/collections` and `/bookmarks` pages.

It installed React Router v7 and MUI v6 instead — quietly, without saying so — because as far as its
training data was concerned, v8 and v9 didn't exist yet. That's a real gap worth watching for: it
substituted versions without flagging the substitution.

**Follow-up:** "React Router v8 has actually shipped, check again."

Claude checked the changelog, found that v8 dropped `react-router-dom` as a separate package
entirely (routing now lives in `react-router` directly), and migrated all the import sites.

Left unverified at the time: an actual browser test and a real Auth0 login. Both flagged openly
rather than assumed to work.
