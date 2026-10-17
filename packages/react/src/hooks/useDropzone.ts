import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react';
import { isFileAccepted } from '../core/validation';

export type DragState = 'idle' | 'accept' | 'reject';

export interface DropzoneOptions {
  onFiles: (files: File[]) => void;
  /** Parsed accept tokens (see `parseAccept`). */
  accept?: readonly string[];
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  /** Mobile camera hint passed to the input (`capture` attribute). */
  capture?: 'user' | 'environment';
  /** Stop the browser from opening files dropped outside any drop zone. Default true. */
  preventWindowDrop?: boolean;
}

export interface DropPoint {
  /** Client coordinates of the drop. */
  x: number;
  y: number;
  at: number;
}

export interface RootPropsOptions extends HTMLAttributes<HTMLElement> {
  /** Make the zone itself a keyboard-focusable button. Use when it contains no other controls. */
  focusable?: boolean;
  /** Write `--um-px` / `--um-py` (0..1) pointer position CSS variables while hovering or dragging. */
  trackPointer?: boolean;
  /** Don't open the file dialog when the zone itself is clicked. */
  noClick?: boolean;
  'aria-label'?: string;
}

export interface DropzoneApi {
  dragState: DragState;
  /** Files are being dragged over this zone. */
  isDragActive: boolean;
  /** Files are being dragged anywhere over the window. */
  isWindowDrag: boolean;
  lastDrop: DropPoint | null;
  /** Synchronous read of the latest drop point – safe inside store event handlers fired during the drop. */
  getLastDrop: () => DropPoint | null;
  open: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  getRootProps: (options?: RootPropsOptions) => HTMLAttributes<HTMLElement> & Record<`data-${string}`, string | undefined>;
  getInputProps: () => InputHTMLAttributes<HTMLInputElement> & { ref: RefObject<HTMLInputElement | null> };
}

const hasFiles = (event: { dataTransfer: DataTransfer | null }) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files');

function compose<E>(...handlers: Array<((event: E) => void) | undefined>) {
  return (event: E) => {
    for (const handler of handlers) handler?.(event);
  };
}

const INTERACTIVE = 'button, a[href], input, select, textarea, [role="button"], [role="menuitem"], [data-um-no-open]';

