// ═══════════════════════════════════════════════
//  RULE ENGINE — Audit Logger
//  "Why was today reduced 10%?"
// ═══════════════════════════════════════════════
import type { AuditEntry, RuleEffect, RuleContext } from './types';
import { summariseAdjustments } from './effectMerger';

const AUDIT_MAX = 50;
const _log: AuditEntry[] = [];

// ─────────────────────────────────────────────
//  Human-readable explanation generator
// ─────────────────────────────────────────────
function buildExplanation(
  firedRules:   string[],
  finalEffects: RuleEffect[],
  ctx:          RuleContext
): string {
  const parts: string[] = [];

  if (finalEffects.some(e => e.type === 'FORCE_DELOAD')) {
    parts.push(`วันนี้ถูก Deload อัตโนมัติ (Readiness ${ctx.readiness}/100 ต่ำกว่า ${ctx.config.readiness.low})`);
    return parts.join(' | ');
  }

  const { loadDelta, volumeDelta, intensityCap } = summariseAdjustments(finalEffects);

  if (firedRules.includes('acr-protection')) {
    parts.push(`ACR = ${ctx.loads.acr.toFixed(2)} (สูงเกิน ${ctx.config.acr.warning}) → ลด Volume`);
  }
  if (firedRules.includes('stress-budget')) {
    parts.push(`Stress Zone = ${ctx.stressZone} (Load ${Math.round(ctx.loads.totalRaw)}) → ลด Volume`);
  }
  if (firedRules.includes('readiness-adjust')) {
    parts.push(`Readiness = ${ctx.readiness}/100 → ปรับ Load`);
  }
  if (firedRules.includes('hybrid-interference')) {
    parts.push('Hybrid conflict: Squat heavy + Interval ซ้อนวันเดียว');
  }
  if (firedRules.includes('strength-progression')) {
    parts.push('Progressive Overload: streak ≥ 3 sessions → เพิ่ม Load');
  }
  if (firedRules.includes('phase-endurance')) {
    parts.push(`Phase = ${ctx.examPhase} → ปรับ Endurance`);
  }
  if (firedRules.includes('failure-escalation')) {
    parts.push('Failure escalation: ลด Load / Reset ตามกฎ');
  }
  if (firedRules.includes('deload-trigger')) {
    parts.push('Deload trigger: ครบรอบหรือ Readiness ต่ำต่อเนื่อง');
  }
  if (firedRules.includes('mileage-growth')) {
    parts.push('Endurance mileage rule: freeze / limit growth');
  }
  if (firedRules.includes('intensity-distribution')) {
    parts.push('80/20 distribution: ปรับ Interval');
  }


  if (firedRules.includes('volume-landmark')) {
    const below = ctx.muscleVolumeStatuses?.filter(s => s.status === 'BELOW_MEV').map(s => s.muscle);
    const above = ctx.muscleVolumeStatuses?.filter(s => s.status === 'ABOVE_MRV').map(s => s.muscle);
    if (below?.length) parts.push(`Volume ต่ำกว่า MEV: ${below.join(', ')}`);
    if (above?.length) parts.push(`Volume เกิน MRV: ${above.join(', ')}`);
  }
  if (firedRules.includes('phase-intensity')) {
    parts.push(`Phase ${ctx.trainingPhase} → Intensity cap ${Math.round((ctx.config.phaseIntensityCaps[ctx.trainingPhase] ?? 1) * 100)}%`);
  }
  if (firedRules.includes('pace-recalibration') && ctx.avgPaceThisWeek > 0) {
    const dir = ctx.avgPaceThisWeek < ctx.avgPacePrevWeek ? 'ดีขึ้น' : 'แย่ลง';
    parts.push(`Pace ${dir}: ${ctx.avgPaceThisWeek.toFixed(2)} vs ${ctx.avgPacePrevWeek.toFixed(2)} min/km`);
  }
  if (!parts.length && loadDelta === 0 && volumeDelta === 0) {
    parts.push('ไม่มีการปรับ — training ปกติ');
  }

  const summary: string[] = [];
  if (loadDelta !== 0)
    summary.push(`Load ${loadDelta > 0 ? '+' : ''}${loadDelta}%`);
  if (volumeDelta !== 0)
    summary.push(`Volume ${volumeDelta > 0 ? '+' : ''}${volumeDelta}%`);
  if (intensityCap !== null)
    summary.push(`Intensity cap ${Math.round(intensityCap * 100)}%`);

  const result = parts.join(' | ');
  return summary.length ? `${result} → [${summary.join(', ')}]` : result;
}

// ─────────────────────────────────────────────
//  Create & store audit entry
// ─────────────────────────────────────────────
export function createAuditEntry(params: {
  trigger:      string;
  firedRules:   string[];
  rawEffects:   RuleEffect[];
  finalEffects: RuleEffect[];
  ctx:          RuleContext;
}): AuditEntry {
  const { trigger, firedRules, rawEffects, finalEffects, ctx } = params;
  const adj = summariseAdjustments(finalEffects);

  const tags = finalEffects
    .filter(e => e.type === 'ADD_TAG')
    .map(e => (e as { type: 'ADD_TAG'; tag: string }).tag);

  const entry: AuditEntry = {
    sessionId:    crypto.randomUUID(),
    timestamp:    new Date().toISOString(),
    trigger,
    firedRules,
    rawEffects,
    finalEffects,
    adjustments:  adj,
    ctxSnapshot: {
      readiness:    ctx.readiness,
      stressZone:   ctx.stressZone,
      acr:          ctx.loads.acr,
      totalStress:  ctx.loads.totalRaw,
      examPhase:    ctx.examPhase,
      weekNum:      ctx.weekNum,
      compliance7d: ctx.compliance7d,
    },
    tags,
    explanation:  buildExplanation(firedRules, finalEffects, ctx),
  };

  _log.unshift(entry);
  if (_log.length > AUDIT_MAX) _log.pop();

  return entry;
}

// ─────────────────────────────────────────────
//  Public accessors
// ─────────────────────────────────────────────
export function getAuditLog(): AuditEntry[] {
  return [..._log];
}

export function getLastAudit(): AuditEntry | null {
  return _log[0] ?? null;
}

export function clearAuditLog(): void {
  _log.length = 0;
}
