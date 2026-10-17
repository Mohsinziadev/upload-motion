import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createUploadStore, type UploadStore } from '../core/store';
import type { ClearFilter, UploaderOptions, UploadSnapshot } from '../core/types';
import { parseAccept } from '../core/validation';
import { useDropzone, type DropzoneApi } from './useDropzone';
import { useIsomorphicLayoutEffect } from './utils';

export interface UseUploaderOptions<TResponse = unknown> extends UploaderOptions<TResponse> {
  /**
   * Bring your own store (e.g. created at module level) so uploads survive
   * unmounts. When omitted the hook owns a store and aborts its uploads on unmount.
   */
  store?: UploadStore<TResponse>;
  disabled?: boolean;
  capture?: 'user' | 'environment';
  preventWindowDrop?: boolean;
}

export interface UploaderApi<TResponse = unknown> extends UploadSnapshot<TResponse> {
  store: UploadStore<TResponse>;
  dropzone: DropzoneApi;
  /** Parsed accept tokens. */
  accept: readonly string[];
  disabled: boolean;
  addFiles: UploadStore<TResponse>['addFiles'];
  openFileDialog: () => void;
  start: UploadStore<TResponse>['start'];
  cancel: UploadStore<TResponse>['cancel'];
  retry: UploadStore<TResponse>['retry'];
  pause: UploadStore<TResponse>['pause'];
  resume: UploadStore<TResponse>['resume'];
  remove: UploadStore<TResponse>['remove'];
  clear: (filter?: ClearFilter) => void;
  dismissRejection: UploadStore<TResponse>['dismissRejection'];
}

/** Subscribe to any upload store. */
export function useUploadSnapshot<TResponse>(store: UploadStore<TResponse>): UploadSnapshot<TResponse> {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

/**
 * Headless uploader: queue state, actions and drag-and-drop wiring with no UI.
 *
 * ```tsx
 * const uploader = useUploader({ upload: createXhrUploader({ url: '/api/upload' }) });
 * <div {...uploader.dropzone.getRootProps({ focusable: true })}>
 *   <input {...uploader.dropzone.getInputProps()} />
 * </div>
 * ```
 */
export function useUploader<TResponse = unknown>(options: UseUploaderOptions<TResponse> = {}): UploaderApi<TResponse> {
  const { store: externalStore, disabled = false, capture, preventWindowDrop, ...uploaderOptions } = options;
  const [ownStore] = useState(() => externalStore ?? createUploadStore<TResponse>(uploaderOptions));
  const store = externalStore ?? ownStore;
  const owned = !externalStore;

  useIsomorphicLayoutEffect(() => {
    if (owned) {
      store.setOptions(uploaderOptions);
    } else {
      // Props layer over the store's creation options, so removing a prop
      // restores the store's own setting instead of keeping a stale value.
      const defined = Object.fromEntries(Object.entries(uploaderOptions).filter(([, value]) => value !== undefined));
      store.setOptions({ ...store.getInitialOptions(), ...defined });
    }
  });

  useEffect(() => {
    if (!owned) return;
    return () => store.dispose();
  }, [store, owned]);

  const snapshot = useUploadSnapshot(store);
  const acceptKey = Array.isArray(uploaderOptions.accept) ? uploaderOptions.accept.join(',') : uploaderOptions.accept;
  const accept = useMemo(() => parseAccept(acceptKey), [acceptKey]);
  const onFiles = useCallback((files: File[]) => store.addFiles(files), [store]);

  const dropzone = useDropzone({
    onFiles,
    accept,
    multiple: uploaderOptions.multiple !== false,
    maxFiles: uploaderOptions.multiple === false ? 1 : uploaderOptions.maxFiles,
    disabled,
    capture,
    preventWindowDrop,
  });

  return {
    ...snapshot,
    store,
    dropzone,
    accept,
    disabled,
    addFiles: store.addFiles,
    openFileDialog: dropzone.open,
    start: store.start,
    cancel: store.cancel,
    retry: store.retry,
    pause: store.pause,
    resume: store.resume,
    remove: store.remove,
    clear: store.clear,
    dismissRejection: store.dismissRejection,
  };
}
