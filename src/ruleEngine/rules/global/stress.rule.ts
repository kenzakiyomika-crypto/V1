// ═══════════════════════════════════════════════
//  RULE: Stress Budget  (priority 95)
//
//  Zone    TotalStress   Action
//  ─────────────────────────────────────────────
//  Green   < 1000        none
//  Yellow  1000–1400     -10% volume
//  Red     > 1400        -20% volume + LOCK 85%
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const stressBudgetRule: Rule = {
  id: 'stress-budget',
  priority: 95,

  when: (ctx) => ctx.stressZone !== 'GREEN',

  then: (ctx): RuleEffect[] => {
    const total = Math.round(ctx.loads.totalRaw);

    if (ctx.stressZone === 'RED') {
      return [
        { type: 'ADJUST_VOLUME',  deltaPct: -20 },
        { type: 'LOCK_INTENSITY', capPct: 0.85 },
        { type: 'ADD_TAG', tag: `🔴 Stress RED (${total}) → -20% Vol + Cap 85%` },
      ];
    }
    return [
      { type: 'ADJUST_VOLUME', deltaPct: -10 },
      { type: 'ADD_TAG', tag: `🟡 Stress YELLOW (${total}) → -10% Volume` },
    ];
  },
};
