// ═══════════════════════════════════════════════
//  RULE ENGINE — Priority Resolver
//  Sorts rules by priority and handles
//  early-exit for FORCE_DELOAD scenarios.
// ═══════════════════════════════════════════════
import type { Rule, RuleContext, RuleEffect } from './types';

export interface EvaluationResult {
  firedRules:  string[];
  rawEffects:  RuleEffect[];
  earlyExit:   boolean;  // true if FORCE_DELOAD triggered
}

/**
 * Evaluate all rules in priority order.
 * If a FORCE_DELOAD is produced, continue collecting tags but skip
 * all lower-priority rules' non-tag effects (they won't matter).
 */
export function evaluateRules(
  rules:  Rule[],
  ctx:    RuleContext
): EvaluationResult {
  const ordered = [...rules].sort((a, b) => b.priority - a.priority);

  const firedRules:  string[]      = [];
  const rawEffects:  RuleEffect[]  = [];
  let   earlyExit  = false;

  for (const rule of ordered) {
    if (!rule.when(ctx)) continue;

    const effects = rule.then(ctx);
    firedRules.push(rule.id);

    if (earlyExit) {
      // Post-deload: only collect tags
      rawEffects.push(...effects.filter(e => e.type === 'ADD_TAG'));
    } else {
      rawEffects.push(...effects);
      if (effects.some(e => e.type === 'FORCE_DELOAD')) {
        earlyExit = true;
      }
    }
  }

  return { firedRules, rawEffects, earlyExit };
}
