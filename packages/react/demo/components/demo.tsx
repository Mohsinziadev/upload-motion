import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createSimulatedUploader, createUploadStore, type UploadHandler, type UploadStore } from 'upload-motion';
import { createSampleSet, type SampleKind } from '../lib/samples';

/**
 * Every demo on this page uses the simulated transport: this page is a static file,
 * so there is no server to receive uploads. The library badges it as "Simulated".
 */
export function createDemoUploader(failureRate = 0): UploadHandler {
  return createSimulatedUploader({ speed: [500_000, 2_000_000], minDuration: 2200, failureRate }) as UploadHandler;
}

/** A store owned by one demo, plus a helper that loads generated sample files into it. */
export function useDemoStore() {
  const [store] = useState<UploadStore>(() => createUploadStore());
  const [loading, setLoading] = useState(false);
  useEffect(() => () => store.dispose(), [store]);
  const load = useCallback(
    async (kinds: readonly SampleKind[]) => {
      setLoading(true);
      try {
        store.addFiles(await createSampleSet(kinds));
      } finally {
        setLoading(false);
      }
    },
    [store],
  );
  return { store, loading, load };
}

/** Runs `callback` once, the first time `ref` scrolls into view. */
export function useOnceVisible(ref: RefObject<Element | null>, callback: () => void, enabled = true) {
  const latest = useRef(callback);
  useEffect(() => {
    latest.current = callback;
  });
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          latest.current();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, enabled]);
}
