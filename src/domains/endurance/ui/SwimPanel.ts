// ─────────────────────────────────────────────
//  ENDURANCE UI — Swim Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { saveSwimLog } from '../application/enduranceUseCases';
import { formatSwimPace, calcSwimPace, isSwimPassingSEAL200, isSwimPassingSEAL500 } from '../domain/calcEndurance';
import { drawLineChart } from '../../../shared/utils/chart';
import { todayISO, withinDays, formatThaiDate } from '../../../shared/utils/dateUtils';
import { STROKE_TH } from '../../../core/constants';
import type { SwimStroke } from '../../../core/types';

const SWIM_PROG = [
  { w: 'สัปดาห์ 1-2', t: 'เน้น Form',        s: ['200ม. ต่อเนื่อง เป้า ≤5:30', '4×50ม. พัก 30 วิ — Stroke Technique', 'Kick Board 100ม.×3 เซ็ต'] },
  { w: 'สัปดาห์ 3-4', t: 'เพิ่ม Volume',      s: ['ทดสอบ 200ม. Full Effort', '6×50ม. + 1×200ม.', '4×100ม. พัก 45 วิ'] },
  { w: 'สัปดาห์ 5-6', t: 'ทดสอบ 500ม.',      s: ['500ม. ต่อเนื่อง Full Effort', '10×50ม. พัก 15 วิ', '2×200ม. พัก 3 นาที'] },
  { w: 'สัปดาห์ 7-8', t: 'SEAL Standard',    s: ['200ม. ≤5:00 (ผ่านซีล)', '500ม. ≤13:00 (ผ่านซีล)', 'Dress: 200ม. + 500ม. พัก 10 นาที'] },
];

export function renderSwimPanel(): void {
  const dateEl = document.getElementById('sw-date') as HTMLInputElement | null;
  if (dateEl && !dateEl.value) dateEl.value = todayISO();

  const { swims } = store.getState().endurance;
  const last30 = swims.filter(r => withinDays(r.date, 30));
  const totalM = last30.reduce((s, r) => s + r.dist, 0);
  const best200 = swims.filter(r => r.dist >= 180 && r.dist <= 220).sort((a, b) => a.time - b.time)[0];
  const best500 = swims.filter(r => r.dist >= 475 && r.dist <= 525).sort((a, b) => a.time - b.time)[0];

  // Stats
  document.getElementById('swim-stats-row')!.innerHTML = [
    [totalM, 'ม./30วัน', '1.7rem'],
    [best200 ? `${best200.time.toFixed(1)}'` : '—', 'Best 200m', '1.1rem'],
    [best500 ? `${best500.time.toFixed(1)}'` : '—', 'Best 500m', '1.1rem'],
  ].map(([v, l, fs]) =>
    `<div class="swim-stat-card"><div class="sv" style="font-size:${fs}">${v}</div><div class="sl">${l}</div></div>`
  ).join('');

  // SEAL targets
  if (best200) {
    const pct = Math.min(100, Math.max(0, (5 - best200.time) / (5 - 4) * 100));
    const el  = document.getElementById('swim-200-display');
    const bar = document.getElementById('swim-200-bar');
    if (el)  el.textContent     = `${best200.time.toFixed(1)}นาที ${best200.time <= 4 ? '⭐' : best200.time <= 5 ? '✅' : '❌'}`;
    if (bar) bar.style.width    = `${pct}%`;
  }
  if (best500) {
    const pct = Math.min(100, Math.max(0, (13 - best500.time) / (13 - 10) * 100));
    const el  = document.getElementById('swim-500-display');
    const bar = document.getElementById('swim-500-bar');
    if (el)  el.textContent     = `${best500.time.toFixed(1)}นาที ${best500.time <= 10 ? '⭐' : best500.time <= 13 ? '✅' : '❌'}`;
    if (bar) bar.style.width    = `${pct}%`;
  }

  // Program
  document.getElementById('swim-program-display')!.innerHTML = SWIM_PROG.map(p => `
    <div style="margin-bottom:9px;background:var(--s2);border-radius:7px;padding:9px 11px">
      <div style="font-size:.7rem;font-family:'JetBrains Mono';color:#3d8eff;margin-bottom:4px">${p.w} — ${p.t}</div>
      ${p.s.map(s => `<div style="font-size:.76rem;color:var(--t2);padding:2px 0;border-bottom:1px solid var(--border)">• ${s}</div>`).join('')}
    </div>`).join('');

  // Pace chart
  const chartData = swims.filter(r => r.secPer100).slice(0, 20).reverse();
  const cs = document.getElementById('swim-chart-section');
  if (cs) {
    cs.style.display = chartData.length >= 2 ? 'block' : 'none';
    if (chartData.length >= 2) {
      setTimeout(() => drawLineChart(
        'swimPaceChart',
        chartData.map(r => formatThaiDate(r.date, { day: 'numeric', month: 'short' })),
        chartData.map(r => +r.secPer100.toFixed(0)),
        '#3d8eff'
      ), 50);
    }
  }

  // History
  const histEl = document.getElementById('swim-history-list');
  if (histEl) histEl.innerHTML = swims.length
    ? swims.slice(0, 30).map(r => {
        const seal200 = isSwimPassingSEAL200(r.dist, r.time);
        const seal500 = isSwimPassingSEAL500(r.dist, r.time);
        return `<div class="swim-hist-item">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:700">${r.dist}ม. · ${r.time}นาที</div>
              <div style="font-family:'Bebas Neue';font-size:1.2rem;color:#3d8eff;line-height:1">${formatSwimPace(r.secPer100)}</div>
              <span class="stroke-chip">${STROKE_TH[r.stroke] || r.stroke}</span>
            </div>
            <div style="text-align:right;font-size:.7rem;color:var(--t2)">
              ${formatThaiDate(r.date, { day: 'numeric', month: 'short' })}
              ${r.note ? `<div>${r.note}</div>` : ''}
              ${seal200 ? '<div style="color:var(--lime)">✅ ซีล 200ม.</div>' : ''}
              ${seal500 ? '<div style="color:var(--lime)">✅ ซีล 500ม.</div>' : ''}
            </div>
          </div>
        </div>`;
      }).join('')
    : '<div class="empty" style="padding:22px 0"><span class="ei">🏊</span>ยังไม่มีประวัติว่ายน้ำ</div>';
}

function liveSwimPace(): void {
  const d = parseFloat((document.getElementById('sw-dist') as HTMLInputElement)?.value);
  const t = parseFloat((document.getElementById('sw-time') as HTMLInputElement)?.value);
  const el = document.getElementById('sw-live-pace');
  if (el) el.textContent = d && t ? `Pace: ${formatSwimPace(calcSwimPace(d, t))}` : '';
}

function doSaveSwim(): void {
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value || '';
  saveSwimLog({
    dist:   parseFloat(g('sw-dist'))  || 0,
    time:   parseFloat(g('sw-time'))  || 0,
    stroke: (g('sw-stroke') || 'freestyle') as SwimStroke,
    date:   g('sw-date') || todayISO(),
    laps:   parseInt(g('sw-laps'))    || null,
    note:   g('sw-note').trim(),
  });
  ['sw-dist', 'sw-time', 'sw-laps', 'sw-note'].forEach(id => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.value = '';
  });
  const lp = document.getElementById('sw-live-pace');
  if (lp) lp.textContent = '';
  renderSwimPanel();
}

// ── Expose ──────────────────────────────────────
(window as any).liveSwimPace = liveSwimPace;
(window as any).saveSwimLog  = doSaveSwim;

// ── Named exports for dynamic import() in app.ts ──
export { liveSwimPace, doSaveSwim };
