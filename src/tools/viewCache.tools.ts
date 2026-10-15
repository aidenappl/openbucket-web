/**
 * Cache for stale-while-revalidate views: a revisited folder or object renders
 * the last copy at once while a fresh fetch runs, instead of flashing
 * skeletons on every navigation.
 *
 * In memory by default. With `persistKey` the newest entries are also kept in
 * localStorage, so a reload or a new tab paints the last-known copy straight
 * away (then revalidates). `clearPersistedViews()` wipes every persisted cache;
 * sign-out and a failed auth check call it, so nothing outlives the user who
 * loaded it. Keys must include the session id — two sessions can point at
 * same-named buckets on different instances.
 */
const MAX_ENTRIES = 100;

/** localStorage keys of persisted caches start with this. */
const PERSIST_PREFIX = "ob-view-cache:";

/** Persisted entries stop being added past this many characters (~2 MB). */
const MAX_PERSISTED_CHARS = 2_000_000;

type Options = {
  /** Persist to localStorage under this name. */
  persistKey?: string;
  /** Newest entries to persist (default 30). */
  persistEntries?: number;
};

export class ViewCache<T> {
  private entries = new Map<string, T>();
  private storageKey: string | null;
  private persistEntries: number;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: Options = {}) {
    this.storageKey = options.persistKey
      ? PERSIST_PREFIX + options.persistKey
      : null;
    this.persistEntries = options.persistEntries ?? 30;
    this.restore();
  }

  get(key: string): T | undefined {
    const value = this.entries.get(key);
    if (value !== undefined) {
      // Re-insert so the Map's insertion order doubles as recency.
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }

  set(key: string, value: T) {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.scheduleSave();
  }

  delete(key: string) {
    this.entries.delete(key);
    this.scheduleSave();
  }

  private restore() {
    if (!this.storageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as [string, T][];
      for (const [k, v] of saved) this.entries.set(k, v);
    } catch {
      // Corrupt or unreadable: start empty.
    }
  }

  // Debounced: a folder load sets twice (listing, then heads), and
  // serialising a large folder on every set would block the main thread.
  private scheduleSave() {
    if (!this.storageKey || typeof window === "undefined") return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 500);
  }

  private save() {
    this.saveTimer = null;
    if (!this.storageKey) return;
    // Newest first, until the entry count or the size budget runs out.
    const newest = [...this.entries].reverse().slice(0, this.persistEntries);
    const kept: string[] = [];
    let size = 2;
    for (const entry of newest) {
      const json = JSON.stringify(entry);
      if (size + json.length + 1 > MAX_PERSISTED_CHARS) continue;
      kept.push(json);
      size += json.length + 1;
    }
    try {
      // Stored oldest first so restore() rebuilds the same recency order.
      window.localStorage.setItem(
        this.storageKey,
        `[${kept.reverse().join(",")}]`,
      );
    } catch {
      // Quota or private mode: the in-memory cache still works.
    }
  }
}

/** Removes every persisted view cache (sign-out, failed auth). */
export const clearPersistedViews = () => {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(PERSIST_PREFIX)) window.localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing was persisted.
  }
};
