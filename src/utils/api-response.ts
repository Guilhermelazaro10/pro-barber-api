export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return { success: true, message, data };
  }

  static error(message: string, issues?: any) {
    return { success: false, error: message, issues };
  }
}