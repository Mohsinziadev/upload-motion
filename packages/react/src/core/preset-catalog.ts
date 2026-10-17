/**
 * Plain-data descriptions of the built-in presets. No React here, so this is
 * importable from servers (docs pages, sitemaps, CMS schemas) via
 * `upload-motion/core`. The React entry attaches a Component to each entry.
 */

export type PresetId =
  | 'card-fan'
  | 'wave-bar'
  | 'hoop-shot'
  | 'essential'
  | 'magnetic'
  | 'portal'
  | 'liquid'
  | 'segment-ring'
  | 'stack'
  | 'orbit'
  | 'bloom'
  | 'page-reveal'
  | 'filmstrip'
  | 'waveform'
  | 'pixel'
  | 'beam'
  | 'adaptive';

export type PresetCategory = 'reference' | 'professional' | 'expressive' | 'media';

export interface PresetInfo {
  id: PresetId;
  name: string;
  description: string;
  category: PresetCategory;
  /** Short list of use cases, shown in docs and galleries. */
  bestFor: readonly string[];
  /** Options the preset defaults to (user props still win). */
  defaults?: { autoUpload?: boolean; progressVariant?: 'bar' | 'ring' | 'wave' | 'beam'; layout?: 'list' | 'grid' };
}

const info = <T extends PresetInfo>(entry: T) => entry;

