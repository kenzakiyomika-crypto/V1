// ─────────────────────────────────────────────
//  PLANNING — Application Use Cases
//  Bug fix: removed direct cross-domain import
//  loadDayToWorkout now uses eventBus instead
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import { generateWorkoutPlan } from '../domain/planningLogic';
import type { ExamUnit, PlanStyle, PlanDay } from '../../../core/types';

export function addExam(input: {
  name: string;
  unit: ExamUnit;
  date: string;
  prepDays: number;
}): void {
  if (!input.name?.trim() || !input.date) {
    eventBus.emit(EVENTS.TOAST, 'กรอกชื่อและวันสอบก่อน');
    return;
  }
  store.dispatch({ type: 'EXAM_ADD', payload: input });
  eventBus.emit(EVENTS.EXAM_ADDED, input);
  eventBus.emit(EVENTS.TOAST, `เพิ่ม "${input.name}" แล้ว ✓`);
}

export function deleteExam(id: string): void {
  store.dispatch({ type: 'EXAM_DELETE', payload: { id } });
  eventBus.emit(EVENTS.EXAM_DELETED, { id });
}

export function generateAndPreviewPlan(
  style: PlanStyle,
  weekNum: number
): ReturnType<typeof generateWorkoutPlan> & { planName: string } {
  const profile = store.getState().profile;
  const days = profile?.days ?? 3;
  const result = generateWorkoutPlan(days, weekNum, style);
  return { ...result, planName: `${days} Day Split` };
}

export function savePlan(
  planName: string,
  style: PlanStyle,
  weekNum: number,
  weekLabel: string,
  days: PlanDay[]
): void {
  store.dispatch({
    type: 'PLAN_SAVE',
    payload: {
      planName,
      style,
      createdAt: new Date().toISOString(),
      planData: { planName, weekNum, weekLabel, days },
    },
  });
  eventBus.emit(EVENTS.PLAN_SAVED, { planName });
  eventBus.emit(EVENTS.TOAST, 'บันทึกตารางแล้ว ✓');
}

export function deletePlan(id: string): void {
  store.dispatch({ type: 'PLAN_DELETE', payload: { id } });
  eventBus.emit(EVENTS.PLAN_DELETED, { id });
}

/**
 * Load a plan day into the workout session.
 * Uses eventBus to avoid cross-domain direct import of strength use cases.
 * Strength domain listens for PLAN_DAY_LOAD_REQUESTED and handles the actual
 * addExercise calls internally.
 */
export function loadDayToWorkout(day: {
  name: string;
  exercises: { name: string; sets: number; reps: string }[];
}): void {
  // Emit event — strength domain handles this
  eventBus.emit(EVENTS.PLAN_LOADED, day);
  eventBus.emit(EVENTS.TAB_CHANGED, 'workout');
  eventBus.emit(EVENTS.TOAST, `โหลด ${day.name} แล้ว ✓`);
}
