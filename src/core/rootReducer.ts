// ─────────────────────────────────────────────
//  ROOT REDUCER — combines all domain reducers
// ─────────────────────────────────────────────
import type { AppState } from './types';
import { strengthReducer, StrengthAction } from '../domains/strength/state/strengthReducer';
import { enduranceReducer, EnduranceAction } from '../domains/endurance/state/enduranceReducer';
import { militaryReducer, MilitaryAction } from '../domains/military/state/militaryReducer';
import { planningReducer, PlanningAction } from '../domains/planning/state/planningReducer';
import { recoveryReducer, RecoveryAction } from '../domains/recovery/state/recoveryReducer';
import { profileReducer, ProfileAction } from '../domains/profile/state/profileReducer';

export type AppAction =
  | StrengthAction
  | EnduranceAction
  | MilitaryAction
  | PlanningAction
  | RecoveryAction
  | ProfileAction
  | { type: 'RESET_ALL' };

export function rootReducer(state: AppState, action: AppAction): AppState {
  if (action.type === 'RESET_ALL') {
    return {
      version: state.version,
      profile: null,
      strength:  { exercises: [], history: [] },
      endurance: { runs: [], swims: [] },
      military:  { fitTestHistory: [] },
      planning:  { exams: [], savedPlans: [] },
      recovery:  { readinessHistory: [] },
    };
  }

  return {
    ...state,
    profile:   profileReducer(state.profile, action as ProfileAction),
    strength:  strengthReducer(state.strength, action as StrengthAction),
    endurance: enduranceReducer(state.endurance, action as EnduranceAction),
    military:  militaryReducer(state.military, action as MilitaryAction),
    planning:  planningReducer(state.planning, action as PlanningAction),
    recovery:  recoveryReducer(state.recovery, action as RecoveryAction),
  };
}
