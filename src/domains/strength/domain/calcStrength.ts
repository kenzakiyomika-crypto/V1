// ─────────────────────────────────────────────
//  STRENGTH DOMAIN — Pure Logic (no side effects)
// ─────────────────────────────────────────────
import type { HistoryEntry } from '../../../core/types';

/** Epley formula: 1RM = weight × (1 + reps / 30) */
export function calculate1RM(weight: number, reps: number): number {
  if (!weight || !reps || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/** Parse reps string to a numeric average */
export function parseRepsNum(s: string | number): number {
  if (!s) return 0;
  const str = String(s).toLowerCase().trim();
  if (str === 'max') return 8;
  const range = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return (parseInt(range[1]) + parseInt(range[2])) / 2;
  const n = parseInt(str);
  return isNaN(n) ? 0 : n;
}

/** Total volume for one history entry (sets × reps × weight) */
export function calcEntryVolume(h: HistoryEntry): number {
  const reps = parseRepsNum(h.reps);
  return (h.sets || 1) * Math.max(reps, 1) * (h.weight || 1);
}

/** Aggregate volume across entries */
export function calcTotalVolume(entries: HistoryEntry[]): number {
  return entries.reduce((sum, h) => sum + calcEntryVolume(h), 0);
}

/** Best 1RM per exercise from history */
export interface Best1RM {
  orm: number;
  weight: number;
  reps: number;
  date: string;
}

export function calcBest1RMs(
  history: HistoryEntry[]
): Record<string, Best1RM> {
  const best: Record<string, Best1RM> = {};
  history.forEach(h => {
    const reps = parseRepsNum(h.reps);
    if (!h.weight || !reps || reps > 20) return;
    const orm = calculate1RM(h.weight, reps);
    if (!best[h.exercise] || orm > best[h.exercise].orm) {
      best[h.exercise] = { orm, weight: h.weight, reps, date: h.date };
    }
  });
  return best;
}

/** Find PR (max weight) per exercise */
export function findPRs(history: HistoryEntry[]): Record<string, number> {
  const prs: Record<string, number> = {};
  history.forEach(h => {
    if (h.weight && (!prs[h.exercise] || h.weight > prs[h.exercise])) {
      prs[h.exercise] = h.weight;
    }
  });
  return prs;
}

/** Muscle involvement map */
export const EXERCISE_DB: Record<string, Record<string, number>> = {
  'bench press':           { chest: .6, triceps: .25, shoulders: .15 },
  'incline press':         { chest: .5, triceps: .25, shoulders: .25 },
  'ohp':                   { shoulders: .55, triceps: .3, chest: .15 },
  'overhead press':        { shoulders: .55, triceps: .3, chest: .15 },
  'push-up':               { chest: .55, triceps: .25, shoulders: .2 },
  'dip':                   { chest: .45, triceps: .4, shoulders: .15 },
  'lateral raise':         { shoulders: .9, traps: .1 },
  'face pull':             { shoulders: .5, traps: .3, biceps: .2 },
  'tricep pushdown':       { triceps: .9, shoulders: .1 },
  'deadlift':              { back: .4, glutes: .25, hamstrings: .2, traps: .15 },
  'romanian dl':           { hamstrings: .45, glutes: .35, back: .2 },
  'barbell row':           { back: .5, biceps: .25, traps: .15, shoulders: .1 },
  'seated row':            { back: .5, biceps: .3, traps: .2 },
  'lat pulldown':          { back: .55, biceps: .3, shoulders: .15 },
  'pull-up':               { back: .55, biceps: .3, shoulders: .15 },
  'chin-up':               { back: .5, biceps: .35, shoulders: .15 },
  'barbell curl':          { biceps: .85, shoulders: .15 },
  'hammer curl':           { biceps: .75, forearms: .25 },
  'squat':                 { quads: .5, glutes: .3, hamstrings: .15, back: .05 },
  'leg press':             { quads: .5, glutes: .35, hamstrings: .15 },
  'bulgarian split squat': { quads: .45, glutes: .4, hamstrings: .15 },
  'lunge':                 { quads: .45, glutes: .4, hamstrings: .15 },
  'leg extension':         { quads: .95, hamstrings: .05 },
  'leg curl':              { hamstrings: .9, glutes: .1 },
  'hip thrust':            { glutes: .7, hamstrings: .2, quads: .1 },
  'calf raise':            { calves: .95, hamstrings: .05 },
  'glute bridge':          { glutes: .7, hamstrings: .2, quads: .1 },
  'hanging knee raise':    { abs: .8, hip_flexors: .2 },
};

export function getMuscleProfile(name: string): Record<string, number> | null {
  const key = name.toLowerCase().trim();
  if (EXERCISE_DB[key]) return EXERCISE_DB[key];
  for (const k of Object.keys(EXERCISE_DB)) {
    if (key.includes(k) || k.includes(key.split(' ')[0])) return EXERCISE_DB[k];
  }
  return null;
}

/** Aggregate muscle volume from history entries */
export function calcMuscleVolume(
  entries: HistoryEntry[]
): Record<string, number> {
  const vol: Record<string, number> = {};
  entries.forEach(h => {
    const mp = getMuscleProfile(h.exercise);
    if (!mp) return;
    for (const m in mp) {
      vol[m] = (vol[m] || 0) + (h.sets || 1) * mp[m];
    }
  });
  return vol;
}

/** Muscle training frequency (unique days per muscle) */
export function calcMuscleFrequency(
  entries: HistoryEntry[]
): Record<string, number> {
  const freq: Record<string, Set<string>> = {};
  entries.forEach(h => {
    const mp = getMuscleProfile(h.exercise);
    if (!mp) return;
    const day = new Date(h.date).toDateString();
    for (const m in mp) {
      if (!freq[m]) freq[m] = new Set();
      freq[m].add(day);
    }
  });
  return Object.fromEntries(
    Object.entries(freq).map(([m, days]) => [m, days.size])
  );
}
