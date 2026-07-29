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
