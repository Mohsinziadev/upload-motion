import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '120px 24px', textAlign: 'center', display: 'grid', gap: 16, justifyItems: 'center' }}>
      <span className="kicker">404</span>
      <h1 className="h2">
        This page <em>missed</em> the hoop.
      </h1>
      <p className="lead">The page you’re looking for doesn’t exist.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link className="button button--primary" href="/">
          Home
        </Link>
        <Link className="button button--ghost" href="/docs">
          Docs
        </Link>
      </div>
    </div>
  );
}
