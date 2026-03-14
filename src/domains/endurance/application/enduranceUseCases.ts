// ─────────────────────────────────────────────
//  ENDURANCE — Application Use Cases
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import { calcRunPace, calcSwimPace } from '../domain/calcEndurance';
import type { RunType, SwimStroke } from '../../../core/types';

interface SaveRunInput {
  dist: number;
  time: number;
  type: RunType;
  date: string;
  hr: number | null;
  note: string;
}

export function saveRunLog(input: SaveRunInput): void {
  if (!input.dist || !input.time) {
    eventBus.emit(EVENTS.TOAST, 'กรอกระยะและเวลาก่อน');
    return;
  }

  store.dispatch({
    type: 'RUN_ADD',
    payload: {
      ...input,
      pace: calcRunPace(input.dist, input.time),
    },
  });

  eventBus.emit(EVENTS.RUN_LOGGED, input);
  eventBus.emit(EVENTS.TOAST, `บันทึกวิ่ง ${input.dist}km ✓`);
}

interface SaveSwimInput {
  dist: number;
  time: number;
  stroke: SwimStroke;
  date: string;
  laps: number | null;
  note: string;
}

export function saveSwimLog(input: SaveSwimInput): void {
  if (!input.dist || !input.time) {
    eventBus.emit(EVENTS.TOAST, 'กรอกระยะและเวลาก่อน');
    return;
  }

  store.dispatch({
    type: 'SWIM_ADD',
    payload: {
      ...input,
      secPer100: calcSwimPace(input.dist, input.time),
    },
  });

  eventBus.emit(EVENTS.SWIM_LOGGED, input);
  eventBus.emit(EVENTS.TOAST, `บันทึกว่ายน้ำ ${input.dist}ม. ✓`);
}
