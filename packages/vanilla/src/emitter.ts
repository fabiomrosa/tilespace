/** Listeners by event name: `on` returns the function that unsubscribes. */
export type Emitter<Events> = {
  on<E extends keyof Events>(event: E, listener: (detail: Events[E]) => void): () => void;
  emit<E extends keyof Events>(event: E, detail: Events[E]): void;
  clear(): void;
};

export function createEmitter<Events>(): Emitter<Events> {
  const listeners = new Map<keyof Events, Set<(detail: unknown) => void>>();
  return {
    on(event, listener) {
      const set = listeners.get(event) ?? new Set();
      listeners.set(event, set);
      const stored = listener as (detail: unknown) => void;
      set.add(stored);
      return () => set.delete(stored);
    },
    emit(event, detail) {
      const set = listeners.get(event);
      // A copy, so a listener added now waits for the next emit; one removed now is skipped.
      for (const listener of [...(set ?? [])]) if (set?.has(listener)) listener(detail);
    },
    clear() {
      for (const set of listeners.values()) set.clear();
    },
  };
}
