import { useEffect, useState } from "react";

const FIRST = 120;
const STEP = 200;

/**
 * How many of `total` rows to render now. The first FIRST paint immediately;
 * the rest are added STEP at a time between frames, so a big folder never
 * blocks the main thread in one go.
 *
 * Mounting all 3,020 rows of atlas/hotels/ at once (a Link, Checkbox and Menu
 * each) took ~800 ms of long tasks: the page sat frozen after the data had
 * arrived. Everything still ends up rendered (browser find, keyboard scroll
 * and Select all behave as before), just not in the first frame.
 *
 * `resetKey` (the folder) restarts from FIRST; a refresh of the same folder
 * keeps what's already rendered.
 */
export const useProgressiveCount = (total: number, resetKey: string) => {
  const [state, setState] = useState({ key: resetKey, count: FIRST });
  const count = state.key === resetKey ? state.count : FIRST;

  useEffect(() => {
    if (count >= total) return;
    const grow = () =>
      setState((s) => ({
        key: resetKey,
        count: (s.key === resetKey ? s.count : FIRST) + STEP,
      }));
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(grow, { timeout: 100 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(grow, 16);
    return () => clearTimeout(id);
  }, [count, total, resetKey]);

  return Math.min(count, total);
};