export function useDropzone(options: DropzoneOptions): DropzoneApi {
  const { accept = [], multiple = true, maxFiles, disabled = false, capture, preventWindowDrop = true } = options;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const onFilesRef = useRef(options.onFiles);
  onFilesRef.current = options.onFiles;

  const [dragState, setDragState] = useState<DragState>('idle');
  const [isWindowDrag, setWindowDrag] = useState(false);
  const [lastDrop, setLastDrop] = useState<DropPoint | null>(null);
  const lastDropRef = useRef<DropPoint | null>(null);
  const getLastDrop = useCallback(() => lastDropRef.current, []);
  const depth = useRef(0);
  const pointerFrame = useRef<number | null>(null);

  // Window-level drag awareness lets presets anticipate a drop before the cursor reaches them.
  useEffect(() => {
    if (typeof window === 'undefined' || disabled) return;
    let windowDepth = 0;
    const enter = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      windowDepth += 1;
      setWindowDrag(true);
    };
    const leave = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      windowDepth = Math.max(0, windowDepth - 1);
      if (windowDepth === 0) setWindowDrag(false);
    };
    const reset = () => {
      windowDepth = 0;
      setWindowDrag(false);
    };
    const guard = (event: globalThis.DragEvent) => {
      if (!preventWindowDrop || event.defaultPrevented || !hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
    };
    const drop = (event: globalThis.DragEvent) => {
      guard(event);
      reset();
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', guard);
    window.addEventListener('drop', drop);
    window.addEventListener('dragend', reset);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', guard);
      window.removeEventListener('drop', drop);
      window.removeEventListener('dragend', reset);
    };
  }, [disabled, preventWindowDrop]);

  useEffect(() => () => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
  }, []);

  const evaluate = useCallback(
    (transfer: DataTransfer | null): DragState => {
      const files = Array.from(transfer?.items ?? []).filter((item) => item.kind === 'file');
      if (!multiple && files.length > 1) return 'reject';
      if (maxFiles !== undefined && files.length > maxFiles) return 'reject';
      // Extension tokens can't be checked until drop (names are hidden during drag).
      const mimeOnly = accept.length > 0 && accept.every((token) => !token.startsWith('.'));
      if (mimeOnly && files.some((item) => item.type && !isFileAccepted({ name: '', type: item.type }, accept))) {
        return 'reject';
      }
      return 'accept';
    },
    [accept, multiple, maxFiles],
  );

  const open = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const deliver = useCallback((list: FileList | File[] | null | undefined) => {
    const files = Array.from(list ?? []);
    if (files.length > 0) onFilesRef.current(files);
  }, []);

  const setPointer = (element: HTMLElement, clientX: number, clientY: number) => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      pointerFrame.current = null;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      element.style.setProperty('--um-px', ((clientX - rect.left) / rect.width).toFixed(4));
      element.style.setProperty('--um-py', ((clientY - rect.top) / rect.height).toFixed(4));
    });
  };
  const resetPointer = (element: HTMLElement) => {
    if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = null;
    element.style.setProperty('--um-px', '0.5');
    element.style.setProperty('--um-py', '0.5');
  };

  const getRootProps: DropzoneApi['getRootProps'] = (rootOptions = {}) => {
    const { focusable = false, trackPointer = false, noClick = false, ...rest } = rootOptions;
    const onDragEnter = (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setDragState(evaluate(event.dataTransfer));
    };
    const onDragOver = (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      if (trackPointer) setPointer(event.currentTarget, event.clientX, event.clientY);
    };
    const onDragLeave = (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) {
        setDragState('idle');
        if (trackPointer) resetPointer(event.currentTarget);
      }
    };
    const onDrop = (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setDragState('idle');
      setWindowDrag(false);
      const point = { x: event.clientX, y: event.clientY, at: Date.now() };
      lastDropRef.current = point;
      setLastDrop(point);
      deliver(event.dataTransfer.files);
    };
    const onClick = (event: MouseEvent<HTMLElement>) => {
      if (disabled || noClick) return;
      const target = event.target as HTMLElement;
      const interactive = target.closest(INTERACTIVE);
      if (interactive && interactive !== event.currentTarget && event.currentTarget.contains(interactive)) return;
      open();
    };
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (!focusable || event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    };
    const onPaste = (event: ClipboardEvent<HTMLElement>) => {
      if (disabled || event.clipboardData.files.length === 0) return;
      event.preventDefault();
      deliver(event.clipboardData.files);
    };
    const onPointerMove = trackPointer
      ? (event: PointerEvent<HTMLElement>) => {
          if (event.pointerType === 'mouse') setPointer(event.currentTarget, event.clientX, event.clientY);
        }
      : undefined;
    const onPointerLeave = trackPointer ? (event: PointerEvent<HTMLElement>) => resetPointer(event.currentTarget) : undefined;

    return {
      ...rest,
      ...(focusable
        ? { role: 'button', tabIndex: disabled ? -1 : 0, 'aria-disabled': disabled || undefined }
        : {}),
      'data-um-drag': dragState,
      'data-um-window-drag': isWindowDrag ? 'true' : undefined,
      'data-um-disabled': disabled ? 'true' : undefined,
      onDragEnter: compose(rest.onDragEnter, onDragEnter),
      onDragOver: compose(rest.onDragOver, onDragOver),
      onDragLeave: compose(rest.onDragLeave, onDragLeave),
      onDrop: compose(rest.onDrop, onDrop),
      onClick: compose(rest.onClick, onClick),
      onKeyDown: compose(rest.onKeyDown, onKeyDown),
      onPaste: compose(rest.onPaste, onPaste),
      onPointerMove: compose(rest.onPointerMove, onPointerMove),
      onPointerLeave: compose(rest.onPointerLeave, onPointerLeave),
    };
  };

  const getInputProps: DropzoneApi['getInputProps'] = () => ({
    ref: inputRef,
    type: 'file',
    multiple,
    accept: accept.length > 0 ? accept.join(',') : undefined,
    capture,
    disabled,
    tabIndex: -1,
    hidden: true,
    'aria-hidden': true,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      deliver(event.currentTarget.files);
      // Reset so picking the same file again still fires `change`.
      event.currentTarget.value = '';
    },
  });

  return {
    dragState,
    isDragActive: dragState !== 'idle',
    isWindowDrag,
    lastDrop,
    getLastDrop,
    open,
    inputRef,
    getRootProps,
    getInputProps,
  };
}
