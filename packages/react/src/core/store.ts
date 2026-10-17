import { toUploadError, type UploadError } from './errors';
import { getExtension, getFileKind } from './file-kind';
import { clamp01 } from './format';
import { parseAccept, validateFile } from './validation';
import type {
  ClearFilter,
  FileRejection,
  RejectionReason,
  UploadContext,
  UploadEventMap,
  UploadItem,
  UploaderOptions,
  UploadSnapshot,
  UploadStatus,
  UploadTotals,
} from './types';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type AbortReason = 'cancel' | 'pause' | 'remove' | 'dispose';
type Ids = string | readonly string[] | undefined;

interface Runtime {
  controller: AbortController | null;
  reason: AbortReason | null;
  lastTime: number;
  lastLoaded: number;
  autoRetries: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
}

export interface AddFilesResult<TResponse = unknown> {
  accepted: UploadItem<TResponse>[];
  rejected: FileRejection[];
}

export interface UploadStore<TResponse = unknown> {
  /** Immutable snapshot; identity changes only when something changed. */
  getSnapshot(): UploadSnapshot<TResponse>;
  /** `useSyncExternalStore`-compatible subscription. Progress is batched per animation frame. */
  subscribe(listener: () => void): () => void;
  on<K extends keyof UploadEventMap<TResponse>>(
    event: K,
    handler: (payload: UploadEventMap<TResponse>[K]) => void,
  ): () => void;
  setOptions(options: UploaderOptions<TResponse>): void;
  getOptions(): UploaderOptions<TResponse>;
  /** The options passed to `createUploadStore` (UI layers merge their props over these). */
  getInitialOptions(): UploaderOptions<TResponse>;
  /** Validates and enqueues files. Returns what was accepted and rejected. */
  addFiles(files: Iterable<File> | ArrayLike<File>): AddFilesResult<TResponse>;
  /** Starts `pending` files (manual mode). No ids = all pending. */
  start(ids?: Ids): void;
  /** Aborts in-flight or waiting uploads; they become `canceled`. No ids = all. */
  cancel(ids?: Ids): void;
  /** Re-queues `error`/`canceled` files. No ids = all of them. */
  retry(ids?: Ids): void;
  /** Aborts and parks uploads as `paused`. No ids = all active. */
  pause(ids?: Ids): void;
  /** Re-queues `paused` files. Transfers restart unless your handler supports resumption. */
  resume(ids?: Ids): void;
  /** Aborts (if needed) and removes files from the queue. */
  remove(ids: string | readonly string[]): void;
  clear(filter?: ClearFilter): void;
  dismissRejection(id?: string): void;
  getItem(id: string): UploadItem<TResponse> | undefined;
  /** Aborts everything and clears timers. The store stays usable afterwards. */
  dispose(): void;
}

let idCounter = 0;
function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

const now = () => Date.now();

const scheduleFrame: (cb: () => void) => () => void =
  typeof requestAnimationFrame === 'function'
    ? (cb) => {
        const handle = requestAnimationFrame(cb);
        return () => cancelAnimationFrame(handle);
      }
    : (cb) => {
        const handle = setTimeout(cb, 16);
        return () => clearTimeout(handle);
      };

const IN_FLIGHT: ReadonlySet<UploadStatus> = new Set(['queued', 'uploading', 'paused', 'success']);

