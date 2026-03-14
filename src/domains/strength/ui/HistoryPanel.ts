// ─────────────────────────────────────────────
//  STRENGTH UI — History Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { clearHistory } from '../application/strengthUseCases';
import { findPRs } from '../domain/calcStrength';
import { drawLineChart } from '../../../shared/utils/chart';
import { formatThaiDate } from '../../../shared/utils/dateUtils';

let _activeFilter = 'ทั้งหมด';

export function renderHistoryPanel(): void {
  const { history } = store.getState().strength;
  const names = [...new Set(history.map(h => h.exercise))];
  const filtersEl = document.getElementById('hist-filters');
  const listEl    = document.getElementById('hist-list');
  const chartSec  = document.getElementById('chart-section');
  if (!filtersEl || !listEl) return;

  filtersEl.innerHTML = ['ทั้งหมด', ...names].map(n =>
    `<button type="button" class="fb ${n === _activeFilter ? 'on' : ''}"
      data-n="${n}" onclick="window._wkFilterHist('${n}')">${n}</button>`
  ).join('');

  const filtered = _activeFilter === 'ทั้งหมด'
    ? history
    : history.filter(h => h.exercise === _activeFilter);

  if (!filtered.length) {
    listEl.innerHTML = '<div class="empty"><span class="ei">📊</span>ยังไม่มีประวัติ</div>';
    if (chartSec) chartSec.style.display = 'none';
    return;
  }

  // Chart for single exercise
  if (_activeFilter !== 'ทั้งหมด' && chartSec) {
    const data = filtered.filter(h => h.weight).reverse();
    if (data.length >= 2) {
      chartSec.style.display = 'block';
      document.getElementById('chart-title')!.textContent = `${_activeFilter} — Progress`;
      setTimeout(() => drawLineChart(
        'progChart',
        data.map(h => formatThaiDate(h.date, { day: 'numeric', month: 'short' })),
        data.map(h => h.weight!),
        '#b5ff2d'
      ), 50);
    } else {
      chartSec.style.display = 'none';
    }
  } else if (chartSec) {
    chartSec.style.display = 'none';
  }

  const prs = findPRs(history);
  const groups: Record<string, typeof filtered> = {};
  filtered.forEach(h => {
    const d = formatThaiDate(h.date);
    if (!groups[d]) groups[d] = [];
    groups[d].push(h);
  });

  listEl.innerHTML = Object.entries(groups).map(([date, items]) =>
    `<div class="hgroup">
      <div class="hdate">${date}</div>
      ${items.map(h => {
        const isPR = h.weight && prs[h.exercise] === h.weight &&
          history.filter(x => x.exercise === h.exercise && x.weight === h.weight).length === 1;
        return `<div class="hitem">
          <div>
            <div class="hn">${h.exercise}</div>
            <div class="hsub">${h.sets} เซ็ต${h.reps ? ' · ' + h.reps + ' reps' : ''}${h.note ? ' · ' + h.note : ''}</div>
          </div>
          <div>
            <div class="hw">${h.weight ? h.weight + 'kg' : '—'}</div>
            ${isPR ? '<span class="hpr">🏆 PR</span>' : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`
  ).join('');
}

(window as any)._wkFilterHist = (n: string) => {
  _activeFilter = n;
  renderHistoryPanel();
};
(window as any).filterHist = (n: string) => {
  _activeFilter = n;
  renderHistoryPanel();
};
(window as any).clearHist = () => {
  if (!confirm('ลบประวัติทั้งหมด?')) return;
  clearHistory();
  renderHistoryPanel();
};

// ── Named exports for dynamic import() in app.ts ──
// renderHistoryPanel already exported above
