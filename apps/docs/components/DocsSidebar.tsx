'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DOC_SECTIONS, docHref } from '@/lib/docs/nav';

export function DocsSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  return (
    <aside className="docs-sidebar" data-open={open || undefined}>
      <button type="button" className="docs-sidebar__toggle button button--ghost button--small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? 'Close menu' : 'Docs menu'}
      </button>
      <nav aria-label="Documentation">
        {DOC_SECTIONS.map((section) => (
          <div key={section.title} className="docs-sidebar__group">
            <p className="docs-sidebar__title">{section.title}</p>
            <ul>
              {section.links.map((link) => {
                const href = docHref(link.slug);
                return (
                  <li key={link.slug}>
                    <Link href={href} aria-current={pathname === href ? 'page' : undefined}>
                      {link.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
