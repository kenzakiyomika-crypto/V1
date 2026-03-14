// ═══════════════════════════════════════════════
//  RULE ENGINE — Core Types  (Final Form)
//  WK Workout Tracker v7
// ═══════════════════════════════════════════════
import type { EngineConfig } from '../config/globalConfig';
export type { EngineConfig };

// ── Zones & Phases ─────────────────────────────
export type StressZone = 'GREEN' | 'YELLOW' | 'RED';

export type TrainingPhase =
  | 'hypertrophy'
  | 'strength'
  | 'peak'
  | 'endurance_base'
  | 'hybrid'
  | 'deload'
  | 'none';

export type ExamPhaseLabel =
  | 'far' | 'build' | 'peak' | 'taper' | 'race' | 'past' | 'none';

// ── Unified Load Currency ──────────────────────
// StrengthLoad  = Sets × Reps × %1RM × RPEFactor
// EnduranceLoad = Duration(min) × ZoneMultiplier
// TotalStress   = StrengthLoad + EnduranceLoad
// Zones: Green <1000 | Yellow 1000–1400 | Red >1400
export interface LoadScores {
  strengthRaw:  number;   // raw strength load score (this session window)
  enduranceRaw: number;   // raw endurance load score
  totalRaw:     number;   // sum — compared against zone thresholds
  acuteLoad:    number;   // 7-day EWMA of daily strength load
  chronicLoad:  number;   // 28-day EWMA of daily strength load
  acr:          number;   // acuteLoad / chronicLoad
}

// ── Rule Context (immutable snapshot per evaluation) ──
export interface RuleContext {
  // ── Time
  date:           string;           // ISO date 'YYYY-MM-DD'
  weekNum:        number;           // 1-based week of season (1–16)
  examPhase:      ExamPhaseLabel;   // from planning domain
  trainingPhase:  TrainingPhase;    // active policy phase

  // ── Recovery
  readiness:      number;           // 0–100 latest score
  readiness3dMin: number;           // min score last 3 days (deload trigger)

  // ── Load
  loads:          LoadScores;
  stressZone:     StressZone;

  // ── Behaviour
  compliance7d:   number;           // 0–1 fraction of last 7 days trained
  failStreak:     Record<string, number>;   // exerciseName → consecutive fails
  successStreak:  Record<string, number>;   // exerciseName → consecutive successes
  stalledLifts:   string[];                 // lifts stalled 4+ weeks

  // ── Endurance
  weeklyRunKm:      number;
  prevWeekRunKm:    number;
  highIntensityPct: number;    // fraction of runs Z4+  (0–1)
  longRunPct:       number;    // long run volume / total weekly volume (0–1)
  avgPaceThisWeek:  number;    // avg min/km of race/tempo runs this week (0 = no data)
  avgPacePrevWeek:  number;    // avg min/km of race/tempo runs prev week (0 = no data)

  // ── Hybrid
  hasSameDayConflict: boolean; // heavy squat ≥85% + interval Z4+ same day

  // ── Volume Landmarks (computed from 7-day history)
  muscleVolumeStatuses: MuscleVolumeStatus[];

  config: EngineConfig;
}

// Forward-declare to avoid circular import
// (actual type defined in volumeLandmark.rule.ts, re-exported here)
export interface MuscleVolumeStatus {
  muscle:   string;
  sets:     number;
  status:   'BELOW_MEV' | 'OPTIMAL' | 'ABOVE_MRV';
  landmark: { mev: number; mrv: number; mav: number };
}

// ── Rule Effects ───────────────────────────────
export type RuleEffect =
  | { type: 'FORCE_DELOAD' }
  | { type: 'ADJUST_LOAD';      liftId?: string; deltaPct: number }
  | { type: 'ADJUST_VOLUME';    liftId?: string; deltaPct: number }
  | { type: 'LOCK_INTENSITY';   capPct: number }
  | { type: 'CANCEL_INTERVALS' }
  | { type: 'ADD_INTERVAL' }
  | { type: 'FREEZE_MILEAGE' }
  | { type: 'RECALIBRATE_PACE'; direction: 'up' | 'down'; pct: number }
  | { type: 'CHANGE_VARIATION'; liftId: string }
  | { type: 'RESET_TO_90PCT';   liftId: string }
  | { type: 'ADD_TAG';          tag: string };

// ── Rule Interface ─────────────────────────────
export interface Rule {
  id:       string;
  priority: number;
  when(ctx: RuleContext): boolean;
  then(ctx: RuleContext): RuleEffect[];
}

// ── Audit Entry ────────────────────────────────
export interface AuditEntry {
  sessionId:    string;
  timestamp:    string;
  trigger:      string;
  firedRules:   string[];
  rawEffects:   RuleEffect[];
  finalEffects: RuleEffect[];
  adjustments: {
    loadDelta:    number;
    volumeDelta:  number;
    intensityCap: number | null;
  };
  ctxSnapshot: {
    readiness:   number;
    stressZone:  StressZone;
    acr:         number;
    totalStress: number;
    examPhase:   ExamPhaseLabel;
    weekNum:     number;
    compliance7d: number;
  };
  tags:         string[];
  explanation:  string; // human-readable "why was today adjusted"
}

// ── Engine Result ──────────────────────────────
export interface EngineResult {
  effects:    RuleEffect[];
  firedRules: string[];
  audit:      AuditEntry;
  ctx:        RuleContext;
}
