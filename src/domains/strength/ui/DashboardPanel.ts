// ─────────────────────────────────────────────
//  STRENGTH UI — Dashboard Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { calcTotalVolume, calcMuscleVolume, calcBest1RMs, calcMuscleFrequency } from '../domain/calcStrength';
import { computeFatigue, calcGrowthIndex } from '../domain/calcFatigue';
import { drawLineChart } from '../../../shared/utils/chart';
import { withinDays, formatThaiDate } from '../../../shared/utils/dateUtils';
import { MUSCLE_COLORS } from '../../../core/constants';

type DashTab = 'volume' | 'oneRM' | 'freq' | 'fatigue';
let _activeDash: DashTab = 'volume';

export function renderDashboardPanel(): void {
  switchDash(_activeDash);
}

export function switchDash(tab: DashTab): void {
  _activeDash = tab;
  document.querySelectorAll('.dashtab').forEach((el, i) => {
    const tabs: DashTab[] = ['volume', 'oneRM', 'freq', 'fatigue'];
    el.classList.toggle('on', tabs[i] === tab);
  });
  document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('on'));
  document.getElementById(`dash-${tab}`)?.classList.add('on');

  if (tab === 'volume')  renderVolume();
  if (tab === 'oneRM')   renderOneRM();
  if (tab === 'freq')    renderFreq();
  if (tab === 'fatigue') renderFatigue();
}

// ── Volume ─────────────────────────────────────
function renderVolume(): void {
  const { history } = store.getState().strength;
  const last7  = history.filter(h => withinDays(h.date, 7));
  const last30 = history.filter(h => withinDays(h.date, 30));

  const vol7   = calcTotalVolume(last7);
  const vol30  = calcTotalVolume(last30);
  const sets7  = last7.reduce((s, h) => s + (h.sets || 0), 0);

  const statsEl = document.getElementById('vol-stats');
  if (statsEl) statsEl.innerHTML = [
    [Math.round(vol7).toLocaleString(), 'Volume 7 วัน (kg)'],
    [Math.round(vol30).toLocaleString(), 'Volume 30 วัน (kg)'],
    [sets7, 'Total Sets 7 วัน'],
    [last7.length, 'Sessions 7 วัน'],
  ].map(([v, l]) => `<div class="stat-card"><div class="sv">${v}</div><div class="sl">${l}</div></div>`).join('');

  const muscleVol = calcMuscleVolume(last30);
  const sorted = Object.entries(muscleVol).sort((a, b) => b[1] - a[1]);
  const maxV = sorted[0]?.[1] || 1;

  const barsEl = document.getElementById('vol-muscle-bars');
  if (barsEl) barsEl.innerHTML = sorted.slice(0, 10).map(([m, v]) => `
    <div class="muscle-bar-wrap">
      <div class="muscle-bar-label"><span>${m}</span><span>${v.toFixed(1)} sets</span></div>
      <div class="muscle-bar-track">
        <div class="muscle-bar-fill" style="width:${(v / maxV * 100).toFixed(1)}%;background:${MUSCLE_COLORS[m] || '#b5ff2d'}"></div>
      </div>
    </div>`).join('') || '<div class="empty" style="padding:18px 0">ไม่มีข้อมูล</div>';

  const exVol: Record<string, number> = {};
  last7.forEach(h => { exVol[h.exercise] = (exVol[h.exercise] || 0) + (h.sets || 1) * Math.max(1, h.weight || 1); });
  const listEl = document.getElementById('vol-exercise-list');
  if (listEl) listEl.innerHTML = Object.entries(exVol).sort((a, b) => b[1] - a[1])
    .map(([n, v]) => `<div class="rm-row"><div class="rm-name">${n}</div><div class="rm-val">${Math.round(v).toLocaleString()} kg</div></div>`).join('')
    || '<div style="color:var(--t3);font-size:.8rem;padding:9px 0">ไม่มีข้อมูล 7 วัน</div>';
}

// ── 1RM ────────────────────────────────────────
function renderOneRM(): void {
  const { history } = store.getState().strength;
  const best = calcBest1RMs(history);

  const listEl = document.getElementById('oneRM-list');
  if (listEl) listEl.innerHTML = Object.entries(best).sort((a, b) => b[1].orm - a[1].orm)
    .map(([name, d]) => `
      <div class="rm-row">
        <div>
          <div class="rm-name">${name}</div>
          <div class="rm-sub">${d.weight}kg × ${d.reps} reps · ${formatThaiDate(d.date, { day: 'numeric', month: 'short' })}</div>
        </div>
        <div class="rm-val">${d.orm} kg</div>
      </div>`)
    .join('') || '<div style="color:var(--t3);padding:9px 0">กรอกน้ำหนัก+เรปเพื่อคำนวณ</div>';

  const sel = document.getElementById('oneRM-chart-select');
  if (sel) sel.innerHTML = `
    <select id="oneRM-exercise-select" class="input-select-styled" onchange="window._wkRender1RMChart(this.value)">
      <option value="">-- เลือกท่า --</option>
      ${Object.keys(best).map(n => `<option value="${n}">${n}</option>`).join('')}
    </select>`;
}

function render1RMChart(exName: string): void {
  const wrap = document.getElementById('oneRM-chart-wrap');
  if (!exName || !wrap) return;
  const { history } = store.getState().strength;
  const data = history.filter(h => h.exercise === exName && h.weight && h.reps).reverse();
  if (data.length < 2) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';
  setTimeout(() => drawLineChart(
    'oneRMChart',
    data.map(h => formatThaiDate(h.date, { day: 'numeric', month: 'short' })),
    data.map(h => h.weight!),
    '#ff9500'
  ), 50);
}

