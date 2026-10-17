'use client';

import { useId, type CSSProperties, type ReactNode } from 'react';

export function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="pg-field">
      <label className="pg-label" htmlFor={id}>
        {label}
      </label>
      {children(id)}
      {hint ? <p className="pg-hint">{hint}</p> : null}
    </div>
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
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="pg-field pg-fieldset">
      <legend className="pg-label">{label}</legend>
      <div className="pg-segmented">
        {options.map((option) => (
          <label key={option.value} className="pg-segment" data-active={option.value === value || undefined}>
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
  format = (v) => String(v),
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="pg-slider">
          <input
            id={id}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            style={{ '--fill': `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
          />
          <output htmlFor={id}>{format(value)}</output>
        </div>
      )}
    </Field>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (value: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="pg-field">
      <label className="pg-toggle" htmlFor={id}>
        <span className="pg-label">{label}</span>
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="pg-switch" aria-hidden="true" />
      </label>
      {hint ? <p className="pg-hint">{hint}</p> : null}
    </div>
  );
}

const SWATCHES = ['#5b5ef4', '#0ea5e9', '#16a34a', '#f97316', '#e11d48', '#a855f7', '#111827'];

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      {(id) => (
        <div className="pg-color">
          <input id={id} type="color" value={value} onChange={(event) => onChange(event.target.value)} />
          <div className="pg-swatches" role="group" aria-label={`${label} presets`}>
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className="pg-swatch"
                style={{ background: swatch }}
                aria-label={swatch}
                aria-pressed={swatch === value}
                onClick={() => onChange(swatch)}
              />
            ))}
          </div>
        </div>
      )}
    </Field>
  );
}

export function Section({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="pg-section" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="pg-section__body">{children}</div>
    </details>
  );
}
