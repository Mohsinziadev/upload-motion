import { useSyncExternalStore } from 'react';

export type Mode = 'system' | 'light' | 'dark';

// The inline script in index.html applies the saved mode before first paint. Reading it
// through an external store keeps the prerendered HTML ("system") hydration-safe.
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const read = (): Mode => (document.documentElement.dataset.mode as Mode) || 'system';

export function setMode(mode: Mode) {
  document.documentElement.dataset.mode = mode;
  try {
    localStorage.setItem('um-demo-mode', mode);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((listener) => listener());
}

export function useMode(): Mode {
  return useSyncExternalStore(subscribe, read, () => 'system');
}
