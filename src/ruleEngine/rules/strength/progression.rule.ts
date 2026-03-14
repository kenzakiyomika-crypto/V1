// ═══════════════════════════════════════════════
//  RULE: Strength Progression  (priority 50)
//
//  Condition stack (ALL must be true):
//  ✓ Compliance ≥ 85%
//  ✓ No failure last 2 weeks (failStreak = 0)
//  ✓ Readiness ≥ 70
//  ✓ Stress Zone ≠ RED
//
//  Then: +2.5% main lift (3-session streak)
//        +1.5% accessory
//        Never exceed phase max %
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

// Main lifts (compound movements)
const MAIN_LIFTS = new Set([
  'squat', 'bench press', 'deadlift', 'ohp', 'overhead press',
  'romanian dl', 'barbell row', 'pull-up',
]);

function isMainLift(name: string): boolean {
  const lower = name.toLowerCase();
  return [...MAIN_LIFTS].some(m => lower.includes(m));
}

export const strengthProgressionRule: Rule = {
  id: 'strength-progression',
  priority: 50,

  when: (ctx): boolean => {
    const cfg = ctx.config.progression;
    return (
      ctx.compliance7d >= cfg.complianceMin &&
      ctx.stressZone   !== 'RED' &&
      ctx.readiness    >= cfg.readinessMin
    );
  },

  then: (ctx): RuleEffect[] => {
    const effects: RuleEffect[] = [];
    const cfg = ctx.config.progression;

    for (const [liftId, streak] of Object.entries(ctx.successStreak)) {
      // Skip if has recent failure
      if ((ctx.failStreak[liftId] ?? 0) > 0) continue;
      // Needs minimum streak
      if (streak < cfg.successStreak) continue;

      const main = isMainLift(liftId);
      const deltaPct = main ? cfg.mainLiftPct : cfg.accessoryPct;

      effects.push({ type: 'ADJUST_LOAD', liftId, deltaPct });
    }

    if (effects.length > 0) {
      effects.push({
        type: 'ADD_TAG',
        tag: `📈 Progressive Overload → +${cfg.mainLiftPct}% (main) / +${cfg.accessoryPct}% (accessory)`,
      });
    }

    return effects;
  },
};
