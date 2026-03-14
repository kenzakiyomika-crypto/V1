// ═══════════════════════════════════════════════
//  RULE: Hybrid Same-Day Conflict  (priority 80)
//
//  If heavy squat (≥85% 1RM) + Interval Z4+ same day:
//    → Reduce squat volume -20%
//    OR move interval to next day (flag via tag)
//
//  If endurance load > 60% total stress:
//    → Cap strength intensity at 85%
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const hybridInterferenceRule: Rule = {
  id: 'hybrid-interference',
  priority: 80,

  when: (ctx): boolean => {
    const cfg = ctx.config.hybrid;
    const enduranceDominant =
      ctx.loads.totalRaw > 0 &&
      ctx.loads.enduranceRaw / ctx.loads.totalRaw > cfg.enduranceDomCap;

    return ctx.hasSameDayConflict || enduranceDominant;
  },

  then: (ctx): RuleEffect[] => {
    const cfg     = ctx.config.hybrid;
    const effects: RuleEffect[] = [];

    // ── Same-day: heavy squat + high interval ──
    if (ctx.hasSameDayConflict) {
      effects.push({
        type: 'ADJUST_VOLUME',
        liftId: 'squat',
        deltaPct: -cfg.sameDayVolumeCut,
      });
      effects.push({
        type: 'ADD_TAG',
        tag: `⚡ Hybrid conflict: Squat volume -${cfg.sameDayVolumeCut}% (heavy squat + interval ซ้อนวัน)`,
      });
    }

    // ── Endurance dominant → cap strength intensity ──
    const enduranceDominant =
      ctx.loads.totalRaw > 0 &&
      ctx.loads.enduranceRaw / ctx.loads.totalRaw > cfg.enduranceDomCap;

    if (enduranceDominant) {
      effects.push({
        type: 'LOCK_INTENSITY',
        capPct: cfg.strIntensityCapHybrid,
      });
      const pct = Math.round(
        (ctx.loads.enduranceRaw / ctx.loads.totalRaw) * 100
      );
      effects.push({
        type: 'ADD_TAG',
        tag: `🏃 Endurance dominant (${pct}% total) → Strength cap ${Math.round(cfg.strIntensityCapHybrid * 100)}%`,
      });
    }

    return effects;
  },
};
