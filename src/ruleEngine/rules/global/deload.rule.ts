// ═══════════════════════════════════════════════
//  RULE: Deload Trigger  (priority 97)
//
//  Triggers if ANY 1 condition is true:
//  1. 4th accumulation week (weekNum % 4 === 0)
//  2. 3 readings < 55 in last 3 days
//  3. 2+ lifts stalled (4-week no progress)
//  4. ACR > 1.5 (handled by ACR rule, but deload escalates)
//
//  Effect: Volume -40%, Intensity cap 80%, Remove top set
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const deloadTriggerRule: Rule = {
  id: 'deload-trigger',
  priority: 97,

  when: (ctx): boolean => {
    const cfg = ctx.config.deload;
    const reasons: boolean[] = [
      // 1. Every N accumulation weeks
      ctx.weekNum > 0 && ctx.weekNum % cfg.accumulationWeeks === 0,
      // 2. Readiness too low for N consecutive days
      ctx.readiness3dMin < cfg.readinessThresh,
      // 3. Multiple lifts stalled
      ctx.stalledLifts.length >= cfg.stalledLiftCount,
      // 4. ACR danger zone
      ctx.loads.acr > ctx.config.acr.danger,
    ];
    return reasons.some(Boolean);
  },

  then: (ctx): RuleEffect[] => {
    const cfg = ctx.config.deload;

    // Build reason string
    const reasons: string[] = [];
    if (ctx.weekNum % cfg.accumulationWeeks === 0)
      reasons.push(`Week ${ctx.weekNum} (รอบ Deload)`);
    if (ctx.readiness3dMin < cfg.readinessThresh)
      reasons.push(`Readiness 3d min = ${ctx.readiness3dMin}`);
    if (ctx.stalledLifts.length >= cfg.stalledLiftCount)
      reasons.push(`${ctx.stalledLifts.length} lifts stalled`);
    if (ctx.loads.acr > ctx.config.acr.danger)
      reasons.push(`ACR = ${ctx.loads.acr.toFixed(2)}`);

    return [
      { type: 'FORCE_DELOAD' },
      { type: 'ADD_TAG', tag: `🔄 Deload: ${reasons.join(' | ')}` },
    ];
  },
};
