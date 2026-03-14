// ─────────────────────────────────────────────
//  PLANNING DOMAIN — Countdown & Phase Logic
// ─────────────────────────────────────────────

export type ExamPhase = 'far' | 'build' | 'peak' | 'taper' | 'race' | 'past';

export interface PhaseInfo {
  label: string;
  color: string;
  bg: string;
  border: string;
  advice: string[];
}

export const PHASE_ADVICE: Record<ExamPhase, PhaseInfo> = {
  far: {
    label: '🌱 Base Phase', color: '#3d8eff', bg: '#001a33', border: '#004466',
    advice: [
      'สร้าง Aerobic Base — วิ่ง Zone 2 ทุกวัน',
      'เพิ่ม Volume ทีละน้อย ไม่เกิน 10%/สัปดาห์',
      'Calisthenics พื้นฐาน — ดันพื้น ซิทอัพ พูลอัพ',
      'นอนหลับ 7-9 ชั่วโมง',
      'อย่าเพิ่งเร่ง — Foundation สำคัญที่สุด',
    ],
  },
  build: {
    label: '🔨 Build Phase', color: '#ff9500', bg: '#1a0d00', border: '#ff950033',
    advice: [
      'เริ่ม Interval Training — 400m/800m repeats',
      'Tempo Run สัปดาห์ละ 1 ครั้ง',
      'เพิ่ม Strength Training Compound',
      'ทดสอบ Fitness ทุก 2 สัปดาห์',
      'ว่ายน้ำเพิ่มเป็น 3 ครั้ง/สัปดาห์ถ้าสอบซีล',
    ],
  },
  peak: {
    label: '🔥 Peak Phase', color: '#ff4444', bg: '#1a0000', border: '#ff444433',
    advice: [
      'ซ้อมเสมือนจริง — Mock Test ทุกสัปดาห์',
      'Race-Specific Intervals เร็วกว่าเป้า 5%',
      'ลด Volume 20% รักษา Intensity',
      'Sleep ให้ครบ — Recovery สำคัญ',
      'เช็ค Form / Equipment',
    ],
  },
  taper: {
    label: '🎯 Taper Phase', color: '#b5ff2d', bg: '#0f1a00', border: '#7ab800',
    advice: [
      'ลด Volume 40-60% — ร่างกาย Super-compensate',
      'รักษา Intensity — 2-3 Short Sessions',
      'งดหนัก 2-3 วันก่อนสอบ',
      'นอนให้ครบ Carb-loading วันก่อน',
      'Visualize ผลลัพธ์ที่ดี 💪',
    ],
  },
  race: {
    label: '🏁 วันสอบ!', color: '#b5ff2d', bg: '#0f1a00', border: '#b5ff2d',
    advice: [
      'Warm-up เบาๆ 10-15 นาที',
      'กิน Carb เบาๆ 2-3 ชั่วโมงก่อน',
      'Start ช้ากว่า Pace เป้า 5%',
      'ทุกอย่างที่ซ้อมมาอยู่ในตัวคุณแล้ว!',
    ],
  },
  past: {
    label: '✅ เสร็จแล้ว', color: '#888', bg: '#181818', border: '#2a2a2a',
    advice: ['ยินดีด้วย! ตั้งเป้าหมายใหม่ได้เลย'],
  },
};

/** Determine which phase based on days remaining */
export function getExamPhase(daysLeft: number, prepDays: number): ExamPhase {
  if (daysLeft < 0)  return 'past';
  if (daysLeft === 0) return 'race';
  const ratio = daysLeft / prepDays;
  if (ratio > 0.6)  return 'far';
  if (ratio > 0.3)  return 'build';
  if (ratio > 0.1)  return 'peak';
  return 'taper';
}

/** Days left until exam date */
export function daysUntilExam(examDateISO: string): number {
  const exam = new Date(examDateISO);
  exam.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((exam.getTime() - today.getTime()) / 86_400_000);
}

/** Progress percentage through prep period */
export function prepProgress(daysLeft: number, prepDays: number): number {
  const elapsed = prepDays - daysLeft;
  return Math.max(0, Math.min(100, Math.round((elapsed / prepDays) * 100)));
}

// ── Workout Plan Generator ──────────────────────
import type { PlanStyle, PlanDay } from '../../../core/types';

const EX_POOL = {
  push: [
    ['Bench Press', 4, '8-10'], ['OHP', 3, '8-10'],
    ['Lateral Raise', 3, '15'], ['Tricep Pushdown', 3, '12'], ['Dip', 3, 'Max'],
  ] as [string, number, string][],
  pull: [
    ['Pull-up', 4, 'Max'], ['Barbell Row', 4, '8-10'],
    ['Lat Pulldown', 3, '10-12'], ['Barbell Curl', 3, '10'], ['Face Pull', 3, '15'],
  ] as [string, number, string][],
  legs: [
    ['Squat', 4, '6-8'], ['Romanian DL', 3, '10'],
    ['Leg Press', 3, '12'], ['Hip Thrust', 3, '10'], ['Calf Raise', 3, '15'],
  ] as [string, number, string][],
};

const DAY_STRUCTURES: Record<number, string[]> = {
  2: ['Full A', 'Full B'],
  3: ['Full A', 'Full B', 'Full C'],
  4: ['Upper A', 'Lower A', 'Upper B', 'Lower B'],
  5: ['Upper A', 'Lower A', 'Full', 'Upper B', 'Lower B'],
  6: ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'],
};

const WEEK_LABELS: Record<number, string> = {
  1: 'เริ่มต้น', 2: 'เพิ่ม 2.5%', 3: 'เพิ่ม 5%', 4: 'DELOAD 🔄',
  5: 'Phase 2',  6: 'เพิ่ม 7.5%', 7: 'เพิ่ม 10%', 8: 'DELOAD 🔄',
  12: 'Peak Week',
};

export function generateWorkoutPlan(
  trainingDays: number,
  weekNum: number,
  _style: PlanStyle
): { days: PlanDay[]; weekLabel: string } {
  const dayNames = DAY_STRUCTURES[trainingDays] ?? DAY_STRUCTURES[3];

  const days: PlanDay[] = dayNames.map(name => {
    const lower = name.toLowerCase();
    const type =
      lower.includes('push') ? 'push' :
      lower.includes('pull') ? 'pull' :
      lower.includes('leg')  ? 'legs' :
      lower.includes('upper')? 'upper' :
      lower.includes('lower')? 'lower' : 'full';

    let pool: [string, number, string][];
    if (type === 'push')  pool = EX_POOL.push.slice(0, 4);
    else if (type === 'pull')  pool = EX_POOL.pull.slice(0, 4);
    else if (type === 'legs')  pool = EX_POOL.legs.slice(0, 4);
    else if (type === 'upper') pool = [...EX_POOL.push.slice(0, 2), ...EX_POOL.pull.slice(0, 2)];
    else if (type === 'lower') pool = EX_POOL.legs.slice(0, 4);
    else pool = [EX_POOL.push[0], EX_POOL.pull[0], EX_POOL.legs[0], EX_POOL.push[1], EX_POOL.pull[1]];

    return {
      name,
      exercises: pool.map(([n, s, r]) => ({ name: n, sets: s, reps: r })),
    };
  });

  return { days, weekLabel: WEEK_LABELS[weekNum] ?? '' };
}
