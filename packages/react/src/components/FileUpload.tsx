import { getPreset } from '../animations';
import { cx } from '../hooks/utils';
import type { PresetId, PresetProps, UploadPreset } from '../types';
import { Uploader, type UploaderProps } from './Uploader';

export interface FileUploadProps<TResponse = unknown> extends UploaderProps<TResponse>, Omit<PresetProps, 'title' | 'description'> {
  /** Built-in preset id or a custom preset object. Default `"essential"`. */
  preset?: PresetId | (string & {}) | UploadPreset;
  /** Headline override for presets that show one. */
  title?: PresetProps['title'];
  description?: PresetProps['description'];
}

/**
 * Ready-made animated uploader.
 *
 * ```tsx
 * <FileUpload
 *   preset="wave-bar"
 *   upload={createXhrUploader({ url: '/api/upload' })}
 *   accept="image/*,.pdf"
 *   maxSize={20_000_000}
 * />
 * ```
 */
export function FileUpload<TResponse = unknown>(props: FileUploadProps<TResponse>) {
  const {
    preset: presetInput = 'essential',
    renderFile,
    zoneContent,
    classNames,
    progressVariant,
    layout,
    fileAnimations,
    showRejections,
    title,
    description,
    className,
    ...uploaderProps
  } = props;

  const preset = typeof presetInput === 'string' ? getPreset(presetInput) : presetInput;
  if (!preset) {
    throw new Error(`upload-motion: unknown preset "${String(presetInput)}".`);
  }
  const { Component, defaults } = preset;

  return (
    <Uploader<TResponse>
      {...uploaderProps}
      autoUpload={uploaderProps.autoUpload ?? defaults?.autoUpload ?? true}
      className={cx(`um-preset-${preset.id}`, className, classNames?.root)}
    >
      <Component
        renderFile={renderFile}
        zoneContent={zoneContent}
        classNames={classNames}
        progressVariant={progressVariant ?? defaults?.progressVariant}
        layout={layout ?? defaults?.layout}
        fileAnimations={fileAnimations}
        showRejections={showRejections}
        title={title}
        description={description}
      />
    </Uploader>
  );
}
