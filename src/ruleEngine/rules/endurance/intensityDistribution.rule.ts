// ═══════════════════════════════════════════════
//  RULE: 80/20 Intensity Distribution  (priority 72)
//
//  Target: 75–85% easy, 15–25% high intensity
//
//  If > 25% high Z → ADJUST_VOLUME -20% intervals
//  If < 15% high Z → ADD_INTERVAL
//  Long run > 30%  → ADJUST_VOLUME redistribute
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const intensityDistributionRule: Rule = {
  id: 'intensity-distribution',
  priority: 72,

  when: (ctx) => ctx.weeklyRunKm > 0,

  then: (ctx): RuleEffect[] => {
    const cfg = ctx.config.endurance;
    const effects: RuleEffect[] = [];
    const hiPct  = ctx.highIntensityPct;
    const lrPct  = ctx.longRunPct;

    // ── High intensity too much → reduce intervals
    if (hiPct > cfg.highIntensityMax) {
      effects.push({ type: 'ADJUST_VOLUME', deltaPct: -20 });
      effects.push({
        type: 'ADD_TAG',
        tag: `🔴 High-intensity ${Math.round(hiPct * 100)}% > ${cfg.highIntensityMax * 100}% → ลด Interval -20%`,
      });
    }
    // ── High intensity too little → add interval
    else if (hiPct < cfg.highIntensityMin) {
      effects.push({ type: 'ADD_INTERVAL' });
      effects.push({
        type: 'ADD_TAG',
        tag: `🟢 High-intensity ${Math.round(hiPct * 100)}% < ${cfg.highIntensityMin * 100}% → เพิ่ม 1 Interval`,
      });
    } else {
      effects.push({
        type: 'ADD_TAG',
        tag: `✅ 80/20 OK — High: ${Math.round(hiPct * 100)}%`,
      });
    }

    // ── Long run guardrail
    if (lrPct > cfg.longRunMaxPct) {
      effects.push({ type: 'ADJUST_VOLUME', deltaPct: -15 });
      effects.push({
        type: 'ADD_TAG',
        tag: `⚠️ Long Run = ${Math.round(lrPct * 100)}% > ${cfg.longRunMaxPct * 100}% → Auto-redistribute`,
      });
    }

    return effects;
  },
};
