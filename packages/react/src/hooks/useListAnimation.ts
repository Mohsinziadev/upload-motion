import { useEffect, useRef, useState, type RefObject } from 'react';
import { useIsomorphicLayoutEffect } from './utils';

export interface PresenceEntry<T> {
  item: T;
  exiting: boolean;
}

/**
 * Keeps removed items rendered for `exitMs` so they can animate out.
 * Removed items are re-inserted at their previous index.
 */
export function usePresence<T extends { id: string }>(items: readonly T[], exitMs: number): PresenceEntry<T>[] {
  const previous = useRef<readonly T[]>(items);
  const [exiting, setExiting] = useState<ReadonlyMap<string, { item: T; index: number }>>(() => new Map());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useIsomorphicLayoutEffect(() => {
    const before = previous.current;
    previous.current = items;
    if (exitMs <= 0 || before === items) return;
    const ids = new Set(items.map((item) => item.id));
    const removed = before.flatMap((item, index) => (ids.has(item.id) ? [] : [{ item, index }]));
    if (removed.length === 0) return;
    setExiting((map) => {
      const next = new Map(map);
      for (const entry of removed) next.set(entry.item.id, entry);
      return next;
    });
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setExiting((map) => {
        const next = new Map(map);
        for (const entry of removed) next.delete(entry.item.id);
        return next;
      });
    }, exitMs);
    timers.current.add(timer);
  }, [items, exitMs]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
    };
  }, []);

  const result: PresenceEntry<T>[] = items.map((item) => ({ item, exiting: false }));
  if (exiting.size > 0) {
    const sorted = [...exiting.values()].sort((a, b) => a.index - b.index);
    for (const entry of sorted) {
      if (result.some((existing) => existing.item.id === entry.item.id)) continue;
      result.splice(Math.min(entry.index, result.length), 0, { item: entry.item, exiting: true });
    }
  }
  return result;
}

/**
 * FLIP layout animation: when the set/order of `[data-flip-id]` children
 * changes, children animate from their old offset to the new one using WAAPI.
 */
export function useFlip(containerRef: RefObject<HTMLElement | null>, layoutKey: string, enabled: boolean, duration = 420) {
  const positions = useRef(new Map<string, { x: number; y: number }>());

  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const nodes = container.querySelectorAll<HTMLElement>('[data-flip-id]');
    const next = new Map<string, { x: number; y: number }>();
    nodes.forEach((node) => {
      const id = node.dataset.flipId!;
      const position = { x: node.offsetLeft, y: node.offsetTop };
      next.set(id, position);
      const before = positions.current.get(id);
      if (!enabled || !before || typeof node.animate !== 'function') return;
      const dx = before.x - position.x;
      const dy = before.y - position.y;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      node.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        composite: 'add',
      });
    });
    positions.current = next;
  }, [layoutKey, enabled, duration]);
}
