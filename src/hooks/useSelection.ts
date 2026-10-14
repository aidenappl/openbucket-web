import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Multi-select over an ordered list of keys, with Shift-click ranges.
 *
 * The range extends from the last plainly-clicked key (the anchor) and applies
 * the anchor's state, matching Finder and Gmail. Keys that disappear from the
 * list (deleted, navigated away from) are dropped by `prune`.
 */
export const useSelection = (keys: string[]) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);

  const toggle = useCallback(
    (key: string, shift = false) => {
      setSelected((prev) => {
        const next = new Set(prev);
        const from = anchor.current ? keys.indexOf(anchor.current) : -1;
        const to = keys.indexOf(key);
        if (shift && from !== -1 && to !== -1) {
          const on = prev.has(anchor.current as string);
          const [a, b] = from < to ? [from, to] : [to, from];
          for (const k of keys.slice(a, b + 1)) {
            if (on) next.add(k);
            else next.delete(k);
          }
          return next;
        }
        if (next.has(key)) next.delete(key);
        else next.add(key);
        anchor.current = key;
        return next;
      });
    },
    [keys],
  );

  const setAll = useCallback(
    (on: boolean) => {
      setSelected(on ? new Set(keys) : new Set());
      anchor.current = null;
    },
    [keys],
  );

  const clear = useCallback(() => {
    setSelected(new Set());
    anchor.current = null;
  }, []);

  const visibleSelected = useMemo(
    () => keys.filter((k) => selected.has(k)),
    [keys, selected],
  );
  const state: "none" | "some" | "all" =
    visibleSelected.length === 0
      ? "none"
      : visibleSelected.length === keys.length
        ? "all"
        : "some";

  return {
    selected,
    selectedKeys: visibleSelected,
    state,
    toggle,
    setAll,
    clear,
  };
};
