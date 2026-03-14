// ═══════════════════════════════════════════════
//  RULE: Phase Endurance  (priority 70)
//
//  Adapts endurance training to exam phase:
//  far   → Base Zone 2 only
//  build → Intervals OK if recovery allows
//  peak  → -10% volume, keep intensity
//  taper → -40% volume, cancel intervals
//  race  → FORCE_DELOAD (warm-up only)
// ═══════════════════════════════════════════════
import type { Rule, RuleEffect } from '../../core/types';

export const phaseEnduranceRule: Rule = {
  id: 'phase-endurance',
  priority: 70,

  when: (ctx) => ctx.examPhase !== 'none' && ctx.examPhase !== 'past',

  then: (ctx): RuleEffect[] => {
    const cfg = ctx.config;

    switch (ctx.examPhase) {
      case 'far':
        return [
          { type: 'ADD_TAG', tag: '🌱 Base Phase — Zone 2 Focus, no speed escalation' },
        ];

      case 'build': {
        const blocked =
          ctx.loads.acr >= cfg.acr.warning ||
          ctx.readiness  <  cfg.readiness.moderate;
        if (blocked) {
          return [
            { type: 'CANCEL_INTERVALS' },
            { type: 'ADD_TAG', tag: '🔨 Build — Interval blocked (recovery ต่ำ)' },
          ];
        }
        return [{ type: 'ADD_TAG', tag: '🔨 Build — Interval training OK' }];
      }

      case 'peak':
        return [
          { type: 'ADJUST_VOLUME', deltaPct: -10 },
          { type: 'ADD_TAG', tag: '🔥 Peak Phase — รักษา Intensity, ลด Volume 10%' },
        ];

      case 'taper':
        return [
          { type: 'ADJUST_VOLUME',    deltaPct: -40 },
          { type: 'CANCEL_INTERVALS' },
          { type: 'ADD_TAG', tag: '🎯 Taper — Volume -40%, งด Intervals' },
        ];

      case 'race':
        return [
          { type: 'FORCE_DELOAD' },
          { type: 'ADD_TAG', tag: '🏁 Race Day — Warm-up only' },
        ];

      default:
        return [];
    }
  },
};
