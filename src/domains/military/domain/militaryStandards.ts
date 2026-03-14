// ─────────────────────────────────────────────
//  MILITARY DOMAIN — Standards & Evaluation
// ─────────────────────────────────────────────
import type { MilitaryUnit } from '../../../core/types';

export interface MilEvent {
  id: string;
  name: string;
  unit: string;
  lowerBetter: boolean;
  pass: string;
  elite: string;
  passVal: number;
  eliteVal: number;
  max: number;
  note?: string;
}

export interface MilStandard {
  name: string;
  icon: string;
  desc: string;
  color: string;
  events: MilEvent[];
}

export const MIL_STANDARDS: Record<MilitaryUnit, MilStandard> = {
  seal: {
    name: 'หน่วยซีล', icon: '🔱', desc: 'มาตรฐานสูงสุด', color: '#3d8eff',
    events: [
      { id: 'run_3km',  name: 'วิ่ง 3 กม.',         unit: 'นาที',  lowerBetter: true,  pass: '≤14:30', elite: '≤12:00', passVal: 14.5, eliteVal: 12.0, max: 25 },
      { id: 'swim_200', name: 'ว่ายน้ำ 200ม.',       unit: 'นาที',  lowerBetter: true,  pass: '≤5:00',  elite: '≤4:00',  passVal: 5.0,  eliteVal: 4.0,  max: 10, note: 'ฟรีสไตล์' },
      { id: 'pushup',   name: 'ดันพื้น 2 นาที',     unit: 'ครั้ง', lowerBetter: false, pass: '≥50',    elite: '≥80',    passVal: 50,   eliteVal: 80,   max: 100 },
      { id: 'situp',    name: 'ซิทอัพ 2 นาที',      unit: 'ครั้ง', lowerBetter: false, pass: '≥50',    elite: '≥80',    passVal: 50,   eliteVal: 80,   max: 100 },
      { id: 'pullup',   name: 'พูลอัพ',              unit: 'ครั้ง', lowerBetter: false, pass: '≥10',    elite: '≥18',    passVal: 10,   eliteVal: 18,   max: 25 },
      { id: 'swim_500', name: 'ว่ายน้ำ 500ม.',       unit: 'นาที',  lowerBetter: true,  pass: '≤13:00', elite: '≤10:00', passVal: 13.0, eliteVal: 10.0, max: 20 },
    ],
  },
  special: {
    name: 'รบพิเศษ', icon: '⚡', desc: 'Special Forces', color: '#b5ff2d',
    events: [
      { id: 'run_5km',  name: 'วิ่ง 5 กม.',         unit: 'นาที',  lowerBetter: true,  pass: '≤25:00', elite: '≤21:00', passVal: 25.0, eliteVal: 21.0, max: 40 },
      { id: 'run_3km',  name: 'วิ่ง 3 กม.',         unit: 'นาที',  lowerBetter: true,  pass: '≤14:00', elite: '≤11:30', passVal: 14.0, eliteVal: 11.5, max: 25 },
      { id: 'pushup',   name: 'ดันพื้น 2 นาที',     unit: 'ครั้ง', lowerBetter: false, pass: '≥60',    elite: '≥90',    passVal: 60,   eliteVal: 90,   max: 120 },
      { id: 'situp',    name: 'ซิทอัพ 2 นาที',      unit: 'ครั้ง', lowerBetter: false, pass: '≥60',    elite: '≥90',    passVal: 60,   eliteVal: 90,   max: 120 },
      { id: 'pullup',   name: 'พูลอัพ',              unit: 'ครั้ง', lowerBetter: false, pass: '≥12',    elite: '≥20',    passVal: 12,   eliteVal: 20,   max: 30 },
    ],
  },
  infantry: {
    name: 'ทหารราบ', icon: '🎖️', desc: 'มาตรฐานทั่วไป', color: '#00d4aa',
    events: [
      { id: 'run_3km',  name: 'วิ่ง 3 กม.',         unit: 'นาที',  lowerBetter: true,  pass: '≤16:00', elite: '≤13:30', passVal: 16.0, eliteVal: 13.5, max: 25 },
      { id: 'pushup',   name: 'ดันพื้น 2 นาที',     unit: 'ครั้ง', lowerBetter: false, pass: '≥42',    elite: '≥70',    passVal: 42,   eliteVal: 70,   max: 100 },
      { id: 'situp',    name: 'ซิทอัพ 2 นาที',      unit: 'ครั้ง', lowerBetter: false, pass: '≥42',    elite: '≥70',    passVal: 42,   eliteVal: 70,   max: 100 },
      { id: 'pullup',   name: 'พูลอัพ',              unit: 'ครั้ง', lowerBetter: false, pass: '≥6',     elite: '≥14',    passVal: 6,    eliteVal: 14,   max: 25 },
    ],
  },
  police: {
    name: 'ตำรวจ/สวาท', icon: '👮', desc: 'มาตรฐานตำรวจ', color: '#a855f7',
    events: [
      { id: 'run_3km',  name: 'วิ่ง 3 กม.',         unit: 'นาที',  lowerBetter: true,  pass: '≤15:30', elite: '≤13:00', passVal: 15.5, eliteVal: 13.0, max: 25 },
      { id: 'pushup',   name: 'ดันพื้น 1 นาที',     unit: 'ครั้ง', lowerBetter: false, pass: '≥35',    elite: '≥55',    passVal: 35,   eliteVal: 55,   max: 80 },
      { id: 'situp',    name: 'ซิทอัพ 1 นาที',      unit: 'ครั้ง', lowerBetter: false, pass: '≥35',    elite: '≥55',    passVal: 35,   eliteVal: 55,   max: 80 },
      { id: 'pullup',   name: 'พูลอัพ',              unit: 'ครั้ง', lowerBetter: false, pass: '≥8',     elite: '≥15',    passVal: 8,    eliteVal: 15,   max: 25 },
    ],
  },
};

export type EvalStatus = 'elite' | 'pass' | 'fail' | 'untested';

export interface EventEvaluation {
  event: MilEvent;
  value: number | null;
  status: EvalStatus;
}

/** Evaluate a single fitness test result against unit standards */
export function evaluateScore(
  event: MilEvent,
  value: number | null
): EvalStatus {
  if (value === null || value === undefined) return 'untested';
  const elite = event.lowerBetter
    ? value <= event.eliteVal
    : value >= event.eliteVal;
  if (elite) return 'elite';
  const pass = event.lowerBetter
    ? value <= event.passVal
    : value >= event.passVal;
  return pass ? 'pass' : 'fail';
}

/** Evaluate all events in a unit for a given score map */
export function evaluateAllEvents(
  unit: MilitaryUnit,
  scores: Record<string, number>
): EventEvaluation[] {
  const standard = MIL_STANDARDS[unit];
  return standard.events.map(ev => ({
    event: ev,
    value: scores[ev.id] ?? null,
    status: evaluateScore(ev, scores[ev.id] ?? null),
  }));
}

/** BMI calculation */
export function calcBMI(weight: number, heightCm: number): number {
  return weight / ((heightCm / 100) ** 2);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'น้ำหนักน้อย';
  if (bmi < 25)   return 'ปกติ';
  if (bmi < 30)   return 'น้ำหนักเกิน';
  return 'อ้วน';
}
