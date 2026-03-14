// ─────────────────────────────────────────────
//  PROFILE DOMAIN — Pure Logic
// ─────────────────────────────────────────────
import type { UserProfile } from '../../../core/types';

/** Profile completeness score 0–100 */
export function getProfileCompleteness(p: UserProfile | null): number {
  if (!p) return 0;
  const fields: (keyof UserProfile)[] = [
    'name', 'sex', 'age', 'height', 'weight', 'level', 'days', 'duration',
  ];
  let score = fields.filter(f => p[f] !== null && p[f] !== '' && p[f] !== undefined).length;
  if (p.goals?.length > 0) score++;
  return Math.round((score / (fields.length + 1)) * 100);
}

/** BMI */
export function calcBMI(weight: number, heightCm: number): number {
  return weight / ((heightCm / 100) ** 2);
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return 'น้ำหนักน้อย';
  if (bmi < 25)   return 'ปกติ';
  if (bmi < 30)   return 'น้ำหนักเกิน';
  return 'อ้วน';
}

/** Avatar initial from name */
export function getAvatarInitial(name: string | null | undefined): string {
  return name?.trim()?.[0]?.toUpperCase() ?? '?';
}
