"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";
export type SortValue = string | number | boolean | null | undefined;

export interface Sort<K extends string> {
  key: K;
  dir: SortDir;
  /** Click handler for a column header: first click sorts it, the next flips it. */
  sortBy: (key: K) => void;
}

/**
 * Client-side sorting over the rows a page has loaded — ported from keyring-web.
 *
 * Local on purpose: openbucket-api has no sort parameter on any list, and every
 * list here (objects in one prefix, users, tokens) is loaded whole.
 */
export function useSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => SortValue>,
  initial: { key: NoInfer<K>; dir: SortDir },
): [T[], Sort<K>] {
  const [key, setKey] = useState<K>(initial.key);
  const [dir, setDir] = useState<SortDir>(initial.dir);

  const sorted = useMemo(() => {
    const get = accessors[key];
    const factor = dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      // Empty values sort last regardless of direction.
      if (va == null || va === "") return vb == null || vb === "" ? 0 : 1;
      if (vb == null || vb === "") return -1;
      if (typeof va === "number" && typeof vb === "number")
        return (va - vb) * factor;
      return (
        String(va).localeCompare(String(vb), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * factor
      );
    });
    // accessors is a literal at every call site; keying on it would re-sort every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, key, dir]);

  const sortBy = (next: K) => {
    if (next === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setKey(next);
      setDir("asc");
    }
  };

  return [sorted, { key, dir, sortBy }];
}
