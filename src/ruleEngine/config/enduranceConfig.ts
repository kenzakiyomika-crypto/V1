// ═══════════════════════════════════════════════
//  RULE ENGINE — Endurance Config
//  Overrides for endurance-focused athletes
//  (SEAL prep / marathon / triathlon)
// ═══════════════════════════════════════════════
import type { EngineConfig } from './globalConfig';

// ── Endurance Base (Zone 2 focus, low intensity) ──
export const ENDURANCE_BASE_CONFIG: Partial<EngineConfig> = {
  stress: {
    yellow: 800,   // tighter — endurance athletes need more recovery
    red:    1200,
  },
  readiness: {
    full:     85,
    mild:     72,
    moderate: 58,
    low:      42,
  },
  endurance: {
    maxWeeklyGrowthPct:   0.10,
    freezeMissedSessions: 2,
    freezeReadiness:      60,
    highIntensityMax:     0.20,  // stricter — keep 80% easy
    highIntensityMin:     0.10,
    longRunMaxPct:        0.30,
    paceImprovePct:       0.03,
    paceDropPct:          0.03,
    paceDropCut:          0.05,
  },
  phaseIntensityCaps: {
    hypertrophy:    0.70,
    strength:       0.80,
    peak:           0.90,
    endurance_base: 0.65,  // low — base building only
    hybrid:         0.78,
    deload:         0.70,
    none:           0.85,
  },
};

// ── Competitive Endurance (race-ready, higher intensity tolerance) ──
export const ENDURANCE_RACE_CONFIG: Partial<EngineConfig> = {
  stress: {
    yellow: 1100,
    red:    1600,  // higher capacity athletes
  },
  endurance: {
    maxWeeklyGrowthPct:   0.10,
    freezeMissedSessions: 2,
    freezeReadiness:      55,
    highIntensityMax:     0.30,  // allow slightly more
    highIntensityMin:     0.15,
    longRunMaxPct:        0.35,  // long run up to 35%
    paceImprovePct:       0.03,
    paceDropPct:          0.03,
    paceDropCut:          0.05,
  },
};

// ── SEAL / Military Endurance (tactical, high volume) ──
export const SEAL_ENDURANCE_CONFIG: Partial<EngineConfig> = {
  stress: {
    yellow: 1200,
    red:    1800,  // must handle extreme loads
  },
  acr: {
    safe:    1.3,  // more aggressive ramp allowed
    warning: 1.5,
    danger:  1.7,
    hard:    2.0,
  },
  endurance: {
    maxWeeklyGrowthPct:   0.15,  // SEAL candidates ramp faster
    freezeMissedSessions: 3,
    freezeReadiness:      50,
    highIntensityMax:     0.35,
    highIntensityMin:     0.20,
    longRunMaxPct:        0.40,
    paceImprovePct:       0.03,
    paceDropPct:          0.03,
    paceDropCut:          0.05,
  },
  deload: {
    accumulationWeeks: 5,  // SEAL prep can go longer before deload
    readinessDaysLow:  3,
    readinessThresh:   50,
    stalledLiftCount:  3,
    volumeCut:         0.35,
    intensityCap:      0.80,
  },
};
