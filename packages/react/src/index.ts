/**
 * upload-motion – animated, accessible file uploads for React.
 *
 * Three layers, use whichever fits:
 * 1. `<FileUpload preset="…" />` – ready-made animated uploaders
 * 2. `<Uploader>` + composable parts – build your own layout
 * 3. `useUploader()` / `createUploadStore()` – headless state & transport
 *
 * Remember to import the stylesheet once: `import 'upload-motion/styles.css'`.
 */

// Ready-made
export { FileUpload, type FileUploadProps } from './components/FileUpload';
export * from './animations';

// Composable
export { Uploader, type UploaderProps } from './components/Uploader';
export { useUploaderContext, type UploaderContextValue } from './components/context';
export {
  UploadDropzone,
  DropzoneContent,
  BrowseButton,
  StartUploadButton,
  UploadHint,
  type UploadDropzoneProps,
  type BrowseButtonProps,
} from './components/Dropzone';
export { UploadFileList, AnimatedList, type UploadFileListProps, type AnimatedListProps } from './components/FileList';
export { FileCard, ItemActions, ItemStatus, IconButton, describeItemStatus, type FileCardProps } from './components/FileItem';
export { UploadProgress, wavePath, type UploadProgressProps } from './components/Progress';
export { FileIcon, FilePreview, type FileIconProps, type FilePreviewProps } from './components/FileVisual';
export { AnimatedCheck, Burst, type BurstProps } from './components/Effects';
export { UploadSummary, UploadRejections, TransportBadge, useSummaryText } from './components/Status';
export { UploadAnnouncer } from './components/Announcer';
export { ActionMenu, type ActionMenuProps, type MenuAction } from './components/Menu';
export {
  BloomVisual,
  PageVisual,
  FilmstripVisual,
  WaveformVisual,
  PixelVisual,
  AudioPreviewButton,
  VisualRow,
  VisualTile,
} from './animations/visualizers';

// Headless
export { useUploader, useUploadSnapshot, type UseUploaderOptions, type UploaderApi } from './hooks/useUploader';
export { useDropzone, type DropzoneApi, type DropzoneOptions, type DragState, type DropPoint } from './hooks/useDropzone';
export { useFilePreview, useVideoFrames, useAudioPeaks, useTextSnippet } from './hooks/useMedia';
export { usePresence, useFlip } from './hooks/useListAnimation';
export { usePrefersReducedMotion } from './hooks/utils';

// Theming
export { appearanceToStyle, resolveMotion, defaultLabels } from './themes';

// Engine (also available from `upload-motion/core`)
export * from './core';

export type * from './types';
