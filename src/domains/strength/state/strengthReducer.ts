// ─────────────────────────────────────────────
//  STRENGTH REDUCER
// ─────────────────────────────────────────────
import type { StrengthState, Exercise, HistoryEntry } from '../../../core/types';

export type StrengthAction =
  | { type: 'EXERCISE_ADD';    payload: Omit<Exercise, 'id' | 'done' | 'collapsed'> }
  | { type: 'EXERCISE_REMOVE'; payload: { id: string } }
  | { type: 'EXERCISE_TOGGLE_COLLAPSE'; payload: { id: string } }
  | { type: 'SET_TOGGLE';      payload: { exerciseId: string; setIndex: number } }
  | { type: 'SET_RESET';       payload: { exerciseId: string } }
  | { type: 'SESSION_RESET' }
  | { type: 'HISTORY_ADD';     payload: Omit<HistoryEntry, 'id'> }
  | { type: 'HISTORY_CLEAR' };

export function strengthReducer(
  state: StrengthState,
  action: StrengthAction
): StrengthState {
  switch (action.type) {

    case 'EXERCISE_ADD':
      return {
        ...state,
        exercises: [
          ...state.exercises,
          {
            ...action.payload,
            id: crypto.randomUUID(),
            done: [],
            collapsed: false,
          },
        ],
      };

    case 'EXERCISE_REMOVE':
      return {
        ...state,
        exercises: state.exercises.filter(e => e.id !== action.payload.id),
      };

    case 'EXERCISE_TOGGLE_COLLAPSE':
      return {
        ...state,
        exercises: state.exercises.map(e =>
          e.id === action.payload.id
            ? { ...e, collapsed: !e.collapsed }
            : e
        ),
      };

    case 'SET_TOGGLE': {
      const { exerciseId, setIndex } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map(e => {
          if (e.id !== exerciseId) return e;
          const already = e.done.includes(setIndex);
          return {
            ...e,
            done: already
              ? e.done.filter(i => i !== setIndex)
              : [...e.done, setIndex],
          };
        }),
      };
    }

    case 'SET_RESET':
      return {
        ...state,
        exercises: state.exercises.map(e =>
          e.id === action.payload.exerciseId ? { ...e, done: [] } : e
        ),
      };

    case 'SESSION_RESET':
      return { ...state, exercises: [] };

    case 'HISTORY_ADD':
      return {
        ...state,
        history: [
          { ...action.payload, id: crypto.randomUUID() },
          ...state.history,
        ],
      };

    case 'HISTORY_CLEAR':
      return { ...state, history: [] };

    default:
      return state;
  }
}