export function computeTotals(items: readonly UploadItem[]): UploadTotals {
  const totals: UploadTotals = {
    count: items.length,
    progress: 0,
    loaded: 0,
    size: 0,
    speed: 0,
    eta: null,
    pending: 0,
    queued: 0,
    uploading: 0,
    paused: 0,
    success: 0,
    error: 0,
    canceled: 0,
    active: 0,
    isUploading: false,
    isComplete: false,
  };
  let weighted = 0;
  let weightedLoaded = 0;
  for (const item of items) {
    totals[item.status] += 1;
    if (!IN_FLIGHT.has(item.status)) continue;
    const weight = Math.max(item.size, 1);
    weighted += weight;
    weightedLoaded += item.status === 'success' ? weight : item.progress * weight;
    totals.size += item.size;
    totals.loaded += item.status === 'success' ? item.size : item.loaded;
    if (item.status === 'uploading') totals.speed += item.speed;
  }
  totals.progress = weighted > 0 ? clamp01(weightedLoaded / weighted) : 0;
  totals.active = totals.queued + totals.uploading;
  totals.isUploading = totals.uploading > 0;
  totals.eta = totals.speed > 0 ? Math.max(0, (totals.size - totals.loaded) / totals.speed) : null;
  totals.isComplete =
    totals.success > 0 && totals.pending + totals.queued + totals.uploading + totals.paused === 0;
  return totals;
}

function normalizeIds(ids: Ids, all: readonly string[]): string[] {
  if (ids === undefined) return [...all];
  return typeof ids === 'string' ? [ids] : [...ids];
}

