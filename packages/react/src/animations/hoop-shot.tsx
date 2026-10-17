import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { Burst } from '../components/Effects';
import { FileIcon } from '../components/FileVisual';
import { TransportBadge } from '../components/Status';
import { getFileLabel } from '../core/file-kind';
import { PRESET_INFO } from '../core/preset-catalog';
import type { UploadItem } from '../core/types';
import { cx } from '../hooks/utils';
import { CloseIcon, UploadIcon } from '../icons';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

const GRAVITY = 2200; // px/s²
const POWER = 10.5; // velocity per px of pull
const MAX_PULL = 120;
const ASSIST = 16; // px of forgiveness either side of the rim opening
const TOKEN_W = 44;
const TOKEN_H = 54;

interface Vec {
  x: number;
  y: number;
}
interface Geometry {
  rimLeft: number;
  rimRight: number;
  rimY: number;
  board: { left: number; right: number; top: number; bottom: number };
  width: number;
  height: number;
}
type ShotResult = 'swish' | 'bank' | 'miss' | 'rim';

function relativeRect(element: Element, container: Element) {
  const a = element.getBoundingClientRect();
  const b = container.getBoundingClientRect();
  return { left: a.left - b.left, top: a.top - b.top, right: a.right - b.left, bottom: a.bottom - b.top, width: a.width, height: a.height };
}

/** Velocity that lands exactly in the rim centre after `time` seconds. */
function perfectVelocity(from: Vec, geometry: Geometry, time = 0.85): Vec {
  const target = { x: (geometry.rimLeft + geometry.rimRight) / 2, y: geometry.rimY - 2 };
  return { x: (target.x - from.x) / time, y: (target.y - from.y - 0.5 * GRAVITY * time * time) / time };
}

function trajectory(from: Vec, velocity: Vec, steps = 18, dt = 0.045): Vec[] {
  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) * dt;
    return { x: from.x + velocity.x * t, y: from.y + velocity.y * t + 0.5 * GRAVITY * t * t };
  });
}

function Token({ item }: { item: Pick<UploadItem, 'kind' | 'name'> }) {
  return (
    <span className="um-hoop__token-face">
      <span className="um-hoop__token-lines" />
      <FileIcon kind={item.kind} label={getFileLabel(item)} size={30} />
    </span>
  );
}

function Hoop({ netKey, rimRef, boardRef }: { netKey: number; rimRef: React.Ref<HTMLSpanElement>; boardRef: React.Ref<HTMLSpanElement> }) {
  const net = Array.from({ length: 7 }, (_, i) => i);
  return (
    <div className="um-hoop__hoop" aria-hidden="true">
      <span className="um-hoop__board" ref={boardRef}>
        <span className="um-hoop__board-square" />
      </span>
      <svg className="um-hoop__rim-svg" viewBox="0 0 96 90" width="96" height="90">
        <g className="um-hoop__net" key={netKey} data-swish={netKey > 0 || undefined}>
          {net.map((i) => (
            <path key={`v${i}`} d={`M${10 + i * 12.6} 12 L ${26 + i * 7.4} 80`} />
          ))}
          <path d="M16 30 Q 48 38 80 30 M20 48 Q 48 55 76 48 M24 66 Q 48 72 72 66 M26 80 L 70 80" />
        </g>
        <ellipse className="um-hoop__rim" cx="48" cy="12" rx="40" ry="7" />
        <rect className="um-hoop__clip" x="40" y="2" width="16" height="6" rx="2" />
      </svg>
      <span className="um-hoop__rim-target" ref={rimRef} />
    </div>
  );
}

