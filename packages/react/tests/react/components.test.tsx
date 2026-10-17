import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  FileUpload,
  Uploader,
  UploadDropzone,
  UploadFileList,
  UploadProgress,
  createUploadStore,
  presets,
  useUploader,
  type UploadHandler,
} from '../../src';
import { controlledHandler, flush, makeFile } from '../helpers';

function getInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function dropFiles(target: Element, files: File[]) {
  const dataTransfer = {
    files,
    types: ['Files'],
    items: files.map((file) => ({ kind: 'file', type: file.type })),
    dropEffect: 'none',
  };
  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
}

describe('presets', () => {
  it('ships at least 12 distinct presets with metadata', () => {
    expect(presets.length).toBeGreaterThanOrEqual(12);
    expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length);
    for (const preset of presets) {
      expect(preset.name).toBeTruthy();
      expect(preset.description.length).toBeGreaterThan(40);
      expect(preset.bestFor.length).toBeGreaterThan(0);
    }
  });

  it.each(presets.map((preset) => [preset.id]))('%s renders on the server without touching browser APIs', (id) => {
    const html = renderToString(<FileUpload preset={id} />);
    expect(html).toContain('um-root');
    expect(html).toContain('type="file"');
  });

  it.each(presets.map((preset) => [preset.id]))('%s renders files through the full lifecycle', async (id) => {
    const { handler, calls } = controlledHandler();
    const { container } = render(<FileUpload preset={id} upload={handler} autoUpload />);
    const files = [makeFile('photo.png', 2048, 'image/png'), makeFile('report.pdf', 4096, 'application/pdf')];
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files } });
      await flush();
    });
    expect(calls.length).toBeGreaterThan(0);
    await act(async () => {
      calls[0]!.ctx.onProgress(1024, 2048);
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    await act(async () => {
      calls.forEach((call) => call.resolve());
      await flush();
      await flush();
    });
    expect(container.textContent).toContain('photo.png');
  });
});

