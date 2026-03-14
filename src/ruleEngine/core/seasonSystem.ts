// ═══════════════════════════════════════════════
//  RULE ENGINE — Season System
//
//  Maps a 12–16 week training season to
//  specific phases with auto-switching rules.
//
//  Example Hybrid 12 Weeks:
//    Weeks 1–4  : Accumulation (hypertrophy)
//    Week  5    : Deload
//    Weeks 6–9  : Intensification (strength)
//    Week  10   : Deload
//    Weeks 11–12: Peak
//
//  Season index drives:
//    - Which policy is active
//    - Whether deload is forced
//    - Phase intensity caps
// ═══════════════════════════════════════════════
import type { TrainingPhase } from './types';

// ─────────────────────────────────────────────
//  Season Block Definition
// ─────────────────────────────────────────────
export interface SeasonBlock {
  label:         string;
  weeks:         number[];        // 1-based week numbers in this block
  phase:         TrainingPhase;
  isDeload:      boolean;
  intensityCap:  number;          // 0–1
  volumeModifier: number;         // multiplier e.g. 0.6 = deload 40% cut
  notes:         string;
}

export interface SeasonTemplate {
  name:          string;
  totalWeeks:    number;
  blocks:        SeasonBlock[];
}

// ─────────────────────────────────────────────
//  Built-in Season Templates
// ─────────────────────────────────────────────

export const SEASON_TEMPLATES: Record<string, SeasonTemplate> = {

  // ── Hybrid 12 Weeks (Military/Tactical athlete) ──
  hybrid_12: {
    name: 'Hybrid 12 Weeks',
    totalWeeks: 12,
    blocks: [
      {
        label: 'Accumulation I',
        weeks: [1, 2, 3, 4],
        phase: 'hypertrophy',
        isDeload: false,
        intensityCap: 0.75,
        volumeModifier: 1.0,
        notes: 'สร้าง Base Volume — เน้น Hypertrophy + Aerobic Base',
      },
      {
        label: 'Deload I',
        weeks: [5],
        phase: 'deload',
        isDeload: true,
        intensityCap: 0.80,
        volumeModifier: 0.60,
        notes: 'พักฟื้น — Volume -40%, ไม่มี Heavy Sets',
      },
      {
        label: 'Intensification',
        weeks: [6, 7, 8, 9],
        phase: 'strength',
        isDeload: false,
        intensityCap: 0.88,
        volumeModifier: 0.85,
        notes: 'เพิ่ม Intensity — ลด Volume, เพิ่ม %1RM',
      },
      {
        label: 'Deload II',
        weeks: [10],
        phase: 'deload',
        isDeload: true,
        intensityCap: 0.80,
        volumeModifier: 0.60,
        notes: 'Super-compensation — ร่างกาย Adapt ก่อน Peak',
      },
      {
        label: 'Peak',
        weeks: [11, 12],
        phase: 'peak',
        isDeload: false,
        intensityCap: 0.95,
        volumeModifier: 0.70,
        notes: 'Peak Performance — Volume ต่ำ Intensity สูง',
      },
    ],
  },

  // ── Strength 16 Weeks ──
  strength_16: {
    name: 'Strength 16 Weeks',
    totalWeeks: 16,
    blocks: [
      {
        label: 'GPP / Hypertrophy',
        weeks: [1, 2, 3, 4],
        phase: 'hypertrophy',
        isDeload: false,
        intensityCap: 0.75,
        volumeModifier: 1.0,
        notes: 'General Prep — ปริมาณสูง น้ำหนักปานกลาง',
      },
      {
        label: 'Deload I',
        weeks: [5],
        phase: 'deload',
        isDeload: true,
        intensityCap: 0.80,
        volumeModifier: 0.60,
        notes: 'Deload Week',
      },
      {
        label: 'Strength Block I',
        weeks: [6, 7, 8, 9],
        phase: 'strength',
        isDeload: false,
        intensityCap: 0.88,
        volumeModifier: 0.85,
        notes: 'Main Lifts 80–88% — Progression สำคัญ',
      },
      {
        label: 'Deload II',
        weeks: [10],
        phase: 'deload',
        isDeload: true,
        intensityCap: 0.80,
        volumeModifier: 0.60,
        notes: 'Deload Week',
      },
      {
        label: 'Strength Block II',
        weeks: [11, 12, 13],
        phase: 'strength',
        isDeload: false,
        intensityCap: 0.92,
        volumeModifier: 0.75,
        notes: 'Heavy Block — 85–92% เน้น Main 3',
      },
      {
        label: 'Peaking',
        weeks: [14, 15],
        phase: 'peak',
        isDeload: false,
        intensityCap: 0.95,
        volumeModifier: 0.65,
        notes: 'Openers + Attempts — 90–95%',
      },
      {
        label: 'Competition Week',
        weeks: [16],
        phase: 'peak',
        isDeload: true,
        intensityCap: 1.00,
        volumeModifier: 0.40,
        notes: 'Taper + Compete',
      },
    ],
  },

  // ── Endurance Base 8 Weeks ──
  endurance_8: {
    name: 'Endurance Base 8 Weeks',
    totalWeeks: 8,
    blocks: [
      {
        label: 'Zone 2 Base',
        weeks: [1, 2, 3],
        phase: 'endurance_base',
        isDeload: false,
        intensityCap: 0.70,
        volumeModifier: 1.0,
        notes: 'สร้าง Aerobic Base — Zone 2 เท่านั้น',
      },
      {
        label: 'Deload',
        weeks: [4],
        phase: 'deload',
        isDeload: true,
        intensityCap: 0.70,
        volumeModifier: 0.60,
        notes: 'Easy Week',
      },
      {
        label: 'Build',
        weeks: [5, 6, 7],
        phase: 'hybrid',
        isDeload: false,
        intensityCap: 0.80,
        volumeModifier: 1.1,
        notes: 'เพิ่ม Tempo + Interval',
      },
      {
        label: 'Taper',
        weeks: [8],
        phase: 'peak',
        isDeload: true,
        intensityCap: 0.85,
        volumeModifier: 0.70,
        notes: 'Taper before Event',
      },
    ],
  },
};

