import { useEffect, useMemo, useState } from 'react';
import { isPreviewableImage } from '../core/file-kind';
import type { UploadItem } from '../core/types';
import { seededRandom } from './utils';

const DEFAULT_PREVIEW_LIMIT = 25_000_000;

/**
 * Object URL for an image preview, revoked automatically on unmount or when the
 * file changes. Returns `null` for non-images and files above `maxSize` (large
 * images are expensive to decode, so they get an icon instead).
 */
export function useFilePreview(item: Pick<UploadItem, 'file'> | null, maxSize = DEFAULT_PREVIEW_LIMIT): string | null {
  const file = item?.file ?? null;
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || file.size > maxSize || !isPreviewableImage(file) || typeof URL.createObjectURL !== 'function') {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, maxSize]);
  return url;
}

/**
 * Extracts `count` evenly spaced frames from a local video as small JPEG data
 * URLs. Everything happens in the browser; unsupported codecs yield `[]`.
 */
export function useVideoFrames(file: File | null, count: number, enabled = true): string[] {
  const [frames, setFrames] = useState<string[]>([]);
  useEffect(() => {
    setFrames([]);
    if (!enabled || !file || typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
    if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|ogv)$/i.test(file.name)) return;
    let cancelled = false;
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    const once = (event: string, timeout = 6000) =>
      new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), timeout);
        const done = () => {
          clearTimeout(timer);
          video.removeEventListener('error', fail);
          resolve();
        };
        const fail = () => {
          clearTimeout(timer);
          video.removeEventListener(event, done);
          reject(new Error('video error'));
        };
        video.addEventListener(event, done, { once: true });
        video.addEventListener('error', fail, { once: true });
      });

    const run = async () => {
      await once('loadeddata');
      let duration = video.duration;
      if (!Number.isFinite(duration)) {
        // MediaRecorder WebM files report Infinity until seeked to the end.
        video.currentTime = 1e7;
        await once('seeked').catch(() => undefined);
        duration = Number.isFinite(video.duration) ? video.duration : 0;
      }
      const width = 160;
      const height = video.videoWidth ? Math.round((width * video.videoHeight) / video.videoWidth) : 90;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      const result: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const time = duration > 0 ? Math.min(duration - 0.05, (duration * (index + 0.5)) / count) : 0;
        video.currentTime = Math.max(0, time);
        await once('seeked');
        if (cancelled) return;
        context.drawImage(video, 0, 0, width, height);
        result.push(canvas.toDataURL('image/jpeg', 0.72));
        setFrames([...result]);
      }
    };

    let released = false;
    // Detach the element before revoking, otherwise an in-flight load logs ERR_FILE_NOT_FOUND.
    const release = () => {
      if (released) return;
      released = true;
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
    };
    run()
      .catch(() => undefined)
      .finally(release);
    return () => {
      cancelled = true;
      release();
    };
  }, [file, count, enabled]);
  return frames;
}

/** Deterministic pseudo waveform (used until/unless real audio decoding succeeds). */
export function pseudoPeaks(seed: string, bars: number): number[] {
  const random = seededRandom(seed);
  const peaks: number[] = [];
  let value = 0.5;
  for (let i = 0; i < bars; i += 1) {
    value = value * 0.55 + random() * 0.45;
    const envelope = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI);
    peaks.push(Math.max(0.12, Math.min(1, value * envelope * 1.35)));
  }
  return peaks;
}

const AUDIO_DECODE_LIMIT = 30_000_000;

/**
 * Real waveform peaks decoded with the Web Audio API for audio files up to
 * 30 MB; a stable pseudo waveform otherwise. `real` tells you which you got.
 */
export function useAudioPeaks(file: File | null, bars: number, enabled = true): { peaks: number[]; real: boolean } {
  const fallback = useMemo(() => pseudoPeaks(file ? `${file.name}:${file.size}` : 'empty', bars), [file, bars]);
  const [decoded, setDecoded] = useState<{ file: File; peaks: number[] } | null>(null);

  useEffect(() => {
    if (!enabled || !file || file.size > AUDIO_DECODE_LIMIT) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(file.name)) return;
    const AudioContextClass =
      typeof window !== 'undefined'
        ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!AudioContextClass) return;
    let cancelled = false;
    const context = new AudioContextClass();
    file
      .arrayBuffer()
      .then((buffer) => context.decodeAudioData(buffer))
      .then((audio) => {
        if (cancelled) return;
        const data = audio.getChannelData(0);
        const bucket = Math.max(1, Math.floor(data.length / bars));
        const peaks: number[] = [];
        let max = 0;
        for (let bar = 0; bar < bars; bar += 1) {
          let peak = 0;
          const start = bar * bucket;
          // Sample every 16th value: plenty for a 48-bar overview, ~16x faster.
          for (let i = start; i < Math.min(start + bucket, data.length); i += 16) {
            const value = Math.abs(data[i]!);
            if (value > peak) peak = value;
          }
          peaks.push(peak);
          if (peak > max) max = peak;
        }
        setDecoded({ file, peaks: peaks.map((peak) => Math.max(0.08, max > 0 ? peak / max : 0)) });
      })
      .catch(() => undefined)
      .finally(() => {
        void context.close().catch(() => undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [file, bars, enabled]);

  return decoded && decoded.file === file && decoded.peaks.length === bars
    ? { peaks: decoded.peaks, real: true }
    : { peaks: fallback, real: false };
}

const TEXT_KINDS = new Set(['text', 'code', 'data', 'spreadsheet']);

/** First lines of small text-like files, for document previews. `null` when not applicable. */
export function useTextSnippet(item: Pick<UploadItem, 'file' | 'kind' | 'size'> | null, lines = 8): string[] | null {
  const file = item?.file ?? null;
  const readable = Boolean(item && TEXT_KINDS.has(item.kind) && item.size < 2_000_000 && !/\.xlsx?$/i.test(item.file.name));
  const [snippet, setSnippet] = useState<string[] | null>(null);
  useEffect(() => {
    setSnippet(null);
    if (!file || !readable || typeof file.slice !== 'function') return;
    let cancelled = false;
    file
      .slice(0, 2048)
      .text()
      .then((text) => {
        if (cancelled) return;
        setSnippet(
          text
            .split(/\r?\n/)
            .map((line) => line.replace(/\t/g, '  ').slice(0, 64))
            .filter((line) => line.trim().length > 0)
            .slice(0, lines),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [file, readable, lines]);
  return snippet;
}
