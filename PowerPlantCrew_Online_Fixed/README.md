# Power Plant Crew — Public Multiplayer Edition

**Based on your uploaded React + Phaser + SpacetimeDB ZIP.** The room/task/gameplay
code and cartoon technician art have been retained. This edition fixes publishing
configuration, adds a verified HTTPS invite helper, and provides public deployment
scripts. It does **not** provision a hosting account or create a live URL without
an authenticated hosting deployment.

## Deploy the game so phones can join anywhere

1. Use **Node 22.23.4+ / 24.22.1+ / 26.12.1+** (check `node --version`).
2. Extract this project ZIP and open the folder with `package.json`.
3. Double-click **`DEPLOY_HTTPS_VERCEL_WINDOWS.cmd`** on Windows (logs into Vercel,
   builds, then deploys to a unique HTTPS `.vercel.app` address).
4. Open that URL, enter a technician name, create a lobby, and scan the QR code
   using a phone on another network. The lobby/player/task reducers run remotely
   on **SpacetimeDB Maincloud** database **`powerplantnov`**.

**Players never run `spacetime dev`, `npm run dev`, or a localhost server.**
Only developers run those commands. Your computer may be switched off after the
website and backend are deployed.

For full troubleshooting and alternative hosts see **`PUBLIC_DEPLOY_GUIDE.md`**.

## Developer workflows (Windows PowerShell)

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run dev
```

To modify/publish the server module, verify `spacetime --version`, then run
`spacetime login` and `spacetime publish` in the project directory. For
automatic development publishing use `spacetime dev`; it reads
`spacetime.dev.json`, which points at **`powerplantnov-dev`**, not the live DB.

The root `spacetime.json` intentionally points to the live `powerplantnov`; do
not wipe it or publish schema-breaking changes without review. It also declares
client binding generation in `src/module_bindings/`.

## Original game mechanics and mini-games

The game provides unique technician sprites, five rooms, WASD/touch movement,
QR lobby invitations, up to 12 players per lobby, host-controlled start, and
five sample mini-games with server-shared completion. Current mini-games are
client-validated classroom exercises, **not** authoritative competitive
puzzles. The public tables and unauthenticated game flow are **prototypes**,
not a secure private room service.

## Source files

- `src/App.tsx`: rooms, players, invitation, control panel
- `src/PowerPlantGame.tsx`: Phaser movement and technician sprites
- `src/invite.ts`: HTTPS QR join-link helper
- `src/minigames/`: mini-game examples and extension points
- `spacetimedb/src/index.ts`: server-side multiplayer reducers
- `spacetime.json` / `spacetime.dev.json`: production/development separation
- `.env.production`: public production database connection
- `vercel.json` / `netlify.toml`: static hosting and SPA routing
- `CHECK_SETUP_WINDOWS.cmd`: CLI and Node diagnostics
- `PUBLIC_DEPLOY_GUIDE.md`: complete instructions and limitations

---

## Original source description

See `MIGRATION_NOTES.md` for the original repository changes.

**Deployment guard:** `npm.cmd run build:public` always uses `.env.production`, even if `spacetime dev` previously changed `.env.local`.
