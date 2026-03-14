// ═══════════════════════════════════════════════
//  RULE: ACR Protection  (priority 98)
//
//  ACR      Action
//  ─────────────────────────────────────────────
//  ≤ 1.2    safe — no action
//  1.3–1.5  -10% volume
//  > 1.5    -20% volume + CANCEL_INTERVALS
//
//  Hard cap: weekly stress spike ≤ 1.6×
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const acrRule: Rule = {
  id: 'acr-protection',
  priority: 98,

  when: (ctx) => ctx.loads.acr > ctx.config.acr.safe,

  then: (ctx): RuleEffect[] => {
    const acr = ctx.loads.acr;
    const cfg = ctx.config.acr;

    if (acr > cfg.danger) {
      return [
        { type: 'ADJUST_VOLUME',    deltaPct: -20 },
        { type: 'CANCEL_INTERVALS' },
        { type: 'ADD_TAG', tag: `🚨 ACR = ${acr.toFixed(2)} (DANGER > ${cfg.danger}) → -20% + Cancel Intervals` },
      ];
    }
    // warning zone: 1.3–1.5
    return [
      { type: 'ADJUST_VOLUME', deltaPct: -10 },
      { type: 'ADD_TAG', tag: `⚠️ ACR = ${acr.toFixed(2)} (WARNING) → -10% Volume` },
    ];
  },
};
