# Original Project / Among Us Clone Adaptation Notes

## Existing `power-plant-game-main.zip` (code preserved or extended)

| File in uploaded project | What changed |
| --- | --- |
| `src/main.tsx` | Same provider and generated bindings; Maincloud default instead of localhost, automatic reconnect |
| `src/App.tsx` | Same React component and existing room/QR reducers; expanded to add host start, real task HUD, mobile invites and progress |
| `src/PowerPlantGame.tsx` | Same Phaser scene wrapper and movement callbacks; replaced placeholder boxes with cartoon map, technicians, navigation, station interactions, mobile controls |
| `spacetimedb/src/index.ts` | Preserved `person`, `gameRoom`, `player` table shapes and existing `createRoom`, `joinRoom`, `movePlayer`, `leaveRoom` reducers; added `plantState`, `plantTask`, `startShift`, `finishTask` |
| `src/module_bindings` | Added matching new table/reducer schemas; **regenerate with CLI before deployment** |
| `package.json` | Dependencies unchanged; corrected publish scripts to use actual `spacetimedb` directory |

## Functionality referenced from uploaded AI0702 Among-Us-clone

| Python/Pygame clone piece | React/Phaser equivalent |
| --- | --- |
| `main.py` | `src/main.tsx` bootstrapping |
| `menu.py` / `board.py` | `src/App.tsx` join and HUD UI |
| `game.py` | `src/PowerPlantGame.tsx` rendering and input |
| `sprites.py` | `public/assets/technicians/` and Phaser player sprites |
| `tilemap.py` | Cartoon map + shared geometry in `src/plantMap.ts` |
| `tasks.py` | `src/minigames/` registry and mini-game UI |
| `server.py` | `spacetimedb/src/index.ts` authoritative reducers |

The Python source is not directly translatable to the existing TypeScript browser project; this is a feature/architecture adaptation that **does not** copy original extracted Among Us assets or networking code.

## Why SpacetimeDB instead of localhost

The original Pygame reference used a TCP LAN server. The uploaded TypeScript game already used SpacetimeDB for lobby/player state but contained only a basic Phaser rectangle map. This version keeps the existing SpacetimeDB model and adds persistent game state and tasks. To remove reliance on your PC for remote joining, deploy the **database on Maincloud** and **the Vite web client on public HTTPS hosting**. QR codes point to the public site's join URL.

## Migration warning

A new `spacetime.json` database placeholder is deliberately used to avoid accidental deployment over the source project's existing database. Create a new unique database for your first test. Never use `--delete-data` against an existing database unless you want to erase its records.

## Deployment status

- Checked: TS/TSX parse, five-room map dimensions, reachability of all 5 consoles, identity of frontend/backend collision rules, sprite file integrity.
- Unchecked in current execution environment: full `npm run build`, SpacetimeDB module compilation, binding regeneration via CLI, cloud publish, cross-device real-time lobby test.
