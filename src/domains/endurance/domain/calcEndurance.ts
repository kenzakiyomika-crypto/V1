// ─────────────────────────────────────────────
//  ENDURANCE DOMAIN — Pure Logic
// ─────────────────────────────────────────────

/** Format pace (min/km) as "M:SS /km" */
export function formatPace(pace: number): string {
  if (!pace || pace <= 0) return '—';
  const m = Math.floor(pace);
  const s = Math.round((pace - m) * 60);
  return `${m}:${s < 10 ? '0' : ''}${s} /km`;
}

/** Format swim pace as "M:SS /100m" */
export function formatSwimPace(secPer100: number): string {
  if (!secPer100 || secPer100 <= 0) return '—';
  const m = Math.floor(secPer100 / 60);
  const s = Math.round(secPer100 % 60);
  return `${m}:${s < 10 ? '0' : ''}${s} /100ม.`;
}

/** Calculate running pace (min/km) */
export function calcRunPace(distKm: number, timeMins: number): number {
  if (!distKm || !timeMins) return 0;
  return timeMins / distKm;
}

/** Calculate swim pace (sec/100m) */
export function calcSwimPace(distMeters: number, timeMins: number): number {
  if (!distMeters || !timeMins) return 0;
  return (timeMins * 60 / distMeters) * 100;
}

export type RunPhase = 'base' | 'build' | 'peak' | 'taper';

export interface IntervalSet {
  type: string;
  distance: string;
  pace: string;
  note: string;
}

export interface IntervalPlan {
  title: string;
  goalPace: string;
  sets: IntervalSet[];
}

/**
 * Generate interval training plan based on 3km goal time and phase.
 */
export function generateIntervalPlan(
  goalMins: number,
  phase: RunPhase
): IntervalPlan {
  const targetPace = goalMins / 3;  // min/km for 3km
  const easyPace   = targetPace * 1.25;
  const tempoPace  = targetPace * 1.05;
  const intPace    = targetPace * 0.95;

  const PLANS: Record<RunPhase, IntervalPlan> = {
    base: {
      title: '🌱 Base — Zone 2',
      goalPace: formatPace(targetPace),
      sets: [
        { type: 'Warm-up',  distance: '1 กม.',   pace: formatPace(easyPace * 1.1), note: 'เดิน/วิ่งเบา' },
        { type: 'Zone 2',   distance: '3-4 กม.', pace: formatPace(easyPace),        note: 'หัวใจ 130-150' },
        { type: 'Cool-down',distance: '500ม.',   pace: formatPace(easyPace * 1.2),  note: 'เดิน' },
      ],
    },
    build: {
      title: '🔨 Build — Tempo+Interval',
      goalPace: formatPace(targetPace),
      sets: [
        { type: 'Warm-up',  distance: '1 กม.',    pace: formatPace(easyPace),          note: '' },
        { type: 'Tempo',    distance: '3×1 กม.',  pace: formatPace(tempoPace),         note: 'พัก 2 นาที' },
        { type: 'Interval', distance: '4×400ม.', pace: formatPace(intPace),            note: 'พัก 90 วิ' },
        { type: 'Cool-down',distance: '1 กม.',    pace: formatPace(easyPace * 1.1),    note: '' },
      ],
    },
    peak: {
      title: '🔥 Peak — Race Specific',
      goalPace: formatPace(targetPace),
      sets: [
        { type: 'Warm-up',  distance: '1 กม.',    pace: formatPace(easyPace),          note: '' },
        { type: 'Interval', distance: '6×400ม.', pace: formatPace(intPace * 0.97),     note: 'พัก 75 วิ' },
        { type: 'Tempo',    distance: '1 กม.',    pace: formatPace(targetPace * 1.02), note: 'Full effort' },
        { type: 'Cool-down',distance: '1 กม.',    pace: formatPace(easyPace * 1.1),    note: '' },
      ],
    },
    taper: {
      title: '🎯 Taper — ก่อนสอบ',
      goalPace: formatPace(targetPace),
      sets: [
        { type: 'Easy Run', distance: '2 กม.',    pace: formatPace(easyPace),          note: 'เบาสบาย' },
        { type: 'Strides',  distance: '4×100ม.', pace: formatPace(intPace * 0.95),    note: 'พัก 2 นาที' },
        { type: 'Cool-down',distance: '500ม.',    pace: formatPace(easyPace * 1.2),    note: '' },
      ],
    },
  };

  return PLANS[phase];
}

/** Check if a run qualifies as passing SEAL/military standard (3km ≤ 14:30) */
export function isRunPassingSEAL(distKm: number, timeMins: number): boolean {
  return distKm >= 2.8 && distKm <= 3.2 && timeMins <= 14.5;
}

/** Check if swim qualifies as passing SEAL standard */
export function isSwimPassingSEAL200(distM: number, timeMins: number): boolean {
  return distM >= 180 && distM <= 220 && timeMins <= 5;
}

export function isSwimPassingSEAL500(distM: number, timeMins: number): boolean {
  return distM >= 475 && distM <= 525 && timeMins <= 13;
}
