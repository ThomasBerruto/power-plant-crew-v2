/** Add a station here, in the SpacetimeDB CONSOLES array, and in the map.
 * Each task is rendered by MiniGameModal and its completion is saved by finishTask.
 */
export const MINIGAMES = {
  reactor: { room: 'Nuclear Room', name: 'Stabilize Reactor', instructions: 'Adjust the simulated control rod setting to the indicated safe operating band.' },
  control: { room: 'Control Room', name: 'Restore Monitoring', instructions: 'Reboot the monitoring panels in the displayed order.' },
  cooling: { room: 'Cooling Towers', name: 'Balance Coolant', instructions: 'Open the inlet and outlet valves; close the bypass.' },
  grid: { room: 'Electrical Grid', name: 'Reset Breakers', instructions: 'Restore breakers in the displayed sequence.' },
  turbine: { room: 'Turbine / Generator', name: 'Sync Generator', instructions: 'Set the simulated output frequency to 60.0 Hz.' },
} as const;
export type MiniGameId = keyof typeof MINIGAMES;
export const TASK_COUNT = Object.keys(MINIGAMES).length;
