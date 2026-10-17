import { codeToHtml } from 'shiki';
import { CopyButton } from './CopyButton';

export async function highlight(code: string, lang = 'tsx') {
  return codeToHtml(code.trim(), {
    lang,
    themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    defaultColor: false,
  });
}

/** Server-highlighted code block (zero client JS except the copy button). */
export async function Code({ code, lang = 'tsx', title }: { code: string; lang?: string; title?: string }) {
  const html = await highlight(code, lang);
  return (
    <div className="code">
      <div className="code__bar">
        <span>{title ?? lang}</span>
        <CopyButton text={code.trim()} />
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
