// ─────────────────────────────────────────────
//  INFRASTRUCTURE — Data Migrations
// ─────────────────────────────────────────────
import { APP_VERSION } from '../core/constants';
import type { AppState } from '../core/types';

type Migration = (state: Partial<AppState>) => Partial<AppState>;

const migrations: Record<number, Migration> = {
  // v1→v2: (legacy) first structural version
  2: (s) => s,

  // v2→v3: merged history entries, added IDs
  3: (s: any) => {
    if (s.strength?.history) {
      s.strength.history = s.strength.history.map((h: any) => ({
        ...h,
        id: h.id ?? crypto.randomUUID(),
      }));
    }
    return s;
  },

  // v3→v4: endurance refactor — runs/swims got secPer100 field
  4: (s: any) => {
    if (s.endurance?.swims) {
      s.endurance.swims = s.endurance.swims.map((sw: any) => ({
        ...sw,
        secPer100: sw.secPer100 ?? (sw.time * 60 / sw.dist * 100),
      }));
    }
    return s;
  },

  // v4→v5: profile goals array replaces single goal string
  5: (s: any) => {
    if (s.profile && !Array.isArray(s.profile.goals)) {
      s.profile.goals = s.profile.goal ? [s.profile.goal] : [];
    }
    return s;
  },

  // v5→v6: planning domain extracted from military/strength
  6: (s: any) => {
    if (!s.planning) s.planning = { exams: [], savedPlans: [] };
    if (!s.recovery) s.recovery = { readinessHistory: [] };
    return s;
  },

  // v6→v7: current version — added UUIDs to all entries
  7: (s: any) => {
    const ensureIds = (arr: any[]) =>
      arr?.map((item: any) => ({ ...item, id: item.id ?? crypto.randomUUID() })) ?? [];

    if (s.strength) {
      s.strength.exercises = ensureIds(s.strength.exercises);
      s.strength.history   = ensureIds(s.strength.history);
    }
    if (s.endurance) {
      s.endurance.runs  = ensureIds(s.endurance.runs);
      s.endurance.swims = ensureIds(s.endurance.swims);
    }
    if (s.military) {
      s.military.fitTestHistory = ensureIds(s.military.fitTestHistory);
    }
    if (s.planning) {
      s.planning.exams      = ensureIds(s.planning.exams);
      s.planning.savedPlans = ensureIds(s.planning.savedPlans);
    }
    if (s.recovery) {
      s.recovery.readinessHistory = ensureIds(s.recovery.readinessHistory);
    }
    return s;
  },
};

/**
 * Runs all pending migrations from `fromVersion` up to APP_VERSION.
 */
export function runMigrations(state: Partial<AppState>, fromVersion: number): AppState {
  let current: any = { ...state };

  for (let v = fromVersion + 1; v <= APP_VERSION; v++) {
    const migrate = migrations[v];
    if (migrate) {
      console.info(`[migration] running v${v - 1}→v${v}`);
      current = migrate(current);
    }
  }

  current.version = APP_VERSION;
  return current as AppState;
}
