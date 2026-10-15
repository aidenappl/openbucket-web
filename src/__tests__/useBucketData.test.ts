import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListContents = vi.fn();
vi.mock("@/services/folder.service", () => ({
  reqListContents: (...args: unknown[]) => mockListContents(...args),
}));
vi.mock("@/services/object.service", () => ({
  reqFetchBulkObjectHead: vi.fn(),
}));

import { prefetchListing } from "@/hooks/useBucketData";

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
