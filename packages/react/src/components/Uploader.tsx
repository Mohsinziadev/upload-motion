import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { formatBytes } from '../core/format';
import { describeAccept } from '../core/validation';
import { useUploader, type UseUploaderOptions } from '../hooks/useUploader';
import { cx, usePrefersReducedMotion } from '../hooks/utils';
import { appearanceToStyle, defaultLabels, resolveMotion } from '../themes';
import type { Appearance, MotionOptions, UploadLabels } from '../types';
import { UploadAnnouncer } from './Announcer';
import { UploaderContext, type UploaderContextValue } from './context';

export interface UploaderProps<TResponse = unknown> extends UseUploaderOptions<TResponse> {
  appearance?: Appearance;
  motion?: MotionOptions;
  /** Override any UI string (i18n). */
  labels?: Partial<Omit<UploadLabels, 'status'>> & { status?: Partial<UploadLabels['status']> };
  className?: string;
  style?: CSSProperties;
  id?: string;
  children?: ReactNode;
}

/**
 * Root of the composable API. Owns the upload store, the hidden file input,
 * theme variables and the screen-reader announcer.
 */
export function Uploader<TResponse = unknown>(props: UploaderProps<TResponse>) {
  const { appearance, motion, labels, className, style, id, children, ...options } = props;
  const api = useUploader<TResponse>(options);
  const prefersReduced = usePrefersReducedMotion();
  const resolvedMotion = useMemo(
    () => resolveMotion(motion, prefersReduced),
    [motion?.speed, motion?.intensity, motion?.particles, motion?.reducedMotion, prefersReduced], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const mergedLabels = useMemo<UploadLabels>(
    () => ({ ...defaultLabels, ...labels, status: { ...defaultLabels.status, ...labels?.status } }),
    [labels],
  );
  const hintId = useId();
  const maxFiles = options.multiple === false ? 1 : (options.maxFiles ?? null);
  const hint = mergedLabels.acceptHint({
    types: describeAccept(api.accept),
    maxSize: options.maxSize ? formatBytes(options.maxSize) : '',
    maxFiles,
  });

  const value: UploaderContextValue<TResponse> = {
    ...api,
    labels: mergedLabels,
    motion: resolvedMotion,
    hint,
    hintId,
    autoUpload: options.autoUpload !== false,
  };

  return (
    <UploaderContext.Provider value={value as unknown as UploaderContextValue}>
      <div
        id={id}
        className={cx('um-root', className)}
        data-um-theme={appearance?.theme ?? 'light'}
        data-um-motion={resolvedMotion.reduced ? 'reduced' : 'full'}
        data-um-density={appearance?.density ?? 'comfortable'}
        data-um-transport={api.transport}
        style={{ ...appearanceToStyle(appearance, resolvedMotion), ...style }}
      >
        <input {...api.dropzone.getInputProps()} />
        {children}
        <UploadAnnouncer />
      </div>
    </UploaderContext.Provider>
  );
}
