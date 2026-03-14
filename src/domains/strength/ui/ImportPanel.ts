// ─────────────────────────────────────────────
//  STRENGTH UI — Import Panel
// ─────────────────────────────────────────────
import { addExercise } from '../application/strengthUseCases';
import { parseWorkoutText, parseCSVText, type ParsedExercise } from '../../../shared/utils/importParser';
import { switchTab } from '../../../app/router';
import { eventBus, EVENTS } from '../../../app/eventBus';

let _importMethod: 'text' | 'csv' = 'text';
let _csvText = '';

export function renderImportPanel(): void {
  // panel is static HTML; nothing to re-render on load
}

function setMethod(m: 'text' | 'csv'): void {
  _importMethod = m;
  document.getElementById('m-text')?.classList.toggle('on', m === 'text');
  document.getElementById('m-csv')?.classList.toggle('on', m === 'csv');
  document.getElementById('zone-text')!.style.display = m === 'text' ? 'block' : 'none';
  document.getElementById('zone-csv')!.style.display  = m === 'csv'  ? 'block' : 'none';
  document.getElementById('parse-result')!.innerHTML = '';
}

function onCSVFile(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    _csvText = ev.target?.result as string;
    document.getElementById('csvPrev')!.innerHTML =
      `<div style="margin-top:7px;font-size:.76rem;color:var(--teal)">✓ ${file.name}</div>`;
  };
  reader.readAsText(file);
}

function runParse(): void {
  let items: ParsedExercise[] = [];
  if (_importMethod === 'csv') {
    if (!_csvText) { eventBus.emit(EVENTS.TOAST, 'ยังไม่ได้เลือกไฟล์'); return; }
    items = parseCSVText(_csvText);
  } else {
    const text = (document.getElementById('itxt') as HTMLTextAreaElement)?.value.trim();
    if (!text) { eventBus.emit(EVENTS.TOAST, 'กรอกข้อความก่อน'); return; }
    items = parseWorkoutText(text);
  }
  showParsed(items);
}

function showParsed(items: ParsedExercise[]): void {
  const el = document.getElementById('parse-result')!;
  if (!items.length) {
    el.innerHTML = '<div style="color:var(--t2);margin-top:9px;padding:9px;background:var(--s2);border-radius:6px">ไม่พบท่า</div>';
    return;
  }
  el.innerHTML = `
    <div class="parsed-card">
      <div class="parse-tag">⚡ PARSED</div>
      <h3>พบ ${items.length} ท่า</h3>
      ${items.map((ex, i) => `
        <div class="pi">
          <div class="pn">${ex.name}</div>
          <div class="fg"><input type="number" value="${ex.sets || 3}" min="1" max="30" id="ps${i}"> เซ็ต</div>
          <div class="fg"><input type="text" value="${ex.reps || ''}" placeholder="reps" id="pr${i}" style="width:50px"> rep</div>
          <div class="fg"><input type="number" value="${ex.weight || ''}" placeholder="kg" step=".5" id="pw${i}" style="width:46px"> kg</div>
        </div>`).join('')}
      <button type="button" class="btn" style="width:100%;margin-top:11px"
        onclick="window._wkApplyParsed(${items.length})">เพิ่มทั้งหมดเข้า Session</button>
    </div>`;
}

function applyParsed(n: number): void {
  const nameEls = document.querySelectorAll<HTMLElement>('.pi .pn');
  for (let i = 0; i < n; i++) {
    const name   = nameEls[i]?.textContent?.trim() || '';
    const sets   = parseInt((document.getElementById(`ps${i}`) as HTMLInputElement)?.value) || 3;
    const reps   = (document.getElementById(`pr${i}`) as HTMLInputElement)?.value || '';
    const weight = parseFloat((document.getElementById(`pw${i}`) as HTMLInputElement)?.value) || null;
    if (name) addExercise({ name, sets, reps, weight });
  }
  switchTab('workout');
  eventBus.emit(EVENTS.TOAST, `เพิ่ม ${n} ท่าแล้ว ✓`);
}

// ── Drop zone ──────────────────────────────────
export function initDropZone(): void {
  const drop = document.getElementById('drop-csv');
  if (!drop) return;
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('over');
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    const inp = document.getElementById('csvInp') as HTMLInputElement;
    inp.files = dt.files;
    onCSVFile({ target: inp } as any);
  });
}

// ── Expose ──────────────────────────────────────
(window as any).setMethod        = setMethod;
(window as any).onCSVFile        = onCSVFile;
(window as any).runParse         = runParse;
(window as any)._wkApplyParsed   = applyParsed;

// ── Named exports for dynamic import() in app.ts ──
export { setMethod, onCSVFile, runParse };
