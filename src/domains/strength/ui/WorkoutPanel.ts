// ─────────────────────────────────────────────
//  STRENGTH UI — Workout Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus, EVENTS } from '../../../app/eventBus';
import {
  addExercise, removeExercise, toggleSetComplete,
  resetSets, toggleCollapse, resetSession, logExerciseManual,
} from '../application/strengthUseCases';
import type { Exercise } from '../../../core/types';

// ── Re-render on state change ───────────────────
eventBus.on(EVENTS.STATE_CHANGED, renderWorkoutPanel);
// ── Rule Engine feedback banner ──────────────
let _ruleHint = '';
eventBus.on('RULE_ENGINE_APPLIED', (data: any) => {
  _ruleHint = data?.explanation ?? '';
  const bannerEl = document.getElementById('rule-banner-workout');
  if (bannerEl) {
    bannerEl.innerHTML = _ruleHint
      ? `<div style="background:#1a1a00;border:1px solid #b5ff2d44;border-radius:8px;
           padding:8px 12px;margin-bottom:10px;font-size:.72rem;color:#b5ff2d;line-height:1.5">
           🔧 ${_ruleHint}
         </div>`
      : '';
  }
});

  </div>`;
}


export function renderWorkoutPanel(): void {
  const exercises = store.getState().strength.exercises;
  const listEl = document.getElementById('ex-list');
  const noExEl = document.getElementById('no-ex');
  if (!listEl || !noExEl) return;

  if (!exercises.length) {
    listEl.innerHTML = '';
    noExEl.style.display = 'block';
    return;
  }
  noExEl.style.display = 'none';
  listEl.innerHTML = exercises.map(renderExerciseCard).join('');
}

function renderExerciseCard(ex: Exercise): string {
  const done  = ex.done.length;
  const total = ex.sets;
  const all   = done >= total;
  const meta  = [
    ex.weight ? `${ex.weight}kg` : '',
    ex.reps   ? `${ex.reps} reps` : '',
  ].filter(Boolean).join(' · ');

  const sets = Array.from({ length: total }, (_, i) => {
    const d = ex.done.includes(i);
    return `<button type="button"
      class="set-btn ${d ? 'dn' : ''}"
      data-exid="${ex.id}" data-idx="${i}"
      onclick="window._wkToggleSet('${ex.id}',${i})">
      <span class="sn">${i + 1}</span>
      <span class="sc">${d ? '✓' : '○'}</span>
    </button>`;
  }).join('');

  return `
    <div class="ex ${all ? 'done-all' : ''} ${ex.collapsed ? 'coll' : ''}" data-card="${ex.id}">
      <div class="ex-head" onclick="window._wkToggleColl('${ex.id}')">
        <div class="ex-name">${all ? '✅ ' : ''}${ex.name}</div>
        ${meta ? `<div class="ex-meta">${meta}</div>` : ''}
        <div class="ex-badge" data-badge="${ex.id}">${done}/${total}</div>
        <span class="chev">▾</span>
      </div>
      <div class="set-wrap" style="max-height:${ex.collapsed ? 0 : 400}px">
        <div class="set-grid">${sets}</div>
        <div class="ex-foot">
          <button type="button" class="btn xs ghost" onclick="window._wkOpenLog('${ex.id}')">📝 บันทึกผล</button>
          <button type="button" class="btn xs ghost" onclick="window._wkResetSets('${ex.id}')">↺</button>
          <button type="button" class="btn xs ghost red" onclick="window._wkRemove('${ex.id}')">✕</button>
        </div>
      </div>
    </div>`;
}

// ── Log Modal ───────────────────────────────────
let _pendingLogId: string | null = null;

function openLogModal(id: string): void {
  _pendingLogId = id;
  const ex = store.getState().strength.exercises.find(e => e.id === id);
  if (!ex) return;

  const body = document.getElementById('log-body');
  if (body) {
    body.innerHTML = `
      <div class="field"><label>ท่า</label><div style="font-weight:700;padding:3px 0">${ex.name}</div></div>
      <div class="field"><label>เซ็ต</label><input type="number" id="ls" value="${ex.done.length}" min="0"></div>
      <div class="field"><label>เรป</label><input type="text" id="lr" value="${ex.reps || ''}"></div>
      <div class="field"><label>น้ำหนัก (kg)</label><input type="number" id="lw" value="${ex.weight || ''}" step=".5"></div>
      <div class="field"><label>Intensity %</label><input type="number" id="li" value="${ex.intensity || 75}"></div>
      <div class="field"><label>RPE</label><input type="number" id="lrpe" value="${ex.rpe || 8}" step=".5"></div>
      <div class="field"><label>หมายเหตุ</label><input type="text" id="ln" placeholder="ไม่บังคับ"></div>`;
  }
  document.getElementById('ov-log')?.classList.add('on');
}

function saveLog(): void {
  if (!_pendingLogId) return;
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
  logExerciseManual({
    exerciseId: _pendingLogId,
    sets:       parseInt(g('ls') || '0') || 0,
    reps:       g('lr') || '',
    weight:     parseFloat(g('lw') || '') || null,
    intensity:  parseFloat(g('li') || '75') || 75,
    rpe:        parseFloat(g('lrpe') || '8') || 8,
    note:       g('ln') || '',
  });
  document.getElementById('ov-log')?.classList.remove('on');
}

function openAddModal(): void {
  (['nn', 'nr', 'nw', 'ni', 'nrpe'] as const).forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = '';
  });
  const ns = document.getElementById('ns') as HTMLInputElement | null;
  if (ns) ns.value = '3';
  document.getElementById('ov-add')?.classList.add('on');
  setTimeout(() => (document.getElementById('nn') as HTMLInputElement | null)?.focus(), 200);
}

function submitAddEx(): void {
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
  addExercise({
    name:      g('nn').trim(),
    sets:      parseInt(g('ns') || '3') || 3,
    reps:      g('nr'),
    weight:    parseFloat(g('nw') || '') || null,
    intensity: parseFloat(g('ni') || '75') || 75,
    rpe:       parseFloat(g('nrpe') || '8') || 8,
  });
  document.getElementById('ov-add')?.classList.remove('on');
}

// ── Expose to HTML inline handlers ─────────────
(window as any)._wkToggleSet  = (id: string, idx: number) => toggleSetComplete(id, idx);
(window as any)._wkToggleColl = (id: string) => toggleCollapse(id);
(window as any)._wkRemove     = (id: string) => removeExercise(id);
(window as any)._wkResetSets  = (id: string) => resetSets(id);
(window as any)._wkOpenLog    = (id: string) => openLogModal(id);
(window as any)._wkSaveLog    = saveLog;
(window as any)._wkOpenAdd    = openAddModal;
(window as any)._wkSubmitAdd  = submitAddEx;
(window as any)._wkReset      = () => resetSession();
(window as any).openAddEx     = openAddModal;
(window as any).addEx         = submitAddEx;
(window as any).saveLog       = saveLog;
(window as any).resetAll      = () => resetSession();

// ── Named exports for dynamic import() in app.ts ──
export { submitAddEx as _wkSubmitAdd, saveLog as _wkSaveLog };
