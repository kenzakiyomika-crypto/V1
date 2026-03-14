// ─────────────────────────────────────────────
//  PROFILE — Application Use Cases
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import type { UserProfile } from '../../../core/types';

export function saveProfile(profile: Omit<UserProfile, 'savedAt'>): void {
  store.dispatch({
    type: 'PROFILE_SAVE',
    payload: { ...profile, savedAt: new Date().toISOString() },
  });
  eventBus.emit(EVENTS.PROFILE_SAVED, profile);
  eventBus.emit(EVENTS.TOAST, 'บันทึกโปรไฟล์แล้ว ✓');
}
