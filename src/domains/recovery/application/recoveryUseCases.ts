// ─────────────────────────────────────────────
//  RECOVERY — Application Use Cases
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import { calcReadinessScore, type ReadinessInput } from '../domain/calcReadiness';

export function saveReadinessLog(input: ReadinessInput): void {
  const result = calcReadinessScore(input);
  store.dispatch({
    type: 'READINESS_ADD',
    payload: {
      date: new Date().toISOString(),
      score: result.score,
      ...input,
    },
  });
  eventBus.emit(EVENTS.READINESS_LOGGED, { score: result.score });
  eventBus.emit(EVENTS.TOAST, 'บันทึก Readiness แล้ว ✓');
}
