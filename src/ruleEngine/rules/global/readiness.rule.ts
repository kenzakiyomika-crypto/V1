// ═══════════════════════════════════════════════
//  RULE: Readiness Adjust  (priority 100)
//
//  Tier    Score    Action
//  ─────────────────────────────────────────────
//  Full    ≥85      none
//  Mild    70–84    -3% load
//  Mod     55–69    -5% load
//  Low     40–54    -15% volume
//  Critical <40     FORCE_DELOAD
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const readinessRule: Rule = {
  id: 'readiness-adjust',
  priority: 100,

  when: () => true,

  then: (ctx): RuleEffect[] => {
    const r   = ctx.readiness;
    const cfg = ctx.config.readiness;

    if (r < cfg.low) {
      return [
        { type: 'FORCE_DELOAD' },
        { type: 'ADD_TAG', tag: `🛌 Deload — Readiness ${r}/100` },
      ];
    }
    if (r < cfg.moderate) {
      return [
        { type: 'ADJUST_VOLUME', deltaPct: -15 },
        { type: 'ADD_TAG', tag: `⚠️ Readiness ต่ำ (${r}) → -15% Volume` },
      ];
    }
    if (r < cfg.mild) {
      return [
        { type: 'ADJUST_LOAD', deltaPct: -5 },
        { type: 'ADD_TAG', tag: `🔶 Readiness ปานกลาง (${r}) → -5% Load` },
      ];
    }
    if (r < cfg.full) {
      return [
        { type: 'ADJUST_LOAD', deltaPct: -3 },
        { type: 'ADD_TAG', tag: `🟡 Readiness (${r}) → -3% Load` },
      ];
    }
    // ≥ 85: full capacity
    return [{ type: 'ADD_TAG', tag: `✅ Readiness ดี (${r}) — ซ้อมเต็มที่` }];
  },
};
