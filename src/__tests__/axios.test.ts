import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchApi, axios_api } from "@/tools/axios.tools";

// Mock axios.create to return a mock instance
vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios");
  const mockInstance = {
    ...actual.default.create(),
    request: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: {
      baseURL: "http://test-api.local",
      headers: { common: {} },
    },
  };
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn(() => mockInstance),
    },
  };
});

describe("fetchApi", () => {
  let mockRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequest = axios_api.request as unknown as ReturnType<typeof vi.fn>;
    mockRequest.mockReset();
  });

  it("returns success response on API success", async () => {
    mockRequest.mockResolvedValue({
      status: 200,
      data: {
        success: true,
        message: "ok",
        data: { id: 1, name: "test" },
      },
    });

    const result = await fetchApi<{ id: number; name: string }>({
      url: "/test",
      method: "GET",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe("test");
      expect(result.status).toBe(200);
    }
  });

  it("returns error response on API error", async () => {
    mockRequest.mockResolvedValue({
      status: 400,
      data: {
        success: false,
        error: "bad_request",
        error_message: "Invalid input",
        error_code: 1000,
      },
    });

    const result = await fetchApi<null>({
      url: "/test",
      method: "POST",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("bad_request");
      expect(result.error_message).toBe("Invalid input");
      expect(result.status).toBe(400);
    }
  });

  it("handles network errors gracefully", async () => {
    const axiosError = Object.assign(new Error("Network Error"), {
      response: { status: 500 },
    });
    mockRequest.mockRejectedValue(axiosError);

    const result = await fetchApi<null>({
      url: "/test",
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("request_failed");
      expect(result.status).toBe(500);
    }
  });

  it("handles missing error status", async () => {
    const error = Object.assign(new Error("Connection refused"), {
      response: undefined,
    });
    mockRequest.mockRejectedValue(error);

    const result = await fetchApi<null>({
      url: "/test",
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.status).toBe(500);
    }
  });

  it("handles missing data fields gracefully", async () => {
    mockRequest.mockResolvedValue({
      status: 500,
      data: null,
    });

    const result = await fetchApi<null>({
      url: "/test",
      method: "GET",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Unknown error");
      expect(result.error_message).toBe("Unexpected error occurred");
    }
  });
});
