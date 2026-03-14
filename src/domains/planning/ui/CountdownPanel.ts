// ─────────────────────────────────────────────
//  PLANNING UI — Countdown Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { addExam, deleteExam } from '../application/planningUseCases';
import { daysUntilExam, getExamPhase, prepProgress, PHASE_ADVICE } from '../domain/planningLogic';

const EXAM_ICONS: Record<string, string> = {
  police: '👮', military: '🎖️', special: '⚡', seal: '🔱', other: '🎯',
};

export function renderCountdownPanel(): void {
  const { exams } = store.getState().planning;
  const active = exams[0] || null;

  const daysEl  = document.getElementById('cd-days-display');
  const labelEl = document.getElementById('cd-days-label');
  const phaseEl = document.getElementById('cd-phase-display');
  const advEl   = document.getElementById('cd-phase-advice');
  const pw      = document.getElementById('cd-progress-wrap');

  if (active) {
    const dl    = daysUntilExam(active.date);
    const phase = getExamPhase(dl, active.prepDays);
    const pd    = PHASE_ADVICE[phase];

    if (daysEl) {
      daysEl.textContent = dl > 0 ? String(dl) : dl === 0 ? '🔥' : '✅';
      daysEl.className   = 'cd-days' + (dl <= 14 && dl > 0 ? ' urgent' : dl <= 30 && dl > 0 ? ' soon' : '');
    }
    if (labelEl) labelEl.textContent = dl > 0 ? `วัน ก่อน ${active.name}` : dl === 0 ? 'วันสอบ!' : 'สอบผ่านแล้ว';
    if (phaseEl) phaseEl.innerHTML =
      `<span class="cd-phase-badge" style="background:${pd.bg};color:${pd.color};border:1px solid ${pd.border}">${pd.label}</span>`;

    if (pw) pw.style.display = dl > 0 ? 'block' : 'none';
    const pct = prepProgress(dl, active.prepDays);
    const pctEl = document.getElementById('cd-progress-pct');
    const pbEl  = document.getElementById('cd-progress-bar');
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (pbEl)  pbEl.style.width  = `${pct}%`;

    const ptEl = document.getElementById('cd-phase-timeline');
    if (ptEl) ptEl.innerHTML = [
      { n: 'Base',  p: 40, c: '#3d8eff', b: '#001a33' },
      { n: 'Build', p: 30, c: '#ff9500', b: '#1a0d00' },
      { n: 'Peak',  p: 20, c: '#ff4444', b: '#1a0000' },
      { n: 'Taper', p: 10, c: '#b5ff2d', b: '#0f1a00' },
    ].map(s => `
      <div class="phase-block" style="background:${s.b};border:1px solid ${s.c}33;flex:${s.p}">
        <span class="pb-name" style="color:${s.c}">${s.n}</span>
        <span style="color:var(--t3)">${s.p}%</span>
      </div>`).join('');

    if (advEl) advEl.innerHTML = `
      <div style="background:${pd.bg};border:1px solid ${pd.border};border-radius:8px;padding:11px">
        <div style="font-weight:700;color:${pd.color};margin-bottom:7px;font-size:.83rem">${pd.label}</div>
        ${pd.advice.map(a => `<div class="rec-item">${a}</div>`).join('')}
      </div>`;
  } else {
    if (daysEl)  daysEl.textContent  = '—';
    if (labelEl) labelEl.textContent = 'เพิ่มวันสอบด้านล่าง';
    if (phaseEl) phaseEl.innerHTML   = '';
    if (pw)      pw.style.display    = 'none';
    if (advEl)   advEl.innerHTML     = '<div style="color:var(--t3);font-size:.8rem;padding:7px 0">เพิ่มวันสอบเพื่อดูคำแนะนำ</div>';
  }

  // Exam list
  const listEl = document.getElementById('exam-list-display');
  if (listEl) listEl.innerHTML = exams.length
    ? exams.map(ex => {
        const dl = daysUntilExam(ex.date);
        return `
          <div class="exam-card ${exams[0]?.id === ex.id ? 'active-exam' : ''}">
            <div class="ec-icon">${EXAM_ICONS[ex.unit] || '🎯'}</div>
            <div>
              <div class="ec-name">${ex.name}</div>
              <div class="ec-date">${new Date(ex.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div class="ec-days" style="color:${dl <= 14 && dl > 0 ? '#ff4444' : dl <= 30 && dl > 0 ? '#ff9500' : 'var(--lime)'}">
              ${dl > 0 ? dl : dl === 0 ? '🔥' : '✅'}
            </div>
            <button type="button" class="btn xs ghost" onclick="window._wkDeleteExam('${ex.id}')" style="margin-left:3px">✕</button>
          </div>`;
      }).join('')
    : '<div style="color:var(--t3);font-size:.8rem;padding:7px 0">ยังไม่มีวันสอบ</div>';
}

function doAddExam(): void {
  addExam({
    name:     (document.getElementById('cd-name') as HTMLInputElement)?.value.trim() || '',
    unit:     (document.getElementById('cd-unit') as HTMLSelectElement)?.value as any,
    date:     (document.getElementById('cd-date') as HTMLInputElement)?.value || '',
    prepDays: parseInt((document.getElementById('cd-prep-days') as HTMLInputElement)?.value) || 90,
  });
  (document.getElementById('cd-name') as HTMLInputElement).value = '';
  (document.getElementById('cd-date') as HTMLInputElement).value = '';
  renderCountdownPanel();
}

// ── Expose ──────────────────────────────────────
(window as any).addExam           = doAddExam;
(window as any)._wkDeleteExam     = (id: string) => { deleteExam(id); renderCountdownPanel(); };

// ── Named exports for dynamic import() in app.ts ──
export { doAddExam };
