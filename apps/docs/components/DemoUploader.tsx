'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createUploadStore, FileUpload, type FileUploadProps, type PresetId } from 'upload-motion';
import { createDemoTransport } from '@/lib/demo-transport';
import { createSampleSet, samplesFor, type SampleKind } from '@/lib/sample-files';
import { useSiteTheme } from '@/lib/site-theme';

export interface DemoUploaderProps extends Omit<FileUploadProps, 'store' | 'upload'> {
  preset: PresetId;
  /** Load sample files automatically once the demo scrolls into view. */
  autoplay?: boolean;
  samples?: SampleKind[];
  compact?: boolean;
  showControls?: boolean;
}

/**
 * The real `FileUpload` with a simulated transport (clearly badged) and
 * sample files generated in the browser.
 */
export function DemoUploader({ preset, autoplay = false, samples, compact, showControls = true, appearance, ...rest }: DemoUploaderProps) {
  const theme = useSiteTheme();
  const [store] = useState(() => createUploadStore());
  const upload = useMemo(() => createDemoTransport('simulated'), []);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);

  const play = async () => {
    setLoading(true);
    try {
      const files = await createSampleSet(samples ?? samplesFor(preset));
      store.addFiles(files);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoplay || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !played.current) {
          played.current = true;
          void play();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay]);

  useEffect(() => () => store.dispose(), [store]);

  return (
    <div className={compact ? 'demo demo--compact' : 'demo'} ref={ref}>
      <FileUpload preset={preset} store={store} upload={upload} appearance={{ theme, ...appearance }} {...rest} />
      {showControls ? (
        <div className="demo__controls">
          <span className="pill pill--warn" title="No data leaves your browser in this demo">
            Simulated transport
          </span>
          <span className="demo__buttons">
            <button type="button" className="button button--ghost button--small" onClick={play} disabled={loading}>
              {loading ? 'Generating…' : 'Add sample files'}
            </button>
            <button type="button" className="button button--ghost button--small" onClick={() => store.clear()}>
              Reset
            </button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
