'use client';

import { useSyncExternalStore } from 'react';

export type SiteTheme = 'light' | 'dark';

function read(): SiteTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** Current site theme, kept in sync with the `data-theme` attribute on <html>. */
export function useSiteTheme(): SiteTheme {
  return useSyncExternalStore(subscribe, read, () => 'light');
}

export function setSiteTheme(theme: SiteTheme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('um-theme', theme);
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for this page view.
  }
}
