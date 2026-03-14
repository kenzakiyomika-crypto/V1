// ═══════════════════════════════════════════════
//  RULE: Mileage Growth  (priority 75)
//
//  A) Max +10% weekly mileage growth
//  B) 2+ missed sessions → FREEZE_MILEAGE
//  C) Readiness < 60    → FREEZE_MILEAGE (no increase)
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const mileageGrowthRule: Rule = {
  id: 'mileage-growth',
  priority: 75,

  when: (ctx) => ctx.weeklyRunKm > 0 || ctx.prevWeekRunKm > 0,

  then: (ctx): RuleEffect[] => {
    const cfg   = ctx.config.endurance;
    const effects: RuleEffect[] = [];

    // B) Missed sessions → freeze
    const missedSessions = Math.round((1 - ctx.compliance7d) * 7);
    if (missedSessions >= cfg.freezeMissedSessions) {
      return [
        { type: 'FREEZE_MILEAGE' },
        { type: 'ADD_TAG', tag: `🚫 Mileage frozen — ${missedSessions} sessions missed` },
      ];
    }

    // C) Low readiness → freeze
    if (ctx.readiness < cfg.freezeReadiness) {
      return [
        { type: 'FREEZE_MILEAGE' },
        { type: 'ADD_TAG', tag: `🚫 Mileage frozen — Readiness ${ctx.readiness} < ${cfg.freezeReadiness}` },
      ];
    }

    // A) Check growth %
    if (ctx.prevWeekRunKm > 0) {
      const growthPct = (ctx.weeklyRunKm - ctx.prevWeekRunKm) / ctx.prevWeekRunKm;
      if (growthPct > cfg.maxWeeklyGrowthPct) {
        const overPct = Math.round((growthPct - cfg.maxWeeklyGrowthPct) * 100);
        effects.push({ type: 'FREEZE_MILEAGE' });
        effects.push({
          type: 'ADD_TAG',
          tag: `⚠️ Mileage growth ${Math.round(growthPct * 100)}% > ${cfg.maxWeeklyGrowthPct * 100}% max → Freeze`,
        });
      } else {
        effects.push({
          type: 'ADD_TAG',
          tag: `✅ Mileage growth OK: ${Math.round(growthPct * 100)}%`,
        });
      }
    }

    return effects;
  },
};
