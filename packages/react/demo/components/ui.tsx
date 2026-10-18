import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { highlightTsx } from '../lib/highlight';

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => setState('idle'), 1600);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <button
      type="button"
      className={`btn btn-ghost btn-sm copy-btn ${className}`}
      data-state={state}
      onClick={async () => setState((await copyText(text)) ? 'copied' : 'failed')}
    >
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        {state === 'copied' ? (
          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </>
        )}
      </svg>
      <span aria-live="polite">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Press ⌘C' : label}</span>
    </button>
  );
}

export function CodeBlock({ code, title, className = '', actions }: { code: string; title?: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <div className={`code ${className}`}>
      <div className="code-head">
        <span className="code-title">{title ?? 'TSX'}</span>
        <span className="code-actions">
          {actions}
          <CopyButton text={code} />
        </span>
      </div>
      <pre className="code-body" tabIndex={0}>
        <code>{highlightTsx(code)}</code>
      </pre>
    </div>
  );
}

export function Section({ id, eyebrow, title, lead, children }: { id: string; eyebrow: string; title: ReactNode; lead?: ReactNode; children: ReactNode }) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-title`}>
      <div className="section-inner">
        <header className="section-head">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`}>{title}</h2>
          {lead ? <p className="section-lead">{lead}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="field">
      <legend className="field-label">{label}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value} className="segment" data-active={option.value === value || undefined}>
            <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-row">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        <output className="field-value" htmlFor={id}>
          {format(value)}
        </output>
      </div>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
      />
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="field">
      <label className="toggle" htmlFor={id}>
        <span>
          <span className="field-label">{label}</span>
          {hint ? <span className="field-hint">{hint}</span> : null}
        </span>
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="switch" aria-hidden="true" />
      </label>
    </div>
  );
}

export function Panel({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="panel" open={open}>
      <summary>{title}</summary>
      <div className="panel-body">{children}</div>
    </details>
  );
}
