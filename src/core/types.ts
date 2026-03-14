// ─────────────────────────────────────────────
//  CORE TYPES  —  WK Workout Tracker
// ─────────────────────────────────────────────

// ── Shared Primitives ──────────────────────────
export type ISODateString = string;
export type UUID = string;

// ── Profile ────────────────────────────────────
export type GoalType =
  | 'muscle' | 'fat_loss' | 'strength' | 'seal_test'
  | 'military_general' | 'endurance' | 'police' | 'health';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type EquipmentType = 'full_gym' | 'home' | 'barbell';

export interface UserProfile {
  name: string;
  sex: 'male' | 'female' | 'other' | '';
  age: number | null;
  height: number | null;   // cm
  weight: number | null;   // kg
  goals: GoalType[];
  level: ExperienceLevel | '';
  days: number | null;
  duration: number | null; // minutes per session
  equipment: EquipmentType;
  squat1rm: number | null;
  bench1rm: number | null;
  dead1rm:  number | null;
  savedAt: ISODateString;
}

// ── Strength ───────────────────────────────────
export interface Exercise {
  id: UUID;
  name: string;
  sets: number;
  reps: string;
  weight: number | null;
  intensity: number;  // %
  rpe: number;
  done: number[];     // set indices completed
  collapsed: boolean;
}

export interface HistoryEntry {
  id: UUID;
  date: ISODateString;
  exercise: string;
  sets: number;
  reps: string;
  weight: number | null;
  intensity: number;
  rpe: number;
  note: string;
}

// ── Endurance ──────────────────────────────────
export type RunType = 'easy' | 'tempo' | 'interval' | 'long' | 'race';
export type SwimStroke = 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'mixed';

export interface RunEntry {
  id: UUID;
  date: ISODateString;
  dist: number;   // km
  time: number;   // minutes
  type: RunType;
  pace: number;   // min/km
  hr: number | null;
  note: string;
}

export interface SwimEntry {
  id: UUID;
  date: ISODateString;
  dist: number;   // meters
  time: number;   // minutes
  stroke: SwimStroke;
  laps: number | null;
  note: string;
  secPer100: number; // seconds per 100m
}

// ── Military ───────────────────────────────────
export type MilitaryUnit = 'seal' | 'special' | 'infantry' | 'police';

export interface FitTestScore {
  [eventId: string]: number;
}

export interface FitTestEntry {
  id: UUID;
  date: ISODateString;
  unit: MilitaryUnit;
  scores: FitTestScore;
}

// ── Planning ───────────────────────────────────
export type ExamUnit = 'police' | 'military' | 'special' | 'seal' | 'other';

export interface ExamEntry {
  id: UUID;
  name: string;
  unit: ExamUnit;
  date: ISODateString;
  prepDays: number;
}

export type PlanStyle = 'hypertrophy' | 'strength' | 'fat_loss' | 'endurance';

export interface PlanExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface PlanDay {
  name: string;
  exercises: PlanExercise[];
}

export interface SavedPlan {
  id: UUID;
  planName: string;
  style: PlanStyle;
  createdAt: ISODateString;
  planData: {
    planName: string;
    weekNum: number;
    weekLabel: string;
    days: PlanDay[];
  };
}

// ── Recovery ───────────────────────────────────
export interface ReadinessEntry {
  id: UUID;
  date: ISODateString;
  score: number;
  sleep: number;
  sleepQ: number;
  energy: number;
  sore: number;
  rhr: number;
  motiv: number;
  stress: number;
}

// ── Root App State ─────────────────────────────
export interface AppState {
  version: number;
  profile: UserProfile | null;
  strength: StrengthState;
  endurance: EnduranceState;
  military: MilitaryState;
  planning: PlanningState;
  recovery: RecoveryState;
}

export interface StrengthState {
  exercises: Exercise[];
  history: HistoryEntry[];
}

export interface EnduranceState {
  runs: RunEntry[];
  swims: SwimEntry[];
}

export interface MilitaryState {
  fitTestHistory: FitTestEntry[];
}

export interface PlanningState {
  exams: ExamEntry[];
  savedPlans: SavedPlan[];
}

export interface RecoveryState {
  readinessHistory: ReadinessEntry[];
}
