// ─────────────────────────────────────────────
//  STRENGTH — Application Use Cases
//  Fix: added PLAN_LOADED listener to handle
//  cross-domain plan loading via eventBus
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import type { Exercise } from '../../../core/types';

type AddExerciseInput = {
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  intensity?: number;
  rpe?: number;
};

export function addExercise(input: AddExerciseInput): void {
  if (!input.name?.trim()) return;
  store.dispatch({
    type: 'EXERCISE_ADD',
    payload: {
      name: input.name.trim(),
      sets: input.sets || 3,
      reps: input.reps || '',
      weight: input.weight || null,
      intensity: input.intensity ?? 75,
      rpe: input.rpe ?? 8,
    },
  });
  eventBus.emit(EVENTS.EXERCISE_ADDED, { name: input.name });
}

export function removeExercise(id: string): void {
  store.dispatch({ type: 'EXERCISE_REMOVE', payload: { id } });
  eventBus.emit(EVENTS.EXERCISE_REMOVED, { id });
}

export function toggleSetComplete(exerciseId: string, setIndex: number): void {
  store.dispatch({ type: 'SET_TOGGLE', payload: { exerciseId, setIndex } });

  const updated = store.getState().strength.exercises.find(e => e.id === exerciseId);
  const allDone = updated && updated.done.length >= updated.sets;

  eventBus.emit(EVENTS.SET_COMPLETED, { exerciseId, setIndex, allDone });

  if (allDone && updated) {
    autoLogExercise(updated);
    const defRest = parseInt(
      (document.getElementById('def-rest') as HTMLInputElement)?.value || '90'
    ) || 90;
    eventBus.emit(EVENTS.REST_STARTED, { seconds: defRest });
  }
}

export function autoLogExercise(exercise: Exercise): void {
  store.dispatch({
    type: 'HISTORY_ADD',
    payload: {
      date: new Date().toISOString(),
      exercise: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps || '',
      weight: exercise.weight,
      intensity: exercise.intensity || 75,
      rpe: exercise.rpe || 8,
      note: '',
    },
  });
  eventBus.emit(EVENTS.WORKOUT_LOGGED, { exercise: exercise.name });
  eventBus.emit(EVENTS.TOAST, `✅ ${exercise.name}`);
}

export function logExerciseManual(payload: {
  exerciseId: string;
  sets: number;
  reps: string;
  weight: number | null;
  intensity: number;
  rpe: number;
  note: string;
}): void {
  const ex = store.getState().strength.exercises.find(e => e.id === payload.exerciseId);
  if (!ex) return;
  store.dispatch({
    type: 'HISTORY_ADD',
    payload: {
      date: new Date().toISOString(),
      exercise: ex.name,
      sets: payload.sets,
      reps: payload.reps,
      weight: payload.weight,
      intensity: payload.intensity,
      rpe: payload.rpe,
      note: payload.note,
    },
  });
  eventBus.emit(EVENTS.WORKOUT_LOGGED, { exercise: ex.name });
  eventBus.emit(EVENTS.TOAST, 'บันทึกแล้ว ✓');
}

export function resetSets(exerciseId: string): void {
  store.dispatch({ type: 'SET_RESET', payload: { exerciseId } });
}

export function toggleCollapse(id: string): void {
  store.dispatch({ type: 'EXERCISE_TOGGLE_COLLAPSE', payload: { id } });
}

export function resetSession(): void {
  store.dispatch({ type: 'SESSION_RESET' });
  eventBus.emit(EVENTS.SESSION_RESET);
}

export function clearHistory(): void {
  store.dispatch({ type: 'HISTORY_CLEAR' });
  eventBus.emit(EVENTS.TOAST, 'ลบประวัติแล้ว');
}

// ── Listen for plan loading from planning domain ──
// This is the correct way to receive cross-domain requests via eventBus
eventBus.on<{ name: string; exercises: { name: string; sets: number; reps: string }[] }>(
  EVENTS.PLAN_LOADED,
  (day) => {
    day.exercises.forEach(ex =>
      addExercise({ name: ex.name, sets: ex.sets, reps: ex.reps, weight: null })
    );
  }
);
