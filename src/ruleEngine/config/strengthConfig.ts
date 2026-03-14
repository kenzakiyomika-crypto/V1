// ═══════════════════════════════════════════════
//  RULE ENGINE — Strength Config Overrides
//  For pure strength athletes (powerlifter / weightlifter)
// ═══════════════════════════════════════════════
import type { EngineConfig } from './globalConfig';
import { DEFAULT_ENGINE_CONFIG } from './globalConfig';
import { mergeConfig } from './hybridConfig';

// ── Powerlifting focused ──────────────────────
export const STRENGTH_CONFIG_OVERRIDE: Partial<EngineConfig> = {
  stress: {
    yellow: 1100,
    red:    1600,
  },
  progression: {
    mainLiftPct:   2.5,
    accessoryPct:  1.5,
    successStreak: 3,
    complianceMin: 0.85,
    readinessMin:  70,
  },
  failure: {
    repeatAt:          1,
    deloadAt:          2,
    resetAt:           3,
    changeVariationAt: 4,
    loadCutPct:        5,
    resetPct:          90,
  },
  deload: {
    accumulationWeeks: 4,
    readinessDaysLow:  3,
    readinessThresh:   55,
    stalledLiftCount:  2,
    volumeCut:         0.40,
    intensityCap:      0.80,
  },
  phaseIntensityCaps: {
    hypertrophy:    0.75,
    strength:       0.90,   // slightly higher for strength athletes
    peak:           0.97,
    endurance_base: 0.72,
    hybrid:         0.88,
    deload:         0.80,
    none:           1.00,
  },
};

// ── Ready-to-use merged preset ────────────────
export const POWERLIFTING_CONFIG = mergeConfig(
  DEFAULT_ENGINE_CONFIG,
  STRENGTH_CONFIG_OVERRIDE
);
