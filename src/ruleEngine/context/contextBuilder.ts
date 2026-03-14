// ═══════════════════════════════════════════════
//  RULE ENGINE — Context Builder  (Final Form)
//  Assembles RuleContext from AppState using
//  dedicated sub-models for each domain.
// ═══════════════════════════════════════════════
import type { AppState, HistoryEntry, RunEntry } from '../../core/types';
import type { RuleContext, ExamPhaseLabel, TrainingPhase } from '../core/types';
import type { EngineConfig }                      from '../config/globalConfig';
import { calculateStressZone }                    from '../core/stressCalculator';
import { buildWorkloadSnapshot }                  from './workloadModel';
import { buildReadinessTrend }                    from './readinessModel';
import { buildFatigueSnapshot }                   from './fatigueModel';
import { calcWeeklyMuscleVolume, classifyMuscleVolumes } from '../rules/strength/volumeLandmark.rule';
import { getExamPhase, daysUntilExam }            from '../../domains/planning/domain/planningLogic';
import { resolvePhaseFromSeason, calcSeasonWeek } from '../core/seasonSystem';

function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

function calcStreaks(history: HistoryEntry[]): {
  failStreak:    Record<string, number>;
  successStreak: Record<string, number>;
  stalledLifts:  string[];
} {
  const byDay = new Map<string, Set<string>>();
  [...history]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .forEach(h => {
      const day = new Date(h.date).toDateString();
      if (!byDay.has(day)) byDay.set(day, new Set());
      byDay.get(day)!.add(h.exercise);
    });

  const days         = [...byDay.entries()];
  const allExercises = new Set(history.map(h => h.exercise));
  const failStreak:    Record<string, number> = {};
  const successStreak: Record<string, number> = {};
  const stalledLifts:  string[] = [];

  allExercises.forEach(ex => {
    let succ = 0, fail = 0;
    for (const [, exs] of days) {
      if (exs.has(ex)) { succ++; fail = 0; }
      else             { fail++; succ = 0; }
    }
    if (succ > 0) successStreak[ex] = succ;
    if (fail > 0) failStreak[ex]    = fail;

    const recent = history.filter(h => h.exercise === ex && daysAgo(h.date) <= 28);
    if (recent.length >= 4) {
      const weights = recent.map(h => h.weight ?? 0);
      if (Math.max(...weights) - Math.min(...weights) < 1) stalledLifts.push(ex);
    }
  });

  return { failStreak, successStreak, stalledLifts };
}

function detectSameDayConflict(
  history: HistoryEntry[],
  runs:    RunEntry[],
  config:  EngineConfig
): boolean {
  const squat7d = history.filter(
    h => daysAgo(h.date) <= 7 &&
         h.exercise.toLowerCase().includes('squat') &&
         (h.intensity ?? 0) >= config.hybrid.squatHeavyThresh * 100
  );
  for (const sq of squat7d) {
    const sqDay = new Date(sq.date).toDateString();
    if (runs.some(r =>
      new Date(r.date).toDateString() === sqDay &&
      (r.type === 'interval' || r.type === 'tempo')
    )) return true;
  }
  return false;
}

function examPhaseToTrainingPhase(exam: ExamPhaseLabel): TrainingPhase {
  const map: Record<ExamPhaseLabel, TrainingPhase> = {
    far: 'endurance_base', build: 'hybrid', peak: 'peak',
    taper: 'deload', race: 'deload', past: 'none', none: 'none',
  };
  return map[exam];
}

function calcWeekNumFromExams(state: AppState): number {
  const first = [...state.planning.exams]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  if (!first) return 1;
  const elapsed = first.prepDays - daysUntilExam(first.date);
  return Math.max(1, Math.ceil(elapsed / 7));
}

// ═══════════════════════════════════════════════
//  MAIN BUILDER
// ═══════════════════════════════════════════════
export function buildContext(state: AppState, config: EngineConfig): RuleContext {
  const today = new Date().toISOString().split('T')[0];

  // 1. Workload model
  const wl = buildWorkloadSnapshot(
    state.strength.history,
    state.endurance.runs,
    state.endurance.swims
  );
  const loads = {
    strengthRaw:  wl.strengthRaw7d,
    enduranceRaw: wl.enduranceRaw7d,
    totalRaw:     wl.totalRaw7d,
    acuteLoad:    wl.acuteLoad,
    chronicLoad:  wl.chronicLoad,
    acr:          wl.acr,
  };
  const stressZone = calculateStressZone(loads.totalRaw, config);

  // 2. Readiness model
  const readinessTrend = buildReadinessTrend(
    state.recovery.readinessHistory,
    config.readiness.moderate
  );
  const readiness      = readinessTrend.latest;
  const readiness3dMin = readinessTrend.min3d;

  // 3. Fatigue snapshot (systemic + per-muscle decay)
  const fatigueSnapshot = buildFatigueSnapshot(state.strength.history);

  // 4. Streaks + stalled
  const { failStreak, successStreak, stalledLifts } =
    calcStreaks(state.strength.history);

  // 5. Endurance distribution
  const weeklyRunKm      = wl.weeklyRunKm;
  const prevWeekRunKm    = wl.prevWeekRunKm;
  const highIntensityPct = wl.weeklyRunTime > 0
    ? wl.highIntensityTime / wl.weeklyRunTime : 0;
  const longRunPct       = wl.weeklyRunTime > 0
    ? wl.longRunTime       / wl.weeklyRunTime : 0;
  const avgPaceThisWeek  = wl.avgPaceThisWeek;
  const avgPacePrevWeek  = wl.avgPacePrevWeek;

  // 6. Hybrid conflict
  const hasSameDayConflict = detectSameDayConflict(
    state.strength.history, state.endurance.runs, config
  );

  // 7. Volume landmarks
  const weeklyMuscleVolume   = calcWeeklyMuscleVolume(state.strength.history);
  const muscleVolumeStatuses = classifyMuscleVolumes(weeklyMuscleVolume, config);

  // 8. Phase resolution — Season > Exam > Default
  const nextExam = [...state.planning.exams]
    .filter(e => daysUntilExam(e.date) >= 0)
    .sort((a, b) => daysUntilExam(a.date) - daysUntilExam(b.date))[0];

  const examPhase: ExamPhaseLabel = nextExam
    ? (getExamPhase(daysUntilExam(nextExam.date), nextExam.prepDays) as ExamPhaseLabel)
    : 'none';

  const seasonResolved   = resolvePhaseFromSeason(config.season ?? null);
  const trainingPhase: TrainingPhase =
    seasonResolved?.phase ?? examPhaseToTrainingPhase(examPhase);
  const weekNum = config.season
    ? calcSeasonWeek(config.season.startDate)
    : calcWeekNumFromExams(state);

  return {
    date: today, weekNum, examPhase, trainingPhase,
    readiness, readiness3dMin,
    loads, stressZone,
    compliance7d:    wl.compliance7d,
    failStreak, successStreak, stalledLifts,
    weeklyRunKm, prevWeekRunKm, highIntensityPct, longRunPct,
    avgPaceThisWeek, avgPacePrevWeek,
    hasSameDayConflict, muscleVolumeStatuses,
    config,
  };
}
