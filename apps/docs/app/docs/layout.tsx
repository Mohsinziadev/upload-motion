import { DocsSidebar } from '@/components/DocsSidebar';
import './docs.css';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container docs">
      <DocsSidebar />
      <article className="docs-content">{children}</article>
    </div>
  );
}
