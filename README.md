# bountyline-dashboard

The web dashboard for Bountyline: the signed-out landing page, the bounty list (AG Grid), the bounty detail page and the contributor's payout address page. It only talks to the Bountyline API (`apps/api`) and holds no secrets.

Stack: React 19, Vite, TypeScript, AG Grid Community.

## Run it

```sh
bun install
cp .env.example .env     # VITE_API_URL points at the API
bun run dev              # http://localhost:5173
bun test                 # formatting, routing and page render tests
bun run build            # type-checks, then builds to dist/
```

On the API side set `DASHBOARD_URL=http://localhost:5173` (it is used for CORS and for the post-login redirect).

## Screens

- **Landing** (signed out): what Bountyline does and a GitHub sign-in button.
- **Bounties**: four stat cards, status tabs with counts, a search box, the AG Grid table and a bot activity list.
- **Bounty detail**: AI review with the pass mark and per-criterion scores, timeline, payout card with countdown and Approve / Veto, repository settings (read only for now).
- **Payout address**: the contributor saves a PayPal email. Only a masked version is ever shown back.

### AG Grid

`src/grid/` holds the grid:

- `theme.ts`: a `themeQuartz.withParams` theme wired to the CSS tokens in `src/index.css`, so light and dark follow the page.
- `renderers.tsx`: custom cell renderers: two-line issue cell, status pill with a due line, AI score bar with a threshold marker, and Approve / Veto buttons where Veto needs a confirming second click.
- `BountyGrid.tsx`: sorting, an external status filter (the tabs), the quick filter (the search box), and live updates after actions. On phones the actions column stops being pinned and the table scrolls inside its card.

## How sign-in works

"Sign in with GitHub" goes to `API_URL/auth/login?to=dashboard`. After GitHub, the API redirects back to `/#token=...`. The dashboard keeps the token (localStorage, with an in-memory fallback), removes it from the URL, and sends it as a Bearer header. A 401 signs you out.

Links the bot posts, such as `/payout`, are turned into hash routes (`/#/payout`) on load. If you are signed out you are sent to GitHub first and brought back to that page.

## Deploy (Render static site)

- Build command: `bun install && bun run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL` = the public API URL
- Add a rewrite rule `/*` to `/index.html`, so links like `/payout` reach the app.

## Notes

- The list page uses a pass mark of 75 for the score bars. The detail page uses the repository's real setting.
- Repository settings are shown but not editable: the API has no endpoint for that yet.
- AG Grid Community needs no license key. If you use the 45-day Enterprise trial, load the key from an environment variable and never commit it.
- Written without being able to install packages: the page logic and rendering are tested, but the AG Grid parts (theme parameters, renderer props, external filter) have not been run in a browser. Check the grid first when you run it.
