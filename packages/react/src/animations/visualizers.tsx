import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useUploaderContext } from '../components/context';
import { AnimatedCheck, Burst } from '../components/Effects';
import { ItemActions, ItemStatus, progressValueText } from '../components/FileItem';
import { FileIcon } from '../components/FileVisual';
import { UploadProgress } from '../components/Progress';
import { getFileLabel } from '../core/file-kind';
import { formatBytes } from '../core/format';
import type { FileKind, UploadItem } from '../core/types';
import { useAudioPeaks, useFilePreview, useTextSnippet, useVideoFrames } from '../hooks/useMedia';
import { cx, seededRandom, useBecameTrue } from '../hooks/utils';
import { KIND_ICONS, PauseIcon, PlayIcon } from '../icons';
import type { FileVisualizer } from '../types';
import { KIND_COLORS } from './shared';

const shown = (item: UploadItem) => (item.status === 'success' ? 1 : item.progress);
const vars = (item: UploadItem, extra: Record<string, string | number> = {}) =>
  ({ '--um-p': shown(item), '--k': KIND_COLORS[item.kind], ...extra }) as CSSProperties;

// ------------------------------------------------------------------ bloom

/** Image sharpens and saturates from the centre outward as bytes upload. */
export function BloomVisual({ item }: { item: UploadItem }) {
  const url = useFilePreview(item);
  const Glyph = KIND_ICONS[item.kind];
  return (
    <span className="um-bloom" data-status={item.status} style={vars(item)}>
      {url ? (
        <>
          <img className="um-bloom__under" src={url} alt="" draggable={false} />
          <img className="um-bloom__over" src={url} alt="" draggable={false} />
        </>
      ) : (
        <>
          <span className="um-bloom__under um-bloom__wash">
            <Glyph size={28} />
          </span>
          <span className="um-bloom__over um-bloom__wash um-bloom__wash--on">
            <Glyph size={28} />
            <span className="um-bloom__ext">{getFileLabel(item)}</span>
          </span>
        </>
      )}
    </span>
  );
}

// ------------------------------------------------------------------- page

/** A page whose lines are inked by a scanning beam. Text files show their real first lines. */
export function PageVisual({ item }: { item: UploadItem }) {
  const snippet = useTextSnippet(item, 10);
  const skeleton = useMemo(() => {
    const random = seededRandom(item.id);
    return Array.from({ length: 10 }, (_, index) => (index === 0 ? 55 : index % 4 === 3 ? 40 + random() * 25 : 70 + random() * 28));
  }, [item.id]);
  const lines = snippet && snippet.length > 0 ? snippet : null;
  const count = lines ? lines.length : skeleton.length;
  return (
    <span className="um-page" data-status={item.status} data-real={lines ? 'true' : undefined} style={vars(item)}>
      <span className="um-page__lines">
        {Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            className="um-page__line"
            style={{ '--li': (index + 0.5) / count, '--w': lines ? 'auto' : `${skeleton[index]}%` } as CSSProperties}
          >
            {lines ? lines[index] : null}
          </span>
        ))}
      </span>
      <span className="um-page__scan" aria-hidden="true" />
      <span className="um-page__fold" aria-hidden="true" />
      <span className="um-page__tag">
        <FileIcon kind={item.kind} label={getFileLabel(item)} size={22} />
      </span>
      {item.status === 'success' ? (
        <span className="um-page__stamp" aria-hidden="true">
          Uploaded
        </span>
      ) : null}
    </span>
  );
}

// -------------------------------------------------------------- filmstrip

const FRAMES = 6;

/** Real frames extracted from the video light up one by one as it uploads. */
export function FilmstripVisual({ item }: { item: UploadItem }) {
  const frames = useVideoFrames(item.kind === 'video' ? item.file : null, FRAMES);
  const still = useFilePreview(item.kind === 'image' ? item : null);
  const lit = Math.floor(shown(item) * FRAMES + 0.0001);
  const Glyph = KIND_ICONS[item.kind];
  return (
    <span className="um-film" data-status={item.status} style={vars(item)}>
      <span className="um-film__strip">
        {Array.from({ length: FRAMES }, (_, index) => {
          const src = frames[index] ?? still;
          return (
            <span key={index} className="um-film__frame" data-lit={index < lit || undefined} style={{ '--fi': index } as CSSProperties}>
              {src ? <img src={src} alt="" draggable={false} /> : <Glyph size={16} />}
            </span>
          );
        })}
      </span>
      <span className="um-film__playhead" aria-hidden="true" />
    </span>
  );
}

