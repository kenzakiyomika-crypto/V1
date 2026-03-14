// ─────────────────────────────────────────────
//  SHARED UI — Stopwatch
// ─────────────────────────────────────────────
import { formatStopwatch } from '../utils/dateUtils';

let _swMs      = 0;
let _swRunning = false;
let _swInterval: ReturnType<typeof setInterval> | null = null;
let _swLaps: number[] = [];

function _updSW(): void {
  const el = document.getElementById('sw-time');
  if (el) el.textContent = formatStopwatch(_swMs);
}

function _updSwNav(): void {
  const el = document.getElementById('sw-nav-time');
  if (el) el.textContent = _swRunning ? formatStopwatch(_swMs) : '00:00';
}

export function swToggle(): void {
  if (_swRunning) {
    if (_swInterval) clearInterval(_swInterval);
    _swRunning = false;
    document.getElementById('sw-start-btn')?.setAttribute('data-label', 'Start');
    const btn = document.getElementById('sw-start-btn');
    if (btn) btn.textContent = 'Start';
    document.getElementById('sw-nav')?.classList.remove('running');
  } else {
    const start = Date.now() - _swMs;
    _swInterval = setInterval(() => {
      _swMs = Date.now() - start;
      _updSW();
      _updSwNav();
    }, 100);
    _swRunning = true;
    const btn = document.getElementById('sw-start-btn');
    if (btn) btn.textContent = 'Stop';
    document.getElementById('sw-nav')?.classList.add('running');
  }
}

export function swReset(): void {
  if (_swInterval) clearInterval(_swInterval);
  _swRunning = false;
  _swMs = 0;
  _swLaps = [];
  _updSW();
  _updSwNav();
  const btn = document.getElementById('sw-start-btn');
  if (btn) btn.textContent = 'Start';
  document.getElementById('sw-nav')?.classList.remove('running');
  const lapsEl = document.getElementById('sw-laps');
  if (lapsEl) lapsEl.innerHTML = '';
}

export function swLap(): void {
  if (!_swRunning) return;
  _swLaps.push(_swMs);
  const lapsEl = document.getElementById('sw-laps');
  if (lapsEl) {
    lapsEl.innerHTML = [..._swLaps]
      .reverse()
      .map((l, i) =>
        `<div class="sw-lap">
          <span>Lap ${_swLaps.length - i}</span>
          <span>${formatStopwatch(l)}</span>
        </div>`
      )
      .join('');
  }
}
