import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ViewCache, clearPersistedViews } from "@/tools/viewCache.tools";

describe("ViewCache", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stays in memory without persistKey", () => {
    const c = new ViewCache<number>();
    c.set("a", 1);
    vi.runAllTimers();
    expect(c.get("a")).toBe(1);
    expect(localStorage.length).toBe(0);
  });

  it("persists and restores newest entries in recency order", () => {
    const c = new ViewCache<number>({ persistKey: "t", persistEntries: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    c.get("b"); // touch: b becomes newest
    c.set("b", 2);
    vi.runAllTimers();

    const restored = new ViewCache<number>({ persistKey: "t" });
    expect(restored.get("a")).toBeUndefined(); // beyond persistEntries
    expect(restored.get("c")).toBe(3);
    expect(restored.get("b")).toBe(2);
  });

  it("debounces writes", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem");
    const c = new ViewCache<number>({ persistKey: "t" });
    for (let i = 0; i < 10; i++) c.set(`k${i}`, i);
    expect(spy).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("survives corrupt storage and a full quota", () => {
    localStorage.setItem("ob-view-cache:t", "{not json");
    const c = new ViewCache<number>({ persistKey: "t" });
    expect(c.get("x")).toBeUndefined();

    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
    c.set("x", 1);
    expect(() => vi.runAllTimers()).not.toThrow();
    expect(c.get("x")).toBe(1);
    spy.mockRestore();
  });

  it("skips entries that would exceed the size budget", () => {
    const c = new ViewCache<string>({ persistKey: "t" });
    c.set("small", "x");
    c.set("huge", "y".repeat(2_100_000));
    vi.runAllTimers();
    const restored = new ViewCache<string>({ persistKey: "t" });
    expect(restored.get("huge")).toBeUndefined();
    expect(restored.get("small")).toBe("x");
  });

  it("clearPersistedViews removes only view caches", () => {
    localStorage.setItem("ob-theme", "dark");
    const c = new ViewCache<number>({ persistKey: "t" });
    c.set("a", 1);
    vi.runAllTimers();
    clearPersistedViews();
    expect(localStorage.getItem("ob-view-cache:t")).toBeNull();
    expect(localStorage.getItem("ob-theme")).toBe("dark");
  });
});
