// ─────────────────────────────────────────────
//  MILITARY UI — Military Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { saveFitTest } from '../application/militaryUseCases';
import { MIL_STANDARDS, evaluateAllEvents, calcBMI, bmiCategory } from '../domain/militaryStandards';
import type { MilitaryUnit } from '../../../core/types';

let _activeUnit: MilitaryUnit = 'seal';
let _activeMilTab = 'standards';

export function renderMilitaryPanel(): void {
  renderStandards();
  renderFitTestHistory();
  renderMilPrograms();
}

function switchMil(tab: string): void {
  _activeMilTab = tab;
  document.querySelectorAll('.miltab').forEach((el, i) =>
    el.classList.toggle('on', ['standards', 'fitest', 'milprogram', 'bodycheck'][i] === tab)
  );
  document.querySelectorAll('.mil-panel').forEach(p => p.classList.remove('on'));
  document.getElementById(`milp-${tab}`)?.classList.add('on');
  if (tab === 'standards') renderStandards();
  if (tab === 'fitest')    renderFitTest();
  if (tab === 'milprogram') renderMilPrograms();
}

function selectUnit(unit: MilitaryUnit): void {
  _activeUnit = unit;
  document.querySelectorAll<HTMLElement>('.unit-chip').forEach(c =>
    c.classList.toggle('on', c.dataset.unit === unit)
  );
  if (_activeMilTab === 'standards') renderStandards();
  if (_activeMilTab === 'fitest')    renderFitTest();
}

function renderStandards(): void {
  const u      = MIL_STANDARDS[_activeUnit];
  const latest = store.getState().military.fitTestHistory[0];
  const evals  = evaluateAllEvents(_activeUnit, latest?.scores || {});

  const STATUS_HTML: Record<string, string> = {
    elite:    '<span class="pass-badge elite">⭐ ELITE</span>',
    pass:     '<span class="pass-badge pass">✅ PASS</span>',
    fail:     '<span class="pass-badge fail">✗ ยังไม่ผ่าน</span>',
    untested: '',
  };

  const rows = evals.map(({ event: ev, value, status }) => `
    <tr>
      <td class="std-event">${ev.name}</td>
      <td class="std-pass">${ev.pass}</td>
      <td class="std-elite">${ev.elite}</td>
      <td>${value !== null ? `<span style="font-family:'JetBrains Mono';font-size:.76rem">${value}</span>` : '<span style="color:var(--t3)">—</span>'}</td>
      <td>${STATUS_HTML[status]}</td>
    </tr>`).join('');

  document.getElementById('standards-display')!.innerHTML = `
    <div class="standards-card">
      <div class="standards-card-head" style="border-left:4px solid ${u.color}">
        <span style="font-size:1.3rem">${u.icon}</span>
        <div><div class="sc-name" style="color:${u.color}">${u.name}</div><div class="sc-desc">${u.desc}</div></div>
      </div>
      <div style="overflow-x:auto">
        <table class="std-table" style="min-width:380px">
          <thead><tr><th>รายการ</th><th>ผ่าน</th><th>เยี่ยม</th><th>ของคุณ</th><th>สถานะ</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function renderFitTest(): void {
  const u      = MIL_STANDARDS[_activeUnit];
  const latest = store.getState().military.fitTestHistory[0];

  const unitChips = Object.entries(MIL_STANDARDS).map(([k, v]) =>
    `<div class="unit-chip ${k === _activeUnit ? 'on' : ''}" data-unit="${k}"
      onclick="window._wkSelectUnit('${k}')" style="font-size:.7rem;padding:4px 9px">${v.icon} ${v.name}</div>`
  ).join('');

  const cards = u.events.map(ev => {
    const prev = latest?.scores?.[ev.id];
    return `<div class="fit-event-card"><h4>${ev.name}</h4>
      <div class="fit-event-row">
        <input type="number" id="ft-${ev.id}" placeholder="${ev.lowerBetter ? 'นาที' : 'ครั้ง'}"
          step="${ev.lowerBetter ? '.1' : '1'}" min="0" max="${ev.max}" value="${prev ?? ''}">
        <span class="fe-unit">${ev.unit}</span>
        <span style="font-size:.68rem;color:var(--t2)">ผ่าน: <b style="color:#ff9500">${ev.pass}</b> | เยี่ยม: <b style="color:var(--lime)">${ev.elite}</b></span>
      </div>
    </div>`;
  }).join('');

  document.getElementById('fit-test-wrap')!.innerHTML =
    `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px">${unitChips}</div>${cards}`;
  renderFitTestHistory();
}

