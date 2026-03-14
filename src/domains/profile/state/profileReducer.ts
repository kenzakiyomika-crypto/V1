// ─────────────────────────────────────────────
//  PROFILE REDUCER
// ─────────────────────────────────────────────
import type { UserProfile } from '../../../core/types';

export type ProfileAction =
  | { type: 'PROFILE_SAVE'; payload: UserProfile }
  | { type: 'PROFILE_CLEAR' };

export function profileReducer(
  state: UserProfile | null,
  action: ProfileAction
): UserProfile | null {
  switch (action.type) {
    case 'PROFILE_SAVE':
      return { ...action.payload, savedAt: new Date().toISOString() };
    case 'PROFILE_CLEAR':
      return null;
    default:
      return state;
  }
}
