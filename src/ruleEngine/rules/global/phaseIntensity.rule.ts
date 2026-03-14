// ═══════════════════════════════════════════════
//  RULE: Phase Intensity Cap  (priority 85)
//
//  Each training phase caps max intensity:
//  hypertrophy  → 75%
//  strength     → 88%
//  peak         → 95%
//  endurance    → 70%
//  hybrid       → 85%
//  deload       → 80%
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const phaseIntensityRule: Rule = {
  id: 'phase-intensity',
  priority: 85,

  when: (ctx) => ctx.trainingPhase !== 'none',

  then: (ctx): RuleEffect[] => {
    const cap = ctx.config.phaseIntensityCaps[ctx.trainingPhase];
    if (!cap || cap >= 1.0) return [];

    return [
      { type: 'LOCK_INTENSITY', capPct: cap },
      { type: 'ADD_TAG', tag: `📊 Phase ${ctx.trainingPhase} → Intensity cap ${Math.round(cap * 100)}%` },
    ];
  },
};
