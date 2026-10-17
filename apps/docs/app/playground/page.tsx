import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Playground } from '@/components/playground/Playground';
import './playground.css';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Configure every upload-motion preset live: themes, colours, motion, validation, transports and queue behaviour.',
};

export default function PlaygroundPage() {
  return (
    <div className="container pg-page">
      <header className="pg-intro">
        <span className="kicker">Playground</span>
        <h1 className="h2">
          Tune it <em>live</em>, copy the code.
        </h1>
        <p className="lead">
          Every control drives the real library – the same components you install. Switch transports to watch genuine network progress
          against <code>/api/upload</code>, or stay simulated to explore motion without sending data.
        </p>
      </header>
      <Suspense fallback={<div className="pg-loading">Loading playground…</div>}>
        <Playground />
      </Suspense>
    </div>
  );
}
