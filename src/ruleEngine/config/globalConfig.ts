// ═══════════════════════════════════════════════
//  RULE ENGINE — Global Config
//  Every threshold is here. Nothing hardcoded.
// ═══════════════════════════════════════════════

export interface EngineConfig {
  // ── Stress Budget (raw load units) ────────────
  stress: {
    yellow: number;   // default 1000
    red:    number;   // default 1400
  };

  // ── ACR (Acute:Chronic ratio) ──────────────────
  acr: {
    safe:    number;  // ≤ this → safe (default 1.2)
    warning: number;  // default 1.3 → -10% volume
    danger:  number;  // default 1.5 → -20% + cancel intervals
    hard:    number;  // weekly spike hard cap (default 1.6×)
  };

  // ── Readiness layers (score 0–100) ─────────────
  readiness: {
    full:     number;  // ≥85 → no adjustment
    mild:     number;  // ≥70 → -3% load
    moderate: number;  // ≥55 → -5% load
    low:      number;  // ≥40 → -15% volume
    // <low → FORCE_DELOAD
  };

  // ── Progression ────────────────────────────────
  progression: {
    mainLiftPct:      number;  // +2.5% on 3-session streak
    accessoryPct:     number;  // +1.5%
    successStreak:    number;  // sessions needed (default 3)
    complianceMin:    number;  // minimum compliance (default 0.85)
    readinessMin:     number;  // minimum readiness (default 70)
  };

  // ── Failure escalation ─────────────────────────
  failure: {
    repeatAt:         number;  // 1 fail → repeat (default 1)
    deloadAt:         number;  // 2 fails → -5% (default 2)
    resetAt:          number;  // 3 fails → 90% 1RM (default 3)
    changeVariationAt: number; // 4-week stall (default 4)
    loadCutPct:       number;  // -5% on 2 fails
    resetPct:         number;  // 90% on 3 fails
  };

  // ── Deload triggers ────────────────────────────
  deload: {
    accumulationWeeks: number; // every N weeks (default 4)
    readinessDaysLow:  number; // readiness < threshold N days → deload (default 3)
    readinessThresh:   number; // threshold for above (default 55)
    stalledLiftCount:  number; // N lifts stalled → deload (default 2)
    volumeCut:         number; // volume reduction (default 0.40 = -40%)
    intensityCap:      number; // (default 0.80)
  };

  // ── Volume Landmarks (sets/week per muscle) ────
  volume: {
    mevMin:     number;   // minimum effective volume (default 10)
    mrvMax:     number;   // maximum recoverable volume (default 20)
    belowMEV:   number;   // sets to add when below MEV (+2)
    aboveMRV:   number;   // sets to remove when above MRV (-3)
  };

  // ── Endurance ──────────────────────────────────
  endurance: {
    maxWeeklyGrowthPct: number;   // max mileage increase/week (default 0.10)
    freezeMissedSessions: number; // missed sessions → freeze mileage (default 2)
    freezeReadiness:   number;    // readiness < this → no increase (default 60)
    highIntensityMax:  number;    // >25% high Z → reduce intervals (default 0.25)
    highIntensityMin:  number;    // <15% → add interval (default 0.15)
    longRunMaxPct:     number;    // max 30% weekly volume (default 0.30)
    paceImprovePct:    number;    // recalibrate if improves ≥3% (default 0.03)
    paceDropPct:       number;    // reduce pace if drops ≥3% (default 0.03)
    paceDropCut:       number;    // -5% pace on drop (default 0.05)
  };

  // ── Hybrid interference ────────────────────────
  hybrid: {
    squatHeavyThresh:    number;  // heavy squat threshold %1RM (default 0.85)
    enduranceDomCap:     number;  // if endurance > X% total → cap str intensity (default 0.60)
    strIntensityCapHybrid: number; // cap at (default 0.85)
    sameDayVolumeCut:    number;  // -20% squat volume on same-day conflict
  };

  // ── Phase intensity caps ───────────────────────
  phaseIntensityCaps: Record<string, number>; // phase → max %1RM cap

  // ── Season System (optional) ───────────────────
  // When set, season block overrides trainingPhase + intensityCap
  season?: import('../core/seasonSystem').SeasonState;
}

// ─────────────────────────────────────────────
//  DEFAULT (production values)
// ─────────────────────────────────────────────
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  stress: {
    yellow: 1000,
    red:    1400,
  },
  acr: {
    safe:    1.2,
    warning: 1.3,
    danger:  1.5,
    hard:    1.6,
  },
  readiness: {
    full:     85,
    mild:     70,
    moderate: 55,
    low:      40,
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
  volume: {
    mevMin:   10,
    mrvMax:   20,
    belowMEV:  2,
    aboveMRV: -3,
  },
  endurance: {
    maxWeeklyGrowthPct:   0.10,
    freezeMissedSessions: 2,
    freezeReadiness:      60,
    highIntensityMax:     0.25,
    highIntensityMin:     0.15,
    longRunMaxPct:        0.30,
    paceImprovePct:       0.03,
    paceDropPct:          0.03,
    paceDropCut:          0.05,
  },
  hybrid: {
    squatHeavyThresh:      0.85,
    enduranceDomCap:       0.60,
    strIntensityCapHybrid: 0.85,
    sameDayVolumeCut:      20,
  },
  phaseIntensityCaps: {
    hypertrophy:    0.75,
    strength:       0.88,
    peak:           0.95,
    endurance_base: 0.70,
    hybrid:         0.85,
    deload:         0.80,
    none:           1.00,
  },
};
