export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 14V4M7.5 8.5 12 4l4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 19c1.5 0 1.5-2 3-2s1.5 2 3 2 1.5-2 3-2 1.5 2 3 2 1.5-2 3-2 1.5 2 3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The site's motif: the travelling wave from the Wave Bar preset. */
export function WaveRule({ className = 'wave-rule' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1200 14" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={Array.from({ length: 41 }, (_, i) => `${i === 0 ? 'M' : 'Q'} ${i === 0 ? '0 7' : `${i * 30 - 15} ${i % 2 ? 1 : 13} ${i * 30} 7`}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
