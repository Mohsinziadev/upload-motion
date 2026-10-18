import { Fragment, type ReactNode } from 'react';

const TOKEN = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`[^`]*`)|(<\/?[A-Za-z][\w.]*)|\b(import|from|export|function|return|const|let|await|async|true|false|null|undefined|new|default)\b|\b(\d[\d_.]*)\b|([A-Za-z_][\w]*)(?==)/g;

/**
 * Tiny dependency-free TSX highlighter for code generated on the client
 * (playground). Static pages use Shiki on the server instead.
 */
export function highlightTsx(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) out.push(<Fragment key={key++}>{code.slice(last, index)}</Fragment>);
    const [text, comment, string, tag, keyword, number, attribute] = match;
    const cls = comment ? 'tok-c' : string ? 'tok-s' : tag ? 'tok-t' : keyword ? 'tok-k' : number ? 'tok-n' : attribute ? 'tok-a' : '';
    out.push(
      <span key={key++} className={cls}>
        {text}
      </span>,
    );
    last = index + text.length;
  }
  if (last < code.length) out.push(<Fragment key={key}>{code.slice(last)}</Fragment>);
  return out;
}
