// ─────────────────────────────────────────────
//  APP ENTRY POINT — WK v7
//  Fixes:
//  1. All window.* handlers properly exposed
//  2. True lazy imports via dynamic import()
//  3. Cross-domain wired via eventBus only
// ─────────────────────────────────────────────
import { store } from '../core/store';
import { logger } from '../infra/logger';
import { importLegacyData, saveState, DEFAULT_STATE } from '../infra/persistence';
import { eventBus, EVENTS } from './eventBus';

// ── Side-effect modules (always needed) ───────
import '../shared/ui/uiHelpers';
import '../shared/ui/stopwatch';

// ── Rule Engine — init once at startup ────────
import { initRuleEngine } from '../ruleEngine/storeIntegration';

// ── Expose shared helpers to HTML inline handlers ──
import { swToggle, swReset, swLap } from '../shared/ui/stopwatch';
import { startRest, stopRest, safeCopy } from '../shared/ui/uiHelpers';

// ── Panel registry — populated via lazy imports ──
type RenderFn = () => void;
const _renderers = new Map<string, RenderFn>();

// ── Lazy loader — only imports panel JS when first needed ──
const PANEL_LOADERS: Record<string, () => Promise<any>> = {
  workout:   () => import('../domains/strength/ui/WorkoutPanel'),
  preset:    () => import('../domains/strength/ui/PresetPanel'),
  import:    () => import('../domains/strength/ui/ImportPanel'),
  history:   () => import('../domains/strength/ui/HistoryPanel'),
  dashboard: () => import('../domains/strength/ui/DashboardPanel'),
  profile:   () => import('../domains/profile/ui/ProfilePanel'),
  aiplanner: () => import('../domains/planning/ui/PlannerPanel'),
  military:  () => import('../domains/military/ui/MilitaryPanel'),
  countdown: () => import('../domains/planning/ui/CountdownPanel'),
  runtrack:  () => import('../domains/endurance/ui/RunPanel'),
  swimtrack: () => import('../domains/endurance/ui/SwimPanel'),
  readiness: () => import('../domains/recovery/ui/ReadinessPanel'),
  export:    () => import('../shared/ui/ExportPanel'),
};

const RENDER_FN_NAMES: Record<string, string> = {
  workout:   'renderWorkoutPanel',
  preset:    'renderPresetPanel',
  import:    'renderImportPanel',
  history:   'renderHistoryPanel',
  dashboard: 'renderDashboardPanel',
  profile:   'renderProfilePanel',
  aiplanner: 'renderPlannerPanel',
  military:  'renderMilitaryPanel',
  countdown: 'renderCountdownPanel',
  runtrack:  'renderRunPanel',
  swimtrack: 'renderSwimPanel',
  readiness: 'renderReadinessPanel',
  export:    'renderExportPanel',
};

async function loadAndRender(panelId: string): Promise<void> {
  // Already loaded
  const cached = _renderers.get(panelId);
  if (cached) { cached(); return; }

  const loader = PANEL_LOADERS[panelId];
  if (!loader) return;

  try {
    const mod = await loader();
    const fnName = RENDER_FN_NAMES[panelId];
    const fn = mod[fnName] as RenderFn | undefined;
    if (fn) {
      _renderers.set(panelId, fn);
      fn();
    }
  } catch (e) {
    logger.error(`[App] failed to load panel: ${panelId}`, e);
  }
}

// ── Navigation (called from HTML + eventBus) ──
const ALL_PANELS = [
  'workout','dashboard','military','runtrack','more',
  'history','preset','import','aiplanner','countdown',
  'readiness','profile','export',
];

function switchToPanel(id: string, isSubPanel = false): void {
  ALL_PANELS.forEach(p => {
    document.getElementById(`panel-${p}`)?.classList.remove('on');
  });
  document.querySelectorAll('.ntab').forEach(t => t.classList.remove('on'));
  document.getElementById(`panel-${id}`)?.classList.add('on');

  if (!isSubPanel) {
    document.getElementById(`ntab-${id}`)?.classList.add('on');
  } else {
    document.getElementById('ntab-more')?.classList.add('on');
  }

  // Update header mission name
  const NAMES: Record<string, string> = {
    workout:'WORKOUT', dashboard:'SITREP', military:'MILITARY',
    runtrack:'ENDURANCE', more:'COMMAND', history:'HISTORY',
    preset:'PROGRAMS', import:'IMPORT', aiplanner:'PLANNER',
    countdown:'COUNTDOWN', readiness:'READINESS', profile:'PROFILE',
    export:'EXPORT',
  };
  const missionEl = document.getElementById('mission-name');
  if (missionEl) missionEl.textContent = NAMES[id] ?? id.toUpperCase();

  // Lazy-load panel renderer
  loadAndRender(id);
}