describe('<FileUpload>', () => {
  it('uploads files chosen with the file input and reports progress accessibly', async () => {
    const { handler, calls } = controlledHandler();
    const onSuccess = vi.fn();
    const { container } = render(<FileUpload preset="essential" upload={handler} onUploadSuccess={onSuccess} />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('notes.txt', 1000, 'text/plain')] } });
      await flush();
    });
    await act(async () => {
      calls[0]!.ctx.onProgress(400, 1000);
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    const bar = screen.getByRole('progressbar', { name: 'notes.txt' });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    await act(async () => {
      calls[0]!.resolve({ ok: true });
      await flush();
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
  });

  it('accepts drag and drop', async () => {
    const { handler, calls } = controlledHandler();
    const { container } = render(<FileUpload preset="essential" upload={handler} />);
    const zone = container.querySelector('.um-zone')!;
    await act(async () => {
      dropFiles(zone, [makeFile('a.png', 10, 'image/png'), makeFile('b.png', 10, 'image/png')]);
      await flush();
    });
    expect(calls).toHaveLength(2);
    expect(screen.getByText('a.png')).toBeInTheDocument();
  });

  it('shows drag-over feedback and rejects disallowed types during drag', () => {
    const { container } = render(<FileUpload preset="essential" accept="image/*" />);
    const zone = container.querySelector('.um-zone')!;
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'image/png' }] } });
    expect(zone).toHaveAttribute('data-um-drag', 'accept');
    expect(screen.getByText('Release to upload')).toBeInTheDocument();
    fireEvent.dragLeave(zone, { dataTransfer: { types: ['Files'] } });
    fireEvent.dragEnter(zone, { dataTransfer: { types: ['Files'], items: [{ kind: 'file', type: 'application/pdf' }] } });
    expect(zone).toHaveAttribute('data-um-drag', 'reject');
  });

  it('explains rejected files in text and lets users dismiss them', async () => {
    const user = userEvent.setup();
    const { container } = render(<FileUpload preset="essential" accept=".pdf" maxSize={1024} />);
    await act(async () => {
      fireEvent.change(getInput(container), {
        target: { files: [makeFile('huge.pdf', 5 * 1024), makeFile('photo.png', 10, 'image/png')] },
      });
    });
    const list = within(screen.getByRole('list', { name: 'Rejected files' }));
    expect(list.getByText(/huge\.pdf is 5 KB; the limit is 1 KB/)).toBeInTheDocument();
    expect(list.getByText(/photo\.png isn't an accepted file type \(PDF\)/)).toBeInTheDocument();
    // The same messages are announced assertively for screen readers.
    expect(screen.getByRole('alert')).toHaveTextContent('huge.pdf is 5 KB');
    await user.click(screen.getByRole('button', { name: 'Dismiss: huge.pdf' }));
    await waitFor(() => expect(list.queryByText(/huge\.pdf is/)).not.toBeInTheDocument());
  });

  it('cancels, retries and removes through accessible buttons', async () => {
    const user = userEvent.setup();
    const { handler, calls } = controlledHandler();
    const { container } = render(<FileUpload preset="essential" upload={handler} />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('clip.mp4', 5000, 'video/mp4')] } });
      await flush();
    });
    await user.click(screen.getByRole('button', { name: 'Cancel clip.mp4' }));
    await waitFor(() => expect(screen.getByText('Canceled')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Retry clip.mp4' }));
    await waitFor(() => expect(calls).toHaveLength(2));
    await act(async () => {
      calls[1]!.reject(new Error('Server exploded'));
      await flush();
    });
    expect(screen.getByText('Server exploded')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove clip.mp4' }));
    await waitFor(() => expect(screen.queryByText('clip.mp4')).not.toBeInTheDocument());
  });

  it('never claims success without an upload handler', async () => {
    const { container } = render(<FileUpload preset="essential" />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('a.txt')] } });
    });
    expect(screen.getByText('Selected – no upload handler configured')).toBeInTheDocument();
    expect(screen.queryByText('Uploaded')).not.toBeInTheDocument();
  });

  it('labels simulated transports', () => {
    const simulated = Object.assign(async () => 'x', { simulated: true }) as UploadHandler;
    render(<FileUpload preset="essential" upload={simulated} />);
    // Footer badge appears once the queue has content in essential; the root advertises the transport.
    expect(document.querySelector('.um-root')).toHaveAttribute('data-um-transport', 'simulated');
  });

  it('applies appearance tokens and themes', () => {
    const { container } = render(
      <FileUpload preset="essential" appearance={{ theme: 'dark', accent: '#ff0066', radius: 4, density: 'compact' }} />,
    );
    const root = container.querySelector('.um-root') as HTMLElement;
    expect(root).toHaveAttribute('data-um-theme', 'dark');
    expect(root).toHaveAttribute('data-um-density', 'compact');
    expect(root.style.getPropertyValue('--um-accent')).toBe('#ff0066');
    expect(root.style.getPropertyValue('--um-radius')).toBe('4px');
  });

  it('honours motion settings and forced reduced motion', () => {
    const { container, rerender } = render(<FileUpload preset="orbit" motion={{ speed: 2, intensity: 0.5 }} />);
    const root = container.querySelector('.um-root') as HTMLElement;
    expect(root).toHaveAttribute('data-um-motion', 'full');
    expect(root.style.getPropertyValue('--um-time')).toBe('0.500');
    expect(root.style.getPropertyValue('--um-intensity')).toBe('0.5');
    rerender(<FileUpload preset="orbit" motion={{ reducedMotion: 'always' }} />);
    expect(root).toHaveAttribute('data-um-motion', 'reduced');
  });

  it('follows the OS reduced-motion preference by default', () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      const { container } = render(<FileUpload preset="liquid" />);
      expect(container.querySelector('.um-root')).toHaveAttribute('data-um-motion', 'reduced');
    } finally {
      window.matchMedia = original;
    }
  });

  it('keeps the queue when switching presets', async () => {
    const { container, rerender } = render(<FileUpload preset="essential" />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('keep.pdf', 10, 'application/pdf')] } });
    });
    rerender(<FileUpload preset="beam" />);
    expect(screen.getByText('keep.pdf')).toBeInTheDocument();
    expect(container.querySelector('.um-root')).toHaveClass('um-preset-beam');
  });

  it('uses custom file renderers and labels', async () => {
    const { container } = render(
      <FileUpload
        preset="essential"
        labels={{ dropTitle: 'Suelta aquí', status: { pending: 'Listo' } }}
        renderFile={(item, helpers) => (
          <div data-testid="custom">
            {item.name}:{helpers.labels.status[item.status]}
          </div>
        )}
      />,
    );
    expect(screen.getByText('Suelta aquí')).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('x.txt')] } });
    });
    expect(screen.getByTestId('custom')).toHaveTextContent('x.txt:Listo');
  });

  it('starts uploads manually with the Upload button in manual presets', async () => {
    const user = userEvent.setup();
    const { handler, calls } = controlledHandler();
    const { container } = render(<FileUpload preset="card-fan" upload={handler} />);
    const button = screen.getByRole('button', { name: 'Upload' });
    expect(button).toBeDisabled();
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('a.png', 10, 'image/png'), makeFile('b.png', 10, 'image/png')] } });
    });
    await user.click(screen.getByRole('button', { name: 'Upload 2 files' }));
    await waitFor(() => expect(calls).toHaveLength(2));
  });

  it('lets hoop-shot users shoot every file with the keyboard-accessible button', async () => {
    const user = userEvent.setup();
    const { handler, calls } = controlledHandler();
    const { container } = render(<FileUpload preset="hoop-shot" upload={handler} motion={{ reducedMotion: 'always' }} />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('a.pdf', 10, 'application/pdf'), makeFile('b.pdf', 10, 'application/pdf')] } });
    });
    expect(screen.getByRole('button', { name: /Shoot b\.pdf into the basket/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Shoot all 2' }));
    await waitFor(() => expect(calls).toHaveLength(2));
  });

  it('opens the wave-bar drawer and menu with keyboard-friendly controls', async () => {
    const user = userEvent.setup();
    const { handler } = controlledHandler();
    const { container } = render(<FileUpload preset="wave-bar" upload={handler} />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('a.zip', 1000, 'application/zip')] } });
      await flush();
    });
    expect(screen.getByText('Uploading 1 file')).toBeInTheDocument();
    const expand = screen.getByRole('button', { name: 'Show files' });
    await user.click(expand);
    expect(expand).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Add more files' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await waitFor(() => expect(screen.getByText('1 file paused')).toBeInTheDocument());
  });
});

