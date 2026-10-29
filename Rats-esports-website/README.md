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

- `/soloq`: EUW Solo/Duo rank, seasonal W/L, recent form, streak, average K/D/A, OP Score and weekly LP change. Player details contain champion text, played roles, matches and rank history. No EUW placement or champion images in the table.
- OP.GG's public profile ai.json supplies at most ten recent games across queues. Only SOLORANKED is accepted; remakes are excluded from averages and awards. Eligibility requires ten completed games; tied winners all receive awards. Awards use the newest twenty saved completed Solo/Duo games, merged across syncs without duplicate IDs. OP.GG may omit matches played between syncs. The table shows five recent form results; expanded details retain the full recent fetch.
- `/soloq/admin`: Discord login and password fallback. Authorized admins can add, edit and remove members. The home page groups the same live roster by team; generic Medlem entries are not teams.
- Required server variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Optional `RIOT_API_KEY` switches rank lookup to Riot; recent match enrichment currently applies to the OP.GG source.
- Rank responses are cached for 15 minutes. Refreshes happen on visits, manual refresh and every 15 minutes while open. No profile refresh request is sent to OP.GG; source timestamps may be older than fetch timestamps. Failed lookups remain unavailable.
- A public snapshot is saved in browser storage and displayed while fetching. It contains no authentication data. Old rank-only snapshots remain compatible.
- `db/soloq-award-matches.sql` records the bounded match-history schema: current account and source are isolated, the narrow server writer saves and prunes to twenty games, and direct client writes are denied.
- `db/soloq-rank-history.sql` records the applied history schema. Public reads and a narrow writer are exposed. Production server secret `SOLOQ_HISTORY_WRITE_KEY` is scoped to this writer; its SHA-256 hash lives in a private table. Never expose it through NEXT_PUBLIC, logs or source. No service-role key is used. Rotate the private hash and production secret together, then redeploy.
- History is collected on sync, at most one latest observation per player/account/source/15-minute bucket. Account and source changes separate histories. First and 7–8-day-old baselines support comparisons; charts show the latest 60 observations. No history is fabricated. LP across divisions is not MMR. Club position is recorded only when the whole roster fetch succeeds.
- Admin rights use `soloq_admins` and auth.uid(), never editable user metadata. Sessions use HttpOnly, Secure production, SameSite=Lax cookies with refresh support; mutations validate Origin.
- Checks: `node --test tests/*.test.mjs` (Node 24), `pnpm exec tsc --noEmit`, `pnpm build`.
