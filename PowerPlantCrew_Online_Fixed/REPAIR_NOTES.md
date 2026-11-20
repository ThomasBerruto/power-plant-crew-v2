# Repair audit — uploaded `power-plant-game-main(1).zip`

## Changes made

1. **Safe production backend** — `spacetime.json` targets `powerplantnov` on Maincloud and now includes client binding codegen. `spacetime.dev.json` targets the separate `powerplantnov-dev` database for `spacetime dev`.
2. **Reproducible HTTPS build** — `.env.production`, `scripts/build-public.mjs`, `vercel.json`, `netlify.toml`, and `public/_redirects` support deploying the React/Phaser website as a public HTTPS SPA. The public builder overrides `.env.local` values, which `spacetime dev` can rewrite.
3. **QR invites** — `src/invite.ts` uses an HTTPS origin, validates the invite's URL, appends the lobby code, and prevents generating misleading localhost/private-network QR invites. A live public address is assigned by Vercel/Netlify when the user authenticates and deploys.
4. **Connection lifecycle** — `src/main.tsx` now shows connection errors in the UI, persists identity tokens when available, and refreshes persistence on automatic reconnect. It keeps the original SpacetimeDB SDK and subscriptions.
5. **App feedback and mobile controls** — `src/App.tsx` shows which database is being reached, and `src/PowerPlantGame.tsx` releases held touch controls on pointer capture loss.
6. **Windows commands** — `CHECK_SETUP_WINDOWS.cmd` diagnoses missing CLI/Node, `DEPLOY_HTTPS_VERCEL_WINDOWS.cmd` logs into hosting and deploys the frontend, with Netlify alternative. No backend CLI is needed to serve already-deployed players.
7. **Clean distribution** — remove Windows-specific `node_modules`, build outputs and user-local `.env.local` from the release archive.

## Findings / causes

- The error `'spacetime' is not recognized` means Windows cannot find the executable (PATH, changed terminal or missing CLI). No TypeScript source edit can install or repair PATH in the user's PC.
- The submitted `package.json` demands Node **22.23.4+, 24.22.1+, or 26.12.1+**. Older Node installations cause unsupported-engine warnings/errors.
- The submitted code uses `spacetimedb` npm 2.14.x while generated binding comments mention CLI 2.15.0. Types compiled successfully here, but CLI/SDK mismatch can still cause protocol issues: align versions and regenerate bindings before publishing a modified module.
- Publicly publishing the SpacetimeDB module does **not** publish the Vite frontend. A real Vercel/Netlify deployment is required to receive an external HTTPS URL.
- The existing tables are public; lobby codes are invite identifiers, not secure authentication. This is a classroom prototype, not a privacy-hardened competitive game.

## Validation (offline)

- 6 geometry, art, reducer and source consistency tests passed.
- 7 hosting/configuration tests passed.
- 6 QR invite unit assertions passed.
- React/Phaser frontend TypeScript and SpacetimeDB server TypeScript both passed `tsc --noEmit` with the supplied dependencies.
- The Vite production bundle could not be executed here because the uploaded Windows `node_modules` does not include native Linux Rollup bindings. The repaired ZIP excludes it and installs native dependencies with `npm ci` on the actual build platform.
- No live Maincloud publish or website deployment has been performed by this repair.
