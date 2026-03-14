// ═══════════════════════════════════════════════
//  RULE ENGINE — Readiness Model
//  Analyses readiness trend over time, not just
//  today's single score. Feeds deload triggers
//  and context fields.
// ═══════════════════════════════════════════════
import type { ReadinessEntry } from '../../core/types';

// ─────────────────────────────────────────────
//  Readiness Trend Snapshot
// ─────────────────────────────────────────────
export interface ReadinessTrend {
  latest:       number;    // most recent score
  avg7d:        number;    // 7-day average
  min3d:        number;    // min of last 3 days (deload trigger)
  trend:        'improving' | 'stable' | 'declining';
  daysLowCount: number;    // days below threshold in last 7 days
  isChronicallyLow: boolean; // 3+ days < threshold
}

const CHRONICALLY_LOW_THRESHOLD = 55;
const CHRONICALLY_LOW_DAYS      = 3;

function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

export function buildReadinessTrend(
  history: ReadinessEntry[],
  threshold = CHRONICALLY_LOW_THRESHOLD
): ReadinessTrend {
  if (!history.length) {
    return {
      latest: 70, avg7d: 70, min3d: 70,
      trend: 'stable', daysLowCount: 0, isChronicallyLow: false,
    };
  }

  // Sort descending by date
  const sorted = [...history]
    .filter(r => daysAgo(r.date) <= 7)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latest = sorted[0]?.score ?? 70;

  // 7-day average
  const avg7d = sorted.length
    ? Math.round(sorted.reduce((s, r) => s + r.score, 0) / sorted.length)
    : latest;

  // Min of last 3 entries
  const last3   = sorted.slice(0, 3);
  const min3d   = last3.length
    ? Math.min(...last3.map(r => r.score))
    : latest;

  // Trend: compare first half vs second half of 7-day window
  const half    = Math.ceil(sorted.length / 2);
  const recent  = sorted.slice(0, half);
  const older   = sorted.slice(half);
  const recentAvg = recent.reduce((s, r) => s + r.score, 0) / (recent.length || 1);
  const olderAvg  = older.length
    ? older.reduce((s, r) => s + r.score, 0) / older.length
    : recentAvg;

  const diff = recentAvg - olderAvg;
  const trend: ReadinessTrend['trend'] =
    diff >  5 ? 'improving' :
    diff < -5 ? 'declining' : 'stable';

  // Days below threshold
  const daysLowCount = sorted.filter(r => r.score < threshold).length;
  const isChronicallyLow = daysLowCount >= CHRONICALLY_LOW_DAYS;

  return { latest, avg7d, min3d, trend, daysLowCount, isChronicallyLow };
}

// ─────────────────────────────────────────────
//  Training readiness tier (for rule evaluation)
// ─────────────────────────────────────────────
export type ReadinessTier =
  | 'FULL'      // ≥ 85 — train hard
  | 'MILD'      // 70–84 — -3% load
  | 'MODERATE'  // 55–69 — -5% load
  | 'LOW'       // 40–54 — -15% volume
  | 'CRITICAL'; // < 40  — FORCE_DELOAD

export function getReadinessTier(
  score:  number,
  config: { full: number; mild: number; moderate: number; low: number }
): ReadinessTier {
  if (score >= config.full)     return 'FULL';
  if (score >= config.mild)     return 'MILD';
  if (score >= config.moderate) return 'MODERATE';
  if (score >= config.low)      return 'LOW';
  return 'CRITICAL';
}
