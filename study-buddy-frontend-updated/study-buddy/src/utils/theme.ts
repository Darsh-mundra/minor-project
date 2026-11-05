export type ThemeId = 'indigo' | 'teal' | 'orange' | 'green' | 'rose';

export const THEMES: { id: ThemeId; name: string; color: string }[] = [
  { id: 'indigo', name: 'Indigo Classic', color: '#4f46e5' },
  { id: 'teal', name: 'Ocean Teal', color: '#0f766e' },
  { id: 'orange', name: 'Sunset Orange', color: '#ea580c' },
  { id: 'green', name: 'Forest Green', color: '#15803d' },
  { id: 'rose', name: 'Rose Berry', color: '#e11d48' },
];

const KEY = 'studybuddy_theme';

export function getTheme(): ThemeId {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null;
    if (t && THEMES.some(x => x.id === t)) return t;
  } catch { /* storage unavailable */ }
  return 'indigo';
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id);
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
}

// ---- light / dark mode ----
// Stored value: 'light' | 'dark'. If nothing is stored we follow the computer's setting.
export type Mode = 'light' | 'dark';
const MODE_KEY = 'studybuddy_mode';
const systemQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

function storedMode(): Mode | null {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === 'light' || m === 'dark' ? m : null;
  } catch { return null; }
}

export function getMode(): Mode {
  return storedMode() ?? (systemQuery().matches ? 'dark' : 'light');
}

export function applyMode(mode: Mode, persist = true) {
  document.documentElement.setAttribute('data-mode', mode);
  if (persist) {
    try { localStorage.setItem(MODE_KEY, mode); } catch { /* ignore */ }
  }
}

// call once before React renders so there is no colour flash
export function initTheme() {
  document.documentElement.setAttribute('data-theme', getTheme());
  applyMode(getMode(), false);
  // until the user picks a mode manually, follow the computer's light/dark switch
  systemQuery().addEventListener('change', e => {
    if (!storedMode()) applyMode(e.matches ? 'dark' : 'light', false);
  });
}