// --------------------------------------------------------------- waveform

const BARS = 48;

/** Waveform of the actual audio (decoded locally); a stable pseudo-waveform for other files. */
export function WaveformVisual({ item }: { item: UploadItem }) {
  const { peaks, real } = useAudioPeaks(item.file, BARS, item.kind === 'audio');
  const ripple = useBecameTrue(item.status === 'success', 1400);
  const progress = shown(item);
  const head = Math.floor(progress * BARS);
  const layer = (variant: 'base' | 'fill') => (
    <span className={`um-wave__layer um-wave__layer--${variant}`} aria-hidden="true">
      {peaks.map((peak, index) => (
        <span
          key={index}
          className="um-wave__bar"
          data-head={variant === 'fill' && item.status === 'uploading' && Math.abs(index - head) <= 2 ? 'true' : undefined}
          style={{ '--h': peak.toFixed(3), '--bi': index / BARS } as CSSProperties}
        />
      ))}
    </span>
  );
  return (
    <span className="um-wave" data-status={item.status} data-real={real || undefined} data-ripple={ripple || undefined} style={vars(item)}>
      {layer('base')}
      {layer('fill')}
    </span>
  );
}

/** Play/pause a local preview of an audio file. The object URL is created on first play and revoked on unmount. */
export function AudioPreviewButton({ item }: { item: UploadItem }) {
  const { labels } = useUploaderContext();
  const audio = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(
    () => () => {
      audio.current?.pause();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );

  if (item.kind !== 'audio') return null;
  const toggle = () => {
    if (!audio.current) {
      url.current = URL.createObjectURL(item.file);
      audio.current = new Audio(url.current);
      audio.current.addEventListener('ended', () => setPlaying(false));
      audio.current.addEventListener('pause', () => setPlaying(false));
      audio.current.addEventListener('play', () => setPlaying(true));
    }
    if (audio.current.paused) void audio.current.play().catch(() => setPlaying(false));
    else audio.current.pause();
  };
  return (
    <button
      type="button"
      className="um-icon-btn um-wave__play"
      aria-label={`${playing ? labels.pause : 'Play'} preview of ${item.name}`}
      aria-pressed={playing}
      onClick={(event) => {
        event.stopPropagation();
        toggle();
      }}
    >
      {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} />}
    </button>
  );
}

// ------------------------------------------------------------------ pixel

const GRID = 8;

/** The file assembles from flying pixels in a shuffled order driven by progress (one CSS variable, no per-cell renders). */
export const PixelVisual = /* @__PURE__ */ memo(function PixelVisual({ item }: { item: UploadItem }) {
  const url = useFilePreview(item);
  const cells = useMemo(() => {
    const random = seededRandom(item.id);
    const order = Array.from({ length: GRID * GRID }, (_, i) => i).sort(() => random() - 0.5);
    return order.map((rank, index) => ({
      index,
      rank: rank / (GRID * GRID),
      dx: (random() - 0.5) * 120,
      dy: (random() - 0.5) * 120,
      shade: 35 + random() * 60,
    }));
  }, [item.id]);
  return (
    <span className="um-pixel" data-status={item.status} style={vars(item)}>
      {cells.map((cell) => {
        const row = Math.floor(cell.index / GRID);
        const col = cell.index % GRID;
        return (
          <span
            key={cell.index}
            className="um-pixel__cell"
            style={
              {
                '--o': cell.rank.toFixed(3),
                '--dx': `${cell.dx.toFixed(0)}px`,
                '--dy': `${cell.dy.toFixed(0)}px`,
                background: url
                  ? `url("${url}") ${(col / (GRID - 1)) * 100}% ${(row / (GRID - 1)) * 100}% / ${GRID * 100}% ${GRID * 100}%`
                  : `color-mix(in oklab, var(--k) ${cell.shade.toFixed(0)}%, var(--um-surface))`,
              } as CSSProperties
            }
          />
        );
      })}
      {!url ? (
        <span className="um-pixel__glyph">
          <FileIcon kind={item.kind} label={getFileLabel(item)} size={34} />
        </span>
      ) : null}
    </span>
  );
});

