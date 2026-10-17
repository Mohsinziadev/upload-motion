/**
 * Demo upload endpoint used by the playground's "Real network" transport.
 *
 * It streams the request body, counts the bytes and discards them – nothing
 * is stored. Optional headers let the playground demonstrate behaviour:
 *   x-throttle-kbps: read the body at most this fast (backpressure slows the
 *                    browser's real upload progress)
 *   x-simulate-failure: "1" → respond 503 after reading the body
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 50 * 1024 * 1024;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  const name = decodeURIComponent(request.headers.get('x-file-name') ?? 'unknown');
  const throttle = Math.max(0, Math.min(Number(request.headers.get('x-throttle-kbps')) || 0, 100_000));
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_BYTES) {
    return Response.json({ error: `This demo accepts up to ${MAX_BYTES / 1024 / 1024} MB per file.` }, { status: 413 });
  }
  if (!request.body) {
    return Response.json({ error: 'Empty request body.' }, { status: 400 });
  }

  const started = Date.now();
  const reader = request.body.getReader();
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        return Response.json({ error: 'Upload exceeded the 50 MB demo limit.' }, { status: 413 });
      }
      if (throttle > 0) {
        // Keep average throughput at or below the requested rate.
        const expected = (received / (throttle * 1024)) * 1000;
        const elapsed = Date.now() - started;
        if (expected > elapsed) await sleep(expected - elapsed);
      }
    }
  } catch {
    return Response.json({ error: 'The connection was interrupted.' }, { status: 499 });
  }

  if (request.headers.get('x-simulate-failure') === '1') {
    return Response.json({ error: 'Simulated server failure (503) – try Retry.' }, { status: 503 });
  }

  return Response.json({
    ok: true,
    name,
    receivedBytes: received,
    durationMs: Date.now() - started,
    stored: false,
    note: 'Received and discarded. This demo endpoint does not store files.',
  });
}
