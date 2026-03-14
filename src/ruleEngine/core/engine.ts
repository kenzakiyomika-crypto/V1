// ═══════════════════════════════════════════════
//  RULE ENGINE — Runner  (Final Form)
//
//  Flow:
//  1. buildContext(AppState)        → RuleContext
//  2. selectPolicy(trainingPhase)   → Rule[]
//  3. evaluateRules(rules, ctx)     → raw effects + fired ids
//  4. mergeEffects(rawEffects)      → resolved effects
//  5. createAuditEntry(...)         → AuditEntry (explainable)
//  6. return EngineResult
// ═══════════════════════════════════════════════
import type { AppState }        from '../../core/types';
import type { EngineResult, TrainingPhase } from './types';
import type { EngineConfig }     from '../config/globalConfig';
import { DEFAULT_ENGINE_CONFIG }  from '../config/globalConfig';
import { buildContext }          from '../context/contextBuilder';
import { evaluateRules }         from './priorityResolver';
import { mergeEffects }          from './effectMerger';
import { createAuditEntry }      from './auditLogger';
import { selectPolicy }          from '../policies/index';
import type { Rule }             from './types';

// ─────────────────────────────────────────────
//  Main entry point
// ─────────────────────────────────────────────
export function runEngine(
  state:          AppState,
  config:         EngineConfig = DEFAULT_ENGINE_CONFIG,
  overrideRules?: Rule[]        // optional: inject specific rules (testing)
): EngineResult {

  // 1. Build context snapshot
  const ctx = buildContext(state, config);

  // 2. Select policy rules for this phase (or use override)
  const rules = overrideRules ?? selectPolicy(ctx.trainingPhase);

  // 3. Evaluate all rules in priority order
  const { firedRules, rawEffects } = evaluateRules(rules, ctx);

  // 4. Merge & resolve conflicts (deterministic)
  const finalEffects = mergeEffects(rawEffects);

  // 5. Build explainable audit entry
  const audit = createAuditEntry({
    trigger:      'ENGINE_RUN',
    firedRules,
    rawEffects,
    finalEffects,
    ctx,
  });

  return { effects: finalEffects, firedRules, audit, ctx };
}

// ─────────────────────────────────────────────
//  Convenience: run for a specific phase override
//  (useful for planning preview: "what if peak?")
// ─────────────────────────────────────────────
export function runEngineForPhase(
  state:  AppState,
  phase:  TrainingPhase,
  config: EngineConfig = DEFAULT_ENGINE_CONFIG
): EngineResult {
  return runEngine(state, config, selectPolicy(phase));
}
