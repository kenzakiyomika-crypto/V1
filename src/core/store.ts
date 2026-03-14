// ─────────────────────────────────────────────
//  CORE STORE — Single Source of Truth
//  Reducer + dispatch pattern
// ─────────────────────────────────────────────
import type { AppState } from './types';
import { loadState, saveState } from '../infra/persistence';
import { eventBus, EVENTS } from '../app/eventBus';
import { rootReducer, AppAction } from './rootReducer';
import { logger } from '../infra/logger';

class Store {
  private state: AppState;
  private subscribers: Array<(state: AppState) => void> = [];

  constructor() {
    this.state = loadState();
    logger.info('[Store] initialised, version:', this.state.version);
  }

  getState(): AppState {
    return this.state;
  }

  dispatch(action: AppAction): void {
    const prev = this.state;
    this.state = rootReducer(prev, action);

    if (this.state !== prev) {
      saveState(this.state);
      eventBus.emit(EVENTS.STATE_CHANGED, { action, state: this.state });
      this.subscribers.forEach(fn => fn(this.state));
    }

    logger.debug('[Store] dispatch', action.type);
  }

  subscribe(fn: (state: AppState) => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  /** Select a slice of state (memoisation-friendly) */
  select<T>(selector: (state: AppState) => T): T {
    return selector(this.state);
  }
}

export const store = new Store();
