import { useMemo, type CSSProperties } from 'react';
import { cx, seededRandom } from '../hooks/utils';
import { useUploaderContext } from './context';

/** Stroke-drawn checkmark inside a circle. */
export function AnimatedCheck({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg className={cx('um-check', className)} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="um-check__circle" cx="12" cy="12" r="10.5" pathLength={1} />
      <path className="um-check__mark" d="m7.2 12.4 3.2 3.2 6.4-7" pathLength={1} />
    </svg>
  );
}

export interface BurstProps {
  /** Base particle count before the `particles` motion multiplier. */
  count?: number;
  seed?: string;
  /** Spread radius in px. */
  spread?: number;
  className?: string;
  shape?: 'dot' | 'petal' | 'spark';
}

/**
 * One-shot particle burst built from a handful of spans animated with CSS
 * transforms. Mount it (e.g. with a key) to play; renders nothing for reduced
 * motion or `particles: 0`.
 */
export function Burst({ count = 14, seed = 'burst', spread = 56, className, shape = 'dot' }: BurstProps) {
  const { motion } = useUploaderContext();
  const total = motion.reduced ? 0 : Math.round(count * motion.particles);
  const particles = useMemo(() => {
    const random = seededRandom(seed);
    return Array.from({ length: total }, (_, index) => {
      const angle = (index / Math.max(total, 1)) * Math.PI * 2 + random() * 0.6;
      const distance = spread * (0.55 + random() * 0.6);
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: (angle * 180) / Math.PI + 90,
        delay: random() * 60,
        scale: 0.6 + random() * 0.8,
        hue: random() > 0.5 ? 'var(--um-accent)' : 'var(--um-accent-2)',
      };
    });
  }, [total, seed, spread]);

  if (total === 0) return null;
  return (
    <span className={cx('um-burst', className)} data-shape={shape} aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          key={index}
          className="um-burst__p"
          style={
            {
              '--x': `${particle.x.toFixed(1)}px`,
              '--y': `${particle.y.toFixed(1)}px`,
              '--r': `${particle.rotate.toFixed(0)}deg`,
              '--s': particle.scale.toFixed(2),
              '--c': particle.hue,
              animationDelay: `${particle.delay.toFixed(0)}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
