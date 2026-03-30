export class ApiResponse {
  static success(data: any, message?: string) {
    return { success: true, message, data };
  }

  static error(message: string, errors?: any) {
    return { success: false, error: message, issues: errors };
  }
}