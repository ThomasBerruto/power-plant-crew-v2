# Power Plant Crew — public HTTPS / SpacetimeDB deployment

This is a **public-site-ready source project**, not a deployed URL. A hosting provider
must assign the unique `https://...` URL using your own hosting account.
You already published the compatible server module as **`powerplantnov`** to
SpacetimeDB Maincloud (per your terminal screenshot). The included `.env.production`
points to it. Your server database and browser website are two distinct deploys.

## Fastest way: Vercel gives you a unique HTTPS URL (Windows)

1. Install **Node.js 22.23.4+** (or a compatible Node 24/26; see package.json).
   Restart the terminal after installing or upgrading.
2. Extract the ZIP and open the **project root** (the folder containing `package.json`).
3. Double-click **`DEPLOY_HTTPS_VERCEL_WINDOWS.cmd`**. This runs:
   - `npm.cmd ci` to install pinned dependencies;
   - `npm.cmd run build:public` to type-check and build the React/Phaser game;
   - `npx.cmd --yes vercel@latest login` for browser authentication;
   - `npx.cmd --yes vercel@latest --prod` to link/create a project and publish it.
4. Follow the Vercel prompts. You can choose an available project name such as
   `power-plant-crew`. Vercel assigns a real HTTPS URL, usually on `vercel.app`.
   **No live URL exists until the deployment command succeeds.**
5. Open the **public HTTPS URL** from a desktop or phone, enter a technician name,
   click **Create New Lobby**, and share the QR code. Other phones join via the
   same HTTPS website. Neither your computer nor `spacetime dev` has to stay on.

**Netlify alternative:** Double-click `BUILD_PUBLIC_WEBSITE_WINDOWS.cmd` to
build `dist/`, then visit https://app.netlify.com/drop and upload only `dist/`.
Or use `DEPLOY_HTTPS_NETLIFY_WINDOWS.cmd` for the interactive Netlify CLI.

> Connecting the Vercel app in ChatGPT is separate from logging into the Vercel
> CLI on your Windows PC. The script opens Vercel's normal authorization flow.

### Important: database must match the deployed module

The frontend in this ZIP uses `VITE_SPACETIMEDB_DB_NAME=powerplantnov` in
`.env.production`. Confirm the correct database is shown in your dashboard:
https://spacetimedb.com/powerplantnov

If your intended database is `powerplantgamenov` instead, change
`.env.production` to that **before building**. It must contain the matching
`gameRoom`, `player`, `plantState`, and `plantTask` tables and reducers.

Vite bakes `VITE_*` values into the built JS. Updating `.env.production` or
`.env.local` **after** you built `dist` will not change an already-published site.
Rebuild and redeploy. Do not put secret tokens into `VITE_` variables.

### QR-code invitation URL

The QR link is generated from the real website origin and includes
`?room=ABC123`. It is shown **only when HTTPS is public**, so a QR code
containing `localhost` cannot accidentally be shared. If developing locally
but wanting to invite to an existing deployed website, set in `.env.local`:

```
VITE_PUBLIC_SITE_URL=https://<your-actual-site>.vercel.app
```

This does not publish the site and does not change where local development runs.

## Local development (not needed for a public site's visitors)

```
npm.cmd ci
npm.cmd run dev
```

This is a **local preview** of the website on http://localhost:5173. It connects
outbound to the remote database. Do not interpret localhost as your multiplayer server.
To rebuild the already published backend (only after changing `spacetimedb/src/*`):

```
spacetime --version
spacetime login
spacetime generate
spacetime publish
```

`spacetime publish` uses `spacetime.json` targeting `powerplantnov`.
This is an intentional **production** update; back up data and check schema changes
before publishing. **Do not use `--delete-data always` unless you want to erase it.**

### If `spacetime dev` stopped being recognized

- Open a **new PowerShell** or CMD window after installing the CLI.
- Run `where.exe spacetime` (CMD/PowerShell) or `Get-Command spacetime` (PowerShell).
- Run `spacetime --version` to distinguish missing executable from a runtime error.
- Check PATH in System Settings if the executable exists but is not found.
- Official Windows installation: `iwr https://windows.spacetimedb.com -useb | iex`.
- Important: you do **NOT** need `spacetime dev` to build or deploy the website.
- Run `CHECK_SETUP_WINDOWS.cmd` for diagnostics; PowerShell may block `npm.ps1`,
  so Windows batch scripts explicitly use `npm.cmd`.

