// ═══════════════════════════════════════════════
//  RULE ENGINE — Policies
//  Each policy = a named set of rules for a phase.
// ═══════════════════════════════════════════════
import type { Rule, TrainingPhase } from '../core/types';

// ── Global ───────────────────────────────────
import { readinessRule }      from '../rules/global/readiness.rule';
import { acrRule }            from '../rules/global/acr.rule';
import { stressBudgetRule }   from '../rules/global/stress.rule';
import { deloadTriggerRule }  from '../rules/global/deload.rule';
import { phaseIntensityRule } from '../rules/global/phaseIntensity.rule';

// ── Strength ──────────────────────────────────
import { strengthProgressionRule } from '../rules/strength/progression.rule';
import { failureEscalationRule }   from '../rules/strength/failureEscalation.rule';
import { volumeLandmarkRule }      from '../rules/strength/volumeLandmark.rule';

// ── Endurance ─────────────────────────────────
import { mileageGrowthRule }         from '../rules/endurance/mileageGrowth.rule';
import { intensityDistributionRule } from '../rules/endurance/intensityDistribution.rule';
import { paceRecalibrationRule }     from '../rules/endurance/paceRecalibration.rule';
import { phaseEnduranceRule }        from '../rules/endurance/phaseEndurance.rule';

// ── Hybrid ────────────────────────────────────
import { hybridInterferenceRule } from '../rules/hybrid/hybridInterference.rule';

// ─────────────────────────────────────────────
//  Global rules — always included in every policy
// ─────────────────────────────────────────────
const GLOBAL_RULES: Rule[] = [
  readinessRule,       // 100
  acrRule,             // 98
  deloadTriggerRule,   // 97
  stressBudgetRule,    // 95
  phaseIntensityRule,  // 85
];

// ═══════════════════════════════════════════════
//  POLICY: Hypertrophy
//  Volume Landmark priority ↑ | Intensity cap 75%
// ═══════════════════════════════════════════════
export const hypertrophyPolicy: Rule[] = [
  ...GLOBAL_RULES,
  failureEscalationRule,   // 60
  strengthProgressionRule, // 50
  volumeLandmarkRule,      // 45
];

// ═══════════════════════════════════════════════
//  POLICY: Strength
//  Progression priority ↑ | Intensity cap 88%
// ═══════════════════════════════════════════════
export const strengthPolicy: Rule[] = [
  ...GLOBAL_RULES,
  failureEscalationRule,   // 60
  strengthProgressionRule, // 50
  volumeLandmarkRule,      // 45
];

// ═══════════════════════════════════════════════
//  POLICY: Peak
//  Volume minimal | No progression | Cap 95%
// ═══════════════════════════════════════════════
export const peakPolicy: Rule[] = [
  ...GLOBAL_RULES,
  failureEscalationRule, // 60
  phaseEnduranceRule,    // 70
];

// ═══════════════════════════════════════════════
//  POLICY: Endurance Base
//  Mileage growth ON | No speed escalation
// ═══════════════════════════════════════════════
export const enduranceBasePolicy: Rule[] = [
  ...GLOBAL_RULES,
  mileageGrowthRule,           // 75
  phaseEnduranceRule,          // 70
  intensityDistributionRule,   // 72
  paceRecalibrationRule,       // 68
  failureEscalationRule,       // 60
  strengthProgressionRule,     // 50
  volumeLandmarkRule,          // 45
];

// ═══════════════════════════════════════════════
//  POLICY: Hybrid Competitive
//  All rules active | Interference priority ↑
// ═══════════════════════════════════════════════
export const hybridPolicy: Rule[] = [
  ...GLOBAL_RULES,
  hybridInterferenceRule,      // 80
  mileageGrowthRule,           // 75
  phaseEnduranceRule,          // 70
  intensityDistributionRule,   // 72
  paceRecalibrationRule,       // 68
  failureEscalationRule,       // 60
  strengthProgressionRule,     // 50
  volumeLandmarkRule,          // 45
];

// ─────────────────────────────────────────────
//  Policy selector
// ─────────────────────────────────────────────
export function selectPolicy(phase: TrainingPhase): Rule[] {
  switch (phase) {
    case 'hypertrophy':    return hypertrophyPolicy;
    case 'strength':       return strengthPolicy;
    case 'peak':           return peakPolicy;
    case 'endurance_base': return enduranceBasePolicy;
    case 'hybrid':         return hybridPolicy;
    case 'deload':         return GLOBAL_RULES;
    default:               return hybridPolicy;
  }
}
