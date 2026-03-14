// ─────────────────────────────────────────────
//  STRENGTH DOMAIN — Fatigue & Growth Index
// ─────────────────────────────────────────────
import type { HistoryEntry } from '../../../core/types';
import { getMuscleProfile } from './calcStrength';

export interface FatigueResult {
  muscle: Record<string, number>;  // effective sets per muscle
  systemic: number;                // 0–100
}

/** Exponential decay fatigue model (14-day window) */
export function computeFatigue(history: HistoryEntry[]): FatigueResult {
  const muscle: Record<string, number> = {};
  let systemic = 0;
  const now = Date.now();

  history.forEach(h => {
    const ageDays = (now - new Date(h.date).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > 14) return;

    const decay = Math.exp(-ageDays * 0.18);
    const mp = getMuscleProfile(h.exercise);
    systemic += (h.sets || 1) * 0.5 * decay;

    if (mp) {
      for (const m in mp) {
        muscle[m] = (muscle[m] || 0) + (h.sets || 1) * mp[m] * decay;
      }
    }
  });

  return {
    muscle,
    systemic: Math.min(100, systemic),
  };
}

/** Growth Index per muscle: higher = more capacity to grow */
export function calcGrowthIndex(
  fatigue: Record<string, number>
): Record<string, number> {
  const gi: Record<string, number> = {};
  for (const m in fatigue) {
    gi[m] = Math.max(0, Math.min(1, 1 / ((fatigue[m] || 1) + 1)));
  }
  return gi;
}
