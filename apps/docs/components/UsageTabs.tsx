'use client';

import { useState } from 'react';
import { CopyButton } from './CopyButton';

export interface UsageTab {
  id: string;
  label: string;
  blurb: string;
  code: string;
  html: string;
}

export function UsageTabs({ tabs }: { tabs: UsageTab[] }) {
  const [active, setActive] = useState(tabs[0]!.id);
  const tab = tabs.find((item) => item.id === active)!;
  return (
    <div className="usage">
      <div className="usage__tabs" role="tablist" aria-label="Ways to use upload-motion">
        {tabs.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`usage-${item.id}`}
            aria-selected={item.id === active}
            aria-controls="usage-panel"
            className="usage__tab"
            onClick={() => setActive(item.id)}
          >
            <span className="usage__num">0{index + 1}</span>
            <span>
              <strong>{item.label}</strong>
              <span className="usage__blurb">{item.blurb}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="code usage__code" id="usage-panel" role="tabpanel" aria-labelledby={`usage-${active}`}>
        <div className="code__bar">
          <span>{tab.label}.tsx</span>
          <CopyButton text={tab.code} />
        </div>
        <div dangerouslySetInnerHTML={{ __html: tab.html }} />
      </div>
    </div>
  );
}
