import { ApiResponse } from "@/types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const axios_api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_OPENBUCKET_API,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
  timeout: 10000,
  withCredentials: true,
});

// Attach CSRF token on state-changing requests (double-submit cookie pattern)
axios_api.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (method !== "get" && method !== "head" && method !== "options") {
    const csrfToken = Cookies.get("ob-csrf");
    if (csrfToken) {
      config.headers.set("X-CSRF-Token", csrfToken);
    }
  }
  return config;
});

// Refresh token deduplication
let refreshPromise: Promise<boolean> | null = null;

const attemptRefresh = async (): Promise<boolean> => {
  try {
    const res = await axios_api.post("/auth/refresh");
    return res.status === 200 && res.data?.success;
  } catch {
    return false;
  }
};

axios_api.interceptors.response.use(async (response) => {
  if (typeof window === "undefined") return response;

  if (response.status === 401) {
    // Skip refresh for auth endpoints themselves
    const url = response.config.url ?? "";
    if (url.includes("/auth/login") || url.includes("/auth/refresh")) {
      return response;
    }

    // Attempt token refresh (deduplicated)
    if (!refreshPromise) {
      refreshPromise = attemptRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    const refreshed = await refreshPromise;

    if (refreshed) {
      // Retry the original request
      return axios_api.request(response.config);
    }

    // Refresh failed — clear ob-logged-in cookie and redirect to login
    document.cookie = "ob-logged-in=; Max-Age=0; path=/";
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    return response;
  }

  if (response.status === 403 && response.data?.error_code === 4003) {
    window.location.href = "/unauthorized";
  }

  return response;
});

const fetchApi = async <T>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await axios_api.request(config);

    if (response.data && response.data.success) {
      return {
        success: true,
        status: response.status,
        message: response.data.message,
        data: response.data.data as T,
      };
    }

    return {
      success: false,
      error: response.data?.error ?? "Unknown error",
      error_message:
        response.data?.error_message ?? "Unexpected error occurred",
      error_code: response.data?.error_code ?? 0,
      status: response.status,
    };
  } catch (err: unknown) {
    const axiosError = err as AxiosError;
    return {
      success: false,
      status: axiosError.response?.status ?? 500,
      error: "request_failed",
      error_message: axiosError.message ?? "Request failed unexpectedly",
      error_code: -1,
    };
  }
};

const fetchRaw = async <T>(config: AxiosRequestConfig): Promise<T | null> => {
  try {
    const response = await axios_api.request(config);
    return response.data as T;
  } catch {
    return null;
  }
};

export { fetchApi, fetchRaw, axios_api };
