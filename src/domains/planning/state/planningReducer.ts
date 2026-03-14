// ─────────────────────────────────────────────
//  PLANNING REDUCER
// ─────────────────────────────────────────────
import type { PlanningState, ExamEntry, SavedPlan } from '../../../core/types';

export type PlanningAction =
  | { type: 'EXAM_ADD';       payload: Omit<ExamEntry, 'id'> }
  | { type: 'EXAM_DELETE';    payload: { id: string } }
  | { type: 'PLAN_SAVE';      payload: Omit<SavedPlan, 'id'> }
  | { type: 'PLAN_DELETE';    payload: { id: string } };

export function planningReducer(
  state: PlanningState,
  action: PlanningAction
): PlanningState {
  switch (action.type) {

    case 'EXAM_ADD':
      return {
        ...state,
        exams: [{ ...action.payload, id: crypto.randomUUID() }, ...state.exams],
      };

    case 'EXAM_DELETE':
      return {
        ...state,
        exams: state.exams.filter(e => e.id !== action.payload.id),
      };

    case 'PLAN_SAVE': {
      const plans = [
        { ...action.payload, id: crypto.randomUUID() },
        ...state.savedPlans,
      ].slice(0, 20); // max 20 saved plans
      return { ...state, savedPlans: plans };
    }

    case 'PLAN_DELETE':
      return {
        ...state,
        savedPlans: state.savedPlans.filter(p => p.id !== action.payload.id),
      };

    default:
      return state;
  }
}
