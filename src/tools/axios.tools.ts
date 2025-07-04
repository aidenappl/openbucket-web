// lib/axios.ts or services/axios.ts
import { ApiResponse } from "@/types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const axios_api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
  timeout: 10000,
});

const fetch = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
  timeout: 10000,
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
      error_message: response.data?.error_message ?? "Unexpected error occurred",
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

export { fetchApi, fetch };
