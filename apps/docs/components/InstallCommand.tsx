import { CopyButton } from './CopyButton';

export function InstallCommand({ command = 'npm install upload-motion' }: { command?: string }) {
  return (
    <div className="install">
      <span className="install__prompt" aria-hidden="true">
        $
      </span>
      <code>{command}</code>
      <CopyButton text={command} label="Copy" />
    </div>
  );
}
