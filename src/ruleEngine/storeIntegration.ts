// ═══════════════════════════════════════════════
//  RULE ENGINE — Store Integration  (Final Form)
//  Wires engine into existing store + eventBus
//  WITHOUT touching any existing domain files.
// ═══════════════════════════════════════════════
import { store }            from '../core/store';
import { eventBus, EVENTS } from '../app/eventBus';
import { logger }           from '../infra/logger';
import { runEngine }        from './core/engine';
import { applyEffects, getVariation } from './core/applyEffects';
import { getAuditLog, getLastAudit } from './core/auditLogger';
import { DEFAULT_ENGINE_CONFIG }     from './config/globalConfig';
import type { EngineConfig }         from './config/globalConfig';
// Season import is static — no await needed
import { resolvePhaseFromSeason }    from './core/seasonSystem';

// ─────────────────────────────────────────────
//  Config
// ─────────────────────────────────────────────
let _config: EngineConfig = DEFAULT_ENGINE_CONFIG;

export function setEngineConfig(cfg: EngineConfig): void { _config = cfg; }
export function getEngineConfig(): EngineConfig           { return _config; }
export { getAuditLog, getLastAudit };

// ─────────────────────────────────────────────
//  Persist CHANGE_VARIATION / RESET_TO_90PCT
//  These structural changes must write to history
//  so future engine runs see the updated baseline.
// ─────────────────────────────────────────────
import type { RuleEffect } from './core/types';

function persistStructuralChanges(effects: RuleEffect[]): void {
  const structural = effects.filter(
    e => e.type === 'RESET_TO_90PCT' || e.type === 'CHANGE_VARIATION'
  );
  if (!structural.length) return;

  const state = store.getState();

  for (const effect of structural) {
    if (effect.type !== 'RESET_TO_90PCT' && effect.type !== 'CHANGE_VARIATION') continue;

    const liftId = effect.liftId;

    // Find matching exercise in current session
    const ex = state.strength.exercises.find(
      e => e.name.toLowerCase().includes(liftId.toLowerCase())
    );
    if (!ex) continue;

    if (effect.type === 'RESET_TO_90PCT') {
      // Log a "reset" history entry so future streak calc sees a new baseline
      store.dispatch({
        type: 'HISTORY_ADD',
        payload: {
          date:      new Date().toISOString(),
          exercise:  ex.name,
          sets:      ex.sets,
          reps:      ex.reps,
          weight:    ex.weight !== null ? Math.round(ex.weight * 0.9 * 10) / 10 : null,
          intensity: Math.min(ex.intensity, 90),
          rpe:       Math.min(ex.rpe, 8),
          note:      '[Rule] Reset to 90% — failure escalation',
        },
      });
      logger.debug('[RuleEngine] persisted RESET_TO_90PCT for', ex.name);
    }

    if (effect.type === 'CHANGE_VARIATION') {
      // The exercise name already changed in applyEffects.
      // Log the new variation name so next session uses it as baseline.
      const newName = getVariation(ex.name);

      store.dispatch({
        type: 'HISTORY_ADD',
        payload: {
          date:      new Date().toISOString(),
          exercise:  newName,
          sets:      ex.sets,
          reps:      ex.reps,
          weight:    ex.weight !== null ? Math.round(ex.weight * 0.9 * 10) / 10 : null,
          intensity: Math.min(ex.intensity, 80),
          rpe:       Math.min(ex.rpe, 7),
          note:      `[Rule] Variation change from ${ex.name} — 4-week stall`,
        },
      });
      logger.debug('[RuleEngine] persisted CHANGE_VARIATION:', ex.name, '→', newName);
    }
  }
}

// ─────────────────────────────────────────────
//  Core evaluate-and-apply (sync — no await)
// ─────────────────────────────────────────────
function evaluateAndApply(trigger: string): void {
  const state = store.getState();

  // Run engine
  const result = runEngine(state, _config);
  const { effects, firedRules, audit, ctx } = result;

  // Season volumeModifier — resolved synchronously
  const seasonResolved = _config.season
    ? resolvePhaseFromSeason(_config.season)
    : null;
  const volumeModifier = seasonResolved?.volumeModifier ?? 1.0;

  logger.debug('[RuleEngine]', trigger, {
    phase:      ctx.trainingPhase,
    examPhase:  ctx.examPhase,
    stressZone: ctx.stressZone,
    acr:        ctx.loads.acr,
    readiness:  ctx.readiness,
    firedRules,
  });

  const actionableEffects = effects.filter(e => e.type !== 'ADD_TAG');
  const hasExercises      = state.strength.exercises.length > 0;

  if (hasExercises && actionableEffects.length > 0) {
    // 1. Persist structural changes BEFORE replacing exercise list
    persistStructuralChanges(effects);

    // 2. Apply all effects → new exercise list
    const { exercises: adjusted, freezeMileage, addInterval, paceRecalibrate } =
      applyEffects(state.strength.exercises, effects, volumeModifier);

    // 3. Replace exercise list (SESSION_RESET + re-add)
    store.dispatch({ type: 'SESSION_RESET' });
    adjusted.forEach(ex => {
      store.dispatch({
        type: 'EXERCISE_ADD',
        payload: {
          name:      ex.name,
          sets:      ex.sets,
          reps:      ex.reps,
          weight:    ex.weight,
          intensity: ex.intensity,
          rpe:       ex.rpe,
        },
      });
    });

    // 4. Emit side-effect flags
    if (freezeMileage)   eventBus.emit('RULE_FREEZE_MILEAGE', {});
    if (addInterval)     eventBus.emit('RULE_ADD_INTERVAL', {});
    if (paceRecalibrate) eventBus.emit('RULE_PACE_RECALIBRATE', paceRecalibrate);
  }

  // Always emit audit event
  eventBus.emit('RULE_ENGINE_APPLIED', {
    trigger,
    firedRules,
    effects,
    audit,
    explanation: audit.explanation,
    tags:        audit.tags,
    ctx: {
      readiness:   ctx.readiness,
      stressZone:  ctx.stressZone,
      acr:         ctx.loads.acr,
      totalStress: ctx.loads.totalRaw,
      examPhase:   ctx.examPhase,
      weekNum:     ctx.weekNum,
    },
  });

  if (audit.tags.length && actionableEffects.length > 0) {
    eventBus.emit(EVENTS.TOAST, `🔧 ${audit.tags[0]}`);
  }
}

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────
let _initialized = false;

export function initRuleEngine(config?: EngineConfig): void {
  if (_initialized) return;
  _initialized = true;
  if (config) _config = config;

  eventBus.on(EVENTS.READINESS_LOGGED, () => evaluateAndApply('READINESS_LOGGED'));
  eventBus.on(EVENTS.WORKOUT_LOGGED,   () => evaluateAndApply('WORKOUT_LOGGED'));
  eventBus.on(EVENTS.RUN_LOGGED,       () => evaluateAndApply('RUN_LOGGED'));
  eventBus.on(EVENTS.PLAN_LOADED, () => {
    setTimeout(() => evaluateAndApply('PLAN_LOADED'), 80);
  });

  logger.info('[RuleEngine] initialised');
}

export function triggerEngineManually(): void {
  evaluateAndApply('MANUAL');
}
