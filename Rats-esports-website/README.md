# RATS Esports website

The first website for RATS Esports, a Swedish grassroots esports association.
It is a responsive one-page site with sections for the organisation, teams,
community, and contact details.

## What is included

- Responsive navigation and hero section
- About section
- Team cards for RATS Esports, RATS Pungh, RATS Iron, and RATS MCD
- Join/community call-to-action
- Contact section and footer
- Mobile-friendly styling

## Run it locally

You need [Node.js](https://nodejs.org/) version 22 or newer.

1. Download or clone this repository.
2. Open the project folder in a terminal.
3. Install the project:

   ```bash
   npm install
   ```

4. Start the local website:

   ```bash
   npm run dev
   ```

5. Open the local address shown in the terminal (normally
   `http://localhost:3000`).

Stop the local website with `Ctrl+C`.

## Make simple changes

Most website text is in `app/page.tsx`. The colors and layout are in
`app/globals.css`.

The Discord and social links are placeholders. Before publishing, replace the
`href="#"` values in `app/page.tsx` with the real RATS links, and replace the
placeholder email address if needed.

## Check a production build

```bash
npm run build
```

## Deploy with Vercel

1. Create a free account at [Vercel](https://vercel.com/).
2. Choose **Add New → Project**.
3. Import this GitHub repository.
4. Keep the suggested settings and choose **Deploy**.

Vercel will create a public website address. Future changes pushed to the main
branch will be deployed automatically.

## Technology

- Next.js
- React
- TypeScript
- CSS

## SoloQ tracker

- `/soloq`: public EUW Ranked Solo/Duo leaderboard, search, team/role filters and OP.GG links.
- `/soloq/admin`: password login using an existing Supabase Auth account. Admins can add and remove players. Membership persists in Supabase; browser storage is not used.
- Required server environment variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.
- Set `RIOT_API_KEY` as an encrypted server environment variable in Vercel to enable ranked statistics, then redeploy. Never use a `NEXT_PUBLIC_` key. The UI clearly labels missing statistics; no mock ranks are displayed.
- Rank data is cached for 15 minutes and refreshed on page load, manual refresh, and every 15 minutes while open. Account lookups are cached for one day. This version does not store LP history or match-by-match results. Rate limits or unavailable Riot accounts are shown as missing data rather than as unranked accounts.
- `db/soloq.sql` records the initial database migration (already applied to the connected project). The database exposes public read access for the roster and permits inserts/deletes only for users explicitly listed in `soloq_admins`. Admin membership is managed outside the public application.
- To authorize an existing account, a database owner inserts its `auth.users.id` into `soloq_admins`. No admin role is derived from editable user metadata. The application never uses a service-role key.
- Login sessions use an HttpOnly, Secure (production), SameSite=Strict cookie and expire within an hour. Sign in again when prompted. Mutations validate the request origin as well as the user's current admin membership.
- Register the public tracker with Riot and use a suitable production key under Riot's developer policies: https://developer.riotgames.com/docs/lol
- Tests: `node --test tests/soloq.test.mjs` (Node 24), `pnpm exec tsc --noEmit`, `pnpm build`.