// ── Frequency ──────────────────────────────────
function renderFreq(): void {
  const { history } = store.getState().strength;
  const last30 = history.filter(h => withinDays(h.date, 30));
  const sessions = new Set(last30.map(h => new Date(h.date).toDateString())).size;

  const statsEl = document.getElementById('freq-stats');
  if (statsEl) statsEl.innerHTML = [
    [sessions, 'วันออกกำลัง 30 วัน'],
    [(sessions / 4.3).toFixed(1), 'ครั้ง/สัปดาห์'],
  ].map(([v, l]) => `<div class="stat-card"><div class="sv">${v}</div><div class="sl">${l}</div></div>`).join('');

  const mFreq = calcMuscleFrequency(last30);
  const sorted = Object.entries(mFreq).sort((a, b) => b[1] - a[1]);
  const maxF = sorted[0]?.[1] || 1;

  const muscleEl = document.getElementById('freq-muscle-list');
  if (muscleEl) muscleEl.innerHTML = `
    <div class="section-title">ความถี่รายกล้ามเนื้อ</div>
    ${sorted.map(([m, f]) => `
      <div class="muscle-bar-wrap">
        <div class="muscle-bar-label"><span>${m}</span><span>${f} วัน</span></div>
        <div class="muscle-bar-track">
          <div class="muscle-bar-fill" style="width:${(f / maxF * 100).toFixed(1)}%;background:${MUSCLE_COLORS[m] || '#b5ff2d'}"></div>
        </div>
      </div>`).join('')}`;

  const exFreq: Record<string, number> = {};
  last30.forEach(h => { exFreq[h.exercise] = (exFreq[h.exercise] || 0) + 1; });
  const exEl = document.getElementById('freq-exercise-list');
  if (exEl) exEl.innerHTML = Object.entries(exFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([n, f]) => `<div class="rm-row"><div class="rm-name">${n}</div><div class="rm-val">${f}×</div></div>`).join('');
}

// ── Fatigue ────────────────────────────────────
function renderFatigue(): void {
  const { history } = store.getState().strength;
  const fatigue = computeFatigue(history);
  const sf = fatigue.systemic;
  const zone  = sf < 30 ? 'low' : sf < 65 ? 'med' : 'high';
  const label = sf < 30 ? 'พักผ่อนเพียงพอ' : sf < 65 ? 'โหลดสะสม' : 'Overreach';
  const color = sf < 30 ? '#00ff88' : sf < 65 ? '#ffaa00' : '#ff4444';

  const sysEl = document.getElementById('systemic-display');
  if (sysEl) sysEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:11px;margin-bottom:7px">
      <div style="font-family:'Bebas Neue';font-size:2.3rem;color:${color};letter-spacing:2px">${sf.toFixed(0)}</div>
      <div>
        <div class="fatigue-zone ${zone}">${label}</div>
        <div style="font-size:.7rem;color:var(--t2);margin-top:3px">Systemic Fatigue (0–100)</div>
      </div>
    </div>
    <div class="systemic-bar"><div class="systemic-fill" style="width:${sf}%;background:${color}"></div></div>`;

  const sorted = Object.entries(fatigue.muscle).sort((a, b) => b[1] - a[1]);
  const maxMF = sorted[0]?.[1] || 1;
  const mfColor = (v: number) => v > maxMF * 0.7 ? '#ff4444' : v > maxMF * 0.4 ? '#ffaa00' : '#00ff88';

  const muscleEl = document.getElementById('fatigue-muscle-list');
  if (muscleEl) muscleEl.innerHTML = sorted.length
    ? sorted.map(([m, f]) => `
        <div class="muscle-bar-wrap">
          <div class="muscle-bar-label"><span>${m}</span><span style="color:${mfColor(f)}">${f.toFixed(2)} eff.sets</span></div>
          <div class="muscle-bar-track">
            <div class="muscle-bar-fill" style="width:${(f / maxMF * 100).toFixed(1)}%;background:${mfColor(f)}"></div>
          </div>
        </div>`).join('')
    : '<div style="color:var(--t3);font-size:.8rem;padding:9px 0">บันทึกผลเพื่อดู</div>';

  const gi = calcGrowthIndex(fatigue.muscle);
  const giEl = document.getElementById('growth-list');
  if (giEl) giEl.innerHTML = Object.entries(gi).sort((a, b) => b[1] - a[1])
    .map(([m, g]) => {
      const c = g > 0.6 ? '#b5ff2d' : g > 0.3 ? '#ff9500' : '#ff4444';
      return `<div class="growth-index-row">
        <div class="gi-name">${m}</div>
        <div class="gi-bar-wrap"><div class="gi-bar-track">
          <div class="gi-bar-fill" style="width:${(g * 100).toFixed(0)}%;background:${c}"></div>
        </div></div>
        <div class="gi-val" style="color:${c}">${(g * 100).toFixed(0)}%</div>
      </div>`;
    }).join('') || '<div style="color:var(--t3);font-size:.8rem;padding:9px 0">ไม่มีข้อมูล</div>';
}

// ── Expose ──────────────────────────────────────
(window as any).switchDash         = switchDash;
(window as any)._wkRender1RMChart  = render1RMChart;

// ── Named exports for dynamic import() in app.ts ──
// renderDashboardPanel + switchDash already exported above
