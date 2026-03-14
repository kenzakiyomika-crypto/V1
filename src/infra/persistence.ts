// ─────────────────────────────────────────────
//  INFRASTRUCTURE — Persistence
//  Handles serialisation / deserialisation of
//  the full AppState tree with migration support
// ─────────────────────────────────────────────
import { storage } from './storage';
import { runMigrations } from './migrations';
import { APP_VERSION, STORAGE_KEYS } from '../core/constants';
import type { AppState } from '../core/types';

export const DEFAULT_STATE: AppState = {
  version: APP_VERSION,
  profile: null,
  strength: {
    exercises: [],
    history: [],
  },
  endurance: {
    runs: [],
    swims: [],
  },
  military: {
    fitTestHistory: [],
  },
  planning: {
    exams: [],
    savedPlans: [],
  },
  recovery: {
    readinessHistory: [],
  },
};

/**
 * Load state from storage, running migrations if needed.
 */
export function loadState(): AppState {
  try {
    const raw = storage.get(STORAGE_KEYS.ROOT);
    if (!raw) return { ...DEFAULT_STATE };

    const parsed = JSON.parse(raw);
    const fromVersion: number = parsed.version ?? 1;

    if (fromVersion < APP_VERSION) {
      return runMigrations(parsed, fromVersion);
    }

    return parsed as AppState;
  } catch (err) {
    console.error('[persistence] load failed', err);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save full AppState to storage.
 */
export function saveState(state: AppState): void {
  try {
    storage.set(STORAGE_KEYS.ROOT, JSON.stringify(state));
  } catch (err) {
    console.error('[persistence] save failed', err);
  }
}

/**
 * Wipe all persisted data.
 */
export function clearState(): void {
  storage.remove(STORAGE_KEYS.ROOT);
}

/**
 * Export state as JSON string (for backup).
 */
export function exportStateJSON(state: AppState): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Import state from JSON backup string.
 */
export function importStateJSON(json: string): AppState {
  const parsed = JSON.parse(json);
  const fromVersion: number = parsed.version ?? 1;
  return fromVersion < APP_VERSION
    ? runMigrations(parsed, fromVersion)
    : (parsed as AppState);
}

/**
 * Legacy key importer — reads from old per-key localStorage schema
 * and merges into the new root structure.
 */
export function importLegacyData(): Partial<AppState> | null {
  const LEGACY_KEYS = {
    exercises:         'wk_ex',
    history:           'wk_hist',
    profile:           'wk_profile',
    plans:             'wk_plans',
    fitTest:           'wk_fitTest',
    exams:             'wk6_exams',
    runs:              'wk6_runs',
    swims:             'wk6_swims',
    readiness:         'wk6_ready',
  };

  const safeGet = (key: string) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  };

  const exercises     = safeGet(LEGACY_KEYS.exercises)  ?? [];
  const history       = safeGet(LEGACY_KEYS.history)    ?? [];
  const profile       = safeGet(LEGACY_KEYS.profile);
  const savedPlans    = safeGet(LEGACY_KEYS.plans)       ?? [];
  const fitTestHist   = safeGet(LEGACY_KEYS.fitTest)    ?? [];
  const exams         = safeGet(LEGACY_KEYS.exams)       ?? [];
  const runs          = safeGet(LEGACY_KEYS.runs)        ?? [];
  const swims         = safeGet(LEGACY_KEYS.swims)       ?? [];
  const readiness     = safeGet(LEGACY_KEYS.readiness)  ?? [];

  const hasData =
    exercises.length || history.length || profile ||
    runs.length || swims.length || readiness.length;

  if (!hasData) return null;

  return {
    profile,
    strength:   { exercises, history },
    endurance:  { runs, swims },
    military:   { fitTestHistory: fitTestHist },
    planning:   { exams, savedPlans },
    recovery:   { readinessHistory: readiness },
  };
}
