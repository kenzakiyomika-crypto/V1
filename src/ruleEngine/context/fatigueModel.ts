// ═══════════════════════════════════════════════
//  RULE ENGINE — Fatigue Model
//  Exponential decay model (14-day window)
//  Builds on existing calcFatigue from strength domain
//  but adds ruleEngine-specific outputs
// ═══════════════════════════════════════════════
import type { HistoryEntry } from '../../core/types';
import { getMuscleProfile }  from '../../domains/strength/domain/calcStrength';
import { calcStrengthEntryLoad } from '../core/stressCalculator';

// ─────────────────────────────────────────────
//  Fatigue per muscle (effective sets × decay)
//  decay = e^(-age_days × 0.18)
//  Half-life ≈ 3.85 days — matches literature
// ─────────────────────────────────────────────
export interface FatigueSnapshot {
  muscle:   Record<string, number>;  // muscle → fatigue units (decayed)
  systemic: number;                  // 0–100 global fatigue index
  peakMuscle: string | null;         // most fatigued muscle right now
  readyMuscles: string[];            // muscles below fatigue threshold (ready to train)
}

const FATIGUE_DECAY_RATE  = 0.18;   // per day
const FATIGUE_WINDOW_DAYS = 14;
const SYSTEMIC_SCALE      = 5;      // divisor to normalise systemic to 0–100

// Muscle fatigue threshold → "ready to train again"
const FATIGUE_READY_THRESHOLD = 2.0;

export function buildFatigueSnapshot(history: HistoryEntry[]): FatigueSnapshot {
  const muscle:   Record<string, number> = {};
  let   systemic = 0;
  const now      = Date.now();

  history.forEach(h => {
    const ageDays = (now - new Date(h.date).getTime()) / 86_400_000;
    if (ageDays > FATIGUE_WINDOW_DAYS) return;

    const decay      = Math.exp(-ageDays * FATIGUE_DECAY_RATE);
    const loadScore  = calcStrengthEntryLoad(h);
    systemic        += loadScore * decay;

    const mp = getMuscleProfile(h.exercise);
    if (mp) {
      for (const [m, involvement] of Object.entries(mp)) {
        muscle[m] = (muscle[m] ?? 0) + (h.sets || 1) * involvement * decay;
      }
    }
  });

  // Normalise systemic to 0–100
  const systemicNorm = Math.min(100, Math.round(systemic / SYSTEMIC_SCALE));

  // Find peak fatigue muscle
  const peakMuscle = Object.keys(muscle).length
    ? Object.entries(muscle).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Ready muscles = those with fatigue < threshold (or not yet trained)
  const ALL_MUSCLES = [
    'chest','back','shoulders','triceps','biceps',
    'quads','hamstrings','glutes','calves','traps','abs',
  ];
  const readyMuscles = ALL_MUSCLES.filter(
    m => (muscle[m] ?? 0) < FATIGUE_READY_THRESHOLD
  );

  return {
    muscle:       Object.fromEntries(
      Object.entries(muscle).map(([m, v]) => [m, Math.round(v * 100) / 100])
    ),
    systemic:     systemicNorm,
    peakMuscle,
    readyMuscles,
  };
}

// ─────────────────────────────────────────────
//  Growth Index per muscle
//  GI = 1 / (fatigue + 1)  →  higher = more capacity
// ─────────────────────────────────────────────
export function calcGrowthIndex(
  fatigue: Record<string, number>
): Record<string, number> {
  const gi: Record<string, number> = {};
  for (const [m, f] of Object.entries(fatigue)) {
    gi[m] = Math.round((1 / (f + 1)) * 100) / 100;
  }
  return gi;
}
