import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetchApi = vi.fn();
vi.mock("@/tools/axios.tools", () => ({
  fetchApi: (...args: unknown[]) => mockFetchApi(...args),
}));

import {
  reqLogin,
  reqRefresh,
  reqLogout,
  reqGetSelf,
  reqGetSSOConfig,
} from "@/services/auth.service";

describe("auth.service", () => {
  beforeEach(() => {
    mockFetchApi.mockReset();
    mockFetchApi.mockResolvedValue({ success: true, data: null });
  });

  it("reqLogin sends POST /auth/login with credentials", async () => {
    await reqLogin("user@test.com", "password123");
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/auth/login",
      method: "POST",
      data: { email: "user@test.com", password: "password123" },
    });
  });

  it("reqRefresh sends POST /auth/refresh", async () => {
    await reqRefresh();
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/auth/refresh",
      method: "POST",
    });
  });

  it("reqLogout sends POST /auth/logout", async () => {
    await reqLogout();
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/auth/logout",
      method: "POST",
    });
  });

  it("reqGetSelf sends GET /auth/self", async () => {
    await reqGetSelf();
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/auth/self",
      method: "GET",
    });
  });

  it("reqGetSSOConfig sends GET /auth/sso/config", async () => {
    await reqGetSSOConfig();
    expect(mockFetchApi).toHaveBeenCalledWith({
      url: "/auth/sso/config",
      method: "GET",
    });
  });
});
