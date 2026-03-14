// ─────────────────────────────────────────────
//  RECOVERY REDUCER
// ─────────────────────────────────────────────
import type { RecoveryState, ReadinessEntry } from '../../../core/types';

export type RecoveryAction =
  | { type: 'READINESS_ADD';    payload: Omit<ReadinessEntry, 'id'> }
  | { type: 'READINESS_REMOVE'; payload: { id: string } };

export function recoveryReducer(
  state: RecoveryState,
  action: RecoveryAction
): RecoveryState {
  switch (action.type) {

    case 'READINESS_ADD': {
      const entries = [
        { ...action.payload, id: crypto.randomUUID() },
        ...state.readinessHistory,
      ].slice(0, 60); // keep last 60 entries
      return { ...state, readinessHistory: entries };
    }

    case 'READINESS_REMOVE':
      return {
        ...state,
        readinessHistory: state.readinessHistory.filter(r => r.id !== action.payload.id),
      };

    default:
      return state;
  }
}
