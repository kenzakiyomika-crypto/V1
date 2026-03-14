// ═══════════════════════════════════════════════
//  RULE: Volume Landmarks  (priority 45)
//  MEV/MRV per muscle group (RP Israetel 2019)
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect, MuscleVolumeStatus } from '../../core/types';
import type { HistoryEntry } from '../../../core/types';
import { getMuscleProfile }  from '../../../domains/strength/domain/calcStrength';

// ─────────────────────────────────────────────
//  Per-muscle MEV / MRV / MAV  (effective sets/week)
// ─────────────────────────────────────────────
export interface MuscleLandmark {
  mev: number;
  mrv: number;
  mav: number;
}

export const MUSCLE_LANDMARKS: Record<string, MuscleLandmark> = {
  chest:       { mev: 8,  mrv: 22, mav: 18 },
  back:        { mev: 10, mrv: 25, mav: 20 },
  shoulders:   { mev: 8,  mrv: 26, mav: 20 },
  triceps:     { mev: 6,  mrv: 20, mav: 16 },
  biceps:      { mev: 8,  mrv: 26, mav: 20 },
  quads:       { mev: 8,  mrv: 20, mav: 16 },
  hamstrings:  { mev: 6,  mrv: 20, mav: 16 },
  glutes:      { mev: 6,  mrv: 20, mav: 16 },
  calves:      { mev: 8,  mrv: 16, mav: 14 },
  traps:       { mev: 6,  mrv: 18, mav: 14 },
  abs:         { mev: 6,  mrv: 20, mav: 16 },
  forearms:    { mev: 4,  mrv: 14, mav: 12 },
  hip_flexors: { mev: 4,  mrv: 12, mav: 10 },
};

// ─────────────────────────────────────────────
//  Weekly effective sets per muscle
//  effective = actual sets × involvement fraction
// ─────────────────────────────────────────────
export function calcWeeklyMuscleVolume(
  history: HistoryEntry[]
): Record<string, number> {
  const cutoff = Date.now() - 7 * 86_400_000;
  const weekly = history.filter(h => new Date(h.date).getTime() >= cutoff);
  const volume: Record<string, number> = {};

  for (const entry of weekly) {
    const profile = getMuscleProfile(entry.exercise);
    if (!profile) continue;
    for (const [muscle, involvement] of Object.entries(profile)) {
      volume[muscle] = (volume[muscle] ?? 0) + (entry.sets || 1) * involvement;
    }
  }
  return volume;
}

// ─────────────────────────────────────────────
//  Classify — uses MuscleVolumeStatus from core/types
// ─────────────────────────────────────────────
export function classifyMuscleVolumes(
  weeklyVolume: Record<string, number>,
  config: { volume: { mevMin: number; mrvMax: number; belowMEV: number; aboveMRV: number } }
): MuscleVolumeStatus[] {
  const results: MuscleVolumeStatus[] = [];

  for (const [muscle, landmark] of Object.entries(MUSCLE_LANDMARKS)) {
    const sets = weeklyVolume[muscle] ?? 0;
    const status: MuscleVolumeStatus['status'] =
      sets < landmark.mev  ? 'BELOW_MEV' :
      sets > landmark.mrv  ? 'ABOVE_MRV' : 'OPTIMAL';

    if (sets > 0 || status === 'BELOW_MEV') {
      results.push({ muscle, sets: Math.round(sets * 10) / 10, status, landmark });
    }
  }
  return results;
}

// ═══════════════════════════════════════════════
//  THE RULE
// ═══════════════════════════════════════════════
export const volumeLandmarkRule: Rule = {
  id: 'volume-landmark',
  priority: 45,

  when: (ctx): boolean => ctx.stressZone !== 'RED',

  then: (ctx): RuleEffect[] => {
    const statuses = ctx.muscleVolumeStatuses;
    if (!statuses?.length) return [];

    const effects: RuleEffect[] = [];
    const belowMEV: string[] = [];
    const aboveMRV: string[] = [];

    for (const s of statuses) {
      if (s.status === 'BELOW_MEV' && s.sets > 0) {
        belowMEV.push(`${s.muscle}(${s.sets.toFixed(1)}/${s.landmark.mev})`);
        effects.push({ type: 'ADJUST_VOLUME', deltaPct: 15 });
      }
      if (s.status === 'ABOVE_MRV') {
        aboveMRV.push(`${s.muscle}(${s.sets.toFixed(1)}>${s.landmark.mrv})`);
        effects.push({ type: 'ADJUST_VOLUME', deltaPct: -15 });
      }
    }

    if (belowMEV.length) effects.push({ type: 'ADD_TAG', tag: `📉 Below MEV: ${belowMEV.join(', ')}` });
    if (aboveMRV.length) effects.push({ type: 'ADD_TAG', tag: `📈 Above MRV: ${aboveMRV.join(', ')}` });

    if (!belowMEV.length && !aboveMRV.length) {
      const ok = statuses.filter(s => s.status === 'OPTIMAL').map(s => s.muscle);
      if (ok.length) effects.push({ type: 'ADD_TAG', tag: `✅ Volume OK: ${ok.join(', ')}` });
    }

    return effects;
  },
};
