// ─────────────────────────────────────────────
//  PROFILE UI — Profile Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { saveProfile } from '../application/profileUseCases';
import { getProfileCompleteness, calcBMI, getAvatarInitial } from '../domain/profileLogic';
import type { GoalType } from '../../../core/types';

let _selectedGoals = new Set<GoalType>();

export function renderProfilePanel(): void {
  const p = store.getState().profile;

  // Restore saved goals
  _selectedGoals = new Set(p?.goals ?? (p as any)?.goal ? [(p as any).goal] : []);

  if (p) {
    const sv = (id: string, v: unknown) => {
      if (v == null || v === '') return;
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (el) el.value = String(v);
    };
    sv('p-name', p.name); sv('p-sex', p.sex); sv('p-age', p.age);
    sv('p-height', p.height); sv('p-weight', p.weight);
    sv('p-level', p.level); sv('p-days', p.days);
    sv('p-duration', p.duration); sv('p-equipment', p.equipment);
    sv('p-squat1rm', p.squat1rm); sv('p-bench1rm', p.bench1rm); sv('p-dead1rm', p.dead1rm);
  }

  // Sync goal chips
  document.querySelectorAll<HTMLElement>('.goal-chip').forEach(c =>
    c.classList.toggle('on', _selectedGoals.has(c.dataset.goal as GoalType))
  );
  _updateGoalCounter();

  // Hero
  const pct = getProfileCompleteness(p);
  const bmi = p?.height && p?.weight ? calcBMI(p.weight, p.height).toFixed(1) : null;
  const heroEl = document.getElementById('profile-hero-wrap');
  if (heroEl) heroEl.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">${getAvatarInitial(p?.name)}</div>
      <div class="profile-name-display">${p?.name || 'ตั้งชื่อผู้ใช้ก่อน'}</div>
      <div class="profile-stats-row">
        ${p?.age    ? `<div class="profile-stat"><div class="pv">${p.age}</div><div class="pl">ปี</div></div>` : ''}
        ${p?.height ? `<div class="profile-stat"><div class="pv">${p.height}</div><div class="pl">cm</div></div>` : ''}
        ${p?.weight ? `<div class="profile-stat"><div class="pv">${p.weight}</div><div class="pl">kg</div></div>` : ''}
        ${bmi       ? `<div class="profile-stat"><div class="pv">${bmi}</div><div class="pl">BMI</div></div>` : ''}
      </div>
    </div>`;

  const compEl = document.getElementById('profile-completeness-wrap');
  if (compEl) compEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:9px;background:var(--s2);border:1px solid var(--border);border-radius:8px;padding:11px 13px;margin-bottom:13px">
      <div style="font-size:.7rem;color:var(--t2)">โปรไฟล์สมบูรณ์</div>
      <div class="pc-bar-track"><div class="pc-bar-fill" style="width:${pct}%"></div></div>
      <div style="font-family:'JetBrains Mono';font-size:.8rem;color:var(--lime);white-space:nowrap">${pct}%</div>
    </div>`;
}

function _updateGoalCounter(): void {
  const el = document.getElementById('goal-counter');
  if (!el) return;
  el.textContent = `เลือกแล้ว: ${_selectedGoals.size}/4`;
  el.style.color = _selectedGoals.size >= 4 ? 'var(--orange)' : 'var(--t3)';
}

function toggleGoal(g: GoalType): void {
  if (_selectedGoals.has(g)) {
    _selectedGoals.delete(g);
  } else {
    if (_selectedGoals.size >= 4) {
      import('../../../app/eventBus').then(({ eventBus, EVENTS }) =>
        eventBus.emit(EVENTS.TOAST, 'เลือกได้สูงสุด 4 เป้าหมาย')
      );
      return;
    }
    _selectedGoals.add(g);
  }
  document.querySelectorAll<HTMLElement>('.goal-chip').forEach(c =>
    c.classList.toggle('on', _selectedGoals.has(c.dataset.goal as GoalType))
  );
  _updateGoalCounter();
}

function doSaveProfile(): void {
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value || '';
  saveProfile({
    name:      g('p-name').trim(),
    sex:       g('p-sex') as any,
    age:       parseFloat(g('p-age'))    || null,
    height:    parseFloat(g('p-height')) || null,
    weight:    parseFloat(g('p-weight')) || null,
    goals:     [..._selectedGoals],

    level:     g('p-level') as any,
    days:      parseInt(g('p-days'))     || null,
    duration:  parseInt(g('p-duration')) || null,
    equipment: (g('p-equipment') || 'full_gym') as any,
    squat1rm:  parseFloat(g('p-squat1rm')) || null,
    bench1rm:  parseFloat(g('p-bench1rm')) || null,
    dead1rm:   parseFloat(g('p-dead1rm'))  || null,
  });
  renderProfilePanel();
}

// ── Expose ──────────────────────────────────────
(window as any).toggleGoal   = toggleGoal;
(window as any).saveProfile  = doSaveProfile;

// ── Named exports for dynamic import() in app.ts ──
export { toggleGoal, doSaveProfile };
