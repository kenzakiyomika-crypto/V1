// ─────────────────────────────────────────────
//  ROUTER — Tab ID type exports only
//  Navigation is now handled directly in app.ts
//  to avoid circular imports with lazy loading
// ─────────────────────────────────────────────
import { type TabId } from '../core/constants';

// Re-export TabId for use in other modules
export type { TabId };

// No-op stubs kept for backward compatibility
// Real navigation is in app.ts switchToPanel()
export function registerPanelRenderer(_tabId: TabId, _fn: () => void): void {
  // Handled by app.ts PANEL_LOADERS
}

export function switchTab(_tabId: TabId): void {
  // Handled by app.ts switchToPanel() via window.goTab
  (window as any).goTab?.(_tabId);
}