export const PRESET_INFO = {
  'card-fan': info({
    id: 'card-fan',
    name: 'Card Fan',
    description:
      'Three media cards fan out as files approach the window, curved arrows draw themselves toward the zone, and the deck re-deals on drop. Manual upload button with inline progress.',
    category: 'reference',
    bestFor: ['Media libraries', 'CMS', 'Marketing tools'],
    defaults: { autoUpload: false },
  }),
  'wave-bar': info({
    id: 'wave-bar',
    name: 'Wave Bar',
    description:
      'A compact upload pill: a soft fill sweeps behind the summary while a sine wave travels along the edge, then flattens into a line on success. Pause, cancel, expand and more actions built in.',
    category: 'reference',
    bestFor: ['Dashboards', 'Cloud storage', 'Background uploads'],
    defaults: { progressVariant: 'wave' },
  }),
  'hoop-shot': info({
    id: 'hoop-shot',
    name: 'Hoop Shot',
    description:
      'A playful, physics-driven uploader: pull a file back, watch the dotted trajectory, release to shoot it into the hoop. Real gravity, rim bounces and bank shots – plus keyboard and "Shoot all" for instant perfect shots.',
    category: 'reference',
    bestFor: ['Consumer apps', 'Onboarding', 'Portfolios', 'Delight moments'],
    defaults: { autoUpload: false },
  }),
  essential: info({
    id: 'essential',
    name: 'Essential',
    description:
      'Restrained and professional: a quiet dashed zone, thin progress bars, gentle list transitions. Motion that informs rather than performs.',
    category: 'professional',
    bestFor: ['Admin panels', 'Forms', 'Enterprise SaaS'],
  }),
  'segment-ring': info({
    id: 'segment-ring',
    name: 'Segment Ring',
    description:
      'One dial, many files: each upload owns an arc sized by its bytes and coloured by type, filling independently. The ring morphs into a checkmark when the batch completes.',
    category: 'professional',
    bestFor: ['Batch uploads', 'Analytics', 'Cloud storage'],
    defaults: { progressVariant: 'ring' },
  }),
  beam: info({
    id: 'beam',
    name: 'Gradient Beam',
    description:
      'A light beam circles the zone’s border and speeds up when files approach. Progress bars are gradient beams with a travelling highlight. Made for dark, premium UIs.',
    category: 'expressive',
    bestFor: ['Developer tools', 'AI products', 'Dark dashboards'],
    defaults: { progressVariant: 'beam' },
  }),
  magnetic: info({
    id: 'magnetic',
    name: 'Magnetic',
    description:
      'A dot field that reacts to your cursor: the core is pulled toward the pointer, a spotlight follows it and dots swell nearby. Dropped files snap into the list with a spring.',
    category: 'expressive',
    bestFor: ['Landing pages', 'Creative tools', 'Design apps'],
  }),
  portal: info({
    id: 'portal',
    name: 'Portal',
    description:
      'Files spiral into a rotating portal from wherever you drop them. The portal’s rim fills with aggregate progress and flashes when everything lands.',
    category: 'expressive',
    bestFor: ['Consumer apps', 'Gaming', 'Creative platforms'],
  }),
  liquid: info({
    id: 'liquid',
    name: 'Liquid Fill',
    description:
      'The zone is a vessel that fills with liquid as bytes arrive – layered waves, rising bubbles, and text that inverts as the level passes it. Turns to success colour when full.',
    category: 'expressive',
    bestFor: ['Consumer apps', 'Single large uploads', 'Mobile'],
  }),
  stack: info({
    id: 'stack',
    name: 'Dimensional Stack',
    description:
      'Files form a 3D deck: the front card uploads while the rest wait in perspective. Finished cards fly to a tray; hover to fan the deck. A full list view is one click away.',
    category: 'expressive',
    bestFor: ['Document workflows', 'Portfolios', 'Review queues'],
  }),
  orbit: info({
    id: 'orbit',
    name: 'Orbit',
    description:
      'Files orbit an upload core in three lanes. Orbits tighten as bytes transfer, and each finished file falls into the core with a pulse. Failed files drift to a halt.',
    category: 'expressive',
    bestFor: ['Landing pages', 'Multi-file batches', 'Consumer apps'],
  }),
  bloom: info({
    id: 'bloom',
    name: 'Image Bloom',
    description:
      'A gallery grid where each image starts blurred and desaturated, then blooms into full colour from the centre as it uploads – finishing with a petal burst.',
    category: 'media',
    bestFor: ['Photo galleries', 'Social apps', 'E-commerce'],
  }),
  'page-reveal': info({
    id: 'page-reveal',
    name: 'Page Reveal',
    description:
      'Documents become pages: a scan line inks each line as bytes upload – showing the real first lines of text, CSV, JSON and code files – then an “Uploaded” stamp lands.',
    category: 'media',
    bestFor: ['Document management', 'Legal & finance', 'Knowledge bases'],
  }),
  filmstrip: info({
    id: 'filmstrip',
    name: 'Filmstrip',
    description:
      'Videos turn into filmstrips using frames extracted in the browser. Frames light up as the upload advances while a playhead tracks progress.',
    category: 'media',
    bestFor: ['Video platforms', 'Course builders', 'Social media tools'],
  }),
  waveform: info({
    id: 'waveform',
    name: 'Audio Waveform',
    description:
      'Audio files show their true waveform, decoded locally, filling bar by bar with an equaliser bounce at the playhead. Includes local preview playback.',
    category: 'media',
    bestFor: ['Podcasts', 'Music platforms', 'Voice notes'],
  }),
  pixel: info({
    id: 'pixel',
    name: 'Pixel Assembly',
    description:
      'Every file assembles from 64 pixels flying into place in a shuffled order driven by real progress. Images use their own pixels; other files build a tinted mosaic.',
    category: 'media',
    bestFor: ['Creative tools', 'Games', 'Retro / playful brands'],
  }),
  adaptive: info({
    id: 'adaptive',
    name: 'Adaptive Media',
    description:
      'Picks the right motion per file: images bloom, videos become filmstrips, audio draws its waveform, documents reveal their pages. Override the mapping with `fileAnimations`.',
    category: 'media',
    bestFor: ['Mixed-media inboxes', 'Asset managers', 'Chat attachments'],
  }),
} satisfies Record<PresetId, PresetInfo>;

/** Built-in presets in gallery order. */
export const presetCatalog: readonly PresetInfo[] = [
  PRESET_INFO['card-fan'],
  PRESET_INFO['wave-bar'],
  PRESET_INFO['hoop-shot'],
  PRESET_INFO.essential,
  PRESET_INFO['segment-ring'],
  PRESET_INFO.beam,
  PRESET_INFO.magnetic,
  PRESET_INFO.portal,
  PRESET_INFO.liquid,
  PRESET_INFO.stack,
  PRESET_INFO.orbit,
  PRESET_INFO.bloom,
  PRESET_INFO['page-reveal'],
  PRESET_INFO.filmstrip,
  PRESET_INFO.waveform,
  PRESET_INFO.pixel,
  PRESET_INFO.adaptive,
];
