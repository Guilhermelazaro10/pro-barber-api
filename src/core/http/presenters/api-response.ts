export class ApiResponse {
  static success<T>(data: T, message?: string, requestId?: string) {
    return {
      success: true,
      message,
      requestId,
      data,
    };
  }

  static error(message: string, issues?: unknown, requestId?: string) {
    return {
      success: false,
      requestId,
      error: message,
      issues,
    };
  }
}
