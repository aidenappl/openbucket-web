import { useCallback, useRef, useState } from "react";
import { ObjectHead, S3ObjectMetadata } from "@/types";
import { reqFetchFolders } from "@/services/folder.service";
import {
  reqFetchBulkObjectHead,
  reqFetchObjects,
} from "@/services/object.service";
import { ViewCache } from "@/tools/viewCache.tools";

export type ListedObject = S3ObjectMetadata & {
  /** `undefined` while heads load, `null` if the HEAD failed for this key. */
  head?: ObjectHead | null;
};

type Listing = {
  folders: string[];
  objects: ListedObject[];
  /**
   * Set when the API capped either list (`pagination.truncated`): only the
   * first `limit` folders / objects are here and the UI must say so.
   */
  truncatedAt?: number;
};

const listings = new ViewCache<Listing>();

const keyFor = (sessionId: number | null, prefix: string) =>
  `${sessionId ?? "none"}:${prefix === "/" ? "" : prefix}`;

/**
 * Loads one prefix of the active session: its sub-folders, its objects, then
 * each object's HEAD (for the ACL and content type).
 *
 * Stale-while-revalidate: a prefix seen before renders from the cache straight
 * away and `refreshing` is true while the fresh copy loads; only a first visit
 * shows the skeleton (`folders`/`objects` null). Cached heads are carried over
 * for unchanged objects (same key + ETag) so the Access column doesn't drop
 * back to placeholders mid-refresh.
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

  const loadBucketData = useCallback(async () => {
    if (sessionId === null) return;
    const req = ++requestRef.current;
    const k = keyFor(sessionId, prefix);
    const normalized = prefix === "/" ? "" : prefix;
    const cached = listings.get(k);
    const patch = (next: Partial<typeof state>) =>
      setState((s) => ({
        ...(s.key === k
          ? s
          : { key: k, data: cached ?? null, error: null, refreshing: false }),
        ...next,
      }));

    patch({ refreshing: true, error: null });

    const [foldersRes, objectsRes] = await Promise.all([
      reqFetchFolders(normalized),
      reqFetchObjects(normalized),
    ]);
    if (req !== requestRef.current) return;

    if (!foldersRes.success || !objectsRes.success) {
      const failed = !foldersRes.success
        ? foldersRes
        : !objectsRes.success
          ? objectsRes
          : null;
      const message =
        failed && !failed.success
          ? failed.error_message || failed.error
          : "Failed to load this folder";
      patch({
        refreshing: false,
        error: cached ? `${message} — showing the last loaded copy` : message,
        data: cached ?? { folders: [], objects: [] },
      });
      return;
    }

    const previous = new Map((cached?.objects ?? []).map((o) => [o.Key, o]));
    const list: ListedObject[] = (objectsRes.data ?? []).map((o) => {
      const prev = previous.get(o.Key);
      return prev && prev.ETag === o.ETag && prev.head !== undefined
        ? { ...o, head: prev.head }
        : o;
    });
    const capped = [foldersRes, objectsRes].find(
      (r) => r.success && r.pagination?.truncated,
    );
    const fresh: Listing = {
      folders: foldersRes.data ?? [],
      objects: list,
      truncatedAt:
        capped && capped.success ? capped.pagination?.limit : undefined,
    };
    listings.set(k, fresh);
    patch({ data: fresh, refreshing: list.length > 0 });
    if (list.length === 0) return;

    const heads = await reqFetchBulkObjectHead(list.map((o) => o.Key));
    if (req !== requestRef.current) return;
    // Matched by index: the API returns heads in request order. On a failed
    // bulk call, keep any carried-over heads rather than blanking them.
    const withHeads: Listing = {
      ...fresh,
      folders: fresh.folders,
      objects: list.map((o, i) => ({
        ...o,
        head: heads.success ? (heads.data[i] ?? null) : (o.head ?? null),
      })),
    };
    listings.set(k, withHeads);
    patch({ data: withHeads, refreshing: false });
  }, [sessionId, prefix]);

  return {
    folders: current.data?.folders ?? null,
    objects: current.data?.objects ?? null,
    error: current.error,
    refreshing: current.refreshing,
    truncatedAt: current.data?.truncatedAt,
    loadBucketData,
  };
};
