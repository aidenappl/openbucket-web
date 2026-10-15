import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useProgressiveCount } from "@/hooks/useProgressiveCount";

describe("useProgressiveCount", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const grow = () => act(() => vi.advanceTimersByTime(200));

  it("starts small and grows to the total", () => {
    const { result } = renderHook(() => useProgressiveCount(1000, "big"));
    expect(result.current).toBe(120);
    for (let i = 0; i < 10; i++) grow();
    expect(result.current).toBe(1000);
  });

  it("never exceeds a small total", () => {
    const { result } = renderHook(() => useProgressiveCount(40, "small"));
    expect(result.current).toBe(40);
  });

  it("starts over after visiting a small folder and coming back", () => {
    const { result, rerender } = renderHook(
      ({ total, k }) => useProgressiveCount(total, k),
      { initialProps: { total: 3000, k: "big" } },
    );
    for (let i = 0; i < 20; i++) grow();
    expect(result.current).toBe(3000);

    rerender({ total: 40, k: "small" });
    expect(result.current).toBe(40);

    rerender({ total: 3000, k: "big" });
    expect(result.current).toBe(120);
  });
});
