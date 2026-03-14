// ─────────────────────────────────────────────
//  STRENGTH UI — Preset Panel
// ─────────────────────────────────────────────
import { addExercise } from '../application/strengthUseCases';
import { switchTab }   from '../../../app/router';

const PRESETS = {
  ppl: {
    name: 'PPL', desc: 'Push/Pull/Legs 6 วัน',
    days: [
      { name: 'Push A',  exs: [{ name: 'Bench Press', sets: 4, reps: '8-10' }, { name: 'OHP', sets: 3, reps: '8-10' }, { name: 'Lateral Raise', sets: 3, reps: '15' }, { name: 'Tricep Pushdown', sets: 3, reps: '12' }] },
      { name: 'Pull A',  exs: [{ name: 'Deadlift', sets: 4, reps: '6-8' }, { name: 'Barbell Row', sets: 3, reps: '8-10' }, { name: 'Lat Pulldown', sets: 3, reps: '10-12' }, { name: 'Barbell Curl', sets: 3, reps: '10' }] },
      { name: 'Legs A',  exs: [{ name: 'Squat', sets: 4, reps: '6-8' }, { name: 'Leg Press', sets: 3, reps: '10-12' }, { name: 'Romanian DL', sets: 3, reps: '10' }, { name: 'Calf Raise', sets: 4, reps: '15' }] },
      { name: 'Push B',  exs: [{ name: 'Incline Press', sets: 4, reps: '8-10' }, { name: 'Dip', sets: 3, reps: 'Max' }, { name: 'Face Pull', sets: 3, reps: '15' }] },
      { name: 'Pull B',  exs: [{ name: 'Pull-up', sets: 4, reps: 'Max' }, { name: 'Seated Row', sets: 3, reps: '10-12' }, { name: 'Hammer Curl', sets: 3, reps: '12' }] },
      { name: 'Legs B',  exs: [{ name: 'Bulgarian Split Squat', sets: 3, reps: '10' }, { name: 'Leg Extension', sets: 3, reps: '12-15' }, { name: 'Hip Thrust', sets: 3, reps: '10' }] },
    ],
  },
  fullbody: {
    name: 'Full Body', desc: '3 วัน เหมาะมือใหม่',
    days: [
      { name: 'วันที่ 1', exs: [{ name: 'Squat', sets: 3, reps: '8' }, { name: 'Bench Press', sets: 3, reps: '8' }, { name: 'Barbell Row', sets: 3, reps: '8' }, { name: 'OHP', sets: 3, reps: '8' }] },
      { name: 'วันที่ 2', exs: [{ name: 'Deadlift', sets: 3, reps: '5' }, { name: 'Lat Pulldown', sets: 3, reps: '10' }, { name: 'Lateral Raise', sets: 3, reps: '15' }, { name: 'Leg Press', sets: 3, reps: '10' }] },
      { name: 'วันที่ 3', exs: [{ name: 'Pull-up', sets: 3, reps: 'Max' }, { name: 'Lunge', sets: 3, reps: '10' }, { name: 'Face Pull', sets: 3, reps: '15' }, { name: 'Hip Thrust', sets: 3, reps: '12' }] },
    ],
  },
  upper: {
    name: 'Upper/Lower', desc: '4 วัน บน-ล่าง',
    days: [
      { name: 'Upper A', exs: [{ name: 'Bench Press', sets: 4, reps: '6-8' }, { name: 'Barbell Row', sets: 4, reps: '6-8' }, { name: 'OHP', sets: 3, reps: '8' }, { name: 'Lateral Raise', sets: 3, reps: '15' }] },
      { name: 'Lower A', exs: [{ name: 'Squat', sets: 4, reps: '6-8' }, { name: 'Romanian DL', sets: 3, reps: '8-10' }, { name: 'Leg Press', sets: 3, reps: '10-12' }, { name: 'Calf Raise', sets: 4, reps: '15' }] },
      { name: 'Upper B', exs: [{ name: 'OHP', sets: 4, reps: '8' }, { name: 'Pull-up', sets: 4, reps: 'Max' }, { name: 'Face Pull', sets: 3, reps: '15' }] },
      { name: 'Lower B', exs: [{ name: 'Deadlift', sets: 4, reps: '4-6' }, { name: 'Hip Thrust', sets: 3, reps: '10' }, { name: 'Leg Extension', sets: 3, reps: '15' }] },
    ],
  },
  cali: {
    name: 'Calisthenics', desc: 'น้ำหนักตัว ไม่ต้องอุปกรณ์',
    days: [
      { name: 'Push', exs: [{ name: 'Push-up', sets: 4, reps: 'Max' }, { name: 'Dip', sets: 3, reps: 'Max' }] },
      { name: 'Pull', exs: [{ name: 'Pull-up', sets: 4, reps: 'Max' }, { name: 'Chin-up', sets: 3, reps: 'Max' }, { name: 'Hanging Knee Raise', sets: 3, reps: '15' }] },
      { name: 'Legs', exs: [{ name: 'Squat', sets: 4, reps: '20' }, { name: 'Bulgarian Split Squat', sets: 3, reps: '12' }, { name: 'Glute Bridge', sets: 3, reps: '20' }] },
    ],
  },
} as const;