// ── Listen for tab change events from use cases ──
eventBus.on<string>(EVENTS.TAB_CHANGED, (id) => switchToPanel(id));

// ── Init ──────────────────────────────────────
async function init(): Promise<void> {
  logger.info('[App] starting WK v7');

  // Init rule engine — registers all eventBus listeners
  initRuleEngine();

  // One-time legacy localStorage migration
  const state = store.getState();
  const isFirstRun = !state.profile && !state.strength.history.length;
  if (isFirstRun) {
    const legacy = importLegacyData();
    if (legacy) {
      logger.info('[App] migrating legacy data');
      saveState({ ...DEFAULT_STATE, ...legacy, version: DEFAULT_STATE.version } as any);
      window.location.reload();
      return;
    }
  }

  // Load workout panel eagerly (always visible on launch)
  await loadAndRender('workout');

  // Preload military (often used second)
  setTimeout(() => loadAndRender('military'), 1000);

  logger.info('[App] ready ✓');
}

document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════
//  WINDOW EXPORTS — all functions called from HTML
//  These bridge Vite module scope to HTML inline handlers
// ═══════════════════════════════════════════════

// Navigation
(window as any).goTab       = (id: string) => switchToPanel(id, false);
(window as any).goSubPanel  = (id: string) => switchToPanel(id.replace('panel-',''), true);
(window as any).switchTab   = (id: string) => switchToPanel(id, false);

// Stopwatch
(window as any).swToggle  = swToggle;
(window as any).swReset   = swReset;
(window as any).swLap     = swLap;
(window as any).openSW    = () => document.getElementById('ov-sw')?.classList.add('on');

// Rest timer
(window as any).startRest = startRest;
(window as any).stopRest  = stopRest;

// Clipboard
(window as any).safeCopy  = safeCopy;

// Overlay helpers
(window as any).openOv   = (id: string) => document.getElementById(id)?.classList.add('on');
(window as any).closeOv  = (id: string) => document.getElementById(id)?.classList.remove('on');
(window as any).openAddEx = () => {
  ['nn','nr','nw','nrpe'].forEach(id => {
    (document.getElementById(id) as HTMLInputElement | null)!.value = '';
  });
  (document.getElementById('ns') as HTMLInputElement).value = '3';
  document.getElementById('ov-add')?.classList.add('on');
  setTimeout(() => (document.getElementById('nn') as HTMLInputElement)?.focus(), 300);
};

// Workout actions — lazy-bound after WorkoutPanel loads
(window as any).addEx = () => {
  import('../domains/strength/ui/WorkoutPanel').then(m => (m as any)._wkSubmitAdd?.());
};
(window as any).saveLog = () => {
  import('../domains/strength/ui/WorkoutPanel').then(m => (m as any)._wkSaveLog?.());
};
(window as any).resetAll = () => {
  import('../domains/strength/application/strengthUseCases').then(m => m.resetSession());
};
(window as any).doResetSession = (window as any).resetAll;

// Dashboard sub-tabs
(window as any).switchDash = (tab: string, el: HTMLElement) => {
  document.querySelectorAll('.dash-pnl').forEach((p: Element) => {
    (p as HTMLElement).style.display = 'none';
  });
  const target = document.getElementById(`dash-${tab}`);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#panel-dashboard .stab').forEach(t => t.classList.remove('on'));
  el?.classList.add('on');
  loadAndRender('dashboard');
};

// Military sub-tabs
(window as any).switchMil = (tab: string, el: HTMLElement) => {
  ['milp-standards','milp-fitest','milp-milprogram','milp-bodycheck'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  });
  const target = document.getElementById(`milp-${tab}`);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#panel-military .stab').forEach(t => t.classList.remove('on'));
  el?.classList.add('on');
  loadAndRender('military');
};
(window as any).selectUnit = (el: HTMLElement, unit: string) => {
  // Update active tab UI
  document.querySelectorAll('#milp-standards .stab, #panel-military .sub-tabs .stab').forEach(t => t.classList.remove('on'));
  el?.classList.add('on');
  import('../domains/military/ui/MilitaryPanel').then((m: any) => m.selectUnit?.(unit));
};
(window as any).saveFilTest = () => {
  import('../domains/military/ui/MilitaryPanel').then((m: any) => m.doSaveFitTest?.());
};
(window as any).calcBodyCheck = () => {
  import('../domains/military/ui/MilitaryPanel').then((m: any) => m.calcBodyCheck?.());
};

