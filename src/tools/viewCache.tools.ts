/**
 * In-memory cache for stale-while-revalidate views: a revisited folder or object
 * renders the last copy at once while a fresh fetch runs, instead of flashing
 * skeletons on every navigation.
 *
 * Per tab, gone on reload, and sign-out is a full navigation, so nothing
 * outlives the session that loaded it. Keys must include the session id — two
 * sessions can point at same-named buckets on different instances.
 */
const MAX_ENTRIES = 100;

export class ViewCache<T> {
  private entries = new Map<string, T>();

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
  }

  delete(key: string) {
    this.entries.delete(key);
  }
}
