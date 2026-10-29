# Discord sign-in

The website reuses the Discord provider already enabled on the RATS Draft Lab Supabase project. Existing linked users retain the same Supabase user ID. Admin privileges continue to come exclusively from `soloq_admins`, checked server-side and enforced by the database. User profile metadata is used only for display names.

Add these exact URLs to Supabase Authentication > URL Configuration > Redirect URLs. Preserve the draft site's existing Site URL and redirects:

- https://rats-esports-website.vercel.app/auth/callback
- https://ratsesports.se/auth/callback

For local development only, add http://localhost:3000/auth/callback. No new Discord client secret or bot token is needed in this repository.

`/auth/discord` starts a PKCE S256 flow. The verifier is random per login and held in a ten-minute HttpOnly cookie. `/auth/callback` exchanges the code on the server and removes the transient cookie on success or failure. Only explicitly allowed local return destinations are accepted. Callback responses use no-store and no-referrer headers. Access and refresh tokens are stored in host-only HttpOnly cookies, Secure in production, SameSite=Lax. Provider tokens are never stored or returned to the browser.

Sessions refresh through server route handlers when necessary. Logout clears current and legacy cookies and requests local-session revocation. Existing password login remains available for admins whose accounts support it.

`/login` displays the Discord sign-in button or the current account; authorized admins see a link to manage the leaderboard. Normal Discord sign-in does not grant admin privileges or restrict the existing public website to Discord members.

Validation: auth flow unit tests, production build, guest session checks, callback rejection without a matching verifier, and unauthorized/cross-origin admin mutation checks. Completing Discord's consent flow must be done by the user; a 302 to Discord alone does not prove successful end-to-end sign-in.
