// ═══════════════════════════════════════════════
//  RULE ENGINE — Hybrid Config
//  For athletes training both strength + endurance
//  concurrently (powerlifter who runs, SEAL, etc.)
// ═══════════════════════════════════════════════
import type { EngineConfig } from './globalConfig';

// ── Standard Hybrid (strength-leaning) ────────
export const HYBRID_STRENGTH_CONFIG: Partial<EngineConfig> = {
  stress: {
    yellow: 1000,
    red:    1400,
  },
  hybrid: {
    squatHeavyThresh:      0.85,
    enduranceDomCap:       0.55,  // tighter — strength athlete
    strIntensityCapHybrid: 0.88,
    sameDayVolumeCut:      20,
  },
  phaseIntensityCaps: {
    hypertrophy:    0.75,
    strength:       0.88,
    peak:           0.93,
    endurance_base: 0.72,
    hybrid:         0.85,
    deload:         0.80,
    none:           1.00,
  },
};

// ── Standard Hybrid (endurance-leaning) ───────
export const HYBRID_ENDURANCE_CONFIG: Partial<EngineConfig> = {
  stress: {
    yellow: 950,
    red:    1350,
  },
  hybrid: {
    squatHeavyThresh:      0.80,  // lower — flag conflicts earlier
    enduranceDomCap:       0.65,
    strIntensityCapHybrid: 0.82,
    sameDayVolumeCut:      25,
  },
  phaseIntensityCaps: {
    hypertrophy:    0.72,
    strength:       0.83,
    peak:           0.90,
    endurance_base: 0.68,
    hybrid:         0.82,
    deload:         0.75,
    none:           0.95,
  },
};

// ── Tactical / Military Hybrid ─────────────────
export const TACTICAL_HYBRID_CONFIG: Partial<EngineConfig> = {
  stress: {
    yellow: 1200,
    red:    1700,
  },
  acr: {
    safe:    1.3,
    warning: 1.5,
    danger:  1.7,
    hard:    2.0,
  },
  hybrid: {
    squatHeavyThresh:      0.85,
    enduranceDomCap:       0.60,
    strIntensityCapHybrid: 0.85,
    sameDayVolumeCut:      15,  // less reduction — tactical athletes train this way
  },
  deload: {
    accumulationWeeks: 5,
    readinessDaysLow:  4,       // can push through more bad days
    readinessThresh:   50,
    stalledLiftCount:  3,
    volumeCut:         0.35,
    intensityCap:      0.82,
  },
};

// ── Config merger utility ──────────────────────
import { DEFAULT_ENGINE_CONFIG } from './globalConfig';

export function mergeConfig(
  base:     EngineConfig,
  override: Partial<EngineConfig>
): EngineConfig {
  return {
    ...base,
    ...override,
    stress:      { ...base.stress,      ...(override.stress      ?? {}) },
    acr:         { ...base.acr,         ...(override.acr         ?? {}) },
    readiness:   { ...base.readiness,   ...(override.readiness   ?? {}) },
    progression: { ...base.progression, ...(override.progression ?? {}) },
    failure:     { ...base.failure,     ...(override.failure     ?? {}) },
    deload:      { ...base.deload,      ...(override.deload      ?? {}) },
    volume:      { ...base.volume,      ...(override.volume      ?? {}) },
    endurance:   { ...base.endurance,   ...(override.endurance   ?? {}) },
    hybrid:      { ...base.hybrid,      ...(override.hybrid      ?? {}) },
    phaseIntensityCaps: {
      ...base.phaseIntensityCaps,
      ...(override.phaseIntensityCaps ?? {}),
    },
  };
}

// ── Ready-to-use merged presets ────────────────
export const TACTICAL_CONFIG = mergeConfig(
  DEFAULT_ENGINE_CONFIG,
  TACTICAL_HYBRID_CONFIG
);

export const HYBRID_STR_CONFIG = mergeConfig(
  DEFAULT_ENGINE_CONFIG,
  HYBRID_STRENGTH_CONFIG
);

export const HYBRID_END_CONFIG = mergeConfig(
  DEFAULT_ENGINE_CONFIG,
  HYBRID_ENDURANCE_CONFIG
);
