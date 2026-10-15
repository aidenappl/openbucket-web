import { useCallback, useRef, useState } from "react";
import {
  ApiResponse,
  FolderContents,
  ObjectHead,
  S3ObjectMetadata,
} from "@/types";
import { reqListContents } from "@/services/folder.service";
import { reqFetchBulkObjectHead } from "@/services/object.service";
import { ViewCache } from "@/tools/viewCache.tools";

export type ListedObject = S3ObjectMetadata & {
  /** `undefined` while heads load, `null` if the HEAD failed for this key. */
  head?: ObjectHead | null;
};

type Listing = {
  folders: string[];
  objects: ListedObject[];
  /**
   * Set when the API capped the listing (`pagination.truncated`): only the
   * first `limit` entries are here and the UI must say so.
   */
  truncatedAt?: number;
  /** Continues a truncated listing (GET /contents?cursor=); see loadMore. */
  nextCursor?: string;
  /** When the listing arrived (ms epoch). Heads may be newer. */
  fetchedAt?: number;
};

// Persisted: a reload or a new tab paints the last-known folder immediately.
// v2: v1 copies could hold repeated keys (see newestPerKey); they're dropped.
const listings = new ViewCache<Listing>({ persistKey: "listings-v2" });
if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem("ob-view-cache:listings");
  } catch {
    // Storage unavailable: nothing to drop.
  }
}

/** A listing this young is shown as-is on arrival, not fetched again. */
const FRESH_MS = 10_000;

const keyFor = (sessionId: number | null, prefix: string) =>
  `${sessionId ?? "none"}:${prefix === "/" ? "" : prefix}`;

const normalize = (prefix: string) => (prefix === "/" ? "" : prefix);

// One request per folder at a time, shared by navigation and hover prefetch.
const inflight = new Map<string, Promise<ApiResponse<FolderContents>>>();

const listContents = (sessionId: number, prefix: string) => {
  const k = keyFor(sessionId, prefix);
  let p = inflight.get(k);
  if (!p) {
    p = reqListContents(sessionId, normalize(prefix)).finally(() =>
      inflight.delete(k),
    );
    inflight.set(k, p);
  }
  return p;
};

/**
 * One object per key — the most recently modified.
 *
 * ⚠️ openbucket-go stored a new metadata row on every overwrite (no unique
 * key), so listings can repeat a key (atlas hotels/250/ listed 15 files as
 * 40 rows). Repeated React keys left orphaned rows on screen across folder
 * navigation — dead checkboxes and empty menus. Keep this even once storage
 * is fixed: rows are keyed by object key.
 */
export const newestPerKey = (objects: S3ObjectMetadata[]) => {
  const byKey = new Map<string, S3ObjectMetadata>();
  for (const o of objects) {
    const seen = byKey.get(o.Key);
    if (!seen || o.LastModified > seen.LastModified) byKey.set(o.Key, o);
  }
  return byKey.size === objects.length ? objects : [...byKey.values()];
};

/**
 * A fresh listing from `res`, carrying cached heads over for unchanged objects
 * (same key + ETag) so the Access column doesn't drop back to placeholders.
 */
const toListing = (
  res: ApiResponse<FolderContents> & { success: true },
  cached: Listing | undefined,
): Listing => {
  const previous = new Map((cached?.objects ?? []).map((o) => [o.Key, o]));
  return {
    folders: [...new Set(res.data?.folders ?? [])],
    objects: newestPerKey(res.data?.objects ?? []).map((o) => {
      const prev = previous.get(o.Key);
      return prev && prev.ETag === o.ETag && prev.head !== undefined
        ? { ...o, head: prev.head }
        : o;
    }),
    truncatedAt: res.pagination?.truncated ? res.pagination.limit : undefined,
    nextCursor: res.pagination?.next_cursor || undefined,
    fetchedAt: Date.now(),
  };
};

/** `listing` plus the next page in `res` (folders/objects de-duplicated). */
export const appendPage = (
  listing: Listing,
  res: ApiResponse<FolderContents> & { success: true },
): Listing => {
  const folders = [
    ...new Set([...listing.folders, ...(res.data?.folders ?? [])]),
  ];
  const known = new Set(listing.objects.map((o) => o.Key));
  const added = newestPerKey(res.data?.objects ?? []).filter(
    (o) => !known.has(o.Key),
  );
  const nextCursor = res.pagination?.next_cursor || undefined;
  return {
    ...listing,
    folders,
    objects: [...listing.objects, ...added],
    nextCursor,
    truncatedAt: nextCursor
      ? folders.length + listing.objects.length + added.length
      : undefined,
  };
};

/**
 * Warms the cache for a folder the user is about to open (hover/focus on its
 * link), so the click renders at once. Skips folders already fresh or in
 * flight; heads are left to the real visit.
 */
export const prefetchListing = (sessionId: number | null, prefix: string) => {
  if (sessionId === null) return;
  const k = keyFor(sessionId, prefix);
  const cached = listings.get(k);
  if (
    inflight.has(k) ||
    (cached?.fetchedAt && Date.now() - cached.fetchedAt < FRESH_MS)
  )
    return;
  listContents(sessionId, prefix).then((res) => {
    if (res.success) listings.set(k, toListing(res, listings.get(k)));
  });
};

