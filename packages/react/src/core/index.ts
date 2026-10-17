/**
 * `upload-motion/core` – framework-agnostic upload engine.
 * Safe to import from servers, workers, or any UI framework.
 */
export { createUploadStore, computeTotals } from './store';
export type { UploadStore, AddFilesResult } from './store';
export { createXhrUploader, createSimulatedUploader } from './transports';
export type { XhrUploaderOptions, SimulatedUploaderOptions } from './transports';
export { UploadError, isUploadError, toUploadError, httpErrorMessage } from './errors';
export type { UploadErrorCode } from './errors';
export { parseAccept, isFileAccepted, describeAccept, validateFile } from './validation';
export { getFileKind, getExtension, getFileLabel, isPreviewableImage } from './file-kind';
export { formatBytes, formatSpeed, formatDuration, formatPercent, clamp01 } from './format';
export type * from './types';
export { presetCatalog, PRESET_INFO } from './preset-catalog';
export type { PresetId, PresetCategory, PresetInfo } from './preset-catalog';
