import { useEffect, useState } from 'react';
import { useUploaderContext } from './context';

const ZERO_WIDTH = String.fromCharCode(0x200b);

/**
 * Visually hidden live regions announcing lifecycle changes (not every
 * progress tick). Errors use an assertive region.
 */
export function UploadAnnouncer() {
  const { store, labels } = useUploaderContext();
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');

  useEffect(() => {
    // Alternate a zero-width suffix so identical consecutive messages are re-announced.
    let flip = false;
    const say = (setter: (value: string) => void, message: string) => {
      flip = !flip;
      setter(flip ? message : message + ZERO_WIDTH);
    };
    const offs = [
      store.on('added', (items) =>
        say(setPolite, items.length === 1 ? `${items[0]!.name} added` : `${items.length} files added`),
      ),
      store.on('rejected', (rejections) =>
        say(setAssertive, rejections.map((rejection) => rejection.errors[0]?.message).join(' ')),
      ),
      store.on('start', (item) => say(setPolite, `${labels.status.uploading} ${item.name}`)),
      store.on('success', (item) => say(setPolite, `${item.name} ${labels.status.success.toLowerCase()}`)),
      store.on('error', (item) =>
        say(setAssertive, `${item.name}: ${labels.status.error}. ${item.error?.message ?? ''}`),
      ),
      store.on('cancel', (item) => say(setPolite, `${item.name} ${labels.status.canceled.toLowerCase()}`)),
      store.on('removed', (item) => say(setPolite, `${item.name} ${labels.remove.toLowerCase()}d`)),
      store.on('complete', (items) => {
        const ok = items.filter((item) => item.status === 'success').length;
        if (items.length > 1) say(setPolite, `${ok} of ${items.length} uploads complete`);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [store, labels]);

  return (
    <>
      <div className="um-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="um-sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </>
  );
}