// Endurance sub-tabs
(window as any).switchEndure = (tab: string, el: HTMLElement) => {
  ['endure-run','endure-swim','endure-interval'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  });
  const target = document.getElementById(`endure-${tab}`);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#panel-runtrack .stab').forEach(t => t.classList.remove('on'));
  el?.classList.add('on');
};
(window as any).liveRunPace = () => {
  import('../domains/endurance/ui/RunPanel').then((m: any) => m.liveRunPace?.());
};
(window as any).saveRunLog = () => {
  import('../domains/endurance/ui/RunPanel').then((m: any) => m.doSaveRun?.());
};
(window as any).previewInterval = () => {
  import('../domains/endurance/ui/RunPanel').then((m: any) => m.previewInterval?.());
};
(window as any).liveSwimPace = () => {
  import('../domains/endurance/ui/SwimPanel').then((m: any) => m.liveSwimPace?.());
};
(window as any).saveSwimLog = () => {
  import('../domains/endurance/ui/SwimPanel').then((m: any) => m.doSaveSwim?.());
};

// Planner sub-tabs
(window as any).switchPlanner = (tab: string, el: HTMLElement) => {
  ['pp-generate','pp-saved'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.display = 'none';
  });
  const target = document.getElementById(`pp-${tab}`);
  if (target) target.style.display = 'block';
  document.querySelectorAll('#panel-aiplanner .stab').forEach(t => t.classList.remove('on'));
  el?.classList.add('on');
  if (tab === 'saved') {
    import('../domains/planning/ui/PlannerPanel').then((m: any) => m.renderSavedPlans?.());
  }
};
(window as any).selectPlanStyle = (style: string, el: HTMLElement) => {
  document.querySelectorAll('.style-card').forEach(c => c.classList.remove('on'));
  el?.classList.add('on');
  import('../domains/planning/ui/PlannerPanel').then((m: any) => m.selectPlanStyle?.(style));
};
(window as any).generatePlan = () => {
  import('../domains/planning/ui/PlannerPanel').then((m: any) => m.generatePlan?.());
};

// Countdown
(window as any).addExam = () => {
  import('../domains/planning/ui/CountdownPanel').then((m: any) => m.doAddExam?.());
};

// Readiness
(window as any).calcReadiness = () => {
  import('../domains/recovery/ui/ReadinessPanel').then((m: any) => m.calcReadiness?.());
};
(window as any).saveReadinessLog = () => {
  import('../domains/recovery/ui/ReadinessPanel').then((m: any) => m.doSaveReadiness?.());
};

// Profile
(window as any).toggleGoal = (goal: string) => {
  import('../domains/profile/ui/ProfilePanel').then((m: any) => m.toggleGoal?.(goal));
};
(window as any).saveProfile = () => {
  import('../domains/profile/ui/ProfilePanel').then((m: any) => m.doSaveProfile?.());
};

// Import
(window as any).setMethod  = (m: string) => {
  import('../domains/strength/ui/ImportPanel').then((mod: any) => mod.setMethod?.(m));
};
(window as any).onCSVFile  = (e: Event) => {
  import('../domains/strength/ui/ImportPanel').then((mod: any) => mod.onCSVFile?.(e));
};
(window as any).runParse   = () => {
  import('../domains/strength/ui/ImportPanel').then((mod: any) => mod.runParse?.());
};

// History
(window as any).filterHist = (n: string) => {
  import('../domains/strength/ui/HistoryPanel').then((m: any) => {
    (window as any)._wkFilterHist?.(n) ?? m._wkFilterHist?.(n);
  });
};
(window as any).clearHist = () => {
  if (!confirm('ลบประวัติทั้งหมด?')) return;
  import('../domains/strength/application/strengthUseCases').then(m => m.clearHistory());
};

// Export
(window as any).exportCSV    = () => import('../shared/ui/ExportPanel').then((m: any) => m.exportCSV?.());
(window as any).exportJSON   = () => import('../shared/ui/ExportPanel').then((m: any) => m.exportJSON?.());
(window as any).exportText   = () => import('../shared/ui/ExportPanel').then((m: any) => m.exportText?.());
(window as any).importBackup = () => document.getElementById('backup-inp')?.click();
(window as any).loadBackup   = (e: Event) => import('../shared/ui/ExportPanel').then((m: any) => m.loadBackup?.(e));
(window as any).confirmReset = () => {
  (document.getElementById('reset-confirm-input') as HTMLInputElement).value = '';
  (document.getElementById('reset-confirm-btn') as HTMLButtonElement).disabled = true;
  (document.getElementById('ov-reset') as HTMLElement).style.display = 'flex';
};
(window as any).doReset = () => {
  store.dispatch({ type: 'RESET_ALL' });
  (document.getElementById('ov-reset') as HTMLElement).style.display = 'none';
  switchToPanel('workout');
  eventBus.emit(EVENTS.TOAST, 'รีเซ็ตแล้ว');
};
