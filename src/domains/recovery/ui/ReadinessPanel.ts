// ─────────────────────────────────────────────
//  RECOVERY UI — Readiness Panel
// ─────────────────────────────────────────────
import { store } from '../../../core/store';
import { saveReadinessLog } from '../application/recoveryUseCases';
import { calcReadinessScore, type ReadinessInput } from '../domain/calcReadiness';
import { formatThaiDate } from '../../../shared/utils/dateUtils';

export function renderReadinessPanel(): void {
  calcReadiness();
  renderReadinessHistory();
}

function _getInput(): ReadinessInput {
  const n = (id: string) => parseFloat((document.getElementById(id) as HTMLInputElement)?.value) || 0;
  return {
    sleep:  n('r-sleep')   || 7,
    sleepQ: n('r-sleep-q') || 3,
    energy: n('r-energy')  || 3,
    sore:   n('r-sore')    || 2,
    rhr:    n('r-rhr')     || 60,
    motiv:  n('r-motiv')   || 3,
    stress: n('r-stress')  || 2,
  };
}

export function calcReadiness(): void {
  const input  = _getInput();
  const result = calcReadinessScore(input);

  const displayEl = document.getElementById('ready-score-display');
  const labelEl   = document.getElementById('ready-label');
  const recEl     = document.getElementById('ready-recommendation');

  if (displayEl) { displayEl.textContent = String(result.score); displayEl.style.color = result.color; }
  if (labelEl)   { labelEl.textContent   = result.label;         labelEl.style.color   = result.color; }

  if (recEl) {
    recEl.style.display     = 'block';
    recEl.style.borderColor = result.color + '44';
    recEl.innerHTML = `
      <h3 style="color:${result.color}">💡 คำแนะนำวันนี้</h3>
      ${result.recommendations.map(r => `<div class="rec-item">${r}</div>`).join('')}`;
  }
}

function doSaveReadiness(): void {
  const input = _getInput();
  saveReadinessLog(input);
  renderReadinessHistory();
}

function renderReadinessHistory(): void {
  const el      = document.getElementById('readiness-history');
  const history = store.getState().recovery.readinessHistory;
  if (!el) return;
  el.innerHTML = history.slice(0, 7).map(r => {
    const color = r.score >= 80 ? '#b5ff2d' : r.score >= 60 ? '#ff9500' : r.score >= 40 ? '#ff4444' : '#888';
    const label = r.score >= 80 ? 'High' : r.score >= 60 ? 'Med' : r.score >= 40 ? 'Low' : 'Rest';
    return `<div class="readiness-hist-item">
      <div>
        <div style="font-weight:700;font-size:.83rem">${formatThaiDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
        <div style="font-size:.68rem;color:var(--t2);margin-top:2px">
          😴${r.sleep}h · ⚡${r.energy}/5 · 🦵${r.sore}/5 · 🎯${r.motiv}/5
        </div>
      </div>
      <div style="text-align:right">
        <div class="readiness-score-mini" style="color:${color}">${r.score}</div>
        <div style="font-size:.63rem;color:${color}">${label}</div>
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--t3);font-size:.8rem;padding:9px 0">ยังไม่มีประวัติ</div>';
}

// ── Expose ──────────────────────────────────────
(window as any).calcReadiness      = calcReadiness;
(window as any).saveReadinessLog   = doSaveReadiness;

// ── Named exports for dynamic import() in app.ts ──
export { doSaveReadiness };