// ─────────────────────────────────────────────
//  Season State (persisted in config/store)
// ─────────────────────────────────────────────
export interface SeasonState {
  templateKey:    string;         // key into SEASON_TEMPLATES
  startDate:      string;         // ISO date season began
  currentWeek:    number;         // 1-based, calculated from startDate
  customTemplate?: SeasonTemplate; // user-defined override
}

// ─────────────────────────────────────────────
//  Season Resolver
// ─────────────────────────────────────────────

/** Calculate current week number from season start date */
export function calcSeasonWeek(startDateISO: string): number {
  const start   = new Date(startDateISO);
  const now     = new Date();
  const diffMs  = now.getTime() - start.getTime();
  const diffDays= diffMs / 86_400_000;
  return Math.max(1, Math.ceil(diffDays / 7));
}

/** Get the active SeasonBlock for a given week */
export function getActiveBlock(
  template:    SeasonTemplate,
  currentWeek: number
): SeasonBlock | null {
  return template.blocks.find(b => b.weeks.includes(currentWeek)) ?? null;
}

/** Get next block (for planning preview) */
export function getNextBlock(
  template:    SeasonTemplate,
  currentWeek: number
): SeasonBlock | null {
  const sorted = [...template.blocks].sort((a, b) => a.weeks[0] - b.weeks[0]);
  const idx    = sorted.findIndex(b => b.weeks.includes(currentWeek));
  return sorted[idx + 1] ?? null;
}

/** Season progress 0–1 */
export function seasonProgress(
  template:    SeasonTemplate,
  currentWeek: number
): number {
  return Math.min(1, (currentWeek - 1) / template.totalWeeks);
}

/** Weeks remaining in season */
export function weeksRemaining(
  template:    SeasonTemplate,
  currentWeek: number
): number {
  return Math.max(0, template.totalWeeks - currentWeek + 1);
}

/** Full season summary for UI display */
export interface SeasonSummary {
  templateName:   string;
  currentWeek:    number;
  totalWeeks:     number;
  progressPct:    number;
  activeBlock:    SeasonBlock | null;
  nextBlock:      SeasonBlock | null;
  weeksRemaining: number;
  isDeloadWeek:   boolean;
}

export function buildSeasonSummary(
  season:   SeasonState
): SeasonSummary {
  const template = season.customTemplate
    ?? SEASON_TEMPLATES[season.templateKey]
    ?? SEASON_TEMPLATES['hybrid_12'];

  const currentWeek = calcSeasonWeek(season.startDate);
  const activeBlock = getActiveBlock(template, currentWeek);
  const nextBlock   = getNextBlock(template, currentWeek);

  return {
    templateName:   template.name,
    currentWeek,
    totalWeeks:     template.totalWeeks,
    progressPct:    Math.round(seasonProgress(template, currentWeek) * 100),
    activeBlock,
    nextBlock,
    weeksRemaining: weeksRemaining(template, currentWeek),
    isDeloadWeek:   activeBlock?.isDeload ?? false,
  };
}

// ─────────────────────────────────────────────
//  Resolve TrainingPhase from Season
//  Called by contextBuilder to override phase
//  when an active season is configured
// ─────────────────────────────────────────────
export function resolvePhaseFromSeason(
  season: SeasonState | null
): { phase: TrainingPhase; intensityCap: number; volumeModifier: number } | null {
  if (!season) return null;

  const template    = season.customTemplate
    ?? SEASON_TEMPLATES[season.templateKey];
  if (!template) return null;

  const currentWeek = calcSeasonWeek(season.startDate);
  const block       = getActiveBlock(template, currentWeek);
  if (!block) return null;

  return {
    phase:          block.phase,
    intensityCap:   block.intensityCap,
    volumeModifier: block.volumeModifier,
  };
}
