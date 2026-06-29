import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

export function errorResponse(message: string): ApiResponse {
  return { success: false, error: message };
}
