// ─────────────────────────────────────────────
//  SHARED UI — Export Panel
// ─────────────────────────────────────────────
import { store } from '../../core/store';
import { exportStateJSON, importStateJSON, saveState } from '../../infra/persistence';
import { eventBus, EVENTS } from '../../app/eventBus';
import { safeCopy } from './uiHelpers';

export function renderExportPanel(): void {
  // static panel — nothing to render on activate
}

function exportCSV(): void {
  const { history } = store.getState().strength;
  const rows = [
    ['Date', 'Exercise', 'Sets', 'Reps', 'Weight(kg)', 'Intensity%', 'RPE', 'Note'],
    ...history.map(h => [
      h.date?.split('T')[0], h.exercise, h.sets, h.reps,
      h.weight || '', h.intensity || '', h.rpe || '', h.note || '',
    ]),
  ];
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  _download(blob, 'workout_history.csv');
  eventBus.emit(EVENTS.TOAST, 'Export CSV แล้ว ✓');
}

function exportJSON(): void {
  const json = exportStateJSON(store.getState());
  const blob = new Blob([json], { type: 'application/json' });
  _download(blob, 'wk_backup.json');
  eventBus.emit(EVENTS.TOAST, 'Export JSON แล้ว ✓');
}

function exportText(): void {
  const { history } = store.getState().strength;
  const lines = [
    `📊 WK Workout Tracker — ${new Date().toLocaleDateString('th-TH')}`,
    '',
    `ประวัติออกกำลังกาย (${history.length} รายการ)`,
    '─'.repeat(40),
    ...history.slice(0, 50).map(h =>
      `${h.date?.split('T')[0]} | ${h.exercise} | ${h.sets}s×${h.reps}r${h.weight ? ' @ ' + h.weight + 'kg' : ''}`
    ),
  ];
  const txtEl = document.getElementById('export-txt') as HTMLTextAreaElement | null;
  if (txtEl) txtEl.value = lines.join('\n');
  document.getElementById('ov-export')?.classList.add('on');
}

function loadBackup(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = importStateJSON(ev.target?.result as string);
      // Merge imported into current state
      const current  = store.getState();
      const merged = {
        ...imported,
        strength: {
          exercises: current.strength.exercises, // keep active session
          history:   [...imported.strength.history, ...current.strength.history],
        },
      };
      saveState(merged as any);
      eventBus.emit(EVENTS.TOAST, 'โหลด Backup แล้ว ✓');
      setTimeout(() => window.location.reload(), 800);
    } catch {
      eventBus.emit(EVENTS.TOAST, 'ไฟล์ไม่ถูกต้อง');
    }
  };
  reader.readAsText(file);
}

function _download(blob: Blob, filename: string): void {
  const a  = document.createElement('a');
  a.href   = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ── Expose ──────────────────────────────────────
(window as any).exportCSV     = exportCSV;
(window as any).exportJSON    = exportJSON;
(window as any).exportText    = exportText;
(window as any).loadBackup    = loadBackup;
(window as any).safeCopy      = safeCopy;

// ── Named exports for dynamic import() in app.ts ──
export { exportCSV, exportJSON, exportText, loadBackup };
