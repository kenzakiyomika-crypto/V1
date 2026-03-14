// ═══════════════════════════════════════════════
//  RULE ENGINE — Stress Calculator
//  Unified Load Currency (Strength + Endurance)
// ═══════════════════════════════════════════════
import type { StressZone } from './types';
import type { EngineConfig } from '../config/globalConfig';
import type { HistoryEntry, RunEntry, SwimEntry } from '../../core/types';

// ─────────────────────────────────────────────
//  RPE → Intensity Factor
// ─────────────────────────────────────────────
const RPE_FACTOR: Record<number, number> = {
  6: 0.8, 7: 0.9, 8: 1.0, 9: 1.1, 10: 1.2,
};

function getRpeFactor(rpe: number): number {
  const clamped = Math.max(6, Math.min(10, Math.round(rpe)));
  return RPE_FACTOR[clamped] ?? 1.0;
}

// ─────────────────────────────────────────────
//  Parse reps string → number
// ─────────────────────────────────────────────
export function parseRepsNum(s: string | number): number {
  if (!s) return 0;
  const str = String(s).toLowerCase().trim();
  if (str === 'max') return 8;
  const range = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return (parseInt(range[1]) + parseInt(range[2])) / 2;
  const n = parseInt(str);
  return isNaN(n) ? 0 : n;
}

// ─────────────────────────────────────────────
//  Strength Load Score
//  = Sets × Reps × (%1RM / 100) × RPEFactor
// ─────────────────────────────────────────────
export function calcStrengthEntryLoad(h: HistoryEntry): number {
  const reps      = parseRepsNum(h.reps);
  const pct1rm    = (h.intensity || 75) / 100;
  const rpeFactor = getRpeFactor(h.rpe || 8);
  return (h.sets || 1) * Math.max(reps, 1) * pct1rm * rpeFactor;
}

// ─────────────────────────────────────────────
//  Endurance Zone → Multiplier
//  Z1=1.0 Z2=1.2 Z3=1.6 Z4=2.0 Z5=2.5
// ─────────────────────────────────────────────
const RUN_ZONE_MULTIPLIER: Record<string, number> = {
  easy:     1.2,
  long:     1.6,
  tempo:    2.0,
  interval: 2.5,
  race:     2.5,
};

export function calcRunLoad(r: RunEntry): number {
  return r.time * (RUN_ZONE_MULTIPLIER[r.type] ?? 1.2);
}

export function calcSwimLoad(s: SwimEntry): number {
  return s.time * 1.2; // Z2 equivalent
}

// ─────────────────────────────────────────────
//  EWMA — Exponential Weighted Moving Average
//  α = 2 / (n + 1)
// ─────────────────────────────────────────────
export function calcEWMA(values: number[], n: number): number {
  if (!values.length) return 0;
  const alpha = 2 / (n + 1);
  return values.reduce((ewma, v) => alpha * v + (1 - alpha) * ewma, values[0]);
}

// ─────────────────────────────────────────────
//  Stress Zone Classification
// ─────────────────────────────────────────────
export function calculateStressZone(
  totalRaw: number,
  config:   EngineConfig
): StressZone {
  if (totalRaw >= config.stress.red)    return 'RED';
  if (totalRaw >= config.stress.yellow) return 'YELLOW';
  return 'GREEN';
}

// ─────────────────────────────────────────────
//  Days since ISO date string
// ─────────────────────────────────────────────
export function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}