// ---------------------------------------------------------------- layouts

export const VISUALIZERS: Record<FileVisualizer, (props: { item: UploadItem }) => ReactNode> = {
  bloom: BloomVisual,
  page: PageVisual,
  filmstrip: FilmstripVisual,
  waveform: WaveformVisual,
  pixel: PixelVisual,
  card: ({ item }) => <FileIcon kind={item.kind} label={getFileLabel(item)} size={44} />,
};

export const DEFAULT_KIND_VISUALIZERS: Record<FileKind, FileVisualizer> = {
  image: 'bloom',
  video: 'filmstrip',
  audio: 'waveform',
  pdf: 'page',
  document: 'page',
  text: 'page',
  code: 'page',
  data: 'page',
  spreadsheet: 'page',
  presentation: 'pixel',
  archive: 'pixel',
  unknown: 'pixel',
};

/** Square tile with overlay meta – used by Bloom and Pixel presets. */
export const VisualTile = /* @__PURE__ */ memo(function VisualTile({ item, visual }: { item: UploadItem; visual: ReactNode }) {
  const { labels } = useUploaderContext();
  const celebrate = useBecameTrue(item.status === 'success', 1100);
  return (
    <div className="um-tile" data-status={item.status} data-celebrate={celebrate || undefined}>
      <div className="um-tile__visual">{visual}</div>
      <div className="um-tile__overlay">
        <span className="um-tile__badge" aria-hidden="true">
          {item.status === 'success' ? <AnimatedCheck size={18} /> : item.status === 'uploading' ? `${Math.round(item.progress * 100)}%` : null}
        </span>
        <ItemActions item={item} className="um-tile__actions" />
      </div>
      <div className="um-tile__meta">
        <span className="um-tile__name" title={item.name}>
          {item.name}
        </span>
        <ItemStatus item={item} />
      </div>
      <span
        className="um-sr-only"
        role="progressbar"
        aria-label={item.name}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(shown(item) * 100)}
        aria-valuetext={progressValueText(item, labels)}
      />
      {celebrate ? <Burst seed={item.id} count={10} spread={60} shape="petal" /> : null}
    </div>
  );
});

/** Row with a visual on the left – used by Filmstrip, Waveform and Adaptive presets. */
export const VisualRow = /* @__PURE__ */ memo(function VisualRow({
  item,
  visual,
  visualKind,
  leading,
}: {
  item: UploadItem;
  visual: ReactNode;
  visualKind: FileVisualizer;
  leading?: ReactNode;
}) {
  const { labels } = useUploaderContext();
  const celebrate = useBecameTrue(item.status === 'success', 1100);
  const failed = useBecameTrue(item.status === 'error', 700);
  return (
    <div className="um-vrow" data-status={item.status} data-visual={visualKind} data-shake={failed || undefined}>
      {leading}
      <div className="um-vrow__visual">{visual}</div>
      <div className="um-vrow__body">
        <div className="um-card__row">
          <span className="um-card__name" title={item.name}>
            {item.name}
          </span>
          <span className="um-card__size">{formatBytes(item.size)}</span>
        </div>
        <ItemStatus item={item} />
        <UploadProgress
          className="um-sr-only"
          value={shown(item)}
          status={item.status}
          label={item.name}
          valueText={progressValueText(item, labels)}
        />
      </div>
      <ItemActions item={item} allowPause />
      {celebrate ? <Burst seed={item.id} count={10} spread={50} className="um-vrow__burst" /> : null}
    </div>
  );
});

export function ZoneTile({ title, icon, className }: { title: string; icon: ReactNode; className?: string }) {
  const { dropzone, labels, hintId } = useUploaderContext();
  return (
    <div
      {...dropzone.getRootProps({ focusable: true, 'aria-label': labels.zoneLabel, 'aria-describedby': hintId })}
      className={cx('um-zone', 'um-zonetile', className)}
    >
      <span className="um-zonetile__icon">{icon}</span>
      <span className="um-zonetile__title">
        {dropzone.dragState === 'reject' ? labels.dropReject : dropzone.dragState === 'accept' ? labels.dropActive : title}
      </span>
    </div>
  );
}