export function createUploadStore<TResponse = unknown>(
  initialOptions: UploaderOptions<TResponse> = {},
): UploadStore<TResponse> {
  type Item = UploadItem<TResponse>;
  type Events = UploadEventMap<TResponse>;

  let options = initialOptions;
  const items = new Map<string, Item>();
  let order: string[] = [];
  const runtimes = new Map<string, Runtime>();
  let rejections: FileRejection[] = [];
  let snapshot: UploadSnapshot<TResponse> | null = null;
  const listeners = new Set<() => void>();
  const eventHandlers = new Map<keyof Events, Set<(payload: never) => void>>();
  let cancelScheduled: (() => void) | null = null;
  let completeArmed = false;

  // ---------------------------------------------------------------- plumbing

  function notify() {
    if (cancelScheduled) {
      cancelScheduled();
      cancelScheduled = null;
    }
    for (const listener of [...listeners]) listener();
  }

  /** `sync` for state transitions, batched for progress ticks. */
  function commit(sync: boolean) {
    snapshot = null;
    if (sync) {
      notify();
    } else if (!cancelScheduled) {
      cancelScheduled = scheduleFrame(() => {
        cancelScheduled = null;
        notify();
      });
    }
    if (options.onChange) options.onChange(order.map((id) => items.get(id)!));
  }

  function emit<K extends keyof Events>(event: K, payload: Events[K]) {
    const handlers = eventHandlers.get(event);
    if (handlers) for (const handler of [...handlers]) (handler as (p: Events[K]) => void)(payload);
  }

  function patch(id: string, changes: Partial<Mutable<Item>>): Item | undefined {
    const current = items.get(id);
    if (!current) return undefined;
    const next = { ...current, ...changes } as Item;
    items.set(id, next);
    return next;
  }

  function runtime(id: string): Runtime {
    let rt = runtimes.get(id);
    if (!rt) {
      rt = { controller: null, reason: null, lastTime: 0, lastLoaded: 0, autoRetries: 0, retryTimer: null };
      runtimes.set(id, rt);
    }
    return rt;
  }

  function clearRetryTimer(id: string) {
    const rt = runtimes.get(id);
    if (rt?.retryTimer) {
      clearTimeout(rt.retryTimer);
      rt.retryTimer = null;
    }
  }

  function retryConfig() {
    const retry = options.retry;
    if (typeof retry === 'number') return { attempts: retry, delay: 800 };
    return { attempts: retry?.attempts ?? 0, delay: retry?.delay ?? 800 };
  }

  // ------------------------------------------------------------ scheduling

  function pump() {
    const handler = options.upload;
    if (!handler) return;
    const limit = Math.max(1, Math.floor(options.concurrency ?? 3));
    let active = 0;
    for (const id of order) if (items.get(id)?.status === 'uploading') active += 1;
    const t = now();
    for (const id of order) {
      if (active >= limit) break;
      const item = items.get(id);
      if (item?.status === 'queued' && (item.retryAt === null || item.retryAt <= t)) {
        run(id);
        active += 1;
      }
    }
  }

  function checkComplete() {
    if (!completeArmed) return;
    const list = order.map((id) => items.get(id)!);
    if (list.some((item) => item.status === 'queued' || item.status === 'uploading')) return;
    completeArmed = false;
    const settled = list.filter((item) => item.startedAt !== null);
    emit('complete', settled);
    options.onQueueComplete?.(settled);
  }

  function run(id: string) {
    const handler = options.upload;
    const initial = items.get(id);
    if (!handler || !initial) return;
    completeArmed = true;
    const rt = runtime(id);
    const controller = new AbortController();
    rt.controller = controller;
    rt.reason = null;
    rt.lastTime = now();
    rt.lastLoaded = 0;

    const started = patch(id, {
      status: 'uploading',
      progress: 0,
      loaded: 0,
      speed: 0,
      eta: null,
      attempts: initial.attempts + 1,
      error: null,
      startedAt: now(),
      completedAt: null,
      retryAt: null,
    })!;
    commit(true);
    emit('start', started);
    options.onUploadStart?.(started);

    let settled = false;

    const onProgress = (loaded: number, total?: number) => {
      if (settled || controller.signal.aborted) return;
      const current = items.get(id);
      if (!current || current.status !== 'uploading') return;
      const denominator = total && total > 0 ? total : Math.max(current.size, 1);
      // Never move backwards within an attempt (multipart overhead can jitter totals).
      const fraction = Math.max(current.progress, clamp01(loaded / denominator));
      const fileLoaded = Math.round(fraction * current.size);
      const t = now();
      let speed = current.speed;
      const dt = t - rt.lastTime;
      if (dt >= 250) {
        const instant = ((fileLoaded - rt.lastLoaded) / dt) * 1000;
        speed = speed > 0 ? speed * 0.6 + instant * 0.4 : instant;
        rt.lastTime = t;
        rt.lastLoaded = fileLoaded;
      }
      const eta = speed > 0 ? Math.max(0, (current.size - fileLoaded) / speed) : null;
      const next = patch(id, { progress: fraction, loaded: fileLoaded, speed, eta })!;
      commit(false);
      options.onUploadProgress?.(next);
    };

    const finish = (outcome: { ok: true; response: TResponse } | { ok: false; error: unknown }) => {
      if (settled) return;
      settled = true;
      rt.controller = null;
      const reason = rt.reason;
      rt.reason = null;
      const current = items.get(id);
      if (!current) {
        pump();
        checkComplete();
        return;
      }
      if (reason === 'pause') {
        patch(id, { status: 'paused', speed: 0, eta: null });
      } else if (reason === 'cancel' || reason === 'dispose') {
        const canceled = patch(id, { status: 'canceled', speed: 0, eta: null })!;
        emit('cancel', canceled);
        options.onUploadCancel?.(canceled);
      } else if (outcome.ok) {
        const done = patch(id, {
          status: 'success',
          progress: 1,
          loaded: current.size,
          speed: 0,
          eta: 0,
          response: outcome.response,
          completedAt: now(),
        })!;
        rt.autoRetries = 0;
        emit('success', done);
        options.onUploadSuccess?.(done, outcome.response);
      } else {
        const error = toUploadError(outcome.error);
        const retry = retryConfig();
        if (error.code === 'aborted') {
          const canceled = patch(id, { status: 'canceled', speed: 0, eta: null, error: null })!;
          emit('cancel', canceled);
          options.onUploadCancel?.(canceled);
        } else if (error.retryable && rt.autoRetries < retry.attempts) {
          rt.autoRetries += 1;
          const delay = retry.delay * 2 ** (rt.autoRetries - 1);
          patch(id, { status: 'queued', error, speed: 0, eta: null, retryAt: now() + delay });
          rt.retryTimer = setTimeout(() => {
            rt.retryTimer = null;
            if (items.get(id)?.status === 'queued') {
              patch(id, { retryAt: null });
              pump();
              commit(true);
            }
          }, delay);
        } else {
          const failed = patch(id, { status: 'error', error: error as UploadError, speed: 0, eta: null })!;
          emit('error', failed);
          options.onUploadError?.(failed, error);
        }
      }
      commit(true);
      pump();
      checkComplete();
    };

    const context: UploadContext<TResponse> = {
      file: started.file,
      item: started,
      signal: controller.signal,
      attempt: started.attempts,
      onProgress,
    };
    Promise.resolve()
      .then(() => handler(context))
      .then(
        (response) => finish({ ok: true, response }),
        (error: unknown) => finish({ ok: false, error }),
      );
  }

  function abortItem(id: string, reason: AbortReason): boolean {
    const rt = runtimes.get(id);
    if (rt?.controller) {
      rt.reason = reason;
      rt.controller.abort(reason);
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------- public API

  const store: UploadStore<TResponse> = {
    getSnapshot() {
      if (!snapshot) {
        const list = order.map((id) => items.get(id)!);
        const handler = options.upload;
        snapshot = {
          items: list,
          rejections,
          totals: computeTotals(list),
          transport: handler ? (handler.simulated ? 'simulated' : 'network') : 'none',
        };
      }
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    on(event, handler) {
      let set = eventHandlers.get(event);
      if (!set) {
        set = new Set();
        eventHandlers.set(event, set);
      }
      set.add(handler as (payload: never) => void);
      return () => set.delete(handler as (payload: never) => void);
    },

    setOptions(next) {
      const transportChanged = Boolean(next.upload) !== Boolean(options.upload) || next.upload?.simulated !== options.upload?.simulated;
      options = next;
      if (transportChanged) commit(true);
      pump();
    },

    getOptions() {
      return options;
    },

    getInitialOptions() {
      return initialOptions;
    },

    addFiles(input) {
      const files = Array.from(input as ArrayLike<File>);
      const accept = parseAccept(options.accept);
      const single = options.multiple === false;
      const maxFiles = single ? 1 : (options.maxFiles ?? Infinity);
      const currentList = order.map((id) => items.get(id)!);
      let slots = single ? 1 : maxFiles - currentList.length;
      const acceptedFiles: File[] = [];
      const rejected: FileRejection[] = [];

      files.forEach((file, index) => {
        const errors: RejectionReason[] = validateFile(
          file,
          { accept, maxSize: options.maxSize, minSize: options.minSize, validate: options.validate },
          currentList,
        );
        if (errors.length === 0 && (slots <= 0 || (single && index > 0))) {
          errors.push({
            code: 'too-many-files',
            message: single
              ? `Only one file can be uploaded – ${file.name} was skipped.`
              : `You can add up to ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'} – ${file.name} was skipped.`,
          });
        }
        if (errors.length > 0) {
          rejected.push({ id: createId('rej'), file, errors, at: now() });
        } else {
          acceptedFiles.push(file);
          slots -= 1;
        }
      });

      if (single && acceptedFiles.length > 0 && order.length > 0) {
        store.remove([...order]);
      }

      const autoStart = Boolean(options.upload) && options.autoUpload !== false;
      const accepted = acceptedFiles.map((file) => {
        const item: Item = {
          id: createId('file'),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          extension: getExtension(file.name),
          kind: getFileKind(file),
          status: autoStart ? 'queued' : 'pending',
          progress: 0,
          loaded: 0,
          speed: 0,
          eta: null,
          attempts: 0,
          error: null,
          response: undefined,
          addedAt: now(),
          startedAt: null,
          completedAt: null,
          retryAt: null,
        };
        items.set(item.id, item);
        order.push(item.id);
        return item;
      });

      if (rejected.length > 0) rejections = [...rejections, ...rejected].slice(-20);
      if (accepted.length > 0 || rejected.length > 0) commit(true);
      if (accepted.length > 0) {
        emit('added', accepted);
        options.onFilesAdded?.(accepted);
      }
      if (rejected.length > 0) {
        emit('rejected', rejected);
        options.onFilesRejected?.(rejected);
      }
      pump();
      return { accepted, rejected };
    },

    start(ids) {
      let changed = false;
      for (const id of normalizeIds(ids, order)) {
        if (items.get(id)?.status === 'pending' && options.upload) {
          patch(id, { status: 'queued' });
          changed = true;
        }
      }
      if (changed) commit(true);
      pump();
    },

    cancel(ids) {
      let changed = false;
      for (const id of normalizeIds(ids, order)) {
        const item = items.get(id);
        if (!item) continue;
        clearRetryTimer(id);
        if (item.status === 'uploading') {
          abortItem(id, 'cancel');
        } else if (item.status === 'queued' || item.status === 'paused' || item.status === 'pending') {
          const canceled = patch(id, { status: 'canceled', speed: 0, eta: null, retryAt: null })!;
          emit('cancel', canceled);
          options.onUploadCancel?.(canceled);
          changed = true;
        }
      }
      if (changed) {
        commit(true);
        checkComplete();
      }
    },

    retry(ids) {
      let changed = false;
      for (const id of normalizeIds(ids, order)) {
        const item = items.get(id);
        if (!item || (item.status !== 'error' && item.status !== 'canceled')) continue;
        clearRetryTimer(id);
        runtime(id).autoRetries = 0;
        patch(id, {
          status: options.upload ? 'queued' : 'pending',
          error: null,
          progress: 0,
          loaded: 0,
          speed: 0,
          eta: null,
          retryAt: null,
        });
        changed = true;
      }
      if (changed) commit(true);
      pump();
    },

    pause(ids) {
      let changed = false;
      for (const id of normalizeIds(ids, order)) {
        const item = items.get(id);
        if (!item) continue;
        if (item.status === 'uploading') {
          abortItem(id, 'pause');
        } else if (item.status === 'queued') {
          clearRetryTimer(id);
          patch(id, { status: 'paused', retryAt: null });
          changed = true;
        }
      }
      if (changed) commit(true);
    },

    resume(ids) {
      let changed = false;
      for (const id of normalizeIds(ids, order)) {
        if (items.get(id)?.status === 'paused') {
          patch(id, { status: options.upload ? 'queued' : 'pending' });
          changed = true;
        }
      }
      if (changed) commit(true);
      pump();
    },

    remove(ids) {
      const list = typeof ids === 'string' ? [ids] : ids;
      const removed: Item[] = [];
      for (const id of list) {
        const item = items.get(id);
        if (!item) continue;
        clearRetryTimer(id);
        abortItem(id, 'remove');
        items.delete(id);
        runtimes.delete(id);
        removed.push(item);
      }
      if (removed.length === 0) return;
      const removedIds = new Set(removed.map((item) => item.id));
      order = order.filter((id) => !removedIds.has(id));
      commit(true);
      for (const item of removed) {
        emit('removed', item);
        options.onFileRemoved?.(item);
      }
      pump();
      checkComplete();
    },

    clear(filter = 'all') {
      const match: Record<ClearFilter, (item: Item) => boolean> = {
        all: () => true,
        completed: (item) => item.status === 'success',
        failed: (item) => item.status === 'error',
        canceled: (item) => item.status === 'canceled',
      };
      const ids = order.filter((id) => match[filter](items.get(id)!));
      if (filter === 'all') rejections = [];
      if (ids.length > 0) store.remove(ids);
      else if (filter === 'all') commit(true);
    },

    dismissRejection(id) {
      const next = id === undefined ? [] : rejections.filter((rejection) => rejection.id !== id);
      if (next.length !== rejections.length) {
        rejections = next;
        commit(true);
      }
    },

    getItem(id) {
      return items.get(id);
    },

    dispose() {
      for (const id of order) {
        clearRetryTimer(id);
        abortItem(id, 'dispose');
      }
      if (cancelScheduled) {
        cancelScheduled();
        cancelScheduled = null;
      }
    },
  };

  return store;
}
