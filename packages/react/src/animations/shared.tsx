import type { ReactNode } from 'react';
import { getFileHelpers, useUploaderContext } from '../components/context';
import { UploadFileList } from '../components/FileList';
import { UploadRejections } from '../components/Status';
import type { UploadItem } from '../core/types';
import type { PresetProps, ProgressVariant } from '../types';

/** Rejections + queue, honouring `renderFile`, `classNames` and `showRejections`. */
export function PresetQueue({
  props,
  progressVariant,
  allowPause,
  items,
  className,
}: {
  props: PresetProps;
  progressVariant?: ProgressVariant;
  allowPause?: boolean;
  items?: readonly UploadItem[];
  className?: string;
}) {
  return (
    <>
      {props.showRejections !== false ? <UploadRejections /> : null}
      <UploadFileList
        className={[className, 'um-queue', props.classNames?.list].filter(Boolean).join(' ')}
        itemClassName={props.classNames?.item}
        items={items}
        layout={props.layout}
        progressVariant={props.progressVariant ?? progressVariant}
        renderFile={props.renderFile}
        allowPause={allowPause}
      />
    </>
  );
}

/** Renders `props.renderFile` when provided, otherwise the preset's own visual. */
export function useRenderFile(props: PresetProps) {
  const context = useUploaderContext();
  return (item: UploadItem, fallback: () => ReactNode): ReactNode =>
    props.renderFile ? props.renderFile(item, getFileHelpers(context, item)) : fallback();
}

export const KIND_COLORS: Record<string, string> = {
  pdf: '#e5484d',
  document: '#3b82f6',
  spreadsheet: '#16a34a',
  presentation: '#f97316',
  image: '#8b5cf6',
  video: '#ec4899',
  audio: '#f59e0b',
  archive: '#a16207',
  code: '#0ea5e9',
  data: '#ca8a04',
  text: '#64748b',
  unknown: '#94a3b8',
};
