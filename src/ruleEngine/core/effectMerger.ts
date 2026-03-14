// ═══════════════════════════════════════════════
//  RULE ENGINE — Effect Merger
//  Conflict Resolution Order (absolute, non-negotiable):
//  1. FORCE_DELOAD
//  2. Acute:Chronic
//  3. Stress Budget
//  4. Readiness
//  5. Intensity Cap
//  6. Failure Escalation
//  7. Interference
//  8. Progression
//  9. Volume Optimization
// ═══════════════════════════════════════════════
import type { RuleEffect } from './types';

// Rule ID prefixes map to resolution priority tier
// (used for explanation generation only — merger is purely structural)
const PRIORITY_TIER: Record<string, number> = {
  'force-deload':     1,
  'acr-protection':   2,
  'stress-budget':    3,
  'readiness-adjust': 4,
  'phase-intensity':  5,
  'failure-escalation': 6,
  'hybrid-interference': 7,
  'strength-progression': 8,
  'volume-landmark':  9,
};
export { PRIORITY_TIER };

// ─────────────────────────────────────────────
//  Safety clamps (edge case guardrails)
// ─────────────────────────────────────────────
const MAX_REDUCTION_PCT = -30;  // never exceed 30% total reduction in one cycle
const MIN_LOAD_DELTA    = -30;  // hard floor

function clampDelta(delta: number): number {
  return Math.max(MIN_LOAD_DELTA, Math.min(30, delta));
}

// ─────────────────────────────────────────────
//  Main merger
// ─────────────────────────────────────────────
export function mergeEffects(rawEffects: RuleEffect[]): RuleEffect[] {
  // ── 1. FORCE_DELOAD overrides everything ──
  if (rawEffects.some(e => e.type === 'FORCE_DELOAD')) {
    // Preserve tags even during deload (informational)
    const tags = rawEffects
      .filter(e => e.type === 'ADD_TAG')
      .map(e => e as { type: 'ADD_TAG'; tag: string });
    return [{ type: 'FORCE_DELOAD' }, ...tags];
  }

  // ── Accumulators ──────────────────────────
  let globalLoadDelta   = 0;
  let globalVolumeDelta = 0;
  const liftLoadDeltas:   Record<string, number> = {};
  const liftVolumeDeltas: Record<string, number> = {};
  let intensityCap:   number | null = null;
  let cancelIntervals = false;
  let addInterval     = false;
  let freezeMileage   = false;
  const recalibrateEffects: RuleEffect[] = [];
  const changeVariations: RuleEffect[]   = [];
  const resetLifts: RuleEffect[]         = [];
  const tags = new Set<string>();

  for (const e of rawEffects) {
    switch (e.type) {

      case 'ADJUST_LOAD':
        if (e.liftId) {
          liftLoadDeltas[e.liftId] = (liftLoadDeltas[e.liftId] ?? 0) + e.deltaPct;
        } else {
          globalLoadDelta += e.deltaPct;
        }
        break;

      case 'ADJUST_VOLUME':
        if (e.liftId) {
          liftVolumeDeltas[e.liftId] = (liftVolumeDeltas[e.liftId] ?? 0) + e.deltaPct;
        } else {
          globalVolumeDelta += e.deltaPct;
        }
        break;

      case 'LOCK_INTENSITY':
        // Strictest cap wins
        intensityCap = intensityCap === null
          ? e.capPct
          : Math.min(intensityCap, e.capPct);
        break;

      case 'CANCEL_INTERVALS':
        cancelIntervals = true;
        addInterval = false; // CANCEL wins over ADD
        break;

      case 'ADD_INTERVAL':
        if (!cancelIntervals) addInterval = true;
        break;

      case 'FREEZE_MILEAGE':
        freezeMileage = true;
        break;

      case 'RECALIBRATE_PACE':
        recalibrateEffects.push(e);
        break;

      case 'CHANGE_VARIATION':
        changeVariations.push(e);
        break;

      case 'RESET_TO_90PCT':
        resetLifts.push(e);
        break;

      case 'ADD_TAG':
        tags.add(e.tag);
        break;
    }
  }

  // ── Safety clamp: total reduction ≤ 30% ──
  globalLoadDelta   = clampDelta(globalLoadDelta);
  globalVolumeDelta = Math.max(MAX_REDUCTION_PCT, globalVolumeDelta);

  // ── Build merged output ───────────────────
  const merged: RuleEffect[] = [];

  if (globalLoadDelta !== 0)
    merged.push({ type: 'ADJUST_LOAD', deltaPct: globalLoadDelta });

  if (globalVolumeDelta !== 0)
    merged.push({ type: 'ADJUST_VOLUME', deltaPct: globalVolumeDelta });

  // Per-lift deltas (compound with global)
  for (const [liftId, delta] of Object.entries(liftLoadDeltas)) {
    const total = clampDelta(delta + globalLoadDelta);
    if (total !== 0)
      merged.push({ type: 'ADJUST_LOAD', liftId, deltaPct: total });
  }
  for (const [liftId, delta] of Object.entries(liftVolumeDeltas)) {
    const total = Math.max(MAX_REDUCTION_PCT, delta + globalVolumeDelta);
    if (total !== 0)
      merged.push({ type: 'ADJUST_VOLUME', liftId, deltaPct: total });
  }

  if (intensityCap !== null)
    merged.push({ type: 'LOCK_INTENSITY', capPct: intensityCap });

  if (cancelIntervals)
    merged.push({ type: 'CANCEL_INTERVALS' });
  else if (addInterval)
    merged.push({ type: 'ADD_INTERVAL' });

  if (freezeMileage)
    merged.push({ type: 'FREEZE_MILEAGE' });

  merged.push(...recalibrateEffects);
  merged.push(...changeVariations);
  merged.push(...resetLifts);

  for (const tag of tags)
    merged.push({ type: 'ADD_TAG', tag });

  return merged;
}

// ─────────────────────────────────────────────
//  Summarise adjustments for audit entry
// ─────────────────────────────────────────────
export function summariseAdjustments(effects: RuleEffect[]): {
  loadDelta:    number;
  volumeDelta:  number;
  intensityCap: number | null;
} {
  let loadDelta    = 0;
  let volumeDelta  = 0;
  let intensityCap: number | null = null;

  for (const e of effects) {
    if (e.type === 'ADJUST_LOAD'   && !e.liftId) loadDelta   += e.deltaPct;
    if (e.type === 'ADJUST_VOLUME' && !e.liftId) volumeDelta += e.deltaPct;
    if (e.type === 'LOCK_INTENSITY') {
      intensityCap = intensityCap === null
        ? e.capPct : Math.min(intensityCap, e.capPct);
    }
    if (e.type === 'FORCE_DELOAD') {
      loadDelta    = -20;
      volumeDelta  = -40;
      intensityCap = 0.80;
    }
  }
  return { loadDelta, volumeDelta, intensityCap };
}
