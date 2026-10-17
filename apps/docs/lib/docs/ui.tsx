import type { ReactNode } from 'react';

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="doc-h2">
      <a href={`#${id}`} className="doc-anchor" aria-label={`Link to this section`}>
        #
      </a>
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="doc-h3">
      {children}
    </h3>
  );
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'tip'; title?: string; children: ReactNode }) {
  return (
    <aside className="callout" data-tone={tone}>
      {title ? <strong className="callout__title">{title}</strong> : null}
      <div>{children}</div>
    </aside>
  );
}

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: ReactNode;
}

export function PropTable({ rows, caption }: { rows: PropRow[]; caption?: string }) {
  return (
    <div className="table-wrap">
      <table className="props">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">Prop</th>
            <th scope="col">Type</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th scope="row">
                <code>{row.name}</code>
              </th>
              <td>
                <code className="props__type">{row.type}</code>
              </td>
              <td>{row.default ? <code>{row.default}</code> : <span className="muted">–</span>}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SimpleTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table className="props">
        <thead>
          <tr>
            {head.map((cell) => (
              <th key={cell} scope="col">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
