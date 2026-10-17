/** Inline script that applies the saved/system theme before first paint. */
export const themeScript = `(() => {
  try {
    const saved = localStorage.getItem('um-theme');
    const theme = saved === 'dark' || saved === 'light' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();`;
