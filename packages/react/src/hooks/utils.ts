import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

export const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
}

/** `true` when the OS asks for reduced motion. Always `false` during SSR. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(REDUCED_QUERY).matches : false),
    () => false,
  );
}

/**
 * Returns `true` for `duration` ms after `flag` flips from false to true.
 * Does not fire for values that were already true on mount, so items that
 * finished before they rendered don't replay celebrations.
 */
export function useBecameTrue(flag: boolean, duration: number): boolean {
  const previous = useRef(flag);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const was = previous.current;
    previous.current = flag;
    if (!flag || was) {
      if (!flag) setActive(false);
      return;
    }
    setActive(true);
    const timer = setTimeout(() => setActive(false), duration);
    return () => clearTimeout(timer);
  }, [flag, duration]);
  return active;
}

/** Deterministic PRNG so decorative randomness is stable between renders and SSR. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
