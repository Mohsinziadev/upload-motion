import { createContext, useContext } from 'react';
import type { UploadItem } from '../core/types';
import type { UploaderApi } from '../hooks/useUploader';
import type { FileRenderHelpers, ResolvedMotion, UploadLabels } from '../types';

export interface UploaderContextValue<TResponse = unknown> extends UploaderApi<TResponse> {
  labels: UploadLabels;
  motion: ResolvedMotion;
  /** Human-readable accept/limit summary, e.g. "Images, PDF · up to 10 MB". */
  hint: string;
  hintId: string;
  autoUpload: boolean;
}

export const UploaderContext = /* @__PURE__ */ createContext<UploaderContextValue | null>(null);

/** Access the nearest `<Uploader>` / `<FileUpload>` state and actions. */
export function useUploaderContext<TResponse = unknown>(): UploaderContextValue<TResponse> {
  const context = useContext(UploaderContext);
  if (!context) {
    throw new Error('upload-motion: this component must be rendered inside <Uploader> or <FileUpload>.');
  }
  return context as unknown as UploaderContextValue<TResponse>;
}

export function getFileHelpers(context: UploaderContextValue, item: UploadItem): FileRenderHelpers {
  return {
    remove: () => context.remove(item.id),
    cancel: () => context.cancel(item.id),
    retry: () => context.retry(item.id),
    pause: () => context.pause(item.id),
    resume: () => context.resume(item.id),
    start: () => context.start(item.id),
    labels: context.labels,
  };
}
