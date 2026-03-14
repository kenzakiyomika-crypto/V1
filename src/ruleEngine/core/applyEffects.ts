// ═══════════════════════════════════════════════
//  RULE ENGINE — Apply Effects
//  Translates merged RuleEffect[] → mutations
//  on Exercise[] (immutable, returns new array)
//
//  Handles all effect types including:
//  RESET_TO_90PCT, CHANGE_VARIATION,
//  ADD_INTERVAL, FREEZE_MILEAGE
// ═══════════════════════════════════════════════
import type { Exercise } from '../../core/types';
import type { RuleEffect } from './types';

// ─────────────────────────────────────────────
//  Pure helpers
// ─────────────────────────────────────────────

function adjustWeight(weight: number | null, deltaPct: number): number | null {
  if (weight === null || weight === 0) return weight;
  const result = weight * (1 + deltaPct / 100);
  return Math.max(0, Math.round(result * 10) / 10);
}

function adjustSets(sets: number, deltaPct: number): number {
  const result = sets * (1 + deltaPct / 100);
  return Math.max(1, Math.round(result));
}

function capIntensityValue(intensity: number, capPct: number): number {
  // capPct is 0–1 (e.g. 0.85), intensity is 0–100
  return Math.min(intensity, Math.round(capPct * 100));
}

const INTERVAL_KEYWORDS = ['interval', 'hiit', 'sprint', 'tabata', 'repeat'];
function isInterval(name: string): boolean {
  return INTERVAL_KEYWORDS.some(k => name.toLowerCase().includes(k));
}


// ─────────────────────────────────────────────
//  Deload: -40% volume, -20% load, cap 80%
// ─────────────────────────────────────────────
function applyDeload(exercises: Exercise[]): Exercise[] {
  return exercises.map(ex => ({
    ...ex,
    sets:      Math.max(1, Math.round(ex.sets * 0.6)),
    weight:    adjustWeight(ex.weight, -20),
    intensity: Math.min(ex.intensity, 80),
    rpe:       Math.min(ex.rpe, 6),
  }));
}

// ─────────────────────────────────────────────
//  Variation substitution table
//  "change variation" = replace with related exercise
// ─────────────────────────────────────────────
const VARIATION_MAP: Record<string, string> = {
  'squat':          'Bulgarian Split Squat',
  'bench press':    'Incline Press',
  'deadlift':       'Romanian DL',
  'ohp':            'Dumbbell Press',
  'overhead press': 'Dumbbell Press',
  'barbell row':    'Seated Row',
  'pull-up':        'Lat Pulldown',
  'barbell curl':   'Hammer Curl',
};

export function getVariation(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(VARIATION_MAP)) {
    if (lower.includes(key)) return val;
  }
  return `${name} (Variation)`;
}

// ─────────────────────────────────────────────
//  Meta output: side-effects that can't mutate
//  Exercise[] directly (returned for caller use)
// ─────────────────────────────────────────────
export interface ApplyResult {
  exercises:        Exercise[];
  freezeMileage:    boolean;
  addInterval:      boolean;
  paceRecalibrate?: { direction: 'up' | 'down'; pct: number };
  tags:             string[];
}

// ═══════════════════════════════════════════════
//  MAIN FUNCTION
// ═══════════════════════════════════════════════
export function applyEffects(
  exercises:      Exercise[],
  effects:        RuleEffect[],
  volumeModifier: number = 1.0   // season block modifier (e.g. 0.6 = deload week)
): ApplyResult {
  let updated        = [...exercises];

  // Apply season volume modifier first (multiplicative on sets)
  if (volumeModifier !== 1.0) {
    updated = updated.map(ex => ({
      ...ex,
      sets: Math.max(1, Math.round(ex.sets * volumeModifier)),
    }));
  }

  let freezeMileage  = false;
  let addInterval    = false;
  let paceRecalibrate: { direction: 'up' | 'down'; pct: number } | undefined;
  const tags: string[] = [];

  for (const effect of effects) {
    switch (effect.type) {

      // ── Global modifiers ──────────────────
      case 'FORCE_DELOAD':
        updated = applyDeload(updated);
        break;

      case 'ADJUST_LOAD':
        updated = updated.map(ex => {
          if (effect.liftId) {
            const match = ex.name.toLowerCase().includes(effect.liftId.toLowerCase())
              || effect.liftId.toLowerCase().includes(ex.name.toLowerCase().split(' ')[0]);
            if (!match) return ex;
          }
          return { ...ex, weight: adjustWeight(ex.weight, effect.deltaPct) };
        });
        break;

      case 'ADJUST_VOLUME':
        updated = updated.map(ex => {
          if (effect.liftId) {
            const match = ex.name.toLowerCase().includes(effect.liftId.toLowerCase());
            if (!match) return ex;
          }
          return { ...ex, sets: adjustSets(ex.sets, effect.deltaPct) };
        });
        break;

      case 'LOCK_INTENSITY':
        updated = updated.map(ex => ({
          ...ex,
          intensity: capIntensityValue(ex.intensity, effect.capPct),
          rpe:       Math.min(ex.rpe, Math.ceil(effect.capPct * 10)),
        }));
        break;

      // ── Endurance modifiers ───────────────
      case 'CANCEL_INTERVALS':
        updated = updated.filter(ex => !isInterval(ex.name));
        break;

      case 'ADD_INTERVAL':
        addInterval = true; // caller adds interval to run session
        break;

      case 'FREEZE_MILEAGE':
        freezeMileage = true;
        break;

      case 'RECALIBRATE_PACE':
        paceRecalibrate = { direction: effect.direction, pct: effect.pct };
        break;

      // ── Strength-specific ─────────────────
      case 'RESET_TO_90PCT': {
        updated = updated.map(ex => {
          const match = ex.name.toLowerCase().includes(effect.liftId.toLowerCase());
          if (!match) return ex;
          return {
            ...ex,
            weight:    adjustWeight(ex.weight, -10),  // ~90% of current
            intensity: Math.min(ex.intensity, 90),
            rpe:       Math.min(ex.rpe, 8),
          };
        });
        break;
      }

      case 'CHANGE_VARIATION': {
        updated = updated.map(ex => {
          const match = ex.name.toLowerCase().includes(effect.liftId.toLowerCase());
          if (!match) return ex;
          return {
            ...ex,
            name: getVariation(ex.name),
            // Reset weight slightly — new variation starts fresh
            weight:    adjustWeight(ex.weight, -10),
            intensity: Math.min(ex.intensity, 80),
          };
        });
        break;
      }

      case 'ADD_TAG':
        tags.push(effect.tag);
        break;
    }
  }

  // ── Safety: never negative weight ─────────
  updated = updated.map(ex => ({
    ...ex,
    weight: ex.weight !== null ? Math.max(0, ex.weight) : null,
    sets:   Math.max(1, ex.sets),
  }));

  return { exercises: updated, freezeMileage, addInterval, paceRecalibrate, tags };
}
