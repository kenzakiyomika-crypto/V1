// ═══════════════════════════════════════════════
//  RULE ENGINE — Workload Model
//  Aggregates training load across strength +
//  endurance into structured workload snapshot.
//  Used by contextBuilder to populate LoadScores
//  and related compliance fields.
// ═══════════════════════════════════════════════
import type { HistoryEntry, RunEntry, SwimEntry } from '../../core/types';
import {
  calcStrengthEntryLoad,
  calcRunLoad,
  calcSwimLoad,
  calcEWMA,
} from '../core/stressCalculator';

function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

// ─────────────────────────────────────────────
//  Daily load grouping helper
// ─────────────────────────────────────────────
function groupDailyStrengthLoad(entries: HistoryEntry[]): number[] {
  const byDay: Record<string, number> = {};
  entries.forEach(h => {
    const day     = new Date(h.date).toDateString();
    byDay[day]    = (byDay[day] ?? 0) + calcStrengthEntryLoad(h);
  });
  return Object.values(byDay);
}


// ─────────────────────────────────────────────
//  Workload Snapshot
// ─────────────────────────────────────────────
export interface WorkloadSnapshot {
  // Raw window sums
  strengthRaw7d:  number;
  enduranceRaw7d: number;
  totalRaw7d:     number;

  // EWMA loads
  acuteLoad:    number;   // 7-day EWMA strength
  chronicLoad:  number;   // 28-day EWMA strength
  acr:          number;   // acute / chronic

  // Compliance
  compliance7d:       number;  // 0–1 fraction trained last 7 days
  missedSessions7d:   number;  // integer count

  // Endurance specific
  weeklyRunKm:      number;
  prevWeekRunKm:    number;
  weeklyRunTime:    number;    // minutes, for zone distribution calc
  highIntensityTime:number;    // minutes Z4+
  longRunTime:      number;    // minutes long runs

  // Real pace comparison from race/tempo entries (min/km, 0 = no data)
  avgPaceThisWeek:  number;
  avgPacePrevWeek:  number;
}

export function buildWorkloadSnapshot(
  history: HistoryEntry[],
  runs:    RunEntry[],
  swims:   SwimEntry[]
): WorkloadSnapshot {
  // ── Window filters ────────────────────────
  const hist7d   = history.filter(h => daysAgo(h.date) <= 7);
  const hist28d  = history.filter(h => daysAgo(h.date) <= 28);
  const runs7d   = runs.filter(r => daysAgo(r.date) <= 7);
  const runs8_14 = runs.filter(r => daysAgo(r.date) > 7 && daysAgo(r.date) <= 14);
  const swims7d  = swims.filter(s => daysAgo(s.date) <= 7);

  // ── Raw sums ──────────────────────────────
  const strengthRaw7d  = hist7d.reduce((s, h) => s + calcStrengthEntryLoad(h), 0);
  const enduranceRaw7d =
    runs7d.reduce((s, r) => s + calcRunLoad(r), 0) +
    swims7d.reduce((s, sw) => s + calcSwimLoad(sw), 0);
  const totalRaw7d = strengthRaw7d + enduranceRaw7d;

  // ── EWMA ──────────────────────────────────
  const daily7d  = groupDailyStrengthLoad(hist7d);
  const daily28d = groupDailyStrengthLoad(hist28d);
  const acuteLoad  = calcEWMA(daily7d,  7);
  const chronicLoad= calcEWMA(daily28d, 28);
  const acr        = chronicLoad > 0
    ? Math.round((acuteLoad / chronicLoad) * 100) / 100
    : 0;

  // ── Compliance ────────────────────────────
  const activeDays7d = new Set(
    hist7d.map(h => new Date(h.date).toDateString())
  ).size;
  const compliance7d     = Math.round((activeDays7d / 7) * 100) / 100;
  const missedSessions7d = 7 - activeDays7d;

  // ── Endurance metrics ─────────────────────
  const weeklyRunKm   = runs7d.reduce((s, r) => s + r.dist, 0);
  const prevWeekRunKm = runs8_14.reduce((s, r) => s + r.dist, 0);
  const weeklyRunTime = runs7d.reduce((s, r) => s + r.time, 0);

  const highIntensityTime = runs7d
    .filter(r => r.type === 'interval' || r.type === 'tempo' || r.type === 'race')
    .reduce((s, r) => s + r.time, 0);

  const longRunTime = runs7d
    .filter(r => r.type === 'long')
    .reduce((s, r) => s + r.time, 0);

  // ── Pace comparison (race > tempo > interval, real pace field) ──
  const TIMING_TYPES = ['race', 'tempo', 'interval'] as const;
  function avgPaceForWindow(windowRuns: RunEntry[]): number {
    for (const type of TIMING_TYPES) {
      const entries = windowRuns.filter(r => r.type === type && r.pace > 0 && r.dist >= 1);
      if (entries.length > 0) {
        return entries.reduce((s, r) => s + r.pace, 0) / entries.length;
      }
    }
    return 0;
  }
  const avgPaceThisWeek = avgPaceForWindow(runs7d);
  const avgPacePrevWeek = avgPaceForWindow(runs8_14);

  return {
    strengthRaw7d,
    enduranceRaw7d,
    totalRaw7d,
    acuteLoad,
    chronicLoad,
    acr,
    compliance7d,
    missedSessions7d,
    weeklyRunKm,
    prevWeekRunKm,
    weeklyRunTime,
    highIntensityTime,
    longRunTime,
    avgPaceThisWeek,
    avgPacePrevWeek,
  };
}
