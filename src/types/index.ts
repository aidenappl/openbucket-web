// Generic success response
type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

// Generic error response
type ApiError = {
  success?: false;
  error: string;
  error_message: string;
  error_code: number;
};

// Union type for API responses
type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type { ApiResponse };