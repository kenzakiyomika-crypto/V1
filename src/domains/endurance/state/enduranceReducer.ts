// ─────────────────────────────────────────────
//  ENDURANCE REDUCER
// ─────────────────────────────────────────────
import type { EnduranceState, RunEntry, SwimEntry } from '../../../core/types';

export type EnduranceAction =
  | { type: 'RUN_ADD';    payload: Omit<RunEntry,  'id'> }
  | { type: 'RUN_REMOVE'; payload: { id: string } }
  | { type: 'SWIM_ADD';   payload: Omit<SwimEntry, 'id'> }
  | { type: 'SWIM_REMOVE';payload: { id: string } };

export function enduranceReducer(
  state: EnduranceState,
  action: EnduranceAction
): EnduranceState {
  switch (action.type) {

    case 'RUN_ADD':
      return {
        ...state,
        runs: [{ ...action.payload, id: crypto.randomUUID() }, ...state.runs],
      };

    case 'RUN_REMOVE':
      return {
        ...state,
        runs: state.runs.filter(r => r.id !== action.payload.id),
      };

    case 'SWIM_ADD':
      return {
        ...state,
        swims: [{ ...action.payload, id: crypto.randomUUID() }, ...state.swims],
      };

    case 'SWIM_REMOVE':
      return {
        ...state,
        swims: state.swims.filter(s => s.id !== action.payload.id),
      };

    default:
      return state;
  }
}
