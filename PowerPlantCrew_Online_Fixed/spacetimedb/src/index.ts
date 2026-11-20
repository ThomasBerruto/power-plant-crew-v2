/** Power Plant Crew SpacetimeDB module; extends the original project's table names.
 * The original gameRoom and player table columns are retained, so the React
 * Phaser front end still follows the user's pre-existing multiplayer design.
 */
import { schema, table, t, SenderError } from 'spacetimedb/server';
import { SPAWN, CONSOLES, canStand, canTravel, USE_RADIUS } from './plantMap';

// Retained for compatibility with the starter database.
const person = table({ public: true }, { name: t.string() });
const gameRoom = table({ public: true }, {
  code: t.string().primaryKey(),
  host: t.identity(),
});
const player = table({ public: true }, {
  identity: t.identity().primaryKey(),
  name: t.string(),
  roomCode: t.string(),
  x: t.f64(),
  y: t.f64(),
});
// New persistent per-lobby state. Do not keep these values in browser memory.
const plantState = table({ public: true }, {
  roomCode: t.string().primaryKey(),
  started: t.bool(),
  completedCount: t.u32(),
});
const plantTask = table({ public: true }, {
  key: t.string().primaryKey(),
  roomCode: t.string(),
  taskId: t.string(),
  title: t.string(),
  completed: t.bool(),
  completedBy: t.string(),
});

const spacetimedb = schema({ person, gameRoom, player, plantState, plantTask });
export default spacetimedb;

function validateName(name: string) {
  const clean = name.trim();
  if (clean.length < 1 || clean.length > 24) throw new SenderError('Technician name must contain 1–24 characters');
  return clean;
}
function validateCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(clean)) throw new SenderError('Room code must be exactly six letters/numbers');
  return clean;
}

export const createRoom = spacetimedb.reducer(
  { code: t.string(), name: t.string() },
  (ctx, { code, name }) => {
    code = validateCode(code);
    name = validateName(name);
    if (ctx.db.gameRoom.code.find(code)) throw new SenderError('Room code already exists');
    const oldPlayer = ctx.db.player.identity.find(ctx.sender);
    if (oldPlayer) throw new SenderError('Leave your current room first');
    ctx.db.gameRoom.insert({ code, host: ctx.sender });
    ctx.db.plantState.insert({ roomCode: code, started: false, completedCount: 0 });
    ctx.db.player.insert({ identity: ctx.sender, name, roomCode: code, ...SPAWN });
  }
);

export const joinRoom = spacetimedb.reducer(
  { code: t.string(), name: t.string() },
  (ctx, { code, name }) => {
    code = validateCode(code);
    name = validateName(name);
    const room = ctx.db.gameRoom.code.find(code);
    if (!room) throw new SenderError('Room not found');
    const state = ctx.db.plantState.roomCode.find(code);
    if (state?.started) throw new SenderError('Shift has started; join another lobby');
    const existing = ctx.db.player.identity.find(ctx.sender);
    if (existing) {
      if (existing.roomCode !== code) throw new SenderError('Leave your current room first');
      ctx.db.player.identity.update({ ...existing, name });
      return;
    }
    if ([...ctx.db.player.iter()].filter(p => p.roomCode === code).length >= 12)
      throw new SenderError('Lobby is full (12 technicians)');
    const index = [...ctx.db.player.iter()].filter(p => p.roomCode === code).length;
    const x = SPAWN.x + (index % 3 - 1) * 38;
    const y = SPAWN.y + Math.floor(index / 3) * 26;
    ctx.db.player.insert({ identity: ctx.sender, name, roomCode: code, x, y });
  }
);

export const movePlayer = spacetimedb.reducer(
  { x: t.f64(), y: t.f64() },
  (ctx, { x, y }) => {
    const current = ctx.db.player.identity.find(ctx.sender);
    if (!current || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const state = ctx.db.plantState.roomCode.find(current.roomCode);
    if (!state?.started) return;
    if (Math.hypot(x - current.x, y - current.y) > 85) return;
    if (!canStand(x, y) || !canTravel(current.x, current.y, x, y)) return;
    ctx.db.player.identity.update({ ...current, x, y });
  }
);

export const startShift = spacetimedb.reducer(
  { code: t.string() },
  (ctx, { code }) => {
    code = validateCode(code);
    const room = ctx.db.gameRoom.code.find(code);
    if (!room || !room.host.equals(ctx.sender)) throw new SenderError('Only the lobby host can start');
    const state = ctx.db.plantState.roomCode.find(code);
    if (!state || state.started) throw new SenderError('Shift has already started');
    ctx.db.plantState.roomCode.update({ ...state, started: true, completedCount: 0 });
    for (const task of CONSOLES) {
      ctx.db.plantTask.insert({
        key: `${code}:${task.id}`, roomCode: code, taskId: task.id,
        title: task.title, completed: false, completedBy: '',
      });
    }
  }
);

export const finishTask = spacetimedb.reducer(
  { taskId: t.string() },
  (ctx, { taskId }) => {
    const current = ctx.db.player.identity.find(ctx.sender);
    if (!current) throw new SenderError('Join a lobby first');
    const state = ctx.db.plantState.roomCode.find(current.roomCode);
    if (!state?.started) throw new SenderError('The shift has not started');
    const consoleAt = CONSOLES.find(c => c.id === taskId);
    if (!consoleAt) throw new SenderError('Unknown station');
    if (Math.hypot(current.x - consoleAt.x, current.y - consoleAt.y) > USE_RADIUS + 15)
      throw new SenderError('Move near the station before completing its task');
    const key = `${current.roomCode}:${taskId}`;
    const task = ctx.db.plantTask.key.find(key);
    if (!task || task.completed) throw new SenderError('This task is already complete');
    ctx.db.plantTask.key.update({ ...task, completed: true, completedBy: current.name });
    ctx.db.plantState.roomCode.update({ ...state, completedCount: state.completedCount + 1 });
    // Mini-game puzzle solutions are client-validated in this teaching prototype.
    // For competitive play, validate puzzle challenge/response in this reducer.
  }
);

export const leaveRoom = spacetimedb.reducer(ctx => {
  const current = ctx.db.player.identity.find(ctx.sender);
  if (!current) return;
  ctx.db.player.identity.delete(ctx.sender);
  const room = ctx.db.gameRoom.code.find(current.roomCode);
  if (!room) return;
  const remaining = [...ctx.db.player.iter()].filter(p => p.roomCode === current.roomCode);
  if (remaining.length && room.host.equals(ctx.sender)) {
    ctx.db.gameRoom.code.update({ ...room, host: remaining[0].identity });
  } else if (!remaining.length) {
    ctx.db.gameRoom.code.delete(current.roomCode);
    ctx.db.plantState.roomCode.delete(current.roomCode);
    const keys = [...ctx.db.plantTask.iter()]
      .filter(task => task.roomCode === current.roomCode)
      .map(task => task.key);
    for (const key of keys) ctx.db.plantTask.key.delete(key);
  }
});

// For demo simplicity, players leave explicitly. This avoids losing a lobby
// during transient mobile disconnects. Stale players should be pruned with
// presence/session metadata if deployed to a long-lived public service.
