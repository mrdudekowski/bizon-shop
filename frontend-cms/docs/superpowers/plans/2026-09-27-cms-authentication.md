# CMS Authentication Implementation Plan

**Goal:** Require a real login before using the BIZON CMS and enforce account roles on the backend.

**Architecture:** The backend bootstraps the configured admin and editor accounts once, stores scrypt password hashes in a dedicated table, and issues opaque HttpOnly cookie sessions. The CMS calls explicit login/logout/session methods; the API validates the cookie for each administrative request and reads the current account role from persistent user data.

**Tech Stack:** Existing Next.js/React CMS, Node.js HTTP backend, PostgreSQL, Node `crypto` scrypt.

## Global Constraints

- Preserve the current `frontend-cms` and `local-sync-wave-1` branch states and all existing uncommitted changes.
- Do not read, print, copy, or commit bootstrap secret values.
- Do not store plaintext passwords in browser storage or database.
- Never reset a password from environment variables after the account has been created.
- Keep public catalog, cart, request, and health routes outside the CMS-session gate.
- Do not commit or push.

### Task 1: Backend credential bootstrap and session service

- Add an auth service in `Bizon-main-app/backend-app/src/admin/server/` for schema initialization, scrypt hashing and verification, one-time bootstrap, opaque session tokens, expiry, cookie parsing/formatting, and account lookup.
- Bootstrap using `CMS_BOOTSTRAP_ADMIN_LOGIN/PASSWORD` and `CMS_BOOTSTRAP_EDITOR_LOGIN/PASSWORD`; insert only missing accounts and hashes.
- Return generic login errors; never expose hashes or log submitted credentials.

### Task 2: Protect the admin API

- Replace the process-global fake admin session with request-scoped authenticated identity.
- Keep login, logout, and session lookup available without an existing session; reject every other `/v1/admin` method without a valid session.
- Use HttpOnly, SameSite=Lax cookies; set `Secure` when the request is HTTPS. Enable credentialed CORS for the configured CMS origin.
- Require the admin role for user listing, creation, disabling, and role changes; use the current database role for each request.

### Task 3: CMS login and role-aware shell

- Extend `AdminClient` with login/logout and remove client-side role switching.
- Add a Russian login form using the current CMS tokens and form controls.
- Keep protected page content hidden until a session exists; show the login form otherwise.
- Show the authenticated login and role in the sidebar with a logout action.
- Send cookies on all admin requests and surface invalid-session and invalid-credential messages in Russian.

### Task 4: User creation and access lifecycle

- Save a password hash when an administrator creates an account; never send the password back in API results.
- Ensure disabled accounts cannot start new sessions and role changes take effect on subsequent requests.
- Preserve the last-admin and cannot-disable-self protections.

### Task 5: Review and verification

- Inspect diffs in both repositories to confirm unrelated dirty files remain untouched.
- Run CMS lint and typecheck plus the backend type/build-equivalent checks available in its package.
- Report any runtime/database proof that remains unavailable; do not claim production login is verified from static checks alone.
