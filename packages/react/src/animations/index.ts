import type { PresetId, UploadPreset } from '../types';
import { beamPreset } from './beam';
import { cardFanPreset } from './card-fan';
import { essentialPreset } from './essential';
import { hoopShotPreset } from './hoop-shot';
import { liquidPreset } from './liquid';
import { magneticPreset } from './magnetic';
import { adaptivePreset, bloomPreset, filmstripPreset, pageRevealPreset, pixelPreset, waveformPreset } from './media';
import { orbitPreset } from './orbit';
import { portalPreset } from './portal';
import { segmentRingPreset } from './segment-ring';
import { stackPreset } from './stack';
import { waveBarPreset } from './wave-bar';

/** All built-in presets, in gallery order. */
export const presets: readonly UploadPreset[] = [
  cardFanPreset,
  waveBarPreset,
  hoopShotPreset,
  essentialPreset,
  segmentRingPreset,
  beamPreset,
  magneticPreset,
  portalPreset,
  liquidPreset,
  stackPreset,
  orbitPreset,
  bloomPreset,
  pageRevealPreset,
  filmstripPreset,
  waveformPreset,
  pixelPreset,
  adaptivePreset,
];

export function getPreset(id: PresetId | (string & {})): UploadPreset | undefined {
  return presets.find((preset) => preset.id === id);
}

export {
  adaptivePreset,
  beamPreset,
  bloomPreset,
  cardFanPreset,
  essentialPreset,
  filmstripPreset,
  hoopShotPreset,
  liquidPreset,
  magneticPreset,
  orbitPreset,
  pageRevealPreset,
  pixelPreset,
  portalPreset,
  segmentRingPreset,
  stackPreset,
  waveBarPreset,
  waveformPreset,
};
