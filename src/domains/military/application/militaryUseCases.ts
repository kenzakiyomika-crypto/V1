// ─────────────────────────────────────────────
//  MILITARY — Application Use Cases
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import type { MilitaryUnit } from '../../../core/types';

export function saveFitTest(unit: MilitaryUnit, scores: Record<string, number>): void {
  if (!Object.keys(scores).length) {
    eventBus.emit(EVENTS.TOAST, 'กรอกผลอย่างน้อย 1 รายการ');
    return;
  }
  store.dispatch({
    type: 'FIT_TEST_ADD',
    payload: { date: new Date().toISOString(), unit, scores },
  });
  eventBus.emit(EVENTS.FIT_TEST_SAVED, { unit, scores });
  eventBus.emit(EVENTS.TOAST, 'บันทึกผลแล้ว ✓');
}

export function removeFitTest(id: string): void {
  store.dispatch({ type: 'FIT_TEST_REMOVE', payload: { id } });
}
