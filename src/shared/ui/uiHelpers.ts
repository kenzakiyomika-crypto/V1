// ─────────────────────────────────────────────
//  SHARED UI — Toast & Rest Timer
// ─────────────────────────────────────────────
import { eventBus, EVENTS } from '../../app/eventBus';

// ── Toast ──────────────────────────────────────
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string): void {
  let el = document.querySelector<HTMLDivElement>('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el!.style.opacity = '0'; }, 2200);
}

// Subscribe to TOAST events globally
eventBus.on<string>(EVENTS.TOAST, msg => showToast(msg));

// ── Rest Timer ─────────────────────────────────
let _restTimer: ReturnType<typeof setInterval> | null = null;
let _restTotal = 90;
let _restLeft  = 90;

function _beep(): void {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [0, 0.25, 0.5].forEach(t => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.2;
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.15);
    });
  } catch { /* ignore */ }
}

function _updateRestUI(): void {
  const m = Math.floor(_restLeft / 60);
  const s = _restLeft % 60;
  const cdEl    = document.getElementById('rcd');
  const fillEl  = document.getElementById('rfill');
  if (cdEl)   cdEl.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
  if (fillEl) fillEl.style.width = `${Math.max(0, (_restLeft / _restTotal) * 100)}%`;
}

export function startRest(seconds: number): void {
  if (_restTimer) clearInterval(_restTimer);
  _restTotal = seconds;
  _restLeft  = seconds;
  _updateRestUI();
  document.getElementById('rest-bar')?.classList.add('on');

  _restTimer = setInterval(() => {
    _restLeft--;
    _updateRestUI();
    if (_restLeft <= 0) {
      stopRest();
      _beep();
    }
  }, 1000);
}

export function stopRest(): void {
  if (_restTimer) clearInterval(_restTimer);
  _restTimer = null;
  document.getElementById('rest-bar')?.classList.remove('on');
}

// Subscribe to rest events
eventBus.on<{ seconds: number }>(EVENTS.REST_STARTED, ({ seconds }) => startRest(seconds));
eventBus.on(EVENTS.REST_STOPPED, () => stopRest());

// ── Clipboard ──────────────────────────────────
export function safeCopy(text: string): void {
  navigator.clipboard?.writeText(text)
    .then(() => showToast('คัดลอกแล้ว ✓'))
    .catch(() => showToast('กด Ctrl+A → Ctrl+C'));
}
