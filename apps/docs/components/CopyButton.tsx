'use client';

import { useEffect, useRef, useState } from 'react';

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };

  return (
    <button
      type="button"
      className={['copy-button', className].filter(Boolean).join(' ')}
      onClick={copy}
      data-copied={state === 'copied' || undefined}
      aria-live="polite"
    >
      {state === 'copied' ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
          Copied
        </>
      ) : state === 'failed' ? (
        'Press ⌘C'
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="8" y="8" width="12" height="12" rx="2.5" />
            <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