type PresetKey = keyof typeof PRESETS;
let _activePreset: PresetKey | null = null;
let _activeDay = 0;

export function renderPresetPanel(): void {
  const grid = document.getElementById('preset-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(PRESETS).map(([k, p]) =>
    `<div class="preset-card" onclick="window._wkShowPreset('${k}')">
      <h3>${p.name}</h3><p>${p.desc}</p>
      <span class="ptag">${p.days.length} วัน</span>
    </div>`
  ).join('');
}

function showPreset(key: PresetKey): void {
  _activePreset = key;
  _activeDay = 0;
  const p = PRESETS[key];
  document.getElementById('preset-grid')!.style.display = 'none';
  const det = document.getElementById('preset-detail')!;
  det.style.display = 'block';
  document.getElementById('preset-detail-name')!.textContent = p.name;
  _renderDayTabs();
  _renderDayExercises();
}

function _renderDayTabs(): void {
  if (!_activePreset) return;
  const p = PRESETS[_activePreset];
  document.getElementById('day-tabs')!.innerHTML =
    p.days.map((d, i) =>
      `<div class="dtab ${i === _activeDay ? 'on' : ''}" onclick="window._wkSelectDay(${i})">${d.name}</div>`
    ).join('');
}

function _renderDayExercises(): void {
  if (!_activePreset) return;
  const day = PRESETS[_activePreset].days[_activeDay];
  document.getElementById('preset-exs')!.innerHTML =
    day.exs.map(e =>
      `<div class="preset-ex"><div class="pen">${e.name}</div><div class="pem">${e.sets}×${e.reps}</div></div>`
    ).join('');

  const btn = document.getElementById('load-preset-btn') as HTMLButtonElement;
  if (btn) btn.onclick = () => loadPresetDay();
}

function loadPresetDay(): void {
  if (!_activePreset) return;
  const day = PRESETS[_activePreset].days[_activeDay];
  day.exs.forEach(e => addExercise({ name: e.name, sets: e.sets, reps: e.reps, weight: null }));
  switchTab('workout');
}

// ── Expose ──────────────────────────────────────
(window as any)._wkShowPreset  = showPreset;
(window as any)._wkSelectDay   = (i: number) => {
  _activeDay = i;
  _renderDayTabs();
  _renderDayExercises();
};
(window as any).showPreset = showPreset;
(window as any).selectDay  = (i: number) => { _activeDay = i; _renderDayTabs(); _renderDayExercises(); };
(window as any).loadPresetDay = loadPresetDay;

// ── Named exports for dynamic import() in app.ts ──
// renderPresetPanel already exported above
