import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useUploaderContext } from '../components/context';
import { BrowseButton, UploadHint } from '../components/Dropzone';
import { AnimatedCheck } from '../components/Effects';
import { FileIcon } from '../components/FileVisual';
import { TransportBadge, useSummaryText } from '../components/Status';
import { getFileLabel } from '../core/file-kind';
import { PRESET_INFO } from '../core/preset-catalog';
import type { FileKind } from '../core/types';
import { cx, useBecameTrue } from '../hooks/utils';
import type { PresetProps, UploadPreset } from '../types';
import { PresetQueue } from './shared';

interface Ghost {
  id: string;
  kind: FileKind;
  label: string;
  angle: number;
  radius: number;
  delay: number;
}

function PortalPreset(props: PresetProps) {
  const { dropzone, labels, store, totals, motion, items } = useUploaderContext();
  const portalRef = useRef<HTMLSpanElement>(null);
  const { getLastDrop } = dropzone;
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const { title, detail } = useSummaryText();
  const complete = totals.isComplete && totals.error === 0;
  const flash = useBecameTrue(complete, 1200);
  const absorbing = totals.active > 0;

  // Every added file spirals into the portal from where it was dropped.
  useEffect(() => {
    if (motion.reduced) return;
    return store.on('added', (added) => {
      const portal = portalRef.current?.getBoundingClientRect();
      const drop = getLastDrop();
      const recent = drop && Date.now() - drop.at < 400;
      const baseAngle =
        portal && recent ? Math.atan2(drop.y - (portal.top + portal.height / 2), drop.x - (portal.left + portal.width / 2)) : -Math.PI / 2;
      const baseRadius =
        portal && recent ? Math.min(220, Math.hypot(drop.x - (portal.left + portal.width / 2), drop.y - (portal.top + portal.height / 2))) : 150;
      const next = added.slice(0, 8).map((item, index) => ({
        id: item.id,
        kind: item.kind,
        label: getFileLabel(item),
        angle: (baseAngle * 180) / Math.PI + index * 34,
        radius: Math.max(110, baseRadius + index * 8),
        delay: index * 90,
      }));
      setGhosts((current) => [...current, ...next]);
      const ids = new Set(next.map((ghost) => ghost.id));
      setTimeout(() => setGhosts((current) => current.filter((ghost) => !ids.has(ghost.id))), 1400 + next.length * 90);
    });
  }, [store, motion.reduced, getLastDrop]);

  return (
    <div className={cx('um-portal', props.classNames?.root)} data-active={absorbing || undefined} data-complete={complete || undefined}>
      <div
        {...dropzone.getRootProps()}
        className={cx('um-zone', 'um-portal__zone', props.classNames?.zone)}
        style={{ '--um-p': totals.progress } as CSSProperties}
      >
        <span className="um-portal__gate" ref={portalRef} aria-hidden="true" data-flash={flash || undefined}>
          <span className="um-portal__halo" />
          <span className="um-portal__ring" />
          <span className="um-portal__ring um-portal__ring--inner" />
          <svg className="um-portal__progress" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="47" pathLength={1} />
          </svg>
          <span className="um-portal__core">{complete ? <AnimatedCheck size={34} /> : null}</span>
          {ghosts.map((ghost) => (
            <span
              key={ghost.id}
              className="um-portal__ghost"
              style={{ '--a': `${ghost.angle}deg`, '--r': `${ghost.radius}px`, animationDelay: `${ghost.delay}ms` } as CSSProperties}
            >
              <FileIcon kind={ghost.kind} label={ghost.label} size={30} />
            </span>
          ))}
        </span>
        {props.zoneContent ?? (
          <div className="um-portal__text">
            <strong>
              {dropzone.dragState === 'reject'
                ? labels.dropReject
                : dropzone.dragState === 'accept'
                  ? labels.dropActive
                  : items.length > 0
                    ? title
                    : (props.title ?? 'Open a portal for your files')}
            </strong>
            <span>
              {items.length > 0 && detail ? detail : <>Drop files into the portal or <BrowseButton variant="link">browse</BrowseButton></>}
            </span>
            <UploadHint />
            <TransportBadge />
          </div>
        )}
      </div>
      <PresetQueue props={props} progressVariant="beam" />
    </div>
  );
}

export const portalPreset: UploadPreset = {
  ...PRESET_INFO['portal'],
  Component: PortalPreset,
};