/**
 * Loads one prefix of the active session: its sub-folders and objects (one
 * GET /contents), then each object's HEAD (for the ACL and content type).
 *
 * Stale-while-revalidate: a prefix seen before — this tab, a hover prefetch,
 * or a previous visit (the cache is persisted) — renders from the cache
 * straight away and `refreshing` is true while the fresh copy loads; only a
 * first visit shows the skeleton (`folders`/`objects` null).
 *
 * `loadBucketData({ maxAge })` (navigation) reuses a listing younger than
 * maxAge instead of refetching it; `loadBucketData()` (after a change)
 * always refetches.
 *
 * ⚠️ What's shown is resolved DURING RENDER from (session, prefix): this hook's
 * state if it belongs to that key, else the cache, else nothing. Holding the
 * data only in state meant the first render after a navigation paired the new
 * folder's title with the previous folder's rows until an effect caught up.
 *
 * Also:
 *  - A failed listing is reported through `error`, never shown as an empty
 *    folder. With a cached copy on screen, that copy stays.
 *  - Responses are tied to the request that asked for them; clicking through
 *    folders quickly can't paint the previous folder's contents last.
 */
export const useBucketData = (sessionId: number | null, prefix: string) => {
  const key = keyFor(sessionId, prefix);
  const [state, setState] = useState<{
    key: string;
    data: Listing | null;
    error: string | null;
    refreshing: boolean;
  }>({ key: "", data: null, error: null, refreshing: false });
  const requestRef = useRef(0);

  const current =
    state.key === key
      ? state
      : {
          key,
          data: listings.get(key) ?? null,
          error: null,
          refreshing: false,
        };

  const loadBucketData = useCallback(
    async (opts: { maxAge?: number } = {}) => {
      if (sessionId === null) return;
      const req = ++requestRef.current;
      const k = keyFor(sessionId, prefix);
      const cached = listings.get(k);
      const patch = (next: Partial<typeof state>) =>
        setState((s) => ({
          ...(s.key === k
            ? s
            : { key: k, data: cached ?? null, error: null, refreshing: false }),
          ...next,
        }));

      let listing: Listing;
      const age = cached?.fetchedAt ? Date.now() - cached.fetchedAt : Infinity;
      if (cached && opts.maxAge !== undefined && age < opts.maxAge) {
        listing = cached;
        patch({ data: cached, error: null });
      } else {
        patch({ refreshing: true, error: null });
        const res = await listContents(sessionId, prefix);
        if (req !== requestRef.current) return;
        if (!res.success) {
          const message =
            res.error_message || res.error || "Failed to load this folder";
          patch({
            refreshing: false,
            error: cached
              ? `${message} — showing the last loaded copy`
              : message,
            data: cached ?? { folders: [], objects: [] },
          });
          return;
        }
        listing = toListing(res, listings.get(k));
        listings.set(k, listing);
      }

      const needHeads = listing.objects.some((o) => o.head === undefined);
      patch({ data: listing, refreshing: needHeads });
      if (!needHeads) return;

      const heads = await reqFetchBulkObjectHead(
        listing.objects.map((o) => o.Key),
      );
      if (req !== requestRef.current) return;
      // Matched by index: the API returns heads in request order. On a failed
      // bulk call, keep any carried-over heads rather than blanking them.
      const withHeads: Listing = {
        ...listing,
        objects: listing.objects.map((o, i) => ({
          ...o,
          head: heads.success ? (heads.data[i] ?? null) : (o.head ?? null),
        })),
      };
      listings.set(k, withHeads);
      patch({ data: withHeads, refreshing: false });
    },
    [sessionId, prefix],
  );

  const [loadingMore, setLoadingMore] = useState(false);

  /**
   * Appends the next 10,000 entries of a capped folder (GET /contents with
   * the listing's cursor), then their heads. A refresh (loadBucketData)
   * starts again from the first page.
   */
  const loadMore = useCallback(async () => {
    if (sessionId === null) return;
    const k = keyFor(sessionId, prefix);
    const base = listings.get(k);
    if (!base?.nextCursor || loadingMore) return;
    const req = requestRef.current;
    setLoadingMore(true);
    const res = await reqListContents(
      sessionId,
      normalize(prefix),
      base.nextCursor,
    );
    setLoadingMore(false);
    if (req !== requestRef.current) return;
    if (!res.success) {
      setState((s) => ({
        ...s,
        key: k,
        error: res.error_message || res.error || "Couldn't load more",
      }));
      return;
    }
    const merged = appendPage(base, res);
    listings.set(k, merged);
    setState((s) => ({ ...s, key: k, data: merged, error: null }));

    const fresh = merged.objects.slice(base.objects.length);
    if (fresh.length === 0) return;
    const heads = await reqFetchBulkObjectHead(fresh.map((o) => o.Key));
    if (req !== requestRef.current || !heads.success) return;
    const offset = base.objects.length;
    const withHeads: Listing = {
      ...merged,
      objects: merged.objects.map((o, i) =>
        i < offset ? o : { ...o, head: heads.data[i - offset] ?? null },
      ),
    };
    listings.set(k, withHeads);
    setState((s) => (s.key === k ? { ...s, data: withHeads } : s));
  }, [sessionId, prefix, loadingMore]);

  return {
    folders: current.data?.folders ?? null,
    objects: current.data?.objects ?? null,
    error: current.error,
    refreshing: current.refreshing,
    truncatedAt: current.data?.truncatedAt,
    canLoadMore: Boolean(current.data?.nextCursor),
    loadingMore,
    loadMore,
    loadBucketData,
  };
};

export { FRESH_MS };
