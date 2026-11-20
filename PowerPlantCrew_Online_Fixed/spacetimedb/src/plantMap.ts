/** Power Plant Crew shared world geometry (keep in sync with src/plantMap.ts).
 * Dimensions match the original cartoon map image (1536 x 1024).
 * Walk zones are intentionally generous to allow for painted perspective walls.
 */
export const MAP_WIDTH = 1536;
export const MAP_HEIGHT = 1024;
export const SPAWN = { x: 765, y: 531 };
export const PLAYER_RADIUS = 15;

export const WALK_ZONES = [
  [65, 454, 1470, 622],           // main corridor
  [696, 590, 840, 949],           // central passage
  [45, 56, 493, 400],             // nuclear room
  [546, 99, 983, 400],            // control room
  [1030, 38, 1490, 400],          // cooling towers
  [70, 661, 688, 977],            // electrical grid
  [839, 660, 1480, 976],          // turbine room
  [212, 391, 343, 465],           // reactor door
  [701, 391, 837, 465],           // control door
  [1208, 391, 1303, 466],         // cooling door
  [266, 608, 427, 675],          // grid door
  [1097, 608, 1238, 675],        // turbine door
] as const;

// Decorative equipment which players cannot walk through.
export const OBSTACLES = [
  [135, 86, 395, 324],           // core
  [618, 110, 909, 238],          // control desks
  [1100, 65, 1420, 280],         // cooling towers
  [180, 738, 559, 892],          // transformer banks
  [947, 719, 1404, 903],         // main turbine
] as const;

export const CONSOLES = [
  { id: 'reactor', title: 'Stabilize Reactor', room: 'Nuclear Room', x: 453, y: 327 },
  { id: 'control', title: 'Restore Monitoring', room: 'Control Room', x: 930, y: 320 },
  { id: 'cooling', title: 'Balance Coolant', room: 'Cooling Towers', x: 1434, y: 324 },
  { id: 'grid', title: 'Reset Breakers', room: 'Electrical Grid', x: 606, y: 919 },
  { id: 'turbine', title: 'Sync Generator', room: 'Turbine / Generator', x: 1435, y: 928 },
] as const;

export type ConsoleId = typeof CONSOLES[number]['id'];
export const USE_RADIUS = 86;

// Coordinates are feet in map space, not a pixel-perfect mask.
export function canStand(x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const r = PLAYER_RADIUS;
  // Test a small footprint in the UNION of zones rather than shrinking each
  // room independently (which would make door/corridor overlaps impassable).
  const samples = [[0,0], [r,0], [-r,0], [0,r], [0,-r], [r*.7,r*.7], [r*.7,-r*.7], [-r*.7,r*.7], [-r*.7,-r*.7]];
  const inside = (sx: number, sy: number) => WALK_ZONES.some(([x1,y1,x2,y2]) => sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2);
  if (!samples.every(([dx,dy]) => inside(x+dx, y+dy))) return false;
  return !OBSTACLES.some(([x1, y1, x2, y2]) => x + r > x1 && x - r < x2 && y + r > y1 && y - r < y2);
}
export function canTravel(ax: number, ay: number, bx: number, by: number): boolean {
  const length = Math.hypot(bx - ax, by - ay);
  const n = Math.max(1, Math.ceil(length / 8));
  for (let i = 1; i <= n; i++) {
    const f = i / n;
    if (!canStand(ax + (bx - ax) * f, ay + (by - ay) * f)) return false;
  }
  return true;
}
export function nearestConsole(x: number, y: number) {
  return CONSOLES.find(c => Math.hypot(c.x - x, c.y - y) <= USE_RADIUS);
}