describe('composable API', () => {
  it('opens the file dialog from a focusable zone with the keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Uploader>
        <UploadDropzone focusable>Drop here</UploadDropzone>
        <UploadFileList />
      </Uploader>,
    );
    const input = getInput(container);
    const click = vi.spyOn(input, 'click');
    const zone = screen.getByRole('button', { name: 'Upload files' });
    zone.focus();
    await user.keyboard('{Enter}');
    expect(click).toHaveBeenCalled();
  });

  it('accepts pasted files', async () => {
    const { container } = render(
      <Uploader>
        <UploadDropzone focusable />
        <UploadFileList />
      </Uploader>,
    );
    const zone = container.querySelector('.um-zone')!;
    await act(async () => {
      fireEvent.paste(zone, { clipboardData: { files: [makeFile('pasted.png', 10, 'image/png')] } });
    });
    expect(screen.getByText('pasted.png')).toBeInTheDocument();
  });

  it('shares an external store across mounts so uploads survive unmounting', async () => {
    const store = createUploadStore();
    const first = render(
      <Uploader store={store}>
        <UploadFileList />
      </Uploader>,
    );
    act(() => {
      store.addFiles([makeFile('persist.txt')]);
    });
    first.unmount();
    render(
      <Uploader store={store}>
        <UploadFileList />
      </Uploader>,
    );
    expect(screen.getByText('persist.txt')).toBeInTheDocument();
  });

  it('renders standalone progress indicators with ARIA values', () => {
    render(
      <>
        <UploadProgress value={0.25} label="bar" />
        <UploadProgress value={0.5} label="ring" variant="ring" />
        <UploadProgress value={0.75} label="wave" variant="wave" />
        <UploadProgress value={1.4} label="beam" variant="beam" status="success" />
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'bar' })).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByRole('progressbar', { name: 'ring' })).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('progressbar', { name: 'wave' })).toHaveAttribute('aria-valuenow', '75');
    expect(screen.getByRole('progressbar', { name: 'beam' })).toHaveAttribute('aria-valuenow', '100');
  });

  it('announces lifecycle changes to screen readers', async () => {
    const { handler, calls } = controlledHandler();
    const { container } = render(<FileUpload preset="essential" upload={handler} />);
    await act(async () => {
      fireEvent.change(getInput(container), { target: { files: [makeFile('voice.mp3', 10, 'audio/mpeg')] } });
      await flush();
    });
    await act(async () => {
      calls[0]!.reject(new Error('Disk full'));
      await flush();
    });
    expect(screen.getByRole('alert')).toHaveTextContent('voice.mp3: Failed. Disk full');
  });

  it('throws a helpful error outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<UploadFileList />)).toThrow(/inside <Uploader>/);
    spy.mockRestore();
  });
});

describe('useUploader (headless)', () => {
  it('exposes queue state and actions without UI', async () => {
    const { handler, calls } = controlledHandler();
    const { result } = renderHook(() => useUploader({ upload: handler, autoUpload: false }));
    act(() => {
      result.current.addFiles([makeFile('a.txt', 100)]);
    });
    expect(result.current.items[0]!.status).toBe('pending');
    expect(result.current.totals.pending).toBe(1);
    await act(async () => {
      result.current.start();
      await flush();
    });
    expect(calls).toHaveLength(1);
    await act(async () => {
      calls[0]!.resolve();
      await flush();
    });
    expect(result.current.totals.isComplete).toBe(true);
  });

  it('aborts its own uploads on unmount', async () => {
    const { handler, calls } = controlledHandler();
    const { result, unmount } = renderHook(() => useUploader({ upload: handler }));
    await act(async () => {
      result.current.addFiles([makeFile('a.txt')]);
      await flush();
    });
    unmount();
    expect(calls[0]!.ctx.signal.aborted).toBe(true);
  });
});

describe('external store + preset defaults', () => {
  it('resets preset-specific defaults like manual upload when switching presets', async () => {
    const store = createUploadStore();
    const { rerender } = render(<FileUpload preset="card-fan" store={store} />);
    expect(store.getOptions().autoUpload).toBe(false);
    rerender(<FileUpload preset="essential" store={store} />);
    expect(store.getOptions().autoUpload).toBe(true);
  });
});

describe('external store option layering', () => {
  it('restores the store’s own options when a prop is removed', () => {
    const store = createUploadStore({ maxSize: 5000 });
    const { rerender } = render(<FileUpload preset="essential" store={store} maxFiles={2} maxSize={100} />);
    expect(store.getOptions()).toMatchObject({ maxFiles: 2, maxSize: 100 });
    rerender(<FileUpload preset="essential" store={store} />);
    expect(store.getOptions().maxFiles).toBeUndefined();
    expect(store.getOptions().maxSize).toBe(5000);
  });
});