function renderFitTestHistory(): void {
  const el = document.getElementById('fit-test-history');
  if (!el) return;
  const history = store.getState().military.fitTestHistory;
  if (!history.length) {
    el.innerHTML = '<div class="empty" style="padding:18px 0">ยังไม่มีผลทดสอบ</div>';
    return;
  }
  el.innerHTML = history.slice(0, 10).map(rec => {
    const u     = MIL_STANDARDS[rec.unit];
    const evals = evaluateAllEvents(rec.unit, rec.scores);
    const chips = evals.filter(e => e.value !== null).map(({ event: ev, value, status }) => {
      const color = status === 'elite' ? 'var(--lime)' : status === 'pass' ? '#ff9500' : '#ff4444';
      return `<div class="fit-score-chip">
        <div class="fsc-event">${ev.name}</div>
        <div class="fsc-val" style="color:${color}">${value} ${ev.unit}</div>
      </div>`;
    }).join('');
    return `<div class="fit-hist-item">
      <div style="font-size:.68rem;color:var(--t3);font-family:'JetBrains Mono';margin-bottom:6px">
        ${new Date(rec.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })} · ${u?.icon} ${u?.name}
      </div>
      <div class="fit-hist-scores">${chips}</div>
    </div>`;
  }).join('');
}

function doSaveFitTest(): void {
  const u      = MIL_STANDARDS[_activeUnit];
  const scores: Record<string, number> = {};
  u.events.forEach(ev => {
    const val = parseFloat((document.getElementById(`ft-${ev.id}`) as HTMLInputElement)?.value);
    if (!isNaN(val)) scores[ev.id] = val;
  });
  saveFitTest(_activeUnit, scores);
  renderFitTest();
  renderStandards();
}

function renderMilPrograms(): void {
  const progs = [
    { k: 'seal_prep', name: 'SEAL Prep 12 สัปดาห์',     desc: 'วิ่ง+ว่าย+Calisthenics' },
    { k: 'sf_prep',   name: 'Special Forces 12 สัปดาห์', desc: 'วิ่งไกล+Ruck+Strength' },
    { k: 'base_fit',  name: 'Base Fitness 8 สัปดาห์',    desc: 'ทหารราบ เหมาะมือใหม่' },
  ];
  const gridEl = document.getElementById('milprog-grid');
  if (gridEl) gridEl.innerHTML = progs.map(p =>
    `<div class="milprog-card" onclick="window._wkShowMilProg('${p.k}')"><h3>${p.name}</h3><p>${p.desc}</p></div>`
  ).join('');
}

function calcBodyCheck(): void {
  const h = parseFloat((document.getElementById('bc-height') as HTMLInputElement)?.value);
  const w = parseFloat((document.getElementById('bc-weight') as HTMLInputElement)?.value);
  if (!h || !w) { import('../../../app/eventBus').then(({ eventBus, EVENTS }) => eventBus.emit(EVENTS.TOAST, 'กรุณากรอกส่วนสูงและน้ำหนัก')); return; }
  const bmi   = calcBMI(w, h);
  const label = bmiCategory(bmi);
  const color = bmi < 18.5 ? '#3d8eff' : bmi < 25 ? '#b5ff2d' : bmi < 30 ? '#ff9500' : '#ff4444';
  const minW  = (h / 100) ** 2 * 17.5;
  const maxW  = (h / 100) ** 2 * 25;
  const pass  = bmi >= 17.5 && bmi <= 25;
  document.getElementById('body-check-result')!.innerHTML = `
    <div class="body-result-card">
      <h3>📊 BMI</h3>
      <div class="bmi-display">
        <div><div class="bmi-val" style="color:${color}">${bmi.toFixed(1)}</div><div style="font-size:.68rem;color:var(--t2)">BMI</div></div>
        <div>
          <span class="pass-badge ${pass ? 'pass' : 'fail'}">${label}</span>
          <div style="font-size:.73rem;color:var(--t2);margin-top:7px">
            น้ำหนักที่เหมาะสม: <strong style="color:var(--lime)">${minW.toFixed(1)}–${maxW.toFixed(1)} kg</strong>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Expose ──────────────────────────────────────
(window as any).switchMil         = switchMil;
(window as any).selectUnit        = selectUnit;
(window as any)._wkSelectUnit     = selectUnit;
(window as any).saveFilTest       = doSaveFitTest;
(window as any).calcBodyCheck     = calcBodyCheck;
(window as any)._wkShowMilProg    = (key: string) => {
  document.getElementById('milprog-grid')!.style.display = 'none';
  document.getElementById('milprog-detail')!.style.display = 'block';
  import('./MilitaryPrograms').then(m => m.renderMilProgDetail(key));
};

// ── Named exports for dynamic import() in app.ts ──
export { selectUnit, doSaveFitTest, calcBodyCheck };
