// ─────────────────────────────────────────────
//  EVENT BUS  —  Decoupled domain communication
// ─────────────────────────────────────────────

type EventHandler<T = unknown> = (payload: T) => void;

class EventBus {
  private listeners: Map<string, EventHandler[]> = new Map();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    const idx = handlers.indexOf(handler as EventHandler);
    if (idx !== -1) handlers.splice(idx, 1);
  }

  emit<T>(event: string, payload?: T): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    handlers.forEach(h => h(payload));
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

// ── Typed Event Constants ──────────────────────
export const EVENTS = {
  // Strength
  EXERCISE_ADDED:       'EXERCISE_ADDED',
  EXERCISE_REMOVED:     'EXERCISE_REMOVED',
  SET_COMPLETED:        'SET_COMPLETED',
  WORKOUT_LOGGED:       'WORKOUT_LOGGED',
  SESSION_RESET:        'SESSION_RESET',

  // Endurance
  RUN_LOGGED:           'RUN_LOGGED',
  SWIM_LOGGED:          'SWIM_LOGGED',

  // Military
  FIT_TEST_SAVED:       'FIT_TEST_SAVED',

  // Planning
  EXAM_ADDED:           'EXAM_ADDED',
  EXAM_DELETED:         'EXAM_DELETED',
  PLAN_SAVED:           'PLAN_SAVED',
  PLAN_DELETED:         'PLAN_DELETED',
  PLAN_LOADED:          'PLAN_LOADED',

  // Recovery
  READINESS_LOGGED:     'READINESS_LOGGED',

  // Profile
  PROFILE_SAVED:        'PROFILE_SAVED',

  // UI
  TAB_CHANGED:          'TAB_CHANGED',
  TOAST:                'TOAST',
  REST_STARTED:         'REST_STARTED',
  REST_STOPPED:         'REST_STOPPED',

  // State
  STATE_CHANGED:        'STATE_CHANGED',
} as const;
