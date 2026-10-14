import { useCallback, useRef, useState } from "react";
import { ObjectHead, S3ObjectMetadata } from "@/types";
import { reqFetchFolders } from "@/services/folder.service";
import {
  reqFetchBulkObjectHead,
  reqFetchObjects,
} from "@/services/object.service";

export type ListedObject = S3ObjectMetadata & {
  /** `undefined` while heads load, `null` if the HEAD failed for this key. */
  head?: ObjectHead | null;
};

/**
 * Loads one prefix: its sub-folders, its objects, then each object's HEAD (for
 * the ACL and content type).
 *
 * Two things the old hook got wrong, both fixed here:
 *  - A failed listing was turned into an empty list, so an expired session or a
 *    revoked key looked exactly like an empty folder. `error` now carries it.
 *  - Responses weren't tied to the request that asked for them; clicking through
 *    folders quickly could paint the previous folder's contents last.
 */
export const useBucketData = () => {
  const [folders, setFolders] = useState<string[] | null>(null);
  const [objects, setObjects] = useState<ListedObject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const loadBucketData = useCallback(
    async (prefix: string, opts?: { quiet?: boolean }) => {
      const req = ++requestRef.current;
      if (!opts?.quiet) {
        setFolders(null);
        setObjects(null);
      }
      setError(null);

      const normalized = prefix === "/" ? "" : prefix;
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
        setError(
          failed && !failed.success
            ? failed.error_message || failed.error
            : "Failed to load this folder",
        );
        setFolders([]);
        setObjects([]);
        return;
      }

      const list = objectsRes.data ?? [];
      setFolders(foldersRes.data ?? []);
      setObjects(list);

      if (list.length === 0) return;
      const heads = await reqFetchBulkObjectHead(list.map((o) => o.Key));
      if (req !== requestRef.current) return;
      // Matched by index: the API returns heads in request order.
      setObjects(
        list.map((o, i) => ({
          ...o,
          head: heads.success ? (heads.data[i] ?? null) : null,
        })),
      );
    },
    [],
  );

  return { folders, objects, error, loadBucketData };
};
