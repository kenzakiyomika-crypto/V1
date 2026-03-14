// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

export const APP_VERSION = 7;

export const STORAGE_KEYS = {
  ROOT: 'wk_v7_root',
} as const;

export const TABS = [
  'workout', 'preset', 'import', 'history', 'dashboard',
  'profile', 'aiplanner', 'military', 'countdown',
  'runtrack', 'swimtrack', 'readiness', 'export',
] as const;

export type TabId = typeof TABS[number];

export const RUN_TYPE_LABELS: Record<string, string> = {
  easy: 'Easy',
  tempo: 'Tempo',
  interval: 'Interval',
  long: 'Long Run',
  race: 'ทดสอบ',
};

export const RUN_TYPE_COLORS: Record<string, string> = {
  easy: '#3d8eff',
  tempo: '#ff9500',
  interval: '#ff4444',
  long: '#a855f7',
  race: '#b5ff2d',
};

export const STROKE_TH: Record<string, string> = {
  freestyle: 'ฟรีสไตล์',
  backstroke: 'กรรเชียง',
  breaststroke: 'กบ',
  butterfly: 'ผีเสื้อ',
  mixed: 'ผสม',
};

export const MUSCLE_COLORS: Record<string, string> = {
  chest: '#3d8eff',
  back: '#a855f7',
  shoulders: '#ff9500',
  triceps: '#ff3d3d',
  biceps: '#00d4aa',
  quads: '#b5ff2d',
  hamstrings: '#ffcc00',
  glutes: '#ff4d9e',
  calves: '#888',
  traps: '#ff8c00',
  abs: '#00ccff',
  forearms: '#ff6688',
  hip_flexors: '#88aaff',
};
