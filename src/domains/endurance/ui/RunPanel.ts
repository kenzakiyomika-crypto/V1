// ─────────────────────────────────────────────
//  ENDURANCE UI — Run Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { eventBus } from '../../../app/eventBus';
import { saveRunLog } from '../application/enduranceUseCases';
import { formatPace, calcRunPace, generateIntervalPlan, isRunPassingSEAL } from '../domain/calcEndurance';
import { drawLineChart } from '../../../shared/utils/chart';
import { todayISO, withinDays, formatThaiDate } from '../../../shared/utils/dateUtils';
import { RUN_TYPE_LABELS, RUN_TYPE_COLORS } from '../../../core/constants';
import type { RunType } from '../../../core/types';

// ── Rule Engine endurance events ─────────────
let _freezeMileage   = false;
let _suggestInterval = false;
let _paceNote        = '';

eventBus.on('RULE_FREEZE_MILEAGE', () => {
  _freezeMileage = true;
  renderRunPanel();
});
eventBus.on('RULE_ADD_INTERVAL', () => {
  _suggestInterval = true;
  renderRunPanel();
});
eventBus.on('RULE_PACE_RECALIBRATE', (data: any) => {
  const dir = data?.direction === 'up' ? 'ดีขึ้น ⬆️' : 'ลดลง ⬇️';
  _paceNote = `Pace ${dir} — โซนความเร็วอัปเดตแล้ว`;
  renderRunPanel();
});

export function renderRunPanel(): void {
  const dateEl = document.getElementById('run-date') as HTMLInputElement | null;
  if (dateEl && !dateEl.value) dateEl.value = todayISO();

  const { runs } = store.getState().endurance;
  const last30 = runs.filter(r => withinDays(r.date, 30));
  const totalKm = last30.reduce((s, r) => s + r.dist, 0);
  const best3k  = runs.filter(r => r.dist >= 2.8 && r.dist <= 3.2 && r.pace).sort((a, b) => a.pace - b.pace)[0];

  // Rule Engine banners
  const ruleEl = document.getElementById('run-rule-banner');
  if (ruleEl) {
    const msgs: string[] = [];
    if (_freezeMileage)   msgs.push('🚫 Rule Engine: หยุดเพิ่ม mileage สัปดาห์นี้');
    if (_suggestInterval) msgs.push('⚡ Rule Engine: แนะนำเพิ่ม Interval session');
    if (_paceNote)        msgs.push(`📊 ${_paceNote}`);
    ruleEl.innerHTML = msgs.length
      ? `<div style="background:#001a33;border:1px solid #3d8eff44;border-radius:8px;
           padding:8px 12px;margin-bottom:10px;font-size:.72rem;color:#3d8eff;line-height:1.6">
           ${msgs.join('<br>')}
         </div>`
      : '';
  }

  // Stats row
  document.getElementById('run-stats-row')!.innerHTML = [
    [totalKm.toFixed(1), 'km/30วัน'],
    [last30.length,      'Sessions'],
    [best3k ? formatPace(best3k.pace) : '—', 'Best 3km'],
  ].map(([v, l]) =>
    `<div class="stat-card"><div class="sv" style="font-size:1.1rem">${v}</div><div class="sl">${l}</div></div>`
  ).join('');

  // Pace chart
  const chartData = runs.filter(r => r.dist >= 2.5 && r.pace).slice(0, 20).reverse();
  const cs = document.getElementById('run-chart-section');
  if (cs) {
    cs.style.display = chartData.length >= 2 ? 'block' : 'none';
    if (chartData.length >= 2) {
      setTimeout(() => drawLineChart(
        'runPaceChart',
        chartData.map(r => formatThaiDate(r.date, { day: 'numeric', month: 'short' })),
        chartData.map(r => +r.pace.toFixed(2)),
        '#b5ff2d'
      ), 50);
    }
  }

  // History
  const histEl = document.getElementById('run-history-list');
  if (histEl) histEl.innerHTML = runs.length
    ? runs.slice(0, 30).map(r => {
        const isPR   = best3k && r.dist >= 2.8 && r.dist <= 3.2 && Math.abs(r.pace - best3k.pace) < 0.01;
        const passes = isRunPassingSEAL(r.dist, r.time);
        return `<div class="run-hist-item">
          <div>
            <div style="font-weight:700">${r.dist}กม.
              <span style="font-size:.7rem;color:${RUN_TYPE_COLORS[r.type] || 'var(--t2)'}">${RUN_TYPE_LABELS[r.type] || r.type}</span>
            </div>
            <div style="font-size:.71rem;color:var(--t2);margin-top:2px">
              ${formatThaiDate(r.date, { day: 'numeric', month: 'short' })} · ${r.time}นาที
              ${r.hr ? ' · ❤️' + r.hr : ''}${r.note ? ' · ' + r.note : ''}
            </div>
            ${isPR    ? '<span class="run-badge pr">🏆 PR</span>'       : ''}
            ${passes  ? '<span class="run-badge pass">✅ ผ่านเกณฑ์</span>' : ''}
          </div>
          <div class="run-pace">${formatPace(r.pace)}</div>
        </div>`;
      }).join('')
    : '<div class="empty" style="padding:22px 0"><span class="ei">🏃</span>ยังไม่มีประวัติวิ่ง</div>';
}

function liveRunPace(): void {
  const d = parseFloat((document.getElementById('run-dist') as HTMLInputElement)?.value);
  const t = parseFloat((document.getElementById('run-time') as HTMLInputElement)?.value);
  const el = document.getElementById('run-live-pace');
  if (el) el.textContent = d && t ? `Pace: ${formatPace(calcRunPace(d, t))}` : '';
}

function doSaveRun(): void {
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value || '';
  saveRunLog({
    dist: parseFloat(g('run-dist')) || 0,
    time: parseFloat(g('run-time')) || 0,
    type: (g('run-type') || 'easy') as RunType,
    date: g('run-date') || todayISO(),
    hr:   parseFloat(g('run-hr')) || null,
    note: g('run-note').trim(),
  });
  ['run-dist', 'run-time', 'run-hr', 'run-note'].forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = '';
  });
  const lp = document.getElementById('run-live-pace');
  if (lp) lp.textContent = '';
  renderRunPanel();
}

function previewInterval(): void {
  const goal  = parseFloat((document.getElementById('int-goal') as HTMLInputElement)?.value);
  const phase = (document.getElementById('int-phase') as HTMLSelectElement)?.value as any;
  const el    = document.getElementById('interval-preview');
  if (!el) return;
  if (!goal) { el.innerHTML = ''; return; }
  const plan = generateIntervalPlan(goal, phase);
  el.innerHTML = `
    <div class="interval-plan">
      <h4>${plan.title}</h4>
      <div style="font-size:.7rem;color:var(--t2);margin-bottom:7px">เป้า 3km: <strong style="color:var(--lime)">${goal}นาที</strong> | Pace: <strong style="color:var(--lime)">${plan.goalPace}</strong></div>
      ${plan.sets.map(s => `
        <div class="interval-set">
          <span class="is-type">${s.type}</span>
          <span class="is-dist">${s.distance}</span>
          <span class="is-pace">${s.pace}</span>
          <span style="font-size:.66rem;color:var(--t3)">${s.note}</span>
        </div>`).join('')}
    </div>`;
}

// ── Expose ──────────────────────────────────────
(window as any).liveRunPace    = liveRunPace;
(window as any).saveRunLog     = doSaveRun;
(window as any).previewInterval = previewInterval;

// ── Named exports for dynamic import() in app.ts ──
export { liveRunPace, doSaveRun, previewInterval };
