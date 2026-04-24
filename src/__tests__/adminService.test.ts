import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetchApi before importing services
const mockFetchApi = vi.fn();
vi.mock("@/tools/axios.tools", () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

import {
  reqAdminListUsers,
  reqAdminCreateUser,
  reqAdminUpdateUser,
  reqAdminDeleteUser,
  reqAdminListInstances,
  reqAdminCreateInstance,
  reqAdminUpdateInstance,
  reqAdminDeleteInstance,
  reqProxyListCredentials,
  reqProxyCreateCredential,
  reqProxyDeleteCredential,
  reqProxyListBuckets,
  reqProxyGetBucket,
  reqProxyCreateBucket,
  reqProxyDeleteBucket,
  reqProxyGetBucketStats,
  reqProxyUpdateBucketACL,
  reqProxyListGrants,
  reqProxyCreateGrant,
  reqProxyDeleteGrant,
} from "@/services/admin.service";

describe("admin.service — user management", () => {
  beforeEach(() => {
    mockFetchApi.mockReset();
    mockFetchApi.mockResolvedValue({ success: true, data: [] });
  });

  it("reqAdminListUsers calls GET /admin/users", async () => {
    await reqAdminListUsers();
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/users",
      method: "GET",
    });
  });

  it("reqAdminCreateUser calls POST /admin/users with data", async () => {
    const payload = {
      email: "user@test.com",
      name: "User",
      password: "password",
      role: "viewer",
    };
    await reqAdminCreateUser(payload);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/users",
      method: "POST",
      data: payload,
    });
  });

  it("reqAdminUpdateUser calls PUT /admin/users/:id", async () => {
    await reqAdminUpdateUser(5, { role: "admin" });
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/users/5",
      method: "PUT",
      data: { role: "admin" },
    });
  });

  it("reqAdminDeleteUser calls DELETE /admin/users/:id", async () => {
    await reqAdminDeleteUser(3);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/users/3",
      method: "DELETE",
    });
  });
});

describe("admin.service — instance management", () => {
  beforeEach(() => {
    mockFetchApi.mockReset();
    mockFetchApi.mockResolvedValue({ success: true, data: [] });
  });

  it("reqAdminListInstances calls GET /admin/instances", async () => {
    await reqAdminListInstances();
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances",
      method: "GET",
    });
  });

  it("reqAdminCreateInstance calls POST /admin/instances", async () => {
    const payload = {
      name: "prod",
      endpoint: "https://ob.example.com",
      admin_token: "secret",
    };
    await reqAdminCreateInstance(payload);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances",
      method: "POST",
      data: payload,
    });
  });

  it("reqAdminUpdateInstance calls PUT /admin/instances/:id", async () => {
    await reqAdminUpdateInstance(2, { active: false });
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/2",
      method: "PUT",
      data: { active: false },
    });
  });

  it("reqAdminDeleteInstance calls DELETE /admin/instances/:id", async () => {
    await reqAdminDeleteInstance(7);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/7",
      method: "DELETE",
    });
  });
});

describe("admin.service — instance proxy", () => {
  beforeEach(() => {
    mockFetchApi.mockReset();
    mockFetchApi.mockResolvedValue({ success: true, data: [] });
  });

  it("reqProxyListCredentials proxies to /admin/instances/:id/proxy/credentials", async () => {
    await reqProxyListCredentials(1);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/credentials",
      method: "GET",
      data: undefined,
    });
  });

  it("reqProxyCreateCredential sends POST with name", async () => {
    await reqProxyCreateCredential(1, "test-cred");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/credentials",
      method: "POST",
      data: { name: "test-cred" },
    });
  });

  it("reqProxyDeleteCredential sends DELETE", async () => {
    await reqProxyDeleteCredential(1, 42);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/credentials/42",
      method: "DELETE",
      data: undefined,
    });
  });

  it("reqProxyListBuckets includes grants query param", async () => {
    await reqProxyListBuckets(2);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/2/proxy/buckets?grants=true",
      method: "GET",
      data: undefined,
    });
  });

  it("reqProxyGetBucket fetches single bucket", async () => {
    await reqProxyGetBucket(1, "my-bucket");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/my-bucket",
      method: "GET",
      data: undefined,
    });
  });

  it("reqProxyCreateBucket sends POST with name and owner", async () => {
    await reqProxyCreateBucket(1, "new-bucket", "key123");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets",
      method: "POST",
      data: { name: "new-bucket", owner_key_id: "key123" },
    });
  });

  it("reqProxyDeleteBucket sends DELETE", async () => {
    await reqProxyDeleteBucket(1, "old-bucket");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/old-bucket",
      method: "DELETE",
      data: undefined,
    });
  });

  it("reqProxyGetBucketStats fetches stats", async () => {
    await reqProxyGetBucketStats(1, "my-bucket");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/my-bucket/stats",
      method: "GET",
      data: undefined,
    });
  });

  it("reqProxyUpdateBucketACL sends PUT with acl", async () => {
    await reqProxyUpdateBucketACL(1, "my-bucket", "public-read");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/my-bucket/acl",
      method: "PUT",
      data: { acl: "public-read" },
    });
  });

  it("reqProxyListGrants fetches grants for a bucket", async () => {
    await reqProxyListGrants(1, "my-bucket");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/my-bucket/grants",
      method: "GET",
      data: undefined,
    });
  });

  it("reqProxyCreateGrant sends POST with key and permission", async () => {
    await reqProxyCreateGrant(1, "my-bucket", "key123", "READ");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/my-bucket/grants",
      method: "POST",
      data: { key_id: "key123", permission: "READ" },
    });
  });

  it("reqProxyDeleteGrant sends DELETE", async () => {
    await reqProxyDeleteGrant(1, "my-bucket", 99);
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/admin/instances/1/proxy/buckets/my-bucket/grants/99",
      method: "DELETE",
      data: undefined,
    });
  });
});
