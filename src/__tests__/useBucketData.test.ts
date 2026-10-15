import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListContents = vi.fn();
vi.mock("@/services/folder.service", () => ({
  reqListContents: (...args: unknown[]) => mockListContents(...args),
}));
vi.mock("@/services/object.service", () => ({
  reqFetchBulkObjectHead: vi.fn(),
}));

import {
  appendPage,
  newestPerKey,
  prefetchListing,
} from "@/hooks/useBucketData";
import { S3ObjectMetadata } from "@/types";

const ok = {
  success: true,
  status: 200,
  message: "ok",
  data: { folders: ["a/b/"], objects: [] },
};

describe("prefetchListing", () => {
  beforeEach(() => {
    mockListContents.mockReset();
  });

  it("lists a folder once while in flight, and not again while fresh", async () => {
    let resolve: (v: unknown) => void = () => {};
    mockListContents.mockReturnValue(new Promise((r) => (resolve = r)));

    prefetchListing(1, "a/");
    prefetchListing(1, "a/"); // hover jitter: still in flight
    expect(mockListContents).toHaveBeenCalledTimes(1);
    expect(mockListContents).toHaveBeenCalledWith(1, "a/");

    resolve(ok);
    await new Promise((r) => setTimeout(r, 0)); // flush the promise chain

    prefetchListing(1, "a/"); // fresh in the cache now
    expect(mockListContents).toHaveBeenCalledTimes(1);
  });

  it("keys by session: the same prefix in another session is listed", () => {
    mockListContents.mockResolvedValue(ok);
    prefetchListing(2, "x/");
    prefetchListing(3, "x/");
    expect(mockListContents).toHaveBeenCalledTimes(2);
  });

  it("does nothing without a session", () => {
    prefetchListing(null, "a/");
    expect(mockListContents).not.toHaveBeenCalled();
  });
});

describe("newestPerKey", () => {
  const obj = (Key: string, LastModified: string, Size = 1) =>
    ({ Key, LastModified, Size, ETag: "e" }) as unknown as S3ObjectMetadata;

  it("keeps one object per key, the most recently modified", () => {
    const got = newestPerKey([
      obj("a.jpg", "2025-12-22T18:34:16Z", 288998),
      obj("b.jpg", "2025-12-24T04:56:07Z"),
      obj("a.jpg", "2025-12-24T05:04:33Z", 207029),
      obj("a.jpg", "2025-12-24T04:56:07Z", 207029),
    ]);
    expect(got.map((o) => [o.Key, o.Size])).toEqual([
      ["a.jpg", 207029],
      ["b.jpg", 1],
    ]);
  });

  it("returns the same array when nothing repeats", () => {
    const list = [obj("a", "1"), obj("b", "2")];
    expect(newestPerKey(list)).toBe(list);
  });
});

describe("appendPage", () => {
  const o = (Key: string) =>
    ({
      Key,
      LastModified: "2026-01-01",
      Size: 1,
      ETag: "e",
    }) as unknown as S3ObjectMetadata;
  const page = (folders: string[], keys: string[], next?: string) =>
    ({
      success: true,
      status: 200,
      message: "ok",
      data: { folders, objects: keys.map(o) },
      pagination: { truncated: !!next, limit: 10000, next_cursor: next },
    }) as const;

  it("appends, de-duplicates, and keeps the cursor while more remain", () => {
    const base = {
      folders: ["a/"],
      objects: [o("x")],
      nextCursor: "c1",
      truncatedAt: 10000,
    };
    const got = appendPage(base, page(["a/", "b/"], ["x", "y"], "c2"));
    expect(got.folders).toEqual(["a/", "b/"]);
    expect(got.objects.map((x) => x.Key)).toEqual(["x", "y"]);
    expect(got.nextCursor).toBe("c2");
    expect(got.truncatedAt).toBe(4);
  });

  it("clears the cap once the last page arrives", () => {
    const got = appendPage(
      { folders: [], objects: [o("x")], nextCursor: "c1", truncatedAt: 1 },
      page([], ["y"]),
    );
    expect(got.nextCursor).toBeUndefined();
    expect(got.truncatedAt).toBeUndefined();
  });
});