### Safer use of `spacetime dev`

We added `spacetime.dev.json` to target `powerplantnov-dev`, **separate from
production**. SpacetimeDB reads this file automatically when running `spacetime dev`.
It may create another cloud database if that name is available and may rewrite
`.env.local` to point local Vite at the dev database. Do not overwrite your production
`powerplantnov` unintentionally. The `generate` array in `spacetime.json` fixes
"No generate targets in spacetime.json" and puts the correct TypeScript module
bindings in `src/module_bindings`.

## Vercel also supports Git-connected hosting

This ZIP includes `vercel.json` for SPA rewrites and a `dist` output directory.
Import the project from GitHub in Vercel for automatic updates; set Node to a
compatible version and build command `npm run build:public`. The production database
name comes from `.env.production` in the checked-in source. Vercel and Netlify
are alternatives, not two simultaneous requirements.

## Deployment: Git-connected Netlify (for future updates)

For automated updates, connect your GitHub project in Netlify. This ZIP contains
`netlify.toml` with command `npm run build:public`, publish directory `dist`, Node
22.23.4, and an SPA fallback redirect. `.env.production` is committed because it
contains a **public database name, not a secret**. Netlify serves the frontend,
SpacetimeDB Maincloud handles persistent multiplayer state.

## Quick smoke test

1. Desktop browser: open deployed HTTPS URL; connection indicator turns green.
2. Enter host name; Create New Lobby. Note six-character code and HTTPS QR.
3. Phone on mobile data: scan QR, enter different technician name, Join Existing Lobby.
4. On both screens, confirm the same lobby list shows 2 players.
5. Start Shift from desktop host and confirm moving technician is visible on phone.
6. Repair a station and verify the task completion is visible on both screens.

## Remaining limitations

We cannot create the hosting account, grant Netlify permission, or reserve a
unique production URL from this offline build environment. User login is required.
The backend and website source can be validated statically, but live Maincloud and
phone tests require an authenticated browser, compatible CLI, and network access.
This remains a classroom prototype: authenticated room access, malicious clients,
private data, anti-cheat and disconnected player cleanup need hardening before
large-scale public use.

## Authoritative references

- https://spacetimedb.com/docs/cli-reference/spacetime-json/
- https://spacetimedb.com/docs/databases/developing/
- https://spacetimedb.com/docs/troubleshooting/
- https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/
- https://vite.dev/guide/env-and-mode

## Additional validated issues / constraints

- The user's Windows terminal proved `spacetime dev` worked once: it built and
  published `powerplantnov` and started Vite. If a *new terminal* cannot find
  `spacetime`, that is a CLI PATH issue, not the cloud site's runtime.
- Do not confuse `powerplantgamenov` with `powerplantnov`. They are different
  databases. All included production settings target `powerplantnov`.
- The TypeScript client bindings are checked in. Regenerate them with the
  *matching* SpacetimeDB CLI after changing `spacetimedb/src/` and before building.
- A `VITE_*` variable is bundled into browser JavaScript at build time. These
  values are intentionally public and must not include a database owner token.
- Your QR code opens `https://your-domain/?room=ABC123`. It does not grant an
  authenticated user account; each visitor uses a SpacetimeDB client identity.
- Hosting account permissions are required to assign a unique HTTPS URL. This
  source archive does not itself reserve or create a Vercel site.

## Additional sources

- https://vercel.com/docs/cli/deploy
- https://vercel.com/docs/frameworks/frontend/vite
- https://spacetimedb.com/docs/how-to/deploy/maincloud/

### Critical: local .env override during public builds

SpacetimeDB `dev` can rewrite `.env.local` to a development database. The `npm run build:public` command explicitly reads `.env.production` and **overrides local values** during the build; Vercel/Netlify scripts use it so the deployed phone game points at the production database.
