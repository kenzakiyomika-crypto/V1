// ═══════════════════════════════════════════════
//  RULE: Failure Escalation  (priority 60)
//
//  Pattern    Action
//  ─────────────────────────────────────────────
//  1 fail     repeat (no effect)
//  2 fails    -5% load
//  3 fails    RESET_TO_90PCT 1RM
//  4-wk stall CHANGE_VARIATION
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const failureEscalationRule: Rule = {
  id: 'failure-escalation',
  priority: 60,

  when: (ctx): boolean =>
    Object.keys(ctx.failStreak).length > 0 || ctx.stalledLifts.length > 0,

  then: (ctx): RuleEffect[] => {
    const effects: RuleEffect[] = [];
    const cfg = ctx.config.failure;

    // ── Per-lift failure escalation ────────
    for (const [liftId, fails] of Object.entries(ctx.failStreak)) {
      if (fails >= cfg.resetAt) {
        effects.push({ type: 'RESET_TO_90PCT', liftId });
        effects.push({
          type: 'ADD_TAG',
          tag: `⛔ ${liftId}: ${fails} fails → Reset to 90% 1RM`,
        });
      } else if (fails >= cfg.deloadAt) {
        effects.push({
          type: 'ADJUST_LOAD',
          liftId,
          deltaPct: -cfg.loadCutPct,
        });
        effects.push({
          type: 'ADD_TAG',
          tag: `🔻 ${liftId}: ${fails} fails → -${cfg.loadCutPct}% Load`,
        });
      }
      // 1 fail: repeat — no effect needed
    }

    // ── 4-week stall: change variation ────
    for (const liftId of ctx.stalledLifts) {
      // Only if not already getting a reset
      if (!ctx.failStreak[liftId] || ctx.failStreak[liftId] < cfg.resetAt) {
        effects.push({ type: 'CHANGE_VARIATION', liftId });
        effects.push({
          type: 'ADD_TAG',
          tag: `🔄 ${liftId}: 4-week stall → Change Variation`,
        });
      }
    }

    return effects;
  },
};