function HoopShotPreset(props: PresetProps) {
  const context = useUploaderContext();
  const { items, dropzone, labels, motion, start, remove, totals } = context;
  const courtRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLSpanElement>(null);
  const boardRef = useRef<HTMLSpanElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const autoQueue = useRef<string[]>([]);
  const aimState = useRef<{ pointerId: number; origin: Vec; offset: Vec; item: UploadItem } | null>(null);

  const [flight, setFlight] = useState<UploadItem | null>(null);
  const [aim, setAim] = useState<{ origin: Vec; offset: Vec } | null>(null);
  const [netKey, setNetKey] = useState(0);
  const [callout, setCallout] = useState<{ text: string; key: number; tone: 'good' | 'bad' } | null>(null);
  const [stats, setStats] = useState({ shots: 0, made: 0 });

  const pending = items.filter((item) => item.status === 'pending' && item.id !== flight?.id);
  const top = pending[pending.length - 1];
  const launched = items.filter((item) => item.status !== 'pending');

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  const geometry = useCallback((): Geometry | null => {
    const court = courtRef.current;
    if (!court || !rimRef.current || !boardRef.current) return null;
    const rim = relativeRect(rimRef.current, court);
    const board = relativeRect(boardRef.current, court);
    const bounds = court.getBoundingClientRect();
    return {
      rimLeft: rim.left,
      rimRight: rim.right,
      rimY: rim.top,
      board: { left: board.left, right: board.right, top: board.top, bottom: board.bottom },
      width: bounds.width,
      height: bounds.height,
    };
  }, []);

  const padOrigin = useCallback((): Vec | null => {
    const court = courtRef.current;
    const pad = court?.querySelector('.um-hoop__pad');
    if (!court || !pad) return null;
    const rect = relativeRect(pad, court);
    return { x: rect.left + TOKEN_W / 2, y: rect.bottom - TOKEN_H / 2 };
  }, []);

  const score = useCallback(
    (item: UploadItem, kind: ShotResult) => {
      setStats((s) => ({ shots: s.shots + 1, made: s.made + (kind === 'swish' || kind === 'bank' ? 1 : 0) }));
      if (kind === 'swish' || kind === 'bank') {
        setNetKey((k) => k + 1);
        setCallout({ text: kind === 'bank' ? 'Bank shot!' : 'Swish!', key: Date.now(), tone: 'good' });
        start(item.id);
      } else {
        setCallout({ text: kind === 'rim' ? 'Rim out – try again' : 'Missed – try again', key: Date.now(), tone: 'bad' });
      }
    },
    [start],
  );

  const shootNextQueued = useRef<() => void>(() => {});

  const launch = useCallback(
    (item: UploadItem, from: Vec, velocity: Vec) => {
      const g = geometry();
      if (!g || motion.reduced) {
        score(item, 'swish');
        setTimeout(() => shootNextQueued.current(), 0);
        return;
      }
      setFlight(item);
      let position = { ...from };
      let v = { ...velocity };
      let rotation = 0;
      let last = performance.now();
      let banked = false;
      let sinking = false;
      let sinkFrames = 0;

      const place = (scale = 1, opacity = 1) => {
        const ball = ballRef.current;
        if (!ball) return;
        ball.style.transform = `translate(${position.x - TOKEN_W / 2}px, ${position.y - TOKEN_H / 2}px) rotate(${rotation}deg) scale(${scale})`;
        ball.style.opacity = String(opacity);
      };

      const finish = (result: ShotResult) => {
        frame.current = null;
        score(item, result);
        setFlight(null);
        setTimeout(() => shootNextQueued.current(), result === 'miss' || result === 'rim' ? 500 : 180);
      };

      const step = (now: number) => {
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        const previousY = position.y;
        v.y += GRAVITY * dt;
        position = { x: position.x + v.x * dt, y: position.y + v.y * dt };
        rotation += v.x * dt * 0.45;

        if (sinking) {
          // Drop through the net, shrinking.
          sinkFrames += 1;
          position.x += (((g.rimLeft + g.rimRight) / 2) - position.x) * 0.25;
          place(Math.max(0.2, 1 - sinkFrames / 14), Math.max(0, 1 - sinkFrames / 16));
          if (sinkFrames > 16) return finish(banked ? 'bank' : 'swish');
          frame.current = requestAnimationFrame(step);
          return;
        }

        // Backboard: absorb horizontal speed and drop down the face.
        const b = g.board;
        if (!banked && position.x > b.left && position.x < b.right && position.y > b.top && position.y < b.bottom) {
          banked = true;
          v = { x: v.x * 0.15, y: Math.max(v.y, 0) * 0.4 };
        }

        // Rim plane crossed going down.
        if (previousY < g.rimY && position.y >= g.rimY && v.y > 0) {
          const inside = position.x > g.rimLeft + 6 && position.x < g.rimRight - 6;
          const assisted = position.x > g.rimLeft - ASSIST && position.x < g.rimRight + ASSIST;
          const nearRim = position.x > g.rimLeft - ASSIST - 22 && position.x < g.rimRight + ASSIST + 22;
          if (inside || assisted) {
            sinking = true;
            v = { x: 0, y: 260 };
          } else if (nearRim) {
            const center = (g.rimLeft + g.rimRight) / 2;
            v = { x: (position.x < center ? -1 : 1) * 260, y: -Math.abs(v.y) * 0.35 };
            position.y = g.rimY - 1;
            setTimeout(() => setCallout({ text: 'Clank!', key: Date.now(), tone: 'bad' }), 0);
          }
        }

        place();
        if (position.y > g.height + 80 || position.x < -80 || position.x > g.width + 80) {
          return finish(banked ? 'rim' : 'miss');
        }
        frame.current = requestAnimationFrame(step);
      };
      place();
      frame.current = requestAnimationFrame(step);
    },
    [geometry, motion.reduced, score],
  );

  const autoShoot = useCallback(
    (item: UploadItem) => {
      const g = geometry();
      const origin = padOrigin();
      if (!g || !origin) {
        start(item.id);
        return;
      }
      launch(item, origin, perfectVelocity(origin, g));
    },
    [geometry, padOrigin, launch, start],
  );

  shootNextQueued.current = () => {
    const nextId = autoQueue.current.shift();
    if (!nextId) return;
    const next = context.store.getItem(nextId);
    if (next && next.status === 'pending') autoShoot(next);
    else shootNextQueued.current();
  };

  const shootAll = () => {
    if (flight) return;
    autoQueue.current = [...pending].reverse().map((item) => item.id);
    shootNextQueued.current();
  };

  // ---------------------------------------------------------------- aiming

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!top || flight || event.button !== 0) return;
    const origin = padOrigin();
    if (!origin) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    aimState.current = { pointerId: event.pointerId, origin, offset: { x: 0, y: 0 }, item: top };
    setAim({ origin, offset: { x: 0, y: 0 } });
    (event.currentTarget as HTMLElement).dataset.start = `${event.clientX},${event.clientY}`;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = aimState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const [sx, sy] = (event.currentTarget.dataset.start ?? '0,0').split(',').map(Number) as [number, number];
    let dx = event.clientX - sx;
    let dy = event.clientY - sy;
    const length = Math.hypot(dx, dy);
    if (length > MAX_PULL) {
      dx = (dx / length) * MAX_PULL;
      dy = (dy / length) * MAX_PULL;
    }
    state.offset = { x: dx, y: dy };
    setAim({ origin: state.origin, offset: state.offset });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = aimState.current;
    if (!state || state.pointerId !== event.pointerId) return;
    aimState.current = null;
    setAim(null);
    const { origin, offset, item } = state;
    if (Math.hypot(offset.x, offset.y) < 12) {
      autoShoot(item); // A tap or click takes the perfect shot.
      return;
    }
    const from = { x: origin.x + offset.x, y: origin.y + offset.y };
    launch(item, from, { x: -offset.x * POWER, y: -offset.y * POWER });
  };

  const aimFrom = aim ? { x: aim.origin.x + aim.offset.x, y: aim.origin.y + aim.offset.y } : null;
  const dots = aim && aimFrom ? trajectory(aimFrom, { x: -aim.offset.x * POWER, y: -aim.offset.y * POWER }) : [];
  const uploaded = totals.success;

  return (
    <div className={cx('um-panel', 'um-hoop', props.classNames?.root)}>
      <div className="um-panel__header">
        <div>
          <h3 className="um-panel__title">{props.title ?? 'Upload files'}</h3>
          <p className="um-panel__desc">{props.description ?? 'Drag and drop, or take the shot.'}</p>
        </div>
        <div className="um-hoop__pills">
          <TransportBadge />
          {stats.shots > 0 ? (
            <span className="um-hoop__pill" title="Shots made">
              🏀 {stats.made}/{stats.shots}
            </span>
          ) : null}
          <span className="um-hoop__pill um-hoop__pill--accent" key={uploaded} data-bump={uploaded > 0 || undefined}>
            Uploaded <strong>{uploaded}</strong>
          </span>
        </div>
      </div>

      <div
        {...dropzone.getRootProps({ noClick: Boolean(top) })}
        ref={courtRef}
        className={cx('um-zone', 'um-hoop__court', props.classNames?.zone)}
        data-aiming={aim ? 'true' : undefined}
      >
        <div className="um-hoop__drop">
          {props.zoneContent ?? (
            <>
              <UploadIcon size={18} />
              <strong>{dropzone.dragState === 'accept' ? labels.dropActive : dropzone.dragState === 'reject' ? labels.dropReject : 'Drop files here'}</strong>
              <span>
                or take the shot · <BrowseButton variant="link">browse</BrowseButton>
              </span>
              <UploadHint />
            </>
          )}
        </div>

        <Hoop netKey={netKey} rimRef={rimRef} boardRef={boardRef} />
        {netKey > 0 ? <Burst key={netKey} seed={`hoop${netKey}`} count={16} spread={64} className="um-hoop__burst" /> : null}
        {callout ? (
          <span className="um-hoop__callout" key={callout.key} data-tone={callout.tone} aria-hidden="true">
            {callout.text}
          </span>
        ) : null}

        {dots.length > 0 ? (
          <svg className="um-hoop__dots" aria-hidden="true">
            {dots.map((dot, index) => (
              <circle key={index} cx={dot.x} cy={dot.y} r={2.4 - index * 0.06} style={{ opacity: 1 - index / dots.length }} />
            ))}
          </svg>
        ) : null}

        <div className="um-hoop__pad" data-count={pending.length}>
          {pending.slice(-3, -1).map((item, index) => (
            <span key={item.id} className="um-hoop__token um-hoop__token--stacked" style={{ '--d': index } as React.CSSProperties} aria-hidden="true">
              <Token item={item} />
            </span>
          ))}
          {top ? (
            <button
              type="button"
              className="um-hoop__token um-hoop__token--top"
              aria-label={`Shoot ${top.name} into the basket to upload it`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                aimState.current = null;
                setAim(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  if (!flight) autoShoot(top);
                }
              }}
              onClick={(event) => event.stopPropagation()}
              style={aim ? { transform: `translate(${aim.offset.x}px, ${aim.offset.y}px) rotate(${aim.offset.x * -0.2}deg)` } : undefined}
            >
              <Token item={top} />
            </button>
          ) : (
            <span className="um-hoop__token um-hoop__token--empty" aria-hidden="true" />
          )}
          {pending.length > 1 ? <span className="um-hoop__count">×{pending.length}</span> : null}
        </div>

        {flight ? (
          <div className="um-hoop__ball" ref={ballRef} aria-hidden="true">
            <Token item={flight} />
          </div>
        ) : null}

        <div className="um-hoop__footer">
          <span className="um-hoop__tip">{top ? 'Pull back the file, aim & release to shoot into the basket' : 'Add files, then aim & shoot them into the basket'}</span>
          {top ? (
            <span className="um-hoop__actions">
              <button
                type="button"
                className="um-icon-btn"
                aria-label={`${labels.remove} ${top.name}`}
                title={`${labels.remove} ${top.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  remove(top.id);
                }}
              >
                <CloseIcon size={14} />
              </button>
              <button
                type="button"
                className="um-btn um-btn--soft"
                disabled={Boolean(flight)}
                onClick={(event) => {
                  event.stopPropagation();
                  shootAll();
                }}
              >
                Shoot {pending.length > 1 ? `all ${pending.length}` : 'it'}
              </button>
            </span>
          ) : null}
        </div>
      </div>

      <PresetQueue props={props} progressVariant="ring" items={launched} />
    </div>
  );
}

export const hoopShotPreset: UploadPreset = {
  ...PRESET_INFO['hoop-shot'],
  Component: HoopShotPreset,
};
