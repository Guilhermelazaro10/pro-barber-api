export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return { success: true, message, data };
  }

  static error(message: string, issues?: unknown) {
    return { success: false, error: message, issues };
  }
}
