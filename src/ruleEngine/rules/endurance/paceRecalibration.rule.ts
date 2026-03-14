// ═══════════════════════════════════════════════
//  RULE: Pace Recalibration  (priority 68)
//
//  ใช้ avgPaceThisWeek / avgPacePrevWeek จาก RuleContext
//  (คำนวณใน workloadModel จาก RunEntry.pace จริง min/km)
//
//  pace lower = faster = improvement
//  changePct positive = pace improved
//
//  ≥ +3%  → RECALIBRATE_PACE up
//  ≤ -3%  → RECALIBRATE_PACE down (threshold -5%)
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const paceRecalibrationRule: Rule = {
  id: 'pace-recalibration',
  priority: 68,

  when: (ctx): boolean =>
    ctx.avgPaceThisWeek > 0 && ctx.avgPacePrevWeek > 0,

  then: (ctx): RuleEffect[] => {
    const cfg      = ctx.config.endurance;
    const recent   = ctx.avgPaceThisWeek;   // min/km — lower = faster
    const previous = ctx.avgPacePrevWeek;

    // positive = got faster (pace decreased)
    const changePct = (previous - recent) / previous;

    if (changePct >= cfg.paceImprovePct) {
      return [
        { type: 'RECALIBRATE_PACE', direction: 'up', pct: changePct },
        {
          type: 'ADD_TAG',
          tag: `⬆️ Pace +${(changePct * 100).toFixed(1)}% `
             + `(${recent.toFixed(2)} → ${previous.toFixed(2)} min/km)`,
        },
      ];
    }

    if (changePct <= -cfg.paceDropPct) {
      return [
        { type: 'RECALIBRATE_PACE', direction: 'down', pct: cfg.paceDropCut },
        {
          type: 'ADD_TAG',
          tag: `⬇️ Pace -${(Math.abs(changePct) * 100).toFixed(1)}% → Threshold -5%`,
        },
      ];
    }

    return [];
  },
};
