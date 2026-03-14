// ─────────────────────────────────────────────
//  PLANNING UI — Planner Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { getProfileCompleteness } from '../../profile/domain/profileLogic';
import {
  generateAndPreviewPlan, savePlan,
  deletePlan, loadDayToWorkout,
} from '../application/planningUseCases';
import type { PlanStyle, PlanDay } from '../../../core/types';

let _planStyle: PlanStyle = 'hypertrophy';
let _currentPlan: { planName: string; weekNum: number; weekLabel: string; days: PlanDay[] } | null = null;

export function renderPlannerPanel(): void {
  const state = store.getState();
  const pct = getProfileCompleteness(state.profile);
  const statusEl = document.getElementById('planner-status');
  if (statusEl) {
    if (pct < 40) {
      statusEl.style.borderColor = 'var(--orange)';
      statusEl.style.background  = '#1a0d00';
      statusEl.innerHTML = `⚠️ โปรไฟล์ ${pct}% — <button type="button" onclick="switchTab('profile')" style="color:var(--orange);background:none;border:none;cursor:pointer;padding:0;font-family:inherit;text-decoration:underline">เพิ่มข้อมูล</button>`;
    } else {
      statusEl.style.borderColor = '#22c55e';
      statusEl.style.background  = '#001a00';
      statusEl.innerHTML = `✅ โปรไฟล์ ${pct}%`;
    }
  }
  renderSavedPlans();
}

function switchPlanner(tab: 'generate' | 'saved'): void {
  document.querySelectorAll('.ptab').forEach((el, i) =>
    el.classList.toggle('on', ['generate', 'saved'][i] === tab)
  );
  document.querySelectorAll('.planner-panel').forEach(p => p.classList.remove('on'));
  document.getElementById(`pp-${tab}`)?.classList.add('on');
  if (tab === 'saved') renderSavedPlans();
}

function selectPlanStyle(style: PlanStyle): void {
  _planStyle = style;
  document.querySelectorAll<HTMLElement>('.style-card').forEach(c =>
    c.classList.toggle('on', c.dataset.style === style)
  );
}

function generatePlan(): void {
  const weekNum = parseInt((document.getElementById('gen-week') as HTMLSelectElement)?.value) || 1;
  const result  = generateAndPreviewPlan(_planStyle, weekNum);
  _currentPlan  = { ...result, weekNum };

  document.getElementById('gen-result')!.innerHTML = `
    <div style="margin-top:13px">
      <div style="background:var(--s1);border:1px solid var(--lime-dim);border-radius:10px;padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:7px">
          <div>
            <div style="font-family:'Bebas Neue';font-size:1.2rem;letter-spacing:2px;color:var(--lime)">${result.planName}</div>
            <div style="font-size:.73rem;color:var(--t2)">สัปดาห์ที่ ${weekNum} · ${result.weekLabel}</div>
          </div>
          <button type="button" class="btn xs" onclick="window._wkSavePlan()">💾 บันทึก</button>
        </div>
        ${result.days.map((day, di) => `
          <div class="plan-day-card" id="pdc${di}">
            <div class="plan-day-head" onclick="document.getElementById('pdc${di}').classList.toggle('open')">
              <div class="pd-name">${day.name}</div>
              <button type="button" class="plan-day-load"
                onclick="event.stopPropagation();window._wkLoadDay(${di})">▶ โหลด</button>
            </div>
            <div class="plan-day-exs">
              ${day.exercises.map(ex =>
                `<div class="plan-ex-row"><div class="plan-ex-name">${ex.name}</div><div class="plan-ex-meta">${ex.sets}×${ex.reps}</div></div>`
              ).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function doSavePlan(): void {
  if (!_currentPlan) return;
  const weekNum = parseInt((document.getElementById('gen-week') as HTMLSelectElement)?.value) || 1;
  savePlan(_currentPlan.planName, _planStyle, weekNum, _currentPlan.weekLabel, _currentPlan.days);
}

function renderSavedPlans(): void {
  const plans = store.getState().planning.savedPlans;
  const el    = document.getElementById('saved-plans-list');
  if (!el) return;
  if (!plans.length) {
    el.innerHTML = '<div class="empty"><span class="ei">📋</span>ยังไม่มีตาราง</div>';
    return;
  }
  el.innerHTML = plans.map((plan) => `
    <div class="saved-plan-card">
      <div>
        <div class="saved-plan-name">${plan.planName}</div>
        <div class="saved-plan-meta">${new Date(plan.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
      </div>
      <div style="display:flex;gap:5px">
        <button type="button" class="btn xs" onclick="window._wkReloadPlan('${plan.id}')">📋</button>
        <button type="button" class="btn xs ghost red" onclick="window._wkDeletePlan('${plan.id}')">✕</button>
      </div>
    </div>`).join('');
}

// ── Expose ──────────────────────────────────────
(window as any).switchPlanner   = switchPlanner;
(window as any).selectPlanStyle = selectPlanStyle;
(window as any).generatePlan    = generatePlan;
(window as any)._wkSavePlan     = doSavePlan;
(window as any)._wkLoadDay      = (di: number) => {
  if (_currentPlan) loadDayToWorkout(_currentPlan.days[di]);
};
(window as any)._wkDeletePlan   = (id: string) => { deletePlan(id); renderSavedPlans(); };
(window as any)._wkReloadPlan   = (id: string) => {
  const plan = store.getState().planning.savedPlans.find(p => p.id === id);
  if (plan) { _currentPlan = plan.planData; switchPlanner('generate'); generatePlan(); }
};

// ── Named exports for dynamic import() in app.ts ──
export { renderSavedPlans, selectPlanStyle, generatePlan };
