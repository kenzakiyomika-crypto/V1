// ─────────────────────────────────────────────
//  MILITARY REDUCER
// ─────────────────────────────────────────────
import type { MilitaryState, FitTestEntry } from '../../../core/types';

export type MilitaryAction =
  | { type: 'FIT_TEST_ADD';    payload: Omit<FitTestEntry, 'id'> }
  | { type: 'FIT_TEST_REMOVE'; payload: { id: string } };

export function militaryReducer(
  state: MilitaryState,
  action: MilitaryAction
): MilitaryState {
  switch (action.type) {

    case 'FIT_TEST_ADD':
      return {
        ...state,
        fitTestHistory: [
          { ...action.payload, id: crypto.randomUUID() },
          ...state.fitTestHistory,
        ],
      };

    case 'FIT_TEST_REMOVE':
      return {
        ...state,
        fitTestHistory: state.fitTestHistory.filter(f => f.id !== action.payload.id),
      };

    default:
      return state;
  }
}
